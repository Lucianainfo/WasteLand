interface YoutubeEmbedProps {
  videoId: string
  title: string
  credit: string
}

export function YoutubeEmbed({ videoId, title, credit }: YoutubeEmbedProps) {
  return (
    <figure className="overflow-hidden border border-[var(--champagne)]/20">
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <figcaption className="px-6 py-4">
        <p className="font-display text-xl text-[var(--bg-card)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--champagne)]/65">{credit}</p>
      </figcaption>
    </figure>
  )
}
