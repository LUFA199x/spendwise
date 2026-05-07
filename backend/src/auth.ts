import { betterAuth } from "better-auth";
import pg from "pg";

const { Pool } = pg;

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  trustedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:5173"],
  secret: process.env.BETTER_AUTH_SECRET,
});
