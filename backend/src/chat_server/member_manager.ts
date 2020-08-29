import { assert } from "console";
import f, { fstat } from "fs";
import ChatServer from "./server";
import { InMemoryKeyValueStorage, KeyValueStorage } from "../storage/key_value";

export enum UserStatus {
  NORMAL,
  BANNED,
}

export enum Role {
  ADMIN,
  MODERATOR,
  MEMBER,
}

export type UserState = {
  username: string;
  status: UserStatus;
  role: Role;
  reportCount?: number;
};

export abstract class UserManager {
  abstract async getState(username: string): Promise<UserState | null>;
  abstract async addUser(
    username: string,
    status: UserStatus,
    role: Role
  ): Promise<UserState>;
  abstract async reportUser(username: string): Promise<UserState>;
  abstract async banUser(username: string): Promise<UserState>;
  abstract async unbanUser(username: string): Promise<UserState>;
}

let ADMIN_LIST = [
  "tuananh-pham",
  "hungdoan",
  "Rosie",
  "Joy_Vu",
];

class KeyValueUserManager extends UserManager {
  storage: KeyValueStorage;

  constructor(storage: KeyValueStorage) {
    super();
    this.storage = storage;
  }
  async getState(username: string): Promise<UserState | null> {
    let userState: UserState | null = await this.storage
      .getKey(username, true)
      .catch((e) => {
        console.error(e);
        throw "Failed to read from keyvalue storage";
      });
    return userState;
  }

  async addUser(
    username: string,
    status: UserStatus = UserStatus.NORMAL,
    role: Role = Role.MEMBER
  ) {
    if (ADMIN_LIST.includes(username)) role = Role.ADMIN;

    let userState: UserState = {
      username: username,
      status: status,
      role: role,
    };
    this.storage.saveKey(username, userState, null);
    return userState;
  }

  async banUser(username: string): Promise<UserState> {
    let userState: UserState | null = await this.storage
      .getKey(username, true)
      .catch((e) => {
        console.error(e);
        throw "Failed to read from keyvalue storage";
      });
    if (!userState) {
      throw "User doesn't exist";
    }

    userState.status = UserStatus.BANNED;
    this.storage.saveKey(username, userState, null);
    return userState;
  }

  async reportUser(username: string): Promise<UserState> {
    let userState: UserState | null = await this.storage
      .getKey(username, true)
      .catch((e) => {
        console.error(e);
        throw "Failed to read from keyvalue storage";
      });
    if (!userState) {
      throw "User doesn't exist";
    }

    userState.reportCount = userState.reportCount
      ? userState.reportCount + 1
      : 1;
    if (userState.reportCount >= 3 /* magic number */) {
      userState.status = UserStatus.BANNED;
    }
    this.storage.saveKey(username, userState, null);
    return userState;
  }

  async unbanUser(username: string): Promise<UserState> {
    let userState: UserState | null = await this.storage
      .getKey(username, true)
      .catch((e) => {
        console.error(e);
        throw "Failed to read from keyvalue storage";
      });
    if (!userState) {
      throw "User doesn't exist";
    }

    userState.status = UserStatus.NORMAL;
    this.storage.saveKey(username, userState, null);
    return userState;
  }
}

export default new KeyValueUserManager(new InMemoryKeyValueStorage());
