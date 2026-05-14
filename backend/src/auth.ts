import { betterAuth } from "better-auth";
import pg from "pg";
import nodemailer from "nodemailer";

const { Pool } = pg;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 3,
    ssl: { rejectUnauthorized: false },
  }),
  advanced: {
    useSecureCookies: true,
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        await transporter.sendMail({
          from:    `"SpendWise" <${process.env.GMAIL_USER}>`,
          to:      user.email,
          subject: "Reset your SpendWise password",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="margin-bottom:8px">Reset your password</h2>
              <p style="color:#6b7280">Click the button below to choose a new password. This link expires in 1 hour.</p>
              <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#000;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
                Reset Password
              </a>
              <p style="font-size:13px;color:#9ca3af">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      } else {
        console.log(`[DEV] Password reset URL for ${user.email}:\n${url}`);
      }
    },
  },
  trustedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:5173"],
  secret: process.env.BETTER_AUTH_SECRET,
});
