# JabulaniFM Content OS

A single-Worker, South African digital media platform for the JabulaniFM network. The repository contains the Cloudflare Worker agent, D1 schema and seed data, static Astro frontend, GitHub Actions render pipeline, and Pipedream workflow components.

## Architecture

- **Cloudflare Worker:** API routes, content orchestration, Edge TTS proxy, Paystack webhook verification, scheduled dreaming, Queue consumer, and static asset fallback.
- **D1:** episodic, semantic, procedural, and narrative memory; shows; content jobs; goals; payments; operational statistics.
- **KV:** daily Workers AI neuron budget tracking and rate-limit state.
- **Workers AI / Groq / Gemini:** task-aware provider routing with a Workers AI soft budget threshold and provider failover.
- **Astro:** static network landing page and show pages built into `frontend/dist` and served by the same Worker.
- **GitHub Actions:** script, voice, image, and vertical video render stages with artifact retention.
- **Pipedream:** distribution, monitoring, and monetization workflow components.

## Local development

```bash
npm install
npm --prefix frontend install
npm --prefix aegis-agent install
npm --prefix frontend run build
npx tsc --noEmit -p aegis-agent/tsconfig.json
npm --prefix aegis-agent test
```

The static build produces `frontend/dist`. The Worker entry point is `aegis-agent/src/index.ts`.

## Cloudflare setup

1. Use the provisioned production D1 binding `aegis_db` (Cloudflare account database ID `b73928dd-e592-4402-9ca3-6e026a78e4f7`), the `JABULANIFM_KV` namespace, and the `jabulanifm-content-queue` Queue. The account was already at Cloudflare's free-account D1 limit, so an empty existing AEGIS database was reused rather than deleting an unrelated database.
2. Keep the binding IDs in `wrangler.toml` synchronized with the target Cloudflare account.
3. Create secrets for any enabled provider: `GROQ_API_KEY`, `GEMINI_API_KEY`, and `PAYSTACK_SECRET_KEY`.
4. Run `npm run build`, `npx wrangler types`, then `npx wrangler deploy`.
5. Apply `aegis-agent/schema.sql` and `aegis-agent/seed.sql` with Wrangler D1 commands.

The production configuration uses one Worker and the three documented cron schedules: daily content generation, daily dreaming, and weekly strategy review. The deployed Worker serves the built-in production landing fallback when no asset bundle is attached; subsequent authenticated Wrangler deployments can attach the generated Astro assets from `frontend/dist`.

## API surface

- `GET /api/health` — service health response.
- `GET /api/shows` — active show catalogue.
- `POST /api/content/generate` — accepts `{ "show_slug": "money-desk", "topic": "..." }` and queues a validated script for rendering.
- `POST /tts/synthesize` — accepts text, a supported South African voice, and an optional speed.
- `POST /webhook/paystack` — verifies the raw body using HMAC-SHA512 before recording payment events.

## Render pipeline

The `render-video.yml` workflow generates an editorial JSON script, synthesizes `en-ZA-LeahNeural` audio, generates eight FLUX scene images using multipart form data, assembles a 1080×1920 MP4 with FFmpeg, and stores the result as a GitHub artifact. Secrets are read only from GitHub Actions configuration.

## Repository layout

```text
.aegis/                  Local agent state (ignored)
.github/workflows/       Render and deployment automation
aegis-agent/             Worker source, tests, D1 schema, and seed data
frontend/                Astro static site
github-actions/scripts/  Render pipeline scripts
pipedream/               Distribution, monitoring, and monetization components
wrangler.toml            Single Worker configuration
deploy.sh                Build, type generation, and deploy wrapper
```

No production credentials are stored in the repository. The platform is designed around free-tier limits and fails closed when a required provider credential or generated asset is unavailable.
