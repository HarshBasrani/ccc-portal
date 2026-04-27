import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Return the profile for the given profileId.
 *
 * The frontend stores the logged-in admin's profileId in
 * localStorage after login and passes it here as an argument.
 * Returns `null` when the id is missing or the row doesn't exist.
 */
export const getMe = query({
  args: {
    profileId: v.optional(v.union(v.id("profiles"), v.null())),
  },
  handler: async (ctx, args) => {
    if (!args.profileId) {
      return null;
    }
    return await ctx.db.get(args.profileId);
  },
});
