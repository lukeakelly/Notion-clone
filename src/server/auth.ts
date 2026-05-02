import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { randomBytes } from "crypto";
import { getPrisma } from "./db";

declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
    };
  }
}

const providers: NextAuthConfig["providers"] = [];
const simplyaiDomain = "@simplyai.com.au";
const hasDatabase = !!process.env.DATABASE_URL;
const previewSecret = process.env.PREVIEW_AUTH_SECRET ?? process.env.AUTH_SECRET;
const fallbackPreviewSecret =
  process.env.VERCEL_ENV === "preview" && !hasDatabase
    ? (previewSecret ?? process.env.VERCEL_GIT_COMMIT_SHA ?? randomBytes(32).toString("base64url"))
    : undefined;

function isSimplyaiEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase().endsWith(simplyaiDomain) ?? false;
}

async function previewUser(email: string, role: "owner" | "viewer") {
  if (!hasDatabase) {
    return {
      id: `preview-${email}`,
      name: email.split("@")[0],
      email,
      image: null,
      role,
    };
  }
  const user = await getPrisma().user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: email.split("@")[0],
      role,
    },
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

// Note: NODE_ENV is inlined by Next.js at build time, so a runtime
// override (e.g. docker-compose `NODE_ENV: development` against an image
// built with `NODE_ENV=production`) cannot re-enable this provider. We gate
// solely on ALLOW_DEV_LOGIN, which is read at runtime; the env var name
// already communicates its dev-only intent and is documented as such in
// .env.example.
if (process.env.ALLOW_DEV_LOGIN === "true") {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const email = ((credentials?.email as string) ?? "estimator@simplyai.com.au")
          .trim()
          .toLowerCase();
        if (!isSimplyaiEmail(email)) return null;
        const isFirstUser = hasDatabase ? (await getPrisma().user.count()) === 0 : false;
        return previewUser(email, isFirstUser ? "owner" : "viewer");
      },
    }),
  );
}

const previewAllowedEmails = (process.env.PREVIEW_LOGIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const allowPreviewLogin =
  previewAllowedEmails.length > 0 ||
  (process.env.VERCEL_ENV === "preview" && !process.env.GOOGLE_CLIENT_ID);

if (allowPreviewLogin) {
  providers.push(
    Credentials({
      id: "preview",
      name: "Preview login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const raw = (credentials?.email as string | undefined)?.trim().toLowerCase();
        if (!raw || !isSimplyaiEmail(raw)) return null;
        if (previewAllowedEmails.length > 0 && !previewAllowedEmails.includes(raw)) return null;
        return previewUser(raw, "viewer");
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: hasDatabase ? PrismaAdapter(getPrisma()) : undefined,
  secret: process.env.AUTH_SECRET ?? fallbackPreviewSecret,
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async signIn({ user }) {
      return isSimplyaiEmail(user.email);
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        if (hasDatabase) {
          const dbUser = await getPrisma().user.findUnique({ where: { id: user.id } });
          if (dbUser) token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (typeof token.role === "string") session.user.role = token.role;
      return session;
    },
  },
  trustHost: true,
});
