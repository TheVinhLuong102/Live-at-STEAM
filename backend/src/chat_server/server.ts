import http from "http";
import jwt from "jsonwebtoken";
import LocalUserManager, { UserManager, Role, UserStatus } from "./member_manager";
import { verifyTokenAndGetUserState, DecodedUserData } from "../auth/jwt_auth";
import { v4 as uuidv4 } from 'uuid';


type SessionStore = {
  isAuthenticated: boolean;
  username?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
};

type SocketClientID = string;
type Room = {
  name: string;
  count: number;
};

type NewMessagePayload = {
  username: string;
  msg: string;
  message_id: string,
  timestamp: number,
  type: string;
};

type DeleteMessagePayload = {
  message_id: string
}

type JoinRoomResponse = {
  status: number;
  response?: string;
  username?: string;
  room?: string;
};

type NewMemberJoined = {
  username: string;
  room: string;
};

const ROOM_PREFIX = "Room";

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export default class NonDistributedChatServer {
  io: SocketIO.Server;
  userManager: UserManager;
  localSocketState: { [key: string]: SessionStore };
  private maxNumRooms: number;
  userStateUpdateInterval: number;

  constructor(
    http_server: http.Server,
    userManager: UserManager,
    userStateUpdateInterval: number = 1000
  ) {
    this.io = require("socket.io")(http_server);
    this.maxNumRooms = 1;
    this.userManager = userManager;
    this.localSocketState = {};
    this.userStateUpdateInterval = userStateUpdateInterval;
    this.updateUserStateRoutine(); // start routine
  }

  async updateUserStateRoutine() {
    // Since fetching UserState is quite expensive, we dont want
    // to refetch UserState on every message.
    // This routine fetch the state for all local users(sockets) periodically
    console.log(
      `updating UserState for ${
        Object.keys(this.localSocketState).length
      } clients`
    );
    await Promise.all(
      Object.keys(this.localSocketState).map(
        (socketId) =>
          new Promise((resolve, reject) => {
            const sessionStore = this.localSocketState[socketId];
            if (!sessionStore.isAuthenticated)
              // ignore guests
              return resolve();

            this.userManager
              .getState(sessionStore.username)
              .then((userState) => {
                if (!userState) {
                  return resolve();
                }
                sessionStore.isAdmin = userState.role == Role.ADMIN;
                sessionStore.isBanned = userState.status == UserStatus.BANNED;
                resolve();
              })
              .catch((e) => {
                reject(e);
              });
          })
      )
    );
    setTimeout(
      () => this.updateUserStateRoutine(),
      this.userStateUpdateInterval
    );
  }

  async getRooms(): Promise<Room[]> {
    // thread safe
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

    // Add not yet materialized rooms to the list
    [...Array(await this.getMaxNumRooms()).keys()]
      .map((i) => `${ROOM_PREFIX} ${i}`)
      .filter((r) => !rooms.includes(r))
      .forEach((roomName) =>
        materializedRooms.push({
          name: roomName,
          count: 0,
        })
      );

    return materializedRooms;
  }

  async getRoomNames(): Promise<string[]> {
    // not "thread" safe
    // Note: if we use socket.io-redis for multiple instances (loadbalancing)
    // we would have to get the rooms from adapter.getAllRooms()
    return Object.keys(this.io.sockets.adapter.rooms).filter((roomName) =>
      roomName.includes(ROOM_PREFIX)
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
              .then(() => resolve())
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
    const socketIds = Object.keys(this.localSocketState).filter(k => this.localSocketState[k].username == username);
    if (socketIds.length === 0) {
      return;
    }

    this.io.to(socketIds[0]).emit("ban_applied");
  }

  async emitUnbanMessage(username: string): Promise<void> {
    const socketIds = Object.keys(this.localSocketState).filter(k => this.localSocketState[k].username == username);
    if (socketIds.length === 0) {
      return;
    }

    this.io.to(socketIds[0]).emit("unban_applied");
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
    socket.on("message", async (msg: string) => {
      if (!this.localSocketState[socket.id].isAuthenticated ||
        this.localSocketState[socket.id].isBanned)
        return;

      let io: SocketIO.Namespace | SocketIO.Server = this.io;
      Object.keys(socket.rooms).forEach((r) => (io = io.to(r)));
      io.emit("message", {
        message_id: uuidv4(), // generate a random ID for this message
        timestamp: Date.now(),
        username: this.localSocketState[socket.id].username,
        msg: msg,
        type: "normal",
      } as NewMessagePayload);
    });

    socket.on("global_message", (msg: string) => {
      if (
        !this.localSocketState[socket.id].isAuthenticated ||
        !this.localSocketState[socket.id].isAdmin
      )
        return;

      let io: SocketIO.Server = this.io;
      //send global message
      io.emit("message", {
        message_id: uuidv4(), // generate a random ID for this message
        timestamp: Date.now(),
        username: this.localSocketState[socket.id].username,
        msg: msg,
        type: "global",
      } as NewMessagePayload);
    });

    socket.on("delete_message", (message_id: string) => {
        // only admin can delete message
        if (
          !this.localSocketState[socket.id].isAuthenticated ||
          !this.localSocketState[socket.id].isAdmin
        )
          return;
  
        let io: SocketIO.Server = this.io;
        //broadcast to all client to delete this new message
        io.emit("delete_message", {
          message_id: message_id,
        } as DeleteMessagePayload);
      });

    socket.on("join_room", async (roomName: string) => {
      // only admin can join room
      if (
        !this.localSocketState[socket.id].isAuthenticated ||
        !this.localSocketState[socket.id].isAdmin
      )
        return;

      if (!(await this.getRoomNames()).includes(roomName)) {
        console.log(roomName);
        this.io.to(socket.id).emit("join_room_resp", {
          status: -1,
          message: `Failed to join room: ${roomName}, becasue the room doesn't exist`,
        } as JoinRoomResponse);
        return;
      }
      this.socketLocalJoinRoom(socket, roomName)
        .then(() => {
          // broadcast to all participant of the room that a new member has joined
          this.io.to(roomName).emit("new_member_joined", {
            username: this.localSocketState[socket.id].username,
            room: roomName,
          } as NewMemberJoined);

          this.io.to(socket.id).emit("join_room_resp", {
            status: 1,
            username: this.localSocketState[socket.id].username,
            room: roomName,
          } as JoinRoomResponse);
        })
        .catch((e) => {
          console.error(e);
          this.io.to(socket.id).emit("join_room_resp", {
            status: -1,
            message: "Failed to join new room: " + roomName,
          } as JoinRoomResponse);
        });
    });

    socket.on("join_random_room", (roomName: string) => {
      this.socketLocalJoinRoom(socket, roomName)
        .then(() => {
          // broadcast to all participant of the room that a new member has joined
          this.io.to(roomName).emit("new_member_joined", {
            username: this.localSocketState[socket.id].username,
            room: roomName,
          } as NewMemberJoined);

          this.io.to(socket.id).emit("join_room_resp", {
            status: 1,
            username: this.localSocketState[socket.id].username,
            room: roomName,
          } as JoinRoomResponse);
        })
        .catch((e) => {
          console.error(e);
          this.io.to(socket.id).emit("join_room_resp", {
            status: -1,
            message: "Failed to join new room: " + roomName,
          } as JoinRoomResponse);
        });
    });
  }

  setup() {
    // "thread" safe
    this.io.use((socket, next) => {
      // TODO(davidvu): implement JWT token verification
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
