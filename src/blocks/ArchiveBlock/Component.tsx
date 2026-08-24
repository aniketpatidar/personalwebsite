import type { Post, ArchiveBlock as ArchiveBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = async (props) => {
  const { id, categories, introContent, limit: limitFromProps, populateBy, selectedDocs } = props

  const limit = limitFromProps || 3

  let posts: any[] = []

  if (populateBy === 'collection') {
    const payload = await getPayload({ config: configPromise })

    const flattenedCategories = categories?.map((category) => {
      if (typeof category === 'object') return category.id
      else return category
    })

    const collectionToQuery = 
      props.relationTo === 'recommendations' ? 'recommendations' 
      : props.relationTo === 'contributions' ? 'contributions' 
      : 'posts'

    const fetchedDocs = await payload.find({
      collection: collectionToQuery,
      depth: 1,
      limit,
      ...(flattenedCategories && flattenedCategories.length > 0 && collectionToQuery === 'posts'
        ? {
            where: {
              categories: {
                in: flattenedCategories,
              },
            },
          }
        : {}),
    })

    posts = fetchedDocs.docs
  } else {
    if (selectedDocs?.length) {
      const filteredSelectedDocs = selectedDocs.map((doc) => {
        if (typeof doc.value === 'object') return { ...doc.value, relationTo: doc.relationTo }
      })

      posts = filteredSelectedDocs
    }
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={posts} relationTo={props.relationTo || undefined} />
    </div>
  )
}
