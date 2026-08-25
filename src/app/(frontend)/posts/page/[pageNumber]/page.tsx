import { createCollectionPaginatedPage } from '@/utilities/collectionPages'

const { Page, generateMetadata, generateStaticParams } = createCollectionPaginatedPage({
  collection: 'posts',
  select: {
    title: true,
    slug: true,
    categories: true,
    meta: true,
  },
})

export { Page as default, generateMetadata, generateStaticParams }
export const revalidate = 600
