import type { AuthStrategy, Config, Plugin } from 'payload'
import { jwtVerify } from 'jose'

import type { WorkerAuthPluginOptions } from './types.js'

interface ResolvedOptions {
  collection: CollectionSlugLike
  strategyName: string
  secretEnvVar: string
  cookieName: string
  lookupField: string
  fallbackAudience?: string
}

// Kept as a loose alias so this file doesn't need to re-import CollectionSlug
// just for the internal resolved-options shape.
type CollectionSlugLike = NonNullable<WorkerAuthPluginOptions['collection']>

const clearCookieHeaders = (cookieName: string) =>
  new Headers({
    'Set-Cookie': `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`,
  })

// Cookie names are user-configurable; escape before building a RegExp so a
// name containing characters like `.` or `+` can't change what the pattern matches.
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const createWorkerAuthStrategy = (options: ResolvedOptions): AuthStrategy => ({
  name: options.strategyName,
  authenticate: async ({ headers, payload }) => {
    let token = headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      const cookieStr = headers.get('cookie')
      if (cookieStr) {
        const match = cookieStr.match(
          new RegExp(`(?:^|;\\s*)${escapeRegExp(options.cookieName)}=([^;]*)`),
        )
        token = match ? match[1] : undefined
      }
    }

    if (!token) {
      payload.logger.error('[payload-plugin-worker-auth] no token provided')
      return { user: null }
    }

    try {
      const secretStr = process.env[options.secretEnvVar] || 'dev-secret-change-me'
      const secret = new TextEncoder().encode(secretStr)
      const host = headers.get('x-forwarded-host') || headers.get('host') || options.fallbackAudience

      const { payload: jwtPayload } = await jwtVerify(token, secret, {
        audience: host,
      })

      const identifier = jwtPayload.email as string | undefined
      if (!identifier) {
        payload.logger.error('[payload-plugin-worker-auth] no email claim in JWT payload')
        return { user: null, responseHeaders: clearCookieHeaders(options.cookieName) }
      }

      const { docs } = await payload.find({
        collection: options.collection,
        where: { [options.lookupField]: { equals: identifier } },
      })

      if (docs.length === 0) {
        payload.logger.warn(
          '[payload-plugin-worker-auth] unregistered user access attempt',
        )
        return { user: null, responseHeaders: clearCookieHeaders(options.cookieName) }
      }

      return {
        user: {
          ...docs[0],
          collection: options.collection,
        },
      }
    } catch (error) {
      payload.logger.error(
        { err: error },
        '[payload-plugin-worker-auth] token verification failed',
      )
      return { user: null, responseHeaders: clearCookieHeaders(options.cookieName) }
    }
  },
})

/**
 * Attaches an auth strategy to a Payload collection that authenticates
 * requests using a JWT issued by a separate, shared Cloudflare Worker
 * (e.g. a passwordless magic-link login flow) instead of Payload's built-in
 * email/password strategy. The local strategy is left enabled unless the
 * collection already disables it.
 */
export const workerAuthPlugin =
  (options: WorkerAuthPluginOptions = {}): Plugin =>
  (config: Config): Config => {
    const resolved: ResolvedOptions = {
      collection: options.collection ?? 'users',
      strategyName: options.strategyName ?? 'worker-auth',
      secretEnvVar: options.secretEnvVar ?? 'JWT_SECRET',
      cookieName: options.cookieName ?? 'payload-token',
      lookupField: options.lookupField ?? 'email',
      fallbackAudience: options.fallbackAudience,
    }

    const strategy = createWorkerAuthStrategy(resolved)

    let matched = false

    const collections = config.collections?.map((collection) => {
      if (collection.slug !== resolved.collection) return collection
      matched = true

      const existingAuth = collection.auth && typeof collection.auth === 'object' ? collection.auth : {}
      const existingStrategies =
        (typeof collection.auth === 'object' && collection.auth.strategies) || []

      return {
        ...collection,
        auth: {
          ...existingAuth,
          strategies: [...existingStrategies, strategy],
        },
      }
    })

    if (!matched) {
      // This runs at config-build time, before a Payload instance (and its
      // logger) exists, so there's no payload.logger to use here yet.
      console.warn(
        `[payload-plugin-worker-auth] no collection with slug "${resolved.collection}" was found. ` +
          'The worker-auth strategy was not attached to anything — check the `collection` option.',
      )
    }

    return {
      ...config,
      ...(collections ? { collections } : {}),
    }
  }
