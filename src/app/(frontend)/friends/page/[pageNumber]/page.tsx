import { createCollectionPaginatedPage } from '@/utilities/collectionPages'

const { Page, generateMetadata, generateStaticParams } = createCollectionPaginatedPage({
  collection: 'friends',
  relationTo: 'friends',
})

export { Page as default, generateMetadata, generateStaticParams }
export const revalidate = 600
