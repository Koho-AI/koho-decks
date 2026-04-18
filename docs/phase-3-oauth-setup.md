# Phase 3 — Google OAuth Setup (one-time)

Koho Decks uses NextAuth v5 with Google SSO restricted to the `@koho.ai` Workspace. The app won't let anyone sign in until the Google OAuth client is created and the credentials are in `.env`.

## What you do

1. **Go to Google Cloud Console** → [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Pick the project that owns the `koho.ai` Workspace (or create one — call it `koho-decks-auth`).
3. **Configure OAuth consent screen** if prompted:
   - User type: **Internal** (restricts to Workspace members automatically — belt with the `hd` braces).
   - App name: `Koho Decks`.
   - User support email: your `@koho.ai` address.
   - Developer contact: same.
4. **Create an OAuth 2.0 Client ID**:
   - Application type: **Web application**.
   - Name: `Koho Decks (local)` (later add another for production).
   - **Authorized JavaScript origins**:
     - `http://localhost:5001` (local dev)
   - **Authorized redirect URIs**:
     - `http://localhost:5001/api/auth/callback/google`
   - Create, then copy the **Client ID** and **Client secret**.
5. **Paste into `.env`**:
   ```
   AUTH_GOOGLE_ID=<client id>
   AUTH_GOOGLE_SECRET=<client secret>
   ```
6. **Restart the stack** so Next.js picks up the new env vars:
   ```sh
   docker compose up -d production
   ```
7. Visit http://localhost:5001 — you should be bounced to `/signin`, and the **Sign in with Google** button should take you through Google's consent flow.

## How the @koho.ai restriction is enforced

Two layers, so bypassing one still fails:

1. The authorization URL sends `hd=koho.ai`, which tells Google's consent screen to show only Workspace accounts on that domain (a hint, not an enforcement — technically bypassable).
2. The `signIn` callback in `lib/auth.ts` rejects any profile whose `email`'s domain ≠ `koho.ai` **and** rejects profiles whose `hd` claim ≠ `koho.ai` when present. This is server-side and un-bypassable short of compromising the Google OAuth flow itself.

A non-Workspace Google account that somehow reaches the callback will get `AccessDenied` on the sign-in page.

## Production (later)

When we deploy to `decks.koho.ai` (Phase 6), add a **second** OAuth client (or add the production origin + redirect URI to the existing one):

- JavaScript origin: `https://decks.koho.ai`
- Redirect URI: `https://decks.koho.ai/api/auth/callback/google`

Use separate `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` per environment.

## Troubleshooting

- **"redirect_uri_mismatch"** — the URI you pasted into Google Console doesn't exactly match the one Next.js is requesting. Check the port (we're on **5001**, not 5000), scheme (`http` locally, `https` in prod), and path (`/api/auth/callback/google`).
- **Bounced back to `/signin?error=AccessDenied`** — a non-`@koho.ai` account tried to sign in. Working as intended.
- **"Configuration" error** — `AUTH_SECRET` or `AUTH_URL` is missing/wrong in `.env`. NextAuth needs both.
