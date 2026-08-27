# Master-Auth Architecture

This document outlines the architecture for the stateless master-auth Cloudflare Worker and Payload CMS Custom Auth integration.

## Module Boundaries

```text
/auth (Cloudflare Worker)
  ├── POST /auth/request   # Sends Resend email w/ short-lived JWT
  └── GET  /auth/verify    # Verifies link, redirects to callback w/ 7-day JWT

/aniketpatidar (Next.js + Payload)
  ├── src/app/(frontend)/login/
  │     └── LoginForm.tsx          # Custom UI posting directly to Worker
  ├── src/app/(frontend)/auth/callback/
  │     └── route.ts               # Captures JWT from URL, sets HTTP-only Cookie
  └── src/collections/Users/
        └── index.ts               # Payload Strategy trusting the Worker's JWT
```

## End-to-End Authentication Control Flow

```mermaid
sequenceDiagram
    participant User
    participant NextJS as Next.js (/login & /auth/callback)
    participant Worker as CF Worker (auth)
    participant Payload as Payload CMS

    User->>NextJS: Enters email at /login
    NextJS->>Worker: POST /auth/request { email, site }
    Worker-->>User: Sends 15m Magic Link Email
    
    User->>Worker: Clicks Link -> GET /auth/verify?token=...
    Worker->>Worker: Validate 15m JWT, create 7-day Session JWT
    Worker-->>User: 302 Redirect to /auth/callback?token={sessionJwt}
    
    User->>NextJS: GET /auth/callback?token={sessionJwt}
    NextJS-->>User: Set-Cookie: payload-token & 302 Redirect to /admin
    
    User->>Payload: Access CMS (/admin) with Cookie
    Payload->>Payload: Custom Auth Strategy validates JWT via jose
    Payload-->>User: Authenticated CMS Access
```

## Configuration Note
The Cloudflare Worker requires the following variables in its `wrangler.jsonc` (or as secrets in production) to properly validate sites:
- `ALLOWED_SITES` (e.g. `localhost:3000`)
- `FROM_ADDRESS` (e.g. `no-reply@aniketpatidar.com`)
- `JWT_SECRET` (Must match the `JWT_SECRET` used in Payload CMS)
