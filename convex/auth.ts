import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// PBKDF2 password hashing using standard Web Crypto available in Convex V8 runtime
export async function hashPassword(password: string, saltHex?: string) {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  
  let salt: Uint8Array;
  if (saltHex) {
    salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  } else {
    salt = crypto.getRandomValues(new Uint8Array(16));
  }

  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    256
  );

  const saltArray = Array.from(salt);
  const saltString = saltArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashString = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    salt: saltString,
    hash: hashString
  };
}

export async function validateSession(ctx: any, sessionToken: string | undefined) {
  if (!sessionToken) {
    throw new Error("Unauthorized: Missing session token");
  }

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
    .unique();

  if (!session) {
    throw new Error("Unauthorized: Invalid session token");
  }

  if (Date.now() > session.expiresAt) {
    await ctx.db.delete(session._id);
    throw new Error("Unauthorized: Session expired");
  }

  const profile = await ctx.db.get(session.userId);
  if (!profile) {
    throw new Error("Unauthorized: User profile not found");
  }

  return profile;
}

export const login = mutation({
  args: {
    email: v.optional(v.string()),
    enrollmentNo: v.optional(v.string()),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    let email = args.email?.trim().toLowerCase();
    
    if (!email && args.enrollmentNo) {
      const students = await ctx.db.query("students").collect();
      const student = students.find((s) => s.enrollmentNo === args.enrollmentNo?.trim());
      if (student && student.email) {
        email = student.email.trim().toLowerCase();
      }
    }

    if (!email) {
      throw new Error("Invalid email or password");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", email!))
      .unique();

    if (!profile) {
      throw new Error("Invalid email or password");
    }

    if (!profile.passwordHash) {
      let isValid = false;
      if (profile.role === "admin") {
        const configuredPassword = process.env.ADMIN_PASSWORD || "Admin@123";
        if (args.password === configuredPassword) {
          isValid = true;
        }
      } else {
        isValid = true;
      }

      if (!isValid) {
        throw new Error("Invalid email or password");
      }

      const { hash, salt } = await hashPassword(args.password);
      await ctx.db.patch(profile._id, {
        passwordHash: hash,
        passwordSalt: salt,
        updatedAt: Date.now(),
      });
      
      profile.passwordHash = hash;
      profile.passwordSalt = salt;
    } else {
      const { hash } = await hashPassword(args.password, profile.passwordSalt);
      if (hash !== profile.passwordHash) {
        throw new Error("Invalid email or password");
      }
    }

    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await ctx.db.insert("sessions", {
      userId: profile._id,
      token,
      expiresAt,
    });

    let enrollmentNo: string | undefined = undefined;
    if (profile.role === "student") {
      const students = await ctx.db.query("students").collect();
      const student = students.find((s) => s.profileId === profile._id || s.email === profile.email);
      if (student) {
        enrollmentNo = student.enrollmentNo;
      }
    }

    return {
      success: true,
      token,
      profileId: profile._id,
      email: profile.email,
      fullName: profile.fullName || "",
      role: profile.role,
      enrollmentNo,
    };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
      
    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});

export const verifySession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    try {
      const profile = await validateSession(ctx, args.token);
      return {
        valid: true,
        profileId: profile._id,
        email: profile.email,
        fullName: profile.fullName || "",
        role: profile.role,
      };
    } catch (e) {
      return { valid: false };
    }
  },
});
