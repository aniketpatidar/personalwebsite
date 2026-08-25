import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { type DataFromGlobalSlug, getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

type Global = keyof Config['globals']

async function getGlobal<T extends Global>(slug: T, depth = 0): Promise<DataFromGlobalSlug<T>> {
  try {
    const payload = await getPayload({ config: configPromise })
    const global = await payload.findGlobal({
      slug,
      depth,
    })
    return global
  } catch (err: any) {
    console.error('getGlobal error:', err)
    return {} as DataFromGlobalSlug<T>
  }
}

export const getCachedGlobal = <T extends Global>(slug: T, depth = 0) =>
  unstable_cache(async () => getGlobal<T>(slug, depth), [slug], {
    tags: [`global_${slug}`],
  })
