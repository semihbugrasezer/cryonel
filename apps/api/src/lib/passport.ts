// apps/api/src/lib/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { env } from "./env";
import { authLogger } from "./logger";
import { db } from "./db";

// User interface for OAuth
interface OAuthUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  providerId: string;
  avatar?: string;
}

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: `${env.API_BASE_URL}/api/auth/oauth/google/callback`,
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`;
        const avatar = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        // Check if user exists with this email
        const existingUser = await db.query(
          "SELECT id, email, role, subscription_tier FROM users WHERE email = $1",
          [email]
        );

        if (existingUser.rows.length > 0) {
          // Update OAuth provider info if user exists
          const user = existingUser.rows[0];
          await db.query(
            `UPDATE users SET 
             google_id = $1, 
             avatar_url = $2, 
             updated_at = NOW() 
             WHERE id = $3`,
            [profile.id, avatar, user.id]
          );

          authLogger.info({ userId: user.id, email, provider: "google" }, "Existing user logged in via Google");
          return done(null, {
            id: user.id,
            email: user.email,
            name: name,
            provider: "google",
            providerId: profile.id,
            avatar,
          });
        } else {
          // Create new user
          const result = await db.query(
            `INSERT INTO users (email, google_id, name, avatar_url, role, subscription_tier) 
             VALUES ($1, $2, $3, $4, 'user', 'free') 
             RETURNING id, email, role, subscription_tier`,
            [email, profile.id, name, avatar]
          );

          const newUser = result.rows[0];
          authLogger.info({ userId: newUser.id, email, provider: "google" }, "New user created via Google OAuth");

          return done(null, {
            id: newUser.id,
            email: newUser.email,
            name: name,
            provider: "google",
            providerId: profile.id,
            avatar,
          });
        }
      } catch (error) {
        authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "Google OAuth error");
        return done(error, undefined);
      }
    }
  )
);

// Configure GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID || "",
      clientSecret: env.GITHUB_CLIENT_SECRET || "",
      callbackURL: `${env.API_BASE_URL}/api/auth/oauth/github/callback`,
    },
    async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || profile.username || "GitHub User";
        const avatar = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in GitHub profile"), undefined);
        }

        // Check if user exists with this email
        const existingUser = await db.query(
          "SELECT id, email, role, subscription_tier FROM users WHERE email = $1",
          [email]
        );

        if (existingUser.rows.length > 0) {
          // Update OAuth provider info if user exists
          const user = existingUser.rows[0];
          await db.query(
            `UPDATE users SET 
             github_id = $1, 
             avatar_url = $2, 
             updated_at = NOW() 
             WHERE id = $3`,
            [profile.id, avatar, user.id]
          );

          authLogger.info({ userId: user.id, email, provider: "github" }, "Existing user logged in via GitHub");
          return done(null, {
            id: user.id,
            email: user.email,
            name: name,
            provider: "github",
            providerId: profile.id,
            avatar,
          });
        } else {
          // Create new user
          const result = await db.query(
            `INSERT INTO users (email, github_id, name, avatar_url, role, subscription_tier) 
             VALUES ($1, $2, $3, $4, 'user', 'free') 
             RETURNING id, email, role, subscription_tier`,
            [email, profile.id, name, avatar]
          );

          const newUser = result.rows[0];
          authLogger.info({ userId: newUser.id, email, provider: "github" }, "New user created via GitHub OAuth");

          return done(null, {
            id: newUser.id,
            email: newUser.email,
            name: name,
            provider: "github",
            providerId: profile.id,
            avatar,
          });
        }
      } catch (error) {
        authLogger.error({ error: error instanceof Error ? error.message : String(error) }, "GitHub OAuth error");
        return done(error, undefined);
      }
    }
  )
);

// Serialize/deserialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
export type { OAuthUser };