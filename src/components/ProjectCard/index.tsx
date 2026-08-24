import React from 'react'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
import type { Project, Category } from '@/payload-types'

export const ProjectCard: React.FC<{ doc: Project; className?: string }> = ({ doc, className }) => {
  const { title, description, image, githubUrl, liveUrl, categories, slug } = doc
  
  const href = `/projects/${slug}`
  
  let fallbackImage = null
  if (!image && githubUrl && githubUrl.includes('github.com/')) {
    const githubPath = githubUrl.split('github.com/')[1]
    fallbackImage = `https://opengraph.githubassets.com/1/${githubPath}`
  }

  return (
    <article className={cn("border border-border rounded-lg overflow-hidden bg-card flex flex-col h-full group", className)}>
      <div className="block relative w-full aspect-video overflow-hidden bg-muted border-b border-border">
        {image && typeof image !== 'string' ? (
          <Media resource={image} size="33vw" imgClassName="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
        ) : fallbackImage ? (
          <img src={fallbackImage} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            No Image
          </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 transition-colors">
          {title}
        </h3>
        
        {description && <div className="text-muted-foreground text-sm mb-4 line-clamp-3">{description}</div>}
        
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 mt-auto">
            {categories.map((cat: any, i) => {
              const categoryTitle = typeof cat === 'object' ? cat.title : 'Category'
              return (
                <span key={i} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {categoryTitle}
                </span>
              )
            })}
          </div>
        )}
        
        <div className="flex gap-3 pt-4 border-t border-border/50 mt-auto">
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
              Live
            </a>
          )}
          {githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary transition-colors">
              GitHub
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
