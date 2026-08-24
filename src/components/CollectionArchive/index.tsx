import { cn } from '@/utilities/ui'
import React from 'react'

import type { Post, Recommendation, Contribution, Project } from '@/payload-types'

import { Card } from '@/components/Card'
import { RecommendationCard } from '@/components/RecommendationCard'
import { ContributionCard } from '@/components/ContributionCard'
import { FriendCard } from '@/components/FriendCard'
import { ProjectCard } from '@/components/ProjectCard'

export type Props = {
  posts: (Post | Recommendation | Contribution | Project | any)[]
  relationTo?: 'posts' | 'recommendations' | 'contributions' | 'friends' | 'projects'
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts, relationTo } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-y-4 gap-x-4 lg:gap-y-8 lg:gap-x-8 xl:gap-x-8">
          {posts?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              
              const itemRelationTo = 'relationTo' in result ? result.relationTo : (relationTo || 'posts')

              let colSpan = 'lg:col-span-4'
              
              if (itemRelationTo === 'recommendations') {
                colSpan = 'lg:col-span-12'
              } else if (itemRelationTo === 'contributions') {
                colSpan = 'lg:col-span-6'
              } else if (itemRelationTo === 'friends') {
                colSpan = 'lg:col-span-12'
              } else if (itemRelationTo === 'projects') {
                colSpan = 'lg:col-span-6'
              }

              return (
                <div className={`col-span-4 ${colSpan}`} key={index}>
                  {itemRelationTo === 'recommendations' ? (
                    <RecommendationCard doc={result as Recommendation} />
                  ) : itemRelationTo === 'contributions' ? (
                    <ContributionCard doc={result as Contribution} />
                  ) : itemRelationTo === 'friends' ? (
                    <FriendCard doc={result} index={index} />
                  ) : itemRelationTo === 'projects' ? (
                    <ProjectCard doc={result as Project} />
                  ) : (
                    <Card className="h-full" doc={result as Post} relationTo="posts" showCategories />
                  )}
                </div>
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}
