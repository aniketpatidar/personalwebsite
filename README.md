# Personal Website

Personal Website is a pnpm/Turborepo monorepo for a personal publishing site. It combines a Next.js frontend with a Payload CMS admin panel, Cloudflare D1 for content, Cloudflare R2 for media, and a separate Worker for passwordless admin sign-in.

## What is included

- `apps/web-cms`: Next.js 16 and Payload CMS application.
- `apps/master-auth`: Cloudflare Worker that sends and verifies admin magic links.
- Cloudflare D1 database for Payload content.
- Cloudflare R2 bucket for uploaded media.
- Pages, posts, projects, contributions, recommendations, friends, categories, users, header, and footer content.
- Draft preview, live preview, SEO, search, redirects, forms, sitemaps, and a layout builder.

## Requirements

- Node.js 22.21.1 (see [.tool-versions](.tool-versions)); the CMS also supports Node.js 18.20.2+.
- pnpm 9.15.0 or a compatible pnpm 9-11 release.
- Cloudflare account access for D1, R2, KV, Email Service, and Workers when deploying.

## Quick start

From the repository root:

```bash
pnpm install
cd apps/web-cms
cp .env.example .env
```

Set `PAYLOAD_SECRET`, `PREVIEW_SECRET`, and `CRON_SECRET` in `apps/web-cms/.env`. Keep `NEXT_PUBLIC_SERVER_URL=http://localhost:3000` for local development. The CMS uses local Wrangler bindings during development; `D1` and `R2` are configured in `apps/web-cms/wrangler.jsonc`.

Start the CMS:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the website. The Payload admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

The admin login uses the `master-auth` Worker. To use passwordless login locally, start the Worker in a second terminal:

```bash
cd apps/master-auth
pnpm install
pnpm dev
```

Set `NEXT_PUBLIC_AUTH_WORKER_URL` in `apps/web-cms/.env` to the local Worker URL printed by Wrangler, usually `http://localhost:8787`. The Worker also needs local values for `JWT_SECRET`, `ALLOWED_SITES`, and `FROM_ADDRESS`; `ALLOWED_SITES` must include `localhost:3000`. Email delivery requires a configured Cloudflare Email Service binding.

## Common commands

Run these from the repository root unless noted otherwise:

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all workspace development servers. |
| `pnpm build` | Build all workspace applications. |
| `pnpm deploy` | Build and deploy workspace applications. |
| `pnpm --filter web-cms lint` | Run CMS ESLint checks. |
| `pnpm --filter web-cms test:int` | Run CMS integration tests with Vitest. |
| `pnpm --filter web-cms test:e2e` | Run CMS browser tests with Playwright. |
| `pnpm --filter web-cms test` | Run integration and end-to-end tests. |
| `pnpm --filter master-auth test` | Run auth Worker tests. |

Useful CMS commands, run from `apps/web-cms`:

```bash
pnpm generate:types   # Generate Cloudflare and Payload types
pnpm payload          # Run a Payload CLI command
pnpm preview          # Build and preview the Cloudflare application
pnpm deploy           # Run migrations, then deploy the CMS
```

## Configuration

The CMS environment template is [`apps/web-cms/.env.example`](apps/web-cms/.env.example):

| Variable | Purpose |
| --- | --- |
| `PAYLOAD_SECRET` | Signs Payload authentication tokens. |
| `NEXT_PUBLIC_SERVER_URL` | Public CMS URL used for links, CORS, images, and sitemaps. |
| `CRON_SECRET` | Authenticates scheduled-job requests. |
| `PREVIEW_SECRET` | Protects draft-preview requests. |
| `NEXT_PUBLIC_AUTH_WORKER_URL` | URL of the `master-auth` Worker used by the login form. |

The auth Worker configuration is in [`apps/master-auth/wrangler.jsonc`](apps/master-auth/wrangler.jsonc). Its `JWT_SECRET` must match the secret expected by the CMS auth strategy. Do not commit secrets or production credentials.

## Deployment

The CMS is packaged for Cloudflare with OpenNext. The deployment configuration is in [`apps/web-cms/wrangler.jsonc`](apps/web-cms/wrangler.jsonc) and defines the D1 database, R2 bucket, and image binding.

Before the first deployment, authenticate Wrangler and verify the configured Cloudflare resources. Then deploy the auth Worker and the CMS:

```bash
pnpm --filter master-auth deploy
pnpm --filter web-cms deploy
```

`web-cms` runs pending Payload migrations and then builds and deploys the OpenNext Worker. Update the Worker `ALLOWED_SITES`, `FROM_ADDRESS`, and secrets for the production hostname before using production login.

## Repository layout

```text
apps/
  master-auth/   Passwordless admin-authentication Worker
  web-cms/       Next.js website and Payload CMS
```

Inside `apps/web-cms/src`, frontend routes live under `app`, Payload collections and plugins under `payload`, reusable page blocks under `blocks`, and shared site chrome under `Header` and `Footer`. The authentication flow is documented in [`apps/web-cms/docs/auth-architecture.md`](apps/web-cms/docs/auth-architecture.md).
<img width="1450" height="678" alt="Screenshot from 2026-08-28 13-31-46" src="https://github.com/user-attachments/assets/9977294d-4bc4-4d03-a64a-5a5117fcd26c" />

## Testing

The integration suite uses Vitest and the end-to-end suite uses Playwright with Chromium. End-to-end tests start the CMS at `http://localhost:3000`; configure the local environment first, then run:

```bash
pnpm --filter web-cms test
```

## License

This project is licensed under the MIT License.
