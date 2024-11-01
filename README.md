# SQLite as a Convex component

As a prototype, bundle up [SQLite's WASM build](https://sqlite.org/wasm/doc/trunk/index.md) as a Convex component. You can execute SQL queries and statements directly against the component interface. Give it a shot with the example app:
```bash
npm install
cd example
npm install
npm run dev
```

We wire up their `localStorage` backend to a Convex table, which has a few limitations:
1. **Scale**: All data is loaded into memory on every query and mutation. Then, Convex limits all transactions to reading and writing at most [**8MiB** of data](https://docs.convex.dev/production/state/limits#transactions).
2. **Concurrency**: There isn't any fine-grained read dependency tracking, and mutations have no concurrency.

Since SQLite assumes the underlying VFS is synchronous, improving these two will require something like [JSPI](https://v8.dev/blog/jspi-ot).
