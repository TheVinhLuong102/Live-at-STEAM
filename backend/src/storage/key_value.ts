

abstract class KeyValueStorage {
    abstract async  getKey(key: string, refresh: boolean): Promise<any>;
    abstract async  saveKey(key: string, value: any, ttl: number): Promise<void>;
    abstract async  clearKey(key: string): Promise<void>;
}

type KeyStore  = {
    value: any,
    time: number,
    ttl: number
}

class InMemoryKeyValueStorage extends KeyValueStorage {
    keyValueMap: {[key:string] : KeyStore};

    constructor() {
        super();
        this.keyValueMap = {};
    }

    async getKey(key: string, refresh: boolean = true) {
        if(!this.keyValueMap[key])
            return null;

        if(this.keyValueMap[key].time + this.keyValueMap[key].ttl < Date.now() / 1000) {
            delete this.keyValueMap[key]; 
            return null;
        }

        if(refresh)
            this.keyValueMap[key].time = Date.now();
        
        return this.keyValueMap[key].value;
    }

    async saveKey(key: string, value: any, ttl: number = 3600) {
        this.keyValueMap[key] = {
            value: value,
            time: Date.now() / 1000,
            ttl: ttl
        }
    }

    async clearKey(key: string) {
        delete this.keyValueMap[key];
    }

}

export default new InMemoryKeyValueStorage();