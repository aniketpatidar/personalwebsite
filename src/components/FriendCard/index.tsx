import React from 'react'
import { Media } from '@/components/Media'

export const FriendCard: React.FC<{ doc: any, index?: number }> = ({ doc, index = 0 }) => {
  const { name, url, description, image } = doc
  
  const isEven = index % 2 === 0
  const bgClass = isEven ? 'bg-card' : 'bg-muted/30'

  return (
    <a href={url || '#'} target="_blank" rel="noopener noreferrer" className="block w-full group">
      <div className={`${bgClass} border border-border rounded-xl p-4 md:p-6 w-full flex flex-col md:flex-row items-center md:items-start text-center md:text-left transition-colors hover:border-primary/50 shadow-sm gap-6`}>
        {image && typeof image !== 'string' && (
          <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden border-2 border-border shadow-sm group-hover:border-primary/30 transition-colors">
            <Media resource={image} imgClassName="object-cover w-full h-full" />
          </div>
        )}
        <div className="flex flex-col justify-center">
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{name}</h3>
          {description && (
            <p className="text-muted-foreground text-sm line-clamp-3 md:line-clamp-none">{description}</p>
          )}
        </div>
      </div>
    </a>
  )
}
