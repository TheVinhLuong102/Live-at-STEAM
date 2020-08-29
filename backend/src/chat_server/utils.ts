import UserManager, { UserState, Role, UserStatus } from "./member_manager";

export function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export async function isAdmin(username: string) {
  let userState: UserState | null = await UserManager.getState(username);

  if (!userState) throw "User not found";

  return userState.role == Role.ADMIN;
}

export async function isBanned(username: string) {
  let userState: UserState | null = await UserManager.getState(username);

  if (!userState) throw "User not found";

  return userState.status == UserStatus.BANNED;
}
