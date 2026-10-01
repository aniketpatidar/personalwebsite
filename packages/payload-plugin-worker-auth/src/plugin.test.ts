import type { CollectionConfig, Config } from 'payload'
import { SignJWT } from 'jose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { workerAuthPlugin } from './plugin.js'

const SECRET = 'test-secret'
const HOST = 'client-a.example.com'

const signToken = async (claims: Record<string, unknown>, audience = HOST, secret = SECRET) =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience(audience)
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(secret))

const fakeCollection = (slug: string, overrides: Partial<CollectionConfig> = {}): CollectionConfig =>
  ({
    slug,
    fields: [],
    ...overrides,
  }) as CollectionConfig

const fakeConfig = (collections: CollectionConfig[]): Config => ({ collections }) as Config

const fakePayload = (docs: unknown[] = []) => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  find: vi.fn(async () => ({ docs })),
})

// Pulls the strategy the plugin attached, so tests exercise the real public
// entry point (workerAuthPlugin) rather than reaching into private helpers.
const getAttachedStrategy = (config: Config, slug: string) => {
  const collection = config.collections?.find((c) => c.slug === slug)
  const auth = collection?.auth
  if (!auth || typeof auth !== 'object') throw new Error(`no auth config on "${slug}"`)
  const strategies = auth.strategies ?? []
  return strategies[strategies.length - 1]!
}

beforeEach(() => {
  process.env.JWT_SECRET = SECRET
})

describe('workerAuthPlugin: config transform', () => {
  it('attaches a strategy only to the matching collection', () => {
    const config = fakeConfig([fakeCollection('users'), fakeCollection('posts')])
    const result = workerAuthPlugin({ collection: 'users' })(config)

    const users = result.collections?.find((c) => c.slug === 'users')
    const posts = result.collections?.find((c) => c.slug === 'posts')

    expect(typeof users?.auth === 'object' && users.auth.strategies).toHaveLength(1)
    expect(posts?.auth).toBeUndefined()
  })

  it('preserves existing auth config and strategies instead of replacing them', () => {
    const existingStrategy = { name: 'local-ish', authenticate: vi.fn() }
    const config = fakeConfig([
      fakeCollection('users', {
        auth: { tokenExpiration: 1234, strategies: [existingStrategy] } as CollectionConfig['auth'],
      }),
    ])

    const result = workerAuthPlugin({ collection: 'users' })(config)
    const users = result.collections?.find((c) => c.slug === 'users')
    const auth = users?.auth as { strategies: unknown[]; tokenExpiration: number }

    expect(auth.tokenExpiration).toBe(1234)
    expect(auth.strategies).toHaveLength(2)
    expect(auth.strategies[0]).toBe(existingStrategy)
  })

  it('warns and no-ops when the target collection does not exist', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const config = fakeConfig([fakeCollection('posts')])

    const result = workerAuthPlugin({ collection: 'users' })(config)

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy.mock.calls[0]![0]).toContain('no collection with slug "users"')
    expect(result.collections?.[0]?.auth).toBeUndefined()
    warnSpy.mockRestore()
  })
})

describe('workerAuthPlugin: authenticate()', () => {
  const setup = (docs: unknown[] = []) => {
    const config = fakeConfig([fakeCollection('users')])
    const result = workerAuthPlugin({ collection: 'users', fallbackAudience: HOST })(config)
    const strategy = getAttachedStrategy(result, 'users')
    const payload = fakePayload(docs)
    return { strategy, payload }
  }

  it('authenticates via an Authorization: Bearer header', async () => {
    const user = { id: '1', email: 'a@example.com' }
    const { strategy, payload } = setup([user])
    const token = await signToken({ email: 'a@example.com' })

    const result = await strategy.authenticate({
      headers: new Headers({ authorization: `Bearer ${token}`, host: HOST }),
      payload: payload as any,
    })

    expect(result.user).toMatchObject({ id: '1', email: 'a@example.com', collection: 'users' })
  })

  it('falls back to the payload-token cookie when no header is present', async () => {
    const user = { id: '2', email: 'b@example.com' }
    const { strategy, payload } = setup([user])
    const token = await signToken({ email: 'b@example.com' })

    const result = await strategy.authenticate({
      headers: new Headers({ cookie: `other=1; payload-token=${token}; another=2`, host: HOST }),
      payload: payload as any,
    })

    expect(result.user).toMatchObject({ id: '2' })
  })

  it('reads a cookie name containing regex-special characters correctly', async () => {
    const config = fakeConfig([fakeCollection('users')])
    const result = workerAuthPlugin({
      collection: 'users',
      cookieName: 'my.auth+token',
      fallbackAudience: HOST,
    })(config)
    const strategy = getAttachedStrategy(result, 'users')
    const payload = fakePayload([{ id: '3', email: 'c@example.com' }])
    const token = await signToken({ email: 'c@example.com' })

    const result2 = await strategy.authenticate({
      headers: new Headers({ cookie: `my.auth+token=${token}`, host: HOST }),
      payload: payload as any,
    })

    expect(result2.user).toMatchObject({ id: '3' })
  })

  it('returns no user and no cleared cookie when no token is present at all', async () => {
    const { strategy, payload } = setup()

    const result = await strategy.authenticate({
      headers: new Headers({ host: HOST }),
      payload: payload as any,
    })

    expect(result.user).toBeNull()
    expect(result.responseHeaders).toBeUndefined()
  })

  it('clears the cookie and rejects a garbage token', async () => {
    const { strategy, payload } = setup()

    const result = await strategy.authenticate({
      headers: new Headers({ authorization: 'Bearer not-a-real-jwt', host: HOST }),
      payload: payload as any,
    })

    expect(result.user).toBeNull()
    expect(result.responseHeaders?.get('set-cookie')).toContain('payload-token=;')
  })

  it('rejects a token signed for a different site (audience mismatch)', async () => {
    const { strategy, payload } = setup([{ id: '1', email: 'a@example.com' }])
    const token = await signToken({ email: 'a@example.com' }, 'client-b.example.com')

    const result = await strategy.authenticate({
      headers: new Headers({ authorization: `Bearer ${token}`, host: HOST }),
      payload: payload as any,
    })

    expect(result.user).toBeNull()
    expect(payload.logger.error).toHaveBeenCalled()
  })

  it('clears the cookie when the JWT is valid but no matching user exists', async () => {
    const { strategy, payload } = setup([])
    const token = await signToken({ email: 'ghost@example.com' })

    const result = await strategy.authenticate({
      headers: new Headers({ authorization: `Bearer ${token}`, host: HOST }),
      payload: payload as any,
    })

    expect(result.user).toBeNull()
    expect(result.responseHeaders).toBeDefined()
    expect(payload.logger.warn).toHaveBeenCalled()
  })
})
