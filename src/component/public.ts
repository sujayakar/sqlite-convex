import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

import { Sqlite3 } from "./bindings";
import { api } from "./_generated/api";

async function loadPages(ctx: QueryCtx) {
  const pages = new Map<string, string>();
  for (const page of await ctx.db.query("pages").collect()) {
    pages.set(page.key, page.value);
  }
  return pages;
}

async function savePages(ctx: MutationCtx, pages: Map<string, string>) {
  for (const page of await ctx.db.query("pages").collect()) {
    await ctx.db.delete(page._id);
  }
  for (const [key, value] of pages.entries()) {
    await ctx.db.insert("pages", { key, value });
  }
}

export const readTransaction = query({
  args: {
    query: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const pages = await loadPages(ctx);
    const sqlite3 = await Sqlite3.init(pages);
    const result: any[] = [];
    sqlite3.db.exec({
      sql: args.query,
      callback: (row: any) => {
        result.push(row);
      }
    });
    return result;
  },
});

export const writeTransaction = mutation({
  args: {
    statements: v.array(v.object({
      sql: v.string(),
      bind: v.optional(v.array(v.any())),
    })),
  },
  handler: async (ctx, args) => {
    const pages = await loadPages(ctx);
    const sqlite3 = await Sqlite3.init(pages);
    const { db } = sqlite3;
    for (const statement of args.statements) {
      db.exec(statement);
    }
    const finalPages = sqlite3.close();
    await savePages(ctx, finalPages);
  },
});

export const demoMutation = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(api.public.writeTransaction, {
      statements: [
        { sql: "CREATE TABLE IF NOT EXISTS t(a,b)" },
        { sql: "INSERT INTO t(a,b) VALUES (?,?)", bind: [Math.random(), "hello"] },
        { sql: "INSERT INTO t(a,b) VALUES (?,?)", bind: [Math.random(), "world"] },
      ]
    });
  },
});

export const demoQuery = internalQuery({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const result: any[] = await ctx.runQuery(api.public.readTransaction, { query: "SELECT * FROM t" });
    return result;
  },
});
