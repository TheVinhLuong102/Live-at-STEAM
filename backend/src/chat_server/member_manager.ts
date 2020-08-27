import { assert } from "console";
import f, { fstat } from "fs";

export enum UserStatus {
    NORMAL,
    BANNED,
}

export enum Role {
    ADMIN,
    MODERATOR,
    MEMBER
}

export type UserState = {
    username: string,
    status: UserStatus,
    role: Role,
    reportCount? : number
}


export abstract class UserManager {
    abstract async getState(username: string) : Promise<UserState | null>;
    abstract async addUser(userState: UserState): Promise<UserState>;
    abstract async banUser(username: string): Promise<void>;
    abstract async unbanUser(username: string): Promise<void>;
    
}

/**
 * Temporary solution for storing UserState
 */
class LocalUserManager extends UserManager{
    private storage_path: string;

    constructor(storage_path: string = process.env.LOCAL_USER_STORAGE || "./userstate.json") {
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
        return JSON.parse(f.readFileSync(this.storage_path, 'utf8'));
    }

    async getState(username: string) : Promise<UserState | null> {
        let userStateMap = await this.loadUserState().catch((e) => { console.error(e); throw "Failed to load UserStateMap" });
        return userStateMap[username] ? userStateMap[username] : null;
    }

    async addUser(username, status = UserStatus.NORMAL, role = Role.MEMBER): Promise<UserState> {
        let userStateMap = await this.loadUserState().catch((e) => { console.error(e); throw "Failed to load UserStateMap" });
        userStateMap[username] = {
            username: username,
            status: status,
            role: role
        };
        await this.writeUserState(userStateMap).catch(e => {console.error(e); throw "Failed to write UserStateMap back to disk"});
        return userStateMap[username];
    }

    async reportUser(username: string): Promise<void> {
        let userStateMap = await this.loadUserState().catch((e) => { console.error(e); throw "Failed to load UserStateMap" });
        if (!(username in userStateMap))
            return;

        userStateMap[username].reportCount = userStateMap[username].reportCount ? userStateMap[username].reportCount + 1 : 1;
        if(userStateMap[username].reportCount >= 5 ) { //  magic number 5
            await this.banUser(username).catch((e) => console.error(e));
        } else {
            await this.writeUserState(userStateMap).catch(e => {console.error(e); throw "Failed to write UserStateMap back to disk"});
        }
    }

    async unbanUser(username: string): Promise<void> {
        let userStateMap = await this.loadUserState().catch((e) => { console.error(e); throw "Failed to load UserStateMap" });
        if (!(username in userStateMap))
            return;

        userStateMap[username].status = UserStatus.NORMAL;
        await this.writeUserState(userStateMap).catch(e => {console.error(e); throw "Failed to write UserStateMap back to disk"});
    }

    async banUser(username: string): Promise<void> {
        let userStateMap = await this.loadUserState().catch((e) => { console.error(e); throw "Failed to load UserStateMap" });

        if (!(username in userStateMap))
            return;

        userStateMap[username].status = UserStatus.BANNED;
        console.log(userStateMap[username])
        await this.writeUserState(userStateMap).catch(e => {console.error(e); throw "Failed to write UserStateMap back to disk"});
    }
}


export default new LocalUserManager();