import { createCollectionListPage } from '@/utilities/collectionPages'

const { Page, generateMetadata } = createCollectionListPage({
  collection: 'posts',
  select: {
    title: true,
    slug: true,
    categories: true,
    meta: true,
  },
})

export { Page as default, generateMetadata }
export const dynamic = 'force-static'
export const revalidate = 600
