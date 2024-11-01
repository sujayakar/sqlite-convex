import { query, mutation } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

export const readTransaction = query({
  args: {
    query: v.string(),
  },
  returns: v.object({
      results: v.array(v.any()),
      error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {    
    if (args.query.trim() === "") {
      return { results: [] };
    }
    try {
      const results = await ctx.runQuery(components.sqlite.public.readTransaction, {
        query: args.query,
      });
      return { results };
    } catch (error: any) {
      return { results: [], error: error.message };
    }    
  },
});

export const writeTransaction = mutation({
  args: {
    statements: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(components.sqlite.public.writeTransaction, {
      statements: args.statements.map((sql) => ({ sql })),
    });
  },
});
