'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import Link from 'next/link'
import React from 'react'

import type { Recommendation } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardRecommendationData = Recommendation

export const RecommendationCard: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardRecommendationData
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc } = props

  const { name, headline, image, profileUrl, relationship, text } = doc || {}

  const imageToUse = image
  const sanitizedHeadline = headline?.replace(/\s/g, ' ')
  const isClickable = !!profileUrl
  const href = profileUrl || '#'

  return (
    <article
      className={cn(
        'w-full py-6 flex gap-4 md:gap-5 border-b border-border/50 last:border-b-0',
        isClickable ? 'hover:cursor-pointer group' : '',
        className,
      )}
      ref={isClickable ? card.ref : undefined}
    >
      {imageToUse && (
        <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden shrink-0 bg-muted mt-1 shadow-sm">
          {typeof imageToUse !== 'string' && <Media resource={imageToUse} size="100px" imgClassName="object-cover w-full h-full" />}
          {typeof imageToUse === 'string' && <img src={imageToUse} alt={name || ''} className="w-full h-full object-cover" />}
        </div>
      )}

      <div className="flex flex-col flex-grow">
        {name && (
          <h3 className="m-0 text-base md:text-lg font-semibold flex items-center gap-1 group-hover:text-primary transition-colors">
            {isClickable ? (
              <Link className="not-prose" href={href} ref={link.ref} target="_blank" rel="noopener noreferrer">
                {name}
              </Link>
            ) : (
              <span>{name}</span>
            )}
          </h3>
        )}
        
        {headline && <div className="text-sm md:text-[15px] text-muted-foreground leading-snug mt-0.5">{sanitizedHeadline}</div>}
        
        {relationship && <div className="text-xs md:text-sm text-muted-foreground/80 leading-snug mt-0.5">{relationship}</div>}
        
        {text && (
          <div className="text-sm md:text-[15px] leading-relaxed mt-4 whitespace-pre-wrap text-foreground/90">
            {text}
          </div>
        )}
      </div>
    </article>
  )
}
