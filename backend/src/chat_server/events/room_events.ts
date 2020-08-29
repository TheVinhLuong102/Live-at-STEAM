import { UserManager } from "../member_manager";
import Config from "../../settings";
import { shuffleArray } from "../utils";

type JoinRoomResponse = {
  status: number;
  response: string;
  username: string;
  room: string;
};

type NewMemberJoined = {
  username: string;
  room: string;
};

export function registerRoomEvents(socket: SocketIO.Socket) {
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
        username: this.localSocketState[socket.id].username,
        room: roomName,
        response: `Không thể tham gia phòng: "${roomName}". Phòng không tồn tại.`,
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
          response: `Gia nhập phòng "${roomName}" thành công!`,
        } as JoinRoomResponse);
      })
      .catch((e) => {
        console.error(e);
        this.io.to(socket.id).emit("join_room_resp", {
          status: -1,
          username: this.localSocketState[socket.id].username,
          room: roomName,
          response: `Có lỗi xảy ra khi gia nhập phòng "${roomName}".`,
        } as JoinRoomResponse);
      });
  });

  socket.on("join_random_room", async () => {
    if (!this.localSocketState[socket.id].isAuthenticated) return;

    console.log(
      `${
        this.localSocketState[socket.id].username
      } is trying to join a random room!`
    );

    let lastAttempt: number = await this.storage
      .getKey(`${this.localSocketState[socket.id].username}_changeRoom`, true)
      .catch((e) => -1);

    if (
      Math.round(Date.now() / 1000) - lastAttempt <
      Config.SWITCH_ROOM_DELAY
    ) {
      let timeLeft =
        Config.SWITCH_ROOM_DELAY - Math.round(Date.now() / 1000 - lastAttempt);
      this.io.to(socket.id).emit("join_room_resp", {
        status: -1,
        response: `Bạn phải đợi thêm ${timeLeft} giây để đổi phòng.`,
      } as JoinRoomResponse);
      return;
    }
    this.getRooms()
      .then((rooms) => {
        shuffleArray(rooms);
        if (!rooms.length) return;
        this.socketLocalJoinRoom(socket, rooms[0].name).then(() => {
          // broadcast to all participant of the room that a new member has joined
          this.io.to(rooms[0].name).emit("new_member_joined", {
            username: this.localSocketState[socket.id].username,
            room: rooms[0].name,
          } as NewMemberJoined);

          this.io.to(socket.id).emit("join_room_resp", {
            status: 1,
            username: this.localSocketState[socket.id].username,
            room: rooms[0].name,
            response: `Gia nhập phòng "${rooms[0].name}" thành công!`,
          } as JoinRoomResponse);

          // not atomic but good enough for our usecase :)
          this.storage
            .saveKey(
              `${this.localSocketState[socket.id].username}_changeRoom`,
              Date.now() / 1000,
              Config.SWITCH_ROOM_DELAY
            )
            .catch((e) => console.error(e));
        });
      })
      .catch((e) => {
        console.error(e);
        this.io.to(socket.id).emit("join_room_resp", {
          status: -1,
          response: "Có lỗi xảy ra khi chuyển phòng ngẫu nhiên.",
          username: this.localSocketState[socket.id].username,
          room: "",
        } as JoinRoomResponse);
      });
  });
}
