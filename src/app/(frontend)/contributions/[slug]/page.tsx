import { createCollectionDetailPage } from '@/utilities/collectionPages'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { DetailPageClient } from '@/utilities/PageClients'
import { formatDateTime } from 'src/utilities/formatDateTime'

const { Page, generateMetadata, generateStaticParams } = createCollectionDetailPage({
  collection: 'contributions',
  render: ({ doc }) => {
    const { title, description, date, image, url: projectUrl } = doc

    return (
      <>
        <DetailPageClient />
        <div className="container relative pb-8">
          <div className="lg:grid lg:grid-cols-[1fr_48rem_1fr]">
            <div className="col-start-1 col-span-1 md:col-start-2 md:col-span-2">
              <h1 className="mb-6 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">{title}</h1>

              <div className="flex flex-col md:flex-row gap-4 md:gap-16">
                {date && (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm">Date</p>
                    <time dateTime={date}>{formatDateTime(date)}</time>
                  </div>
                )}
                {projectUrl && (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm">Link</p>
                    <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                      View Project
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {image && (
          <div className="container relative mb-16">
            <div className="max-w-[48rem] mx-auto rounded-xl overflow-hidden border border-border shadow-sm">
              {typeof image !== 'string' && <Media resource={image} priority />}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="container">
            {description && (
              <RichText className="max-w-[48rem] mx-auto" data={description} enableGutter={false} />
            )}
          </div>
        </div>
      </>
    )
  },
})

export { Page as default, generateMetadata, generateStaticParams }
export const dynamic = 'force-dynamic'
