import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// On Vercel serverless environment, the root directory is read-only.
// Copy seed database to /tmp if running on Vercel so SQLite writes succeed.
if (process.env.VERCEL) {
  try {
    const tmpDbPath = path.join("/tmp", "dev.db");
    const localDbPath = path.join(process.cwd(), "dev.db");
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
      fs.copyFileSync(localDbPath, tmpDbPath);
    }
    process.env.DATABASE_URL = `file:${tmpDbPath}`;
  } catch (err) {
    console.warn("Could not copy database to /tmp:", err);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
