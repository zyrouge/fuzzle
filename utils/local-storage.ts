import p from "path";
import { ensureDir, exists, readFile, writeFile } from "fs-extra";

export type LocalStorageData<T> = Record<string, T>;
export type LocalStorageTransaction<T> = (
    data: LocalStorageData<T>
) => LocalStorageData<T>;
export type LocalStorageReadonlyTransaction<T, U> = (
    data: LocalStorageData<T>
) => U;

export class LocalStorage<T = any> {
    ready = false;
    data: LocalStorageData<T> = {};

    constructor(public readonly path: string) {}

    async get(key: string) {
        return this.readonlyTransaction((data) => data[key]);
    }

    async set(key: string, value: T) {
        return this.transaction((data) => {
            data[key] = value;
            return data;
        });
    }

    async delete(key: string) {
        return this.transaction((data) => {
            delete data[key];
            return data;
        });
    }

    async purge() {
        return this.transaction(() => ({}));
    }

    async raw() {
        return this.readonlyTransaction((data) => data);
    }

    async _ensureConnection() {
        if (this.ready) return;
        this.ready = true;
        if (!(await exists(this.path))) {
            await ensureDir(p.dirname(this.path));
            return;
        }
        const content = await readFile(this.path, "utf-8");
        this.data = JSON.parse(content);
    }

    async transaction(writer: LocalStorageTransaction<T>) {
        await this._ensureConnection();
        this.data = writer(this.data);
        const content = JSON.stringify(this.data);
        await writeFile(this.path, content);
    }

    async readonlyTransaction<U>(
        reader: LocalStorageReadonlyTransaction<T, U>
    ) {
        await this._ensureConnection();
        return reader(this.data);
    }

    static dataDir = p.resolve(__dirname, "../data");
}

class CommonStorage extends LocalStorage {
    constructor() {
        super(p.join(LocalStorage.dataDir, "common.json"));
    }

    async get<T>(key: string, defaultValue?: T) {
        const value = await super.get(key);
        return (value ?? defaultValue) as T;
    }
}

export const commonStorage = new CommonStorage();
