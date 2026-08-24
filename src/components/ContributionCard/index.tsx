'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React from 'react'
import { formatDateTime } from 'src/utilities/formatDateTime'

import type { Contribution } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardContributionData = Contribution

export const ContributionCard: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardContributionData
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc } = props

  const { title, image, date, slug } = doc || {}

  const href = `/contributions/${slug}`
  const isClickable = !!slug

  return (
    <article
      className={cn(
        'border border-border rounded-lg overflow-hidden bg-card h-full flex flex-col',
        isClickable ? 'hover:cursor-pointer' : '',
        className,
      )}
      ref={isClickable ? card.ref : undefined}
    >
      {image && (
        <div className="relative w-full border-b border-border">
          {typeof image !== 'string' && <Media resource={image} size="33vw" />}
          {typeof image === 'string' && <img src={image} alt={title || ''} className="w-full h-auto object-cover aspect-video" />}
        </div>
      )}
      <div className="p-4 flex flex-col justify-center flex-grow">
        {title && (
          <div className="prose">
            <h3 className="m-0 text-lg">
              {isClickable ? (
                <Link className="not-prose" href={href} ref={link.ref}>
                  {title}
                </Link>
              ) : (
                <span>{title}</span>
              )}
            </h3>
          </div>
        )}
      </div>
    </article>
  )
}
