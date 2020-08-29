import http from "http";
import jwt from "jsonwebtoken";
import { Role, UserStatus, UserState } from "./member_manager";
import { verifyTokenAndGetUserState } from "../auth/jwt_auth";
import { KeyValueStorage } from "../storage/key_value";
import Config from "../settings";
import { report } from "process";
import { registerRoomEvents, JoinRoomResponse, NewMemberJoined } from "./events/room_events";
import { registerMessageEvents } from "./events/message_events";
import { registerReportEvents } from "./events/report_events";

type SessionStore = {
  isAuthenticated: boolean;
  username?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
};

type SocketClientID = string;

const ROOM_PREFIX = "Room";

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export default class NonDistributedChatServer {
  io: SocketIO.Server;
  localSocketState: { [key: string]: SessionStore };
  private maxNumRooms: number;
  userStateUpdateInterval: number;
  storage: KeyValueStorage;

  constructor(http_server: http.Server, storage: KeyValueStorage) {
    this.io = require("socket.io")(http_server);
    this.maxNumRooms = 1;
    this.localSocketState = {};
    this.storage = storage;
  }

  async getRooms(): Promise<Room[]> {
    // not thread safe
    let rooms = await this.getRoomNames();
    let materializedRooms = await Promise.all(
      rooms.map(
        (roomName) =>
          new Promise((resolve: (arg0: Room) => void, reject) => {
            this.getConnectedClients(roomName)
              .then((socketIDs) =>
                resolve({
                  name: roomName,
                  count: socketIDs.length,
                })
              )
              .catch((e) => reject(e));
          })
      )
    );
    return materializedRooms;
  }

  async getRoomNames(): Promise<string[]> {
    // "thread" safe
    return [...Array(await this.getMaxNumRooms()).keys()].map(
      (i) => `${ROOM_PREFIX} ${i}`
    );
  }

  async getConnectedClients(
    room: string | null = null
  ): Promise<SocketClientID[]> {
    // "thread" safe
    return new Promise((resolve, reject) => {
      let chain: SocketIO.Namespace | SocketIO.Server = this.io;

      if (room != null) chain = chain.in(room);

      chain.clients((error: any, clients: string[]) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(clients);
      });
    });
  }

  async setMaxNumRooms(num: number): Promise<void> {
    // NOT "thread" safe
    // Note: For distributed instances usecase, we need to SET this value from redis
    this.maxNumRooms = num;
  }

  async getMaxNumRooms(): Promise<number> {
    // NOT "thread" safe
    // Note: For distributed instances usecase, we need to GET this value from redis
    return this.maxNumRooms;
  }

  async shuffleIntoRooms(): Promise<void> {
    // "thread" safe
    let roomNames = [...Array(await this.getMaxNumRooms()).keys()].map(
      (i) => `${ROOM_PREFIX} ${i}`
    );
    console.log(`--- Shuffling clients into rooms ---`);
    console.log(roomNames);
    let clientIDs: SocketClientID[] = [];
    try {
      clientIDs = await this.getConnectedClients();
    } catch (e) {
      console.error(e);
      throw new Error(`Failed to get all connected clients`);
    }
    console.log(`Clients ${clientIDs}`);
    shuffleArray(clientIDs);
    await Promise.all(
      clientIDs.map(
        (clientID, i) =>
          new Promise((resolve, reject) =>
            this.socketRemoteJoinRoom(clientID, roomNames[i % roomNames.length])
              .then(() => {
                this.io.to(clientID).emit("join_room_resp", {
                  status: 1,
                  room: roomNames[i % roomNames.length],
                  response: `Gia nhập phòng "${
                    roomNames[i % roomNames.length]
                  }" thành công!`,
                } as JoinRoomResponse);
                resolve();
              })
              .catch((e) => {
                console.error(e);
                reject(
                  `Failed to instruct socketId ${clientID} to join room ${
                    roomNames[i % roomNames.length]
                  }`
                );
              })
          )
      )
    );
  }

  async emitBanMessage(username: string): Promise<void> {
    // If we were to run this chat server in multiple instances
    // it's not so easy to find where the targeted user's socket is managed
    // ---> The easier approach is to broadcast the message to all the clients
    // and let the the client decides whether they were banned or not
    this.io.emit("ban_applied", username);
  }

  async emitUnbanMessage(username: string): Promise<void> {
    // Same reason with emitBanMessage()
    this.io.emit("unban_applied", username);
  }

  public async socketRemoteJoinRoom(
    socketId: string,
    roomName: string
  ): Promise<void> {
    // NOT "thread" safe
    // Note: must reimplement this function for distributed instances usecase

    // Since this class assumes that there is only 1 instance of NonDistributedChatServer
    // we can get the socket object straight from namespace.connected
    let socketObj = this.io.of("/").connected[socketId];
    await this.socketLocalJoinRoom(socketObj, roomName);
  }

  private async socketLocalJoinRoom(
    socket: SocketIO.Socket,
    roomName: string
  ): Promise<void> {
    // "thread" safe
    let joinedRooms = Object.keys(socket.rooms);

    // leave old rooms to join this new one
    await Promise.all(
      joinedRooms
        .filter((r) => r != socket.id)
        .map(
          (r) =>
            new Promise((resolve, reject) => {
              socket.leave(r, (err) => {
                if (err) {
                  console.error(err);
                  reject(new Error(`Failed to leave room ${r}`));
                  return;
                }
                console.log(`Client ${socket.id} leaves room ${r}`);
                resolve();
              });
            })
        )
    );

    // join the new room
    await new Promise((resolve, reject) =>
      socket.join(roomName, (err) => {
        if (err) {
          console.error(err);
          reject(new Error(`Failed to join room ${roomName}`));
          return;
        }
        console.log(`Client ${socket.id} joined room ${roomName}`);
        resolve();
      })
    );
  }

  setupSocketEvents(socket: SocketIO.Socket) {
    // "thread" safe
    registerMessageEvents.bind(this)(socket);
    registerRoomEvents.bind(this)(socket);
    registerReportEvents.bind(this)(socket);
  }

  setup() {
    // "thread" safe
    this.io.use((socket, next) => {
      if (socket.handshake.query.token && socket.handshake.query.token != "") {
        verifyTokenAndGetUserState(socket.handshake.query.token)
          .then((userState) => {
            this.localSocketState[socket.id] = {
              isAuthenticated: true,
              username: userState.username,
              isAdmin: userState.role == Role.ADMIN,
            };
            next();
          })
          .catch((e) => {
            console.error(e);
            this.localSocketState[socket.id] = {
              isAuthenticated: false,
              username: "guest",
            };
            next();
          });
      } else {
        this.localSocketState[socket.id] = {
          isAuthenticated: false,
          username: "guest",
        };
        next();
      }
    });

    this.io.on("connection", (socket) => {
      console.log("connected");
      this.getRooms()
        .then((rooms) => {
          rooms.sort((a, b) => {
            return a.count - b.count;
          });
          if (!rooms.length) throw "No rooms to join";

          this.socketLocalJoinRoom(socket, rooms[0].name)
            .then(() => {
              this.io.to(rooms[0].name).emit("new_member_joined", {
                username: this.localSocketState[socket.id].username,
                room: rooms[0].name,
              } as NewMemberJoined);

              this.io.to(socket.id).emit("join_room_resp", {
                status: 1,
                room: rooms[0].name,
                response: `Gia nhập phòng "${rooms[0].name}" thành công!`,
              } as JoinRoomResponse);

              this.setupSocketEvents(socket);
            })
            .catch((e) => {
              console.error(e);
              throw `${socket.id} couldn't setup socket events because failed to join a room!`;
            });
        })
        .catch((e) => console.error(e));

      socket.on("disconnect", () => {
        delete this.localSocketState[socket.id];
        console.log("disconnected");
      });
    });
  }
}
