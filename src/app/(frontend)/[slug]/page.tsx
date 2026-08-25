import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  return []
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  try {
    const { isEnabled: draft } = await draftMode()
    const { slug = '/' } = await paramsPromise
    const decodedSlug = decodeURIComponent(slug)
    const url = '/' + decodedSlug
    let page: RequiredDataFromCollectionSlug<'pages'> | null

    page = await queryPageBySlug({
      slug: decodedSlug,
    })

    if (!page && slug === '/') {
      page = homeStatic
    }

    if (!page) {
      return <PayloadRedirects url={url} />
    }

    const { hero, layout } = page

    return (
      <article className="pt-8 pb-8">
        <PageClient />
        <PayloadRedirects disableNotFound url={url} />
        {draft && <LivePreviewListener />}
        {hero?.type === 'none' ? (
          <div className="container mb-16">
            <div className="prose dark:prose-invert max-w-none">
              <h1>{page.title}</h1>
            </div>
          </div>
        ) : (
          <RenderHero {...hero} />
        )}
        <RenderBlocks blocks={layout} />
      </article>
    )
  } catch (err: any) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Page Error</h1>
        <pre>{err.message}</pre>
        <pre>{err.stack}</pre>
      </div>
    )
  }
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  return { title: 'Personal Websites' }
}

const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: { slug: { equals: slug } },
  })
  return result.docs?.[0] || null
})
