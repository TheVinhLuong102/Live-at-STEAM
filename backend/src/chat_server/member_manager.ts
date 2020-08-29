import { assert } from "console";
import f, { fstat } from "fs";
import ChatServer from "./server";
import {InMemoryKeyValueStorage, KeyValueStorage} from "../storage/key_value"

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
  "s4vadmin",
  "tuananh-pham",
  "hungdoan",
  "lemailan12",
  "Rosie",
  "Joy_Vu",
];

/**
 * Temporary solution for storing UserState
 */
class LocalUserManager extends UserManager {
  private storage_path: string;

  constructor(
    storage_path: string = process.env.LOCAL_USER_STORAGE || "./userstate.json"
  ) {
    super();
    this.storage_path = storage_path;
    //this.userStateMap = JSON.parse(f.readFileSync(storage_path, 'utf8'));
    //this.writeBackToFileRoutine();
  }

  // writeBackToFileRoutine() {
  //     // write to a cache file every 1 second
  //     f.writeFile(this.storage_path, JSON.stringify(this.userStateMap), err => {
  //         if (err)
  //             console.error(err);

  //         setTimeout(() => this.writeBackToFileRoutine(), 1000);
  //     });
  // }

  async writeUserState(userStateMap: { [key: string]: UserState }) {
    f.writeFileSync(this.storage_path, JSON.stringify(userStateMap));
    // return new Promise((resolve, reject) => {
    //     f.writeFile(this.storage_path, JSON.stringify(userStateMap),(err) => {
    //         if (err) return reject(err);
    //         resolve();
    //     })
    // });
  }

  async loadUserState(): Promise<{ [key: string]: UserState }> {
    // return new Promise((resolve, reject) => {
    //     f.readFile(this.storage_path, 'utf8', (err, data) => {
    //         if (err) return reject(err);

    //         resolve(JSON.parse(data));
    //     })
    // });
    return JSON.parse(f.readFileSync(this.storage_path, "utf8"));
  }

  async getState(username: string): Promise<UserState |  null> {
    let userStateMap = await this.loadUserState().catch((e) => {
      console.error(e);
      throw "Failed to load UserStateMap";
    });
    return userStateMap[username] ? userStateMap[username] : null;
  }

  async addUser(
    username: string,
    status = UserStatus.NORMAL,
    role = Role.MEMBER
  ): Promise<UserState> {
    let userStateMap = await this.loadUserState().catch((e) => {
      console.error(e);
      throw "Failed to load UserStateMap";
    });

    if (ADMIN_LIST.includes(username)) role = Role.ADMIN;

    userStateMap[username] = {
      username: username,
      status: status,
      role: role,
    };
    await this.writeUserState(userStateMap).catch((e) => {
      console.error(e);
      throw "Failed to write UserStateMap back to disk";
    });
    return userStateMap[username];
  }

  async reportUser(username: string): Promise<UserState> {
    let userStateMap = await this.loadUserState().catch((e) => {
      console.error(e);
      throw "Failed to load UserStateMap";
    });
    if (!(username in userStateMap)) return;

    userStateMap[username].reportCount = userStateMap[username].reportCount
      ? userStateMap[username].reportCount + 1
      : 1;
    if (userStateMap[username].reportCount >= 3) {
      //  magic number 3
      await this.banUser(username).catch((e) => console.error(e));
    } else {
      await this.writeUserState(userStateMap).catch((e) => {
        console.error(e);
        throw "Failed to write UserStateMap back to disk";
      });
    }
    return userStateMap[username];
  }

  async unbanUser(username: string): Promise<UserState> {
    let userStateMap = await this.loadUserState().catch((e) => {
      console.error(e);
      throw "Failed to load UserStateMap";
    });
    if (!(username in userStateMap)) throw "User doesn't exist";

    userStateMap[username].status = UserStatus.NORMAL;
    await this.writeUserState(userStateMap).catch((e) => {
      console.error(e);
      throw "Failed to write UserStateMap back to disk";
    });
    return userStateMap[username];
  }

  async banUser(username: string): Promise<UserState> {
    let userStateMap = await this.loadUserState().catch((e) => {
      console.error(e);
      throw "Failed to load UserStateMap";
    });

    if (!(username in userStateMap)) throw "User doesn't exist";

    userStateMap[username].status = UserStatus.BANNED;
    console.log(userStateMap[username]);
    await this.writeUserState(userStateMap).catch((e) => {
      console.error(e);
      throw "Failed to write UserStateMap back to disk";
    });
    return userStateMap[username];
  }
}

class KeyValueUserManager extends UserManager {
    storage: KeyValueStorage;

    constructor(storage: KeyValueStorage) {
        super();
        this.storage = storage;

    }
    async getState(username: string): Promise<UserState | null> {
        let userState: UserState | null = await this.storage.getKey(username, true)
                                                            .catch(e => {console.error(e); throw "Failed to read from keyvalue storage"});
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
        let userState: UserState | null = await this.storage.getKey(username, true)
                                                            .catch(e => {console.error(e); throw "Failed to read from keyvalue storage"});
        if(!userState) {
            throw "User doesn't exist";
        }

        userState.status = UserStatus.BANNED;
        this.storage.saveKey(username, userState, null);
        return userState;

    }

    async reportUser(username: string): Promise<UserState> {
        let userState: UserState | null = await this.storage.getKey(username, true)
                                                            .catch(e => {console.error(e); throw "Failed to read from keyvalue storage"});
        if(!userState) {
            throw "User doesn't exist";
        }

        userState.reportCount = userState.reportCount ? userState.reportCount + 1 : 1;
        if(userState.reportCount >= 3 /* magic number */) {
            userState.status = UserStatus.BANNED;
        }
        this.storage.saveKey(username, userState, null);
        return userState;
    }

    async unbanUser(username: string): Promise<UserState> {
        let userState: UserState | null = await this.storage.getKey(username, true)
                                                            .catch(e => {console.error(e); throw "Failed to read from keyvalue storage"});
        if(!userState) {
            throw "User doesn't exist";
        }

        userState.status = UserStatus.NORMAL;
        this.storage.saveKey(username, userState, null);
        return userState;
    }
}

export default new KeyValueUserManager(new InMemoryKeyValueStorage());
