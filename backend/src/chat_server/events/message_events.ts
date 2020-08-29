import { v4 as uuidv4 } from "uuid";
import UserManager, { UserState, UserStatus, Role } from "../member_manager";
import { isBanned, isAdmin } from "../utils";

type NewMessagePayload = {
  username: string;
  msg: string;
  message_id: string;
  timestamp: number;
  type: string;
};

type DeleteMessagePayload = {
  message_id: string;
};

export function registerMessageEvents(socket: SocketIO.Socket) {
  socket.on("message", async (msg: string) => {
    if (!this.localSocketState[socket.id].isAuthenticated) return;

    try {
      if (await isBanned(this.localSocketState[socket.id].username))
        throw "This user is banned";

      let io: SocketIO.Namespace | SocketIO.Server = this.io;
      Object.keys(socket.rooms).forEach((r) => (io = io.to(r)));
      io.emit("message", {
        message_id: uuidv4(), // generate a random ID for this message
        timestamp: Date.now(),
        username: this.localSocketState[socket.id].username,
        msg: msg,
        type: "normal",
      } as NewMessagePayload);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("global_message", async (msg: string) => {
    if (!this.localSocketState[socket.id].isAuthenticated) return;

    try {
      if (!(await isAdmin(this.localSocketState[socket.id].username)))
        throw "This user isn't Admin";

      let io: SocketIO.Server = this.io;
      //send global message
      io.emit("message", {
        message_id: uuidv4(), // generate a random ID for this message
        timestamp: Date.now(),
        username: this.localSocketState[socket.id].username,
        msg: msg,
        type: "global",
      } as NewMessagePayload);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("delete_message", async (message_id: string) => {
    // only admin can delete message
    if (!this.localSocketState[socket.id].isAuthenticated) return;

    try {
      if (!(await isAdmin(this.localSocketState[socket.id].username)))
        throw "This user isn't Admin";

      //broadcast to all client to delete this new message
      this.io.emit("delete_message", {
        message_id: message_id,
      } as DeleteMessagePayload);
    } catch (e) {
      console.error(e);
    }
  });
}
