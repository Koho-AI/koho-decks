import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * NextAuth v5 configuration for Koho Decks.
 *
 * Google SSO is restricted to the @koho.ai Workspace via the `hd`
 * authorization parameter and an extra server-side check in the
 * `signIn` callback (belt + braces — `hd` is a hint to Google's
 * consent screen, not an enforcement).
 *
 * Session strategy: JWT. The same JWT is forwarded to the FastAPI
 * backend in the Authorization header so FastAPI can identify the
 * caller without running its own auth stack.
 */

const KOHO_DOMAIN = "koho.ai";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          // Shows only @koho.ai accounts on Google's consent screen.
          hd: KOHO_DOMAIN,
          prompt: "select_account",
          access_type: "online",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    async signIn({ profile }) {
      // Enforce @koho.ai server-side — `hd` in the auth URL is bypassable.
      if (!profile?.email) return false;
      const emailDomain = profile.email.split("@")[1]?.toLowerCase();
      if (emailDomain !== KOHO_DOMAIN) return false;
      // Google's `hd` claim should match too for Workspace accounts.
      const hd = (profile as { hd?: string }).hd?.toLowerCase();
      if (hd && hd !== KOHO_DOMAIN) return false;
      return true;
    },
    async jwt({ token, account, profile }) {
      // First sign-in: stash Google sub + profile details on the JWT so
      // downstream calls don't need to hit Google again.
      if (account && profile) {
        token.googleSub = profile.sub;
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.image = (token.picture as string) ?? session.user.image;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Public routes — signed-out users may access.
      const publicPrefixes = [
        "/signin",
        "/api/auth",
        "/view", // Phase 5 public share viewer (not built yet, reserved)
        "/_next",
        "/koho",
        "/favicon",
        "/icon",
        "/apple-icon",
        "/Logo.png",
        "/logo-white.png",
        "/logo-with-bg.png",
      ];
      const isPublic = publicPrefixes.some((p) => path.startsWith(p));

      if (isPublic) return true;
      return isLoggedIn;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
