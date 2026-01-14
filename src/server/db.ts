import { PrismaClient } from "@prisma/client";
import { env } from "@/env";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  return new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

let db: PrismaClient;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}

db = globalForPrisma.prisma;

export { db };
