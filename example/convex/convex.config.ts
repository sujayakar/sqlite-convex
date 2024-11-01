import { defineApp } from "convex/server";
import sqlite from "sqlite-convex/convex.config";

const app = defineApp();
app.use(sqlite);

export default app;
