# payload-plugin-worker-auth

Payload auth strategy plugin for verifying JWT sessions issued by a
**separate, shared Cloudflare Worker** — a passwordless magic-link login
flow living outside the Payload app itself — instead of hand-writing the
same `authenticate()` function into every client project's `Users`
collection.

## Why this exists

A magic-link flow typically looks like:

1. A Worker emails a short-lived JWT link.
2. The user clicks it; the Worker verifies it and issues a longer-lived
   **session JWT**, redirecting back to the app with it (as a query param,
   which the app then sets as a cookie).
3. Payload needs to treat requests carrying that cookie (or an
   `Authorization: Bearer` header) as authenticated — without ever seeing
   a password, because there isn't one.

That last step is a custom [auth strategy](https://payloadcms.com/docs/authentication/custom-strategy).
Across several client sites sharing one auth Worker, that strategy function
is identical except for which collection, which env var holds the shared
secret, and what the session cookie is called — exactly the kind of
repetition a plugin should swallow.

## Usage

```ts
import { buildConfig } from 'payload'
import { workerAuthPlugin } from 'payload-plugin-worker-auth'

export default buildConfig({
  // ...
  plugins: [
    workerAuthPlugin({
      collection: 'users', // default
      secretEnvVar: 'JWT_SECRET', // default — must match the Worker's signing secret
      cookieName: 'payload-token', // default
      lookupField: 'email', // default — field matched against the JWT's `email` claim
    }),
  ],
})
```

The target collection must already exist in `collections` (this plugin
attaches a strategy to it, it doesn't create the collection). If `collection`
doesn't match any collection slug, the plugin logs a `console.warn` at
config-build time and otherwise no-ops, rather than silently doing nothing —
a typo'd slug fails loudly instead of quietly leaving the collection
unauthenticated. Payload's built-in email/password strategy stays enabled
alongside this one unless the collection already sets
`disableLocalStrategy: true` — so an admin can still be hand-created with a
password if needed, e.g. for local dev without running the auth Worker.

## How authentication resolves

1. Read a token from the `Authorization: Bearer <token>` header, falling
   back to the `cookieName` cookie.
2. No token → unauthenticated (`{ user: null }`), no cookie cleared (there
   isn't one to clear).
3. Verify the JWT against `process.env[secretEnvVar]` using
   [`jose`](https://github.com/panva/jose), with the expected audience set
   to the request's `x-forwarded-host` / `host` header (or
   `fallbackAudience` if neither is present). This is what makes the JWT
   single-site-scoped even when the signing secret is shared across
   clients — a token issued for `client-a.com` won't verify against a
   request claiming to be `client-b.com`.
4. On a bad/expired/wrong-audience token, or an email claim with no
   matching user in `collection`, return `{ user: null }` **and** a
   `Set-Cookie` header clearing the stale cookie, so a revoked or expired
   session doesn't keep getting resent on every request.
5. On success, look up the user by `lookupField` (default `email`) and
   return it, tagged with `collection` as Payload's `AuthStrategy` result
   expects.

## Options

| Option             | Default            | Purpose                                                       |
| ------------------ | ------------------ | --------------------------------------------------------------|
| `collection`        | `'users'`          | Collection slug to attach the strategy to                     |
| `strategyName`       | `'worker-auth'`     | Name under which Payload registers the strategy                |
| `secretEnvVar`       | `'JWT_SECRET'`      | Env var holding the secret shared with the auth Worker          |
| `cookieName`         | `'payload-token'`   | Cookie the session JWT is read from / cleared on failure        |
| `lookupField`        | `'email'`           | Field matched against the JWT's `email` claim                  |
| `fallbackAudience`   | `undefined`         | Audience to use when no host header is present                 |

## Tests

```bash
pnpm test
```

Covers the config-merge logic (attaches only to the matching collection,
preserves existing `auth` config and strategies, warns on a missing
collection) and `authenticate()` itself against real signed JWTs via
`jose` — including a regression test for cookie names containing regex
metacharacters, audience-mismatch rejection, and the unregistered-user
path. No mocked JWT verification; the tokens are actually signed and
actually verified.
