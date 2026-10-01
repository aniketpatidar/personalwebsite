import type { CollectionSlug } from 'payload'

export interface WorkerAuthPluginOptions {
  /** Collection the strategy authenticates against. Defaults to 'users'. */
  collection?: CollectionSlug
  /** Name registered for the auth strategy. Defaults to 'worker-auth'. */
  strategyName?: string
  /** Env var holding the JWT signing secret shared with the auth Worker. Defaults to 'JWT_SECRET'. */
  secretEnvVar?: string
  /** Cookie the session JWT is read from when no Authorization header is present. Defaults to 'payload-token'. */
  cookieName?: string
  /** Field on the target collection used to look up the user from the JWT's email claim. Defaults to 'email'. */
  lookupField?: string
  /**
   * Host used as the expected JWT audience when neither the x-forwarded-host
   * nor host request headers are present (e.g. some local dev setups).
   */
  fallbackAudience?: string
}
