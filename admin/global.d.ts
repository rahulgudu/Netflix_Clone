import { PrismaClient } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare global {
    namespace globalThis {
        var prismadb: PrismaClient
    }
}

declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
    } & DefaultSession["user"];
  }
}