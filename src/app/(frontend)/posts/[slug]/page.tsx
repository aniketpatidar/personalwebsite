import { createCollectionDetailPage } from '@/utilities/collectionPages'
import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import RichText from '@/components/RichText'
import { PostHero } from '@/heros/PostHero'
import PageClient from './page.client'

const { Page, generateMetadata, generateStaticParams } = createCollectionDetailPage({
  collection: 'posts',
  render: ({ doc }) => (
    <>
      <PageClient hasHeroImage={!!doc.heroImage && typeof doc.heroImage !== 'string'} />
      <PostHero post={doc} />
      <div className="flex flex-col items-center gap-4 pt-8">
        <div className="container">
          <RichText className="max-w-[48rem] mx-auto" data={doc.content} enableGutter={false} />
          {doc.relatedPosts && doc.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={doc.relatedPosts.filter((post: any) => typeof post === 'object')}
            />
          )}
        </div>
      </div>
    </>
  ),
})

export { Page as default, generateMetadata, generateStaticParams }
export const dynamic = 'force-dynamic'
