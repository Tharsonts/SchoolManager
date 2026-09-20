import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./server/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./server/school.db",
  },
} satisfies Config;
