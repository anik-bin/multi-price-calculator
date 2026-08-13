import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });

const globalPrisma = global as unknown as {prisma: PrismaClient};

export const db = globalPrisma.prisma ?? new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
    globalPrisma.prisma = db;
}