# Koho Decks

Internal pitch deck generator for the Koho team. Fork of [Presenton](https://github.com/presenton/presenton) with:

- 52 Koho-branded layouts (dark + light, V3 Cool Electric palette, Signal Green accent)
- Tone of Voice v2.1 (Context Platform positioning) baked into the LLM prompts
- 1920×1080 slide rendering end-to-end
- Browser-chrome showcase mockups wrapping live dashboard components
- Claude Opus 4.7 as the default LLM

## What this is

Koho Decks takes a prompt and produces a ready-to-deliver pitch deck using Koho brand templates. It is the internal tool the Koho team uses to build client decks — not a customer-facing product. Clients receive finished decks through shareable view links.

## Local development

```sh
docker compose up -d --build
open http://localhost:5000
```

Environment variables (see `.env.example`):
- `ANTHROPIC_API_KEY` — LLM access
- `ANTHROPIC_MODEL` — defaults to `claude-opus-4-7`
- `PEXELS_API_KEY` — slide imagery

## Roadmap

Phases tracked in `/docs/roadmap.md`:

1. **Fork + rebrand** (done)
2. Postgres migration
3. Users + Google SSO (@koho.ai Workspace domain)
4. Internal team sharing + invitations
5. Public share links with optional email-OTP gating + view tracking
6. Mac Mini deployment behind Cloudflare Tunnel

## Upstream

`upstream` git remote points at `presenton/presenton`. To pull upstream changes:

```sh
git fetch upstream
git merge upstream/main
```

## License

Koho-internal. The Presenton base is Apache 2.0; Koho additions are proprietary.
