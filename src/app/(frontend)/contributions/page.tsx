import { createCollectionListPage } from '@/utilities/collectionPages'

const { Page, generateMetadata } = createCollectionListPage({
  collection: 'contributions',
  relationTo: 'contributions',
})

export { Page as default, generateMetadata }
export const dynamic = 'force-static'
export const revalidate = 600
