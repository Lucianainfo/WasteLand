interface OwidEmbedProps {
  slug: string
  title: string
  source: string
}

/** Live interactive chart embedded from Our World in Data — with its own country selector. */
export function OwidEmbed({ slug, title, source }: OwidEmbedProps) {
  return (
    <figure className="card-lux overflow-hidden">
      <div className="relative w-full" style={{ paddingTop: '68%' }}>
        <iframe
          className="absolute inset-0 h-full w-full bg-white"
          src={`https://ourworldindata.org/grapher/${slug}`}
          title={title}
          loading="lazy"
        />
      </div>
      <figcaption className="border-t border-[var(--border)] px-6 py-4">
        <p className="font-display text-xl text-[var(--text)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--text-soft)]">{source}</p>
      </figcaption>
    </figure>
  )
}
