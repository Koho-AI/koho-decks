import { auth } from "@/lib/auth";

/**
 * Root middleware — NextAuth's `auth()` export is itself an
 * Edge-compatible middleware function. Route protection rules live in
 * the `authorized` callback in lib/auth.ts.
 *
 * Matcher excludes Next.js internals and static assets so they don't
 * trigger auth redirects for every request.
 */
export default auth;

export const config = {
  matcher: [
    // Match all request paths except:
    //   _next/static, _next/image, static files under /public, the
    //   NextAuth routes (/api/auth/*), and the public share viewer
    //   (/view/*) — those are handled by `authorized` in lib/auth.ts.
    "/((?!_next/static|_next/image|favicon.ico|apple-icon|icon1|icon2|koho/|fonts/|Logo.png|logo-white.png|logo-with-bg.png|404.svg|card_bg.svg|create_presentation.png|final_onboarding.png|image_mode.png|image-markup.svg|loading.gif|pdf.svg|pptx.svg|providers/|report.png).*)",
  ],
};
