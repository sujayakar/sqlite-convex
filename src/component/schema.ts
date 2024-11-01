import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  pages: defineTable({
    key: v.string(),
    value: v.string(),
  }),  
});
