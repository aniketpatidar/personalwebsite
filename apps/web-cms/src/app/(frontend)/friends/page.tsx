import { createCollectionListPage } from '@/utilities/collectionPages'

const { Page, generateMetadata } = createCollectionListPage({
  collection: 'friends',
  relationTo: 'friends',
})

export { Page as default, generateMetadata }
export const dynamic = 'force-static'
export const revalidate = 600
