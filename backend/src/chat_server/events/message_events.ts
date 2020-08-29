import { v4 as uuidv4 } from "uuid";
import UserManager, { UserState, UserStatus, Role } from "../member_manager";
import { isBanned, isAdmin, getRole } from "../utils";

type NewMessagePayload = {
  username: string;
  role: Role,
  message: string;
  messageId: string;
  timestamp: number;
  type: string;
};

type DeleteMessagePayload = {
  messageId: string;
};

export function registerMessageEvents(socket: SocketIO.Socket) {
  socket.on("message", async (message: string) => {
    if (!this.localSocketState[socket.id].isAuthenticated) return;

    try {
      if (await isBanned(this.localSocketState[socket.id].username))
        throw "This user is banned";
      
      let role: Role = await getRole(this.localSocketState[socket.id].username);

      let io: SocketIO.Namespace | SocketIO.Server = this.io;
      Object.keys(socket.rooms).forEach((r) => (io = io.to(r)));
      io.emit("message", {
        messageId: uuidv4(), // generate a random ID for this message
        role: role,
        timestamp: Date.now(),
        username: this.localSocketState[socket.id].username,
        message: message,
        type: "normal",
      } as NewMessagePayload);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("global_message", async (message: string) => {
    if (!this.localSocketState[socket.id].isAuthenticated) return;

    try {
      let role: Role = await getRole(this.localSocketState[socket.id].username);
      if (role !== Role.ADMIN)
        throw "This user isn't Admin";

      let io: SocketIO.Server = this.io;
      //send global message
      io.emit("message", {
        messageId: uuidv4(), // generate a random ID for this message
        role: role,
        timestamp: Date.now(),
        username: this.localSocketState[socket.id].username,
        message: message,
        type: "global",
      } as NewMessagePayload);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("delete_message", async (messageId: string) => {
    // only admin can delete message
    if (!this.localSocketState[socket.id].isAuthenticated) return;

    try {
      if (!(await isAdmin(this.localSocketState[socket.id].username)))
        throw "This user isn't Admin";

      //broadcast to all client to delete this new message
      this.io.emit("delete_message", {
        messageId: messageId,
      } as DeleteMessagePayload);
    } catch (e) {
      console.error(e);
    }
  });
}
