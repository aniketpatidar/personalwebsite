import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'

import type { Project } from '@/payload-types'

import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const projects = await payload.find({
    collection: 'projects',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = projects.docs.map(({ slug }) => {
    return { slug }
  })

  return params
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function ProjectPage({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const url = '/projects/' + slug
  const project = await queryProjectBySlug({ slug })

  if (!project) return <PayloadRedirects url={url} />

  const { title, description, content, image, githubUrl, liveUrl } = project

  let fallbackImage = null
  if (!image && githubUrl && githubUrl.includes('github.com/')) {
    const githubPath = githubUrl.split('github.com/')[1]
    fallbackImage = `https://opengraph.githubassets.com/1/${githubPath}`
  }

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
              {liveUrl && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm">Live</p>
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                    View Live Site
                  </a>
                </div>
              )}
              {githubUrl && (
                <div className="flex flex-col gap-1">
                  <p className="text-sm">GitHub</p>
                  <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                    View Source Code
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(image || fallbackImage) && (
        <div className="container relative mb-16">
          <div className="max-w-[48rem] mx-auto rounded-xl overflow-hidden border border-border shadow-sm">
            {image && typeof image !== 'string' ? (
              <Media resource={image} priority />
            ) : fallbackImage ? (
              <img src={fallbackImage} alt={title} className="w-full h-auto" />
            ) : null}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          {description && (
            <div className="max-w-[48rem] mx-auto text-lg mb-8 font-medium">
              <p>{description}</p>
            </div>
          )}
          {content && (
            <RichText className="max-w-[48rem] mx-auto" data={content} enableGutter={false} />
          )}
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const project = await queryProjectBySlug({ slug })

  return generateMeta({ doc: project })
}

const queryProjectBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'projects',
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
