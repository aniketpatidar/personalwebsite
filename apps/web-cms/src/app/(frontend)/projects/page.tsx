import { createCollectionListPage } from '@/utilities/collectionPages'

const { Page, generateMetadata } = createCollectionListPage({
  collection: 'projects',
  relationTo: 'projects',
})

export { Page as default, generateMetadata }
export const dynamic = 'force-static'
export const revalidate = 600
