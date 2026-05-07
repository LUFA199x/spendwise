import { betterAuth } from "better-auth";
import pg from "pg";
import { Resend } from "resend";

const { Pool } = pg;

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      if (resend) {
        await resend.emails.send({
          from:    process.env.FROM_EMAIL ?? "SpendWise <onboarding@resend.dev>",
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
        // No email provider configured — log URL for local development
        console.log(`[DEV] Password reset URL for ${user.email}:\n${url}`);
      }
    },
  },
  trustedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:5173"],
  secret: process.env.BETTER_AUTH_SECRET,
});
