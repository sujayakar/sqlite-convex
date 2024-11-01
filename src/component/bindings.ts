import sqlite3InitModule from "../sqlite-wasm/sqlite3.mjs";
import { wasmSource } from "../sqlite-wasm/sqlite3.wasm.js";

const wasmBinary = atob(wasmSource);
const wasmBuffer = new Uint8Array(wasmBinary.length);
for (let i = 0; i < wasmBinary.length; i++) {
    wasmBuffer[i] = wasmBinary.charCodeAt(i);
}

export class Sqlite3 {
    constructor(private pages: Map<string, string>, private sqlite3: any, public db: any) {}

    static async init(pages: Map<string, string>): Promise<Sqlite3> {
        if (globalThis.localStorage) {
            throw new Error('localStorage is already defined');
        }
        globalThis.localStorage = {
            key: (index: number) => {
                throw new Error('key() not implemented');
            },
            getItem: (key: string) => {
                return pages.get(key) ?? null;
            },
            setItem: (key: string, value: string) => {
                pages.set(key, value);
            },
            removeItem: (key: string) => {
                pages.delete(key);
            },
            get length() {
                return pages.size;
            },
            clear: () => {
                pages.clear();
            },
        }
        console.time('sqlite3InitModule');
        const sqlite3 = await sqlite3InitModule({
            instantiateWasm: async (imports: any, receiveInstance: any) => {
                const { instance } = await WebAssembly.instantiate(wasmBuffer, imports);
                receiveInstance(instance);
            },
        });
        console.timeEnd('sqlite3InitModule');
        console.log("Running SQLite3 version", sqlite3.version.libVersion);
        const db = new sqlite3.oo1.DB({
            filename: ':localStorage:',
            flags: 'c',
        });
        return new Sqlite3(pages, sqlite3, db);
    }

    close(): Map<string, string> {
        this.db.close();        
        return this.pages;
    }
}