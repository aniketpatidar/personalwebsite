import { createCollectionDetailPage } from '@/utilities/collectionPages'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { DetailPageClient } from '@/utilities/PageClients'

const { Page, generateMetadata, generateStaticParams } = createCollectionDetailPage({
  collection: 'projects',
  render: ({ doc }) => {
    const { title, description, content, image, githubUrl, liveUrl } = doc

    let fallbackImage = null
    if (!image && githubUrl && githubUrl.includes('github.com/')) {
      const githubPath = githubUrl.split('github.com/')[1]
      fallbackImage = `https://opengraph.githubassets.com/1/${githubPath}`
    }

    return (
      <>
        <DetailPageClient />
        <div className="container relative pb-8">
          <div className="lg:grid lg:grid-cols-[1fr_48rem_1fr]">
            <div className="col-start-1 col-span-1 md:col-start-2 md:col-span-2">
              <h1 className="mb-6 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">{title}</h1>

              <div className="flex flex-col md:flex-row gap-4 md:gap-16">
                {liveUrl && (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm">Live</p>
                    <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                      View Live Site
                    </a>
                  </div>
                )}
                {githubUrl && (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm">GitHub</p>
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="underline text-primary">
                      View Source Code
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {(image || fallbackImage) && (
          <div className="container relative mb-16">
            <div className="max-w-[48rem] mx-auto rounded-xl overflow-hidden border border-border shadow-sm">
              {image && typeof image !== 'string' ? (
                <Media resource={image} priority />
              ) : fallbackImage ? (
                <img src={fallbackImage} alt={title} className="w-full h-auto" />
              ) : null}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center gap-4 pt-8">
          <div className="container">
            {description && (
              <div className="max-w-[48rem] mx-auto text-lg mb-8 font-medium">
                <p>{description}</p>
              </div>
            )}
            {content && (
              <RichText className="max-w-[48rem] mx-auto" data={content} enableGutter={false} />
            )}
          </div>
        </div>
      </>
    )
  },
})

export { Page as default, generateMetadata, generateStaticParams }
export const dynamic = 'force-dynamic'
