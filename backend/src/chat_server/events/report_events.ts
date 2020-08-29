import UserManager, { UserStatus, UserState, Role } from "../member_manager";
import { report } from "process";
import { isAdmin } from "../utils";

export function registerReportEvents(socket: SocketIO.Socket) {
  socket.on("ban_user", async (username: string) => {
    try {
      if (!(await isAdmin(this.localSocketState[socket.id].username))) {
        throw "This user isn't Admin";
      }

      let userState = await UserManager.banUser(username);
      this.emitBanMessage(username).catch((e) => console.error(e));
      return this.io.to(socket.id).emit("report_user_resp", {
        status: -1,
        response: `Cấm chat ${username} thành công!`,
      });
    } catch (e) {
      console.error(e);
      this.io.to(socket.id).emit("report_user_resp", {
        status: -1,
        response: `Lỗi xảy ra khi cấm chat ${username}`,
      });
    }
  });
  socket.on("unban_user", async (username: string) => {
    try {
      if (!(await isAdmin(this.localSocketState[socket.id].username))) {
        throw "This user isn't Admin";
      }

      let userState = await UserManager.unbanUser(username);
      this.emitUnbanMessage(username).catch((e) => console.error(e));
      return this.io.to(socket.id).emit("report_user_resp", {
        status: -1,
        response: `Gỡ cấm chat cho ${username} thành công!`,
      });
    } catch (e) {
      console.error(e);
      this.io.to(socket.id).emit("report_user_resp", {
        status: -1,
        response: `Lỗi xảy ra khi cấm chat ${username}`,
      });
    }
  });
  socket.on("report", async (username: string) => {
    if (!this.localSocketState[socket.id].isAuthenticated) return;

    try {
      let reportedUser: UserState | null = await UserManager.getState(username);

      let userState: UserState | null = await UserManager.getState(
        this.localSocketState[socket.id].username
      );

      if (!reportedUser || !userState) throw "User not found!";

      if (reportedUser.role === Role.ADMIN) {
        return this.io.to(socket.id).emit("report_user_resp", {
          status: -1,
          response: `Bạn không thể báo cáo vi phạm Admin!`,
        });
      }

      // number of times this client has reported `username`
      let reportCount: number = await this.storage.getKey(
        `${this.localSocketState[socket.id].username}_report_${username}`,
        true
      );
      if (reportCount > 0) {
        return this.io.to(socket.id).emit("report_user_resp", {
          status: -1,
          response: `Bạn không thể báo cáo vi phạm ${username} quá 1 lần.`,
        });
      }
      await this.storage.saveKey(
        `${this.localSocketState[socket.id].username}_report_${username}`,
        1, // report count
        3600 // ttl
      );

      UserManager.reportUser(username).then((newState) => {
        if (newState.status === UserStatus.BANNED) {
          this.emitBanMessage(username);
        }
      });
      this.emitReportMessage(username, socket.rooms[-1]).catch((e) => console.error(e));
      // emit successful response to client
      this.io.to(socket.id).emit("report_user_resp", {
        status: 1,
        response: `Báo cáo vi phạm dành cho ${username} thành công!`,
      });
    } catch (e) {
      console.error(e);
      this.io.to(socket.id).emit("report_user_resp", {
        status: -1,
        response: `Báo cáo vi phạm dành cho ${username} không thành công.`,
      });
    }
  });
}
