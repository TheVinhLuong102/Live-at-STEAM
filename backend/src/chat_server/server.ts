import http from "http";
import { assert } from "console";
import { isBuffer } from "util";

type SessionStore = {
    isAuthenticated: boolean;
    username: string | null;
    room: string;
};

type SocketClientID = string;
type Room = {
    name: string;
    count: Number;
};

type NewMessagePayload = {
    username: string;
    msg: string;
};

type JoinRoomResponse = {
    status: Number; // 1 == "success", 0 == "room is full", -1 == "error"
    message: string;
};

type NewMemberJoined = {
    username: string,
    room: string
};

const ROOM_PREFIX = "Room";

export default class ChatServer {
    io: SocketIO.Server;
    sessionStore: {
        [key: string]: SessionStore;
    };

    constructor(http_server: http.Server) {
        this.io = require("socket.io")(http_server);
        this.sessionStore = {};
    }

    async getRooms(): Promise<Room[]> {
        let rooms = Object.keys(this.io.sockets.adapter.rooms);
        return await Promise.all(rooms.map(roomName => new Promise((resolve: (arg0: Room) => void, errResolve) => {
            this.getConnectedClients(roomName).then((socketIDs) => resolve({
                name: roomName,
                count: socketIDs.length
            })).catch((e) => errResolve(e));
        })));
    }

    getRoomNames(): string[] {
        return Object.keys(this.io.sockets.adapter.rooms);
    }

    async getConnectedClients(
        room: string | null
    ): Promise<SocketClientID[]> | null {
        return new Promise((resolve, err) => {
            let chain: any = this.io;

            if (room) chain = chain.in(room);

            chain.clients((error, clients) => {
                if (err) {
                    err(error);
                    return;
                }
                resolve(clients);
            });
        });
    }

    private setupSocketEvents(socket: SocketIO.Socket) {
        socket.on("message", (msg: string) => {
            console.log("message: " + msg);
            this.io.emit("new_message", {
                username: this.sessionStore[socket.id].username,
                msg: msg,
            } as NewMessagePayload);
        });

        socket.on("join_room", async (roomName: string) => {
            let roomFilter = this.getRoomNames().filter((r) => r == roomName);

            // if no room with provided name is found
            if (!roomName.includes(ROOM_PREFIX) || !(roomFilter && roomFilter.length)) {
                this.io
                    .to(socket.id)
                    .emit("join_room_resp", {
                        status: -1,
                        message: "The room you tried to join doesn't exist",
                    } as JoinRoomResponse);
                return;
            }

            let newRoomName = roomFilter[0];
            let joinedRooms = Object.keys(socket.rooms);

            // leave old rooms to join this new one
            await Promise.all(joinedRooms.filter(roomName => roomName != socket.id).map(roomName =>
                new Promise((resolve, errResolver) => {
                    socket.leave(roomName, (err) => {
                        if (err) {
                            errResolver(err);
                            return;
                        }
                        resolve();
                    });
                })
            )).then(() => {
                socket.join(newRoomName, (err) => {
                    if (err) {
                        this.io
                            .to(socket.id)
                            .emit("join_room_resp", {
                                status: -1,
                                message: "Failed to join new room: " + newRoomName,
                            } as JoinRoomResponse);
                        return;
                    }
                    // send back to client to notify success
                    this.io
                        .to(socket.id)
                        .emit("join_room_resp", {
                            status: 1,
                            message: "Successfully joined room: " + newRoomName,
                        } as JoinRoomResponse);

                    // broadcast to all participant of the room that a new member has joined
                    this.io.to(newRoomName).emit("new_member_joined", {
                        username: socket.handshake.query.username,
                        room: newRoomName
                    } as NewMemberJoined)
                })
            })
        });
    }

    setup() {
        this.io.use((socket, next) => {
            let handshake = socket.handshake;
            // TODO(davidvu): implement JWT token verification
            this.sessionStore[socket.id] = {
                isAuthenticated: true,
                username: handshake.query.username,
                // default room for each socket is its socketid
                room: handshake.query.room || socket.id,
            };
            this.sessionStore[socket.id].isAuthenticated = true;
            // TODO(davidvu): retrieve this info from signed token
            this.sessionStore[socket.id].username = handshake.query.username;
            next();
        });

        this.io.on("connection", (socket) => {
            console.log("connected");
            this.setupSocketEvents(socket);
            socket.on("disconnect", () => {
                console.log("disconnected");
                delete this.sessionStore[socket.id];
            });
        });
    }
}
