import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load environment variables from .env.local for Prisma CLI
dotenv.config({ path: ".env.local" });

/** Prisma CLI configuration — schema path, migrations directory, and database URL. */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
