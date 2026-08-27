import type { Metadata } from 'next/types'
import type { Config } from '@/payload-types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import { generateMeta } from '@/utilities/generateMeta'
import { ListPageClient, DetailPageClient } from '@/utilities/PageClients'
import { LivePreviewListener } from '@/components/LivePreviewListener'

type CollectionSlug = keyof Config['collections']

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

type ListPageConfig<TSlug extends CollectionSlug> = {
  collection: TSlug
  title?: string
  select?: Record<string, true>
  relationTo?: string
  limit?: number
}

export function createCollectionListPage<TSlug extends CollectionSlug>(
  config: ListPageConfig<TSlug>,
) {
  const {
    collection,
    title = capitalize(collection as string),
    select,
    relationTo = collection as string,
    limit = 12,
  } = config

  async function Page() {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: collection as any,
      depth: 1,
      limit,
      overrideAccess: false,
      ...(select ? { select } : {}),
    })

    return (
      <div className="pt-8 pb-8">
        <ListPageClient />
        <div className="container mb-16">
          <div className="prose dark:prose-invert max-w-none">
            <h1>{title}</h1>
          </div>
        </div>

        <div className="container mb-8">
          <PageRange
            collection={collection as 'posts'}
            currentPage={result.page}
            limit={limit}
            totalDocs={result.totalDocs}
          />
        </div>

        <CollectionArchive posts={result.docs} relationTo={relationTo as any} />

        <div className="container">
          {result.totalPages > 1 && result.page && (
            <Pagination
              basePath={`/${collection as string}`}
              page={result.page}
              totalPages={result.totalPages}
            />
          )}
        </div>
      </div>
    )
  }

  function generateMetadata(): Metadata {
    return { title }
  }

  return { Page, generateMetadata }
}

type PaginatedPageConfig<TSlug extends CollectionSlug> = {
  collection: TSlug
  title?: string
  select?: Record<string, true>
  relationTo?: string
  limit?: number
}

export function createCollectionPaginatedPage<TSlug extends CollectionSlug>(
  config: PaginatedPageConfig<TSlug>,
) {
  const {
    collection,
    title = capitalize(collection as string),
    select,
    relationTo = collection as string,
    limit = 12,
  } = config

  type Args = {
    params: Promise<{
      pageNumber: string
    }>
  }

  async function Page({ params: paramsPromise }: Args) {
    const { pageNumber } = await paramsPromise
    const payload = await getPayload({ config: configPromise })

    const sanitizedPageNumber = Number(pageNumber)
    if (!Number.isInteger(sanitizedPageNumber)) notFound()

    const result = await payload.find({
      collection: collection as any,
      depth: 1,
      limit,
      page: sanitizedPageNumber,
      overrideAccess: false,
      ...(select ? { select } : {}),
    })

    return (
      <div className="pt-24 pb-8">
        <ListPageClient />
        <div className="container mb-16">
          <div className="prose dark:prose-invert max-w-none">
            <h1>{title}</h1>
          </div>
        </div>

        <div className="container mb-8">
          <PageRange
            collection={collection as 'posts'}
            currentPage={result.page}
            limit={limit}
            totalDocs={result.totalDocs}
          />
        </div>

        <CollectionArchive posts={result.docs} relationTo={relationTo as any} />

        <div className="container">
          {result?.page && result?.totalPages > 1 && (
            <Pagination
              basePath={`/${collection as string}`}
              page={result.page}
              totalPages={result.totalPages}
            />
          )}
        </div>
      </div>
    )
  }

  async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
    const { pageNumber } = await paramsPromise
    return { title: `${title} Page ${pageNumber || ''}` }
  }

  async function generateStaticParams() {
    const payload = await getPayload({ config: configPromise })
    const { totalDocs } = await payload.count({
      collection: collection as any,
      overrideAccess: false,
    })

    const totalPages = Math.ceil(totalDocs / limit)
    const pages: { pageNumber: string }[] = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push({ pageNumber: String(i) })
    }
    return pages
  }

  return { Page, generateMetadata, generateStaticParams }
}

type DetailPageConfig<TSlug extends CollectionSlug> = {
  collection: TSlug
  render: (args: { doc: any; draft: boolean; url: string }) => React.ReactNode
}

export function createCollectionDetailPage<TSlug extends CollectionSlug>(
  config: DetailPageConfig<TSlug>,
) {
  const { collection, render } = config

  async function generateStaticParams() {
    const payload = await getPayload({ config: configPromise })
    const docs = await payload.find({
      collection: collection as any,
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      select: { slug: true },
    })

    return docs.docs.map((doc: any) => ({ slug: doc.slug }))
  }

  type Args = {
    params: Promise<{
      slug?: string
    }>
  }

  async function Page({ params: paramsPromise }: Args) {
    const { isEnabled: draft } = await draftMode()
    const { slug = '' } = await paramsPromise
    const decodedSlug = decodeURIComponent(slug)
    const url = `/${collection as string}/${decodedSlug}`
    const doc = await queryBySlug({ slug: decodedSlug })

    if (!doc) return <PayloadRedirects url={url} />

    return (
      <article className="pt-8 pb-8">
        <DetailPageClient />
        <PayloadRedirects disableNotFound url={url} />
        {draft && <LivePreviewListener />}
        {render({ doc, draft, url })}
      </article>
    )
  }

  async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
    const { slug = '' } = await paramsPromise
    const decodedSlug = decodeURIComponent(slug)
    const doc = await queryBySlug({ slug: decodedSlug })
    return generateMeta({ doc })
  }

  const queryBySlug = cache(async ({ slug }: { slug: string }) => {
    const { isEnabled: draft } = await draftMode()
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: collection as any,
      draft,
      limit: 1,
      overrideAccess: draft,
      pagination: false,
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    return result.docs?.[0] || null
  })

  return { Page, generateMetadata, generateStaticParams }
}
