import http from 'http';

type SessionStore = {
    isAuthenticated: boolean,
    username: string | null
}

type NewMessagePayload = {
    username: string,
    msg: string,
}

export default class ChatServer {
    io: SocketIO.Server;
    sessionStore: { 
        [key: string]: SessionStore
    };

    constructor(http_server: http.Server) {
        this.io = require("socket.io")(http_server);
        this.sessionStore = {};
    }

    private setupSocketEvents(socket: SocketIO.Socket) {
        socket.on('message', (msg: string) => {
            console.log('message: ' + msg);
            this.io.emit('new_message', {
                username: this.sessionStore[socket.id].username,
                msg: msg
            } as NewMessagePayload);
        });
    }

    setup() {
        this.io.use((socket, next) => {
            let handshake = socket.handshake;
            // TODO(davidvu): implement JWT token verification
            this.sessionStore[socket.id] = {
                isAuthenticated: true,
                username: handshake.query.username
            }
            this.sessionStore[socket.id].isAuthenticated = true;
            // TODO(davidvu): retrieve this info from signed token
            this.sessionStore[socket.id].username = handshake.query.username;
            next();
        });
          
        this.io.on('connection', (socket) => {
            console.log("connected")
            this.setupSocketEvents(socket);
            socket.on('disconnect', () => {
                console.log("disconnected");
                delete this.sessionStore[socket.id]
            });
        });
    }

}
