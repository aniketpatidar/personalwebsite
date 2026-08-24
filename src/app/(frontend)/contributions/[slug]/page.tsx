import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'

import type { Contribution } from '@/payload-types'

import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { formatDateTime } from 'src/utilities/formatDateTime'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const contributions = await payload.find({
    collection: 'contributions',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = contributions.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function ContributionPage({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = '/contributions/' + decodedSlug
  const contribution = await queryContributionBySlug({ slug: decodedSlug })

  if (!contribution) return <PayloadRedirects url={url} />

  const { title, description, date, image, url: projectUrl } = contribution

  return (
    <article className="pt-8 pb-8">
      <PageClient />
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <div className="container relative pb-8">
        <div className="lg:grid lg:grid-cols-[1fr_48rem_1fr]">
          <div className="col-start-1 col-span-1 md:col-start-2 md:col-span-2">
            <h1 className="mb-6 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">{title}</h1>
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-16">
              {date && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm">Date</p>
                  <time dateTime={date}>{formatDateTime(date)}</time>
                </div>
              )}
              {projectUrl && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm">Link</p>
                  <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                    View Project
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {image && (
        <div className="container relative mb-16">
          <div className="max-w-[48rem] mx-auto rounded-xl overflow-hidden border border-border shadow-sm">
            {typeof image !== 'string' && <Media resource={image} priority />}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          {description && (
            <RichText className="max-w-[48rem] mx-auto" data={description} enableGutter={false} />
          )}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const contribution = await queryContributionBySlug({ slug: decodedSlug })

  return generateMeta({ doc: contribution })
}

const queryContributionBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'contributions',
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
