import http from "http";
import { assert } from "console";
import { isBuffer } from "util";
import { Namespace } from "socket.io";

type SessionStore = {
    isAuthenticated: boolean;
    username: string | null;
    room: string;
};

type SocketClientID = string;
type Room = {
    name: string,
    count: number
};

type NewMessagePayload = {
    username: string,
    msg: string
};

type JoinRoomResponse = {
    status: number,
    response?: string,
    username?: string,
    room?: string,
};

type NewMemberJoined = {
    username: string,
    room: string
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
    private maxNumRooms: Number;

    constructor(http_server: http.Server) {
        this.io = require("socket.io")(http_server);
        this.maxNumRooms = 1;
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

    async setMaxNumRooms(num: Number): Promise<void> {
        // NOT "thread" safe
        // Note: For distributed instances usecase, we need to SET this value from redis
        this.maxNumRooms = num;
    }

    async getMaxNumRooms(): Promise<Number> {
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
        socket.on("message", (msg: string) => {
            console.log("message: " + msg);
            let io: SocketIO.Namespace | SocketIO.Server = this.io;
            Object.keys(socket.rooms).forEach((r) => (io = io.to(r)));
            io.emit("message", {
                username: socket.handshake.query.username,
                msg: msg,
            } as NewMessagePayload);
        });

        socket.on("join_room", (roomName: string) => {
            this.socketLocalJoinRoom(socket, roomName)
                .then(() => {
                    // broadcast to all participant of the room that a new member has joined
                    this.io.to(roomName).emit("new_member_joined", {
                        username: socket.handshake.query.username,
                        room: roomName,
                    } as NewMemberJoined);

                    this.io.to(socket.id).emit("join_room_resp", {
                        status: 1,
                        username: socket.handshake.query.username,
                        room: roomName
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
            let handshake = socket.handshake;
            // TODO(davidvu): implement JWT token verification
            next();
        });

        this.io.on("connection", (socket) => {
            console.log("connected");
            this.getRooms().then((rooms) => {
                rooms.sort((a, b) => { return a.count - b.count });
                if (!rooms.length)
                    throw "No rooms to join";

                this.socketLocalJoinRoom(socket, rooms[0].name)
                    .then(() => {
                        this.io.to(rooms[0].name).emit("new_member_joined", {
                            username: socket.handshake.query.username,
                            room: rooms[0].name,
                        } as NewMemberJoined);
                        this.setupSocketEvents(socket);
                    })
                    .catch((e) => {
                        console.error(e);
                        throw `${socket.id} couldn't setup socket events because failed to join a room!`
                    });
            }).catch(e => console.error(e))
            socket.on("disconnect", () => {
                console.log("disconnected");
            });
        });
    }
}
