import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL not set, ensure the database is provisioned for migrations",
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
