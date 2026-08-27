import { createCollectionPaginatedPage } from '@/utilities/collectionPages'

const { Page, generateMetadata, generateStaticParams } = createCollectionPaginatedPage({
  collection: 'projects',
  relationTo: 'projects',
})

export { Page as default, generateMetadata, generateStaticParams }
export const revalidate = 600
