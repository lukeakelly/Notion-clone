import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      role?: string;
    };
  }
}

const providers: NextAuthConfig["providers"] = [];
const simplyaiDomain = "@simplyai.com.au";

function isSimplyaiEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase().endsWith(simplyaiDomain) ?? false;
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
        const isFirstUser = (await prisma.user.count()) === 0;
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: email.split("@")[0],
            role: isFirstUser ? "owner" : "viewer",
          },
        });
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  );
}

const previewAllowedEmails = (process.env.PREVIEW_LOGIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

if (previewAllowedEmails.length > 0) {
  providers.push(
    Credentials({
      id: "preview",
      name: "Preview login",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const raw = (credentials?.email as string | undefined)?.trim().toLowerCase();
        if (!raw || !isSimplyaiEmail(raw) || !previewAllowedEmails.includes(raw)) return null;
        const user = await prisma.user.upsert({
          where: { email: raw },
          update: {},
          create: {
            email: raw,
            name: raw.split("@")[0],
            role: "viewer",
          },
        });
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbUser) token.role = dbUser.role;
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
