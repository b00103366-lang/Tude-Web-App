import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;
// Legacy salt used before bcrypt migration — kept only for read-time verification
const SHA256_LEGACY_SALT = "etude_salt";

function getTokenSecret(): string {
  const secret = process.env["TOKEN_SECRET"];
  if (!secret) throw new Error("TOKEN_SECRET environment variable is required");
  return secret;
}

/** Hash a new password with bcrypt. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Returns true if the hash looks like a legacy SHA-256 hex hash. */
export function isLegacyPasswordHash(hash: string): boolean {
  return /^[0-9a-f]{64}$/.test(hash);
}

/**
 * Verify a plaintext password against a stored hash.
 * Supports both bcrypt (current) and legacy SHA-256 hashes.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (isLegacyPasswordHash(storedHash)) {
    const legacyHash = crypto
      .createHash("sha256")
      .update(password + SHA256_LEGACY_SALT)
      .digest("hex");
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(legacyHash, "hex"), Buffer.from(storedHash, "hex"));
  }
  return bcrypt.compare(password, storedHash);
}

/** Generate a cryptographically signed token for a user. */
export function generateToken(userId: number): string {
  const timestamp = Date.now().toString();
  const payload = `${userId}:${timestamp}`;
  const sig = crypto
    .createHmac("sha256", getTokenSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

/** Middleware: require a valid signed auth token. Attaches user to req. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const rawHeader = req.headers.authorization;
  if (!rawHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = rawHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    // Format: "userId:timestamp:hmacHex"
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon < 0) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);

    const expectedSig = crypto
      .createHmac("sha256", getTokenSecret())
      .update(payload)
      .digest("hex");

    // Constant-time comparison
    let sigValid = false;
    try {
      const sigBuf = Buffer.from(sig, "hex");
      const expectedBuf = Buffer.from(expectedSig, "hex");
      if (sigBuf.length === expectedBuf.length) {
        sigValid = crypto.timingSafeEqual(sigBuf, expectedBuf);
      }
    } catch {
      // Invalid hex — treat as invalid token
    }

    if (!sigValid) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const colonIdx = payload.indexOf(":");
    if (colonIdx < 0) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const userId = parseInt(payload.slice(0, colonIdx), 10);
    if (!userId || isNaN(userId) || userId <= 0) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Middleware: attach user to req if a valid token is present, but never block.
 * Used on public routes that return extra data to authenticated admins.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const rawHeader = req.headers.authorization;
  if (rawHeader?.startsWith("Bearer ")) {
    const token = rawHeader.slice(7).trim();
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf-8");
      const lastColon = decoded.lastIndexOf(":");
      if (lastColon >= 0) {
        const payload = decoded.slice(0, lastColon);
        const sig = decoded.slice(lastColon + 1);
        const expectedSig = crypto.createHmac("sha256", getTokenSecret()).update(payload).digest("hex");
        const sigBuf = Buffer.from(sig, "hex");
        const expectedBuf = Buffer.from(expectedSig, "hex");
        if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
          const colonIdx = payload.indexOf(":");
          if (colonIdx >= 0) {
            const userId = parseInt(payload.slice(0, colonIdx), 10);
            if (userId > 0 && !isNaN(userId)) {
              const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
              if (user) (req as any).user = user;
            }
          }
        }
      }
    } catch { /* ignore — token is optional */ }
  }
  next();
}

/** Middleware: require admin or super_admin role. Must be used after requireAuth. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

/** Middleware: require super_admin role only. Must be used after requireAuth. */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "super_admin") {
    res.status(403).json({ error: "Super-admin access required" });
    return;
  }
  next();
}
