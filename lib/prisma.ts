import { PrismaClient } from ".prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Return a client without adapter (will fail at runtime but won't crash at import time)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new PrismaClient({ log: ["error"] } as any);
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter, log: ["error"] });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
