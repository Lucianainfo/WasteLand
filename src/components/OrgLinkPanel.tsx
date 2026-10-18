import { NumberBadge } from './NumberBadge'

interface OrgLinkPanelProps {
  n: number
  name: string
  description: string
  url: string
  ctaLabel: string
}

/** A real organisation working on food waste, as a card on the dark "Go further" section. */
export function OrgLinkPanel({ n, name, description, url, ctaLabel }: OrgLinkPanelProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col border border-[var(--champagne)]/20 p-7 transition-colors duration-500 hover:border-[var(--champagne)]/60 hover:bg-white/[0.03]"
    >
      <NumberBadge n={n} dark />
      <p className="font-display mt-6 text-2xl text-[var(--bg-card)]">{name}</p>
      <p className="mt-3 flex-1 text-sm text-[var(--champagne)]/75">{description}</p>
      <p className="eyebrow mt-6 flex items-center gap-3 text-[var(--gold)]">
        {ctaLabel}
        <span className="inline-block transition-transform duration-500 group-hover:translate-x-1.5">→</span>
      </p>
    </a>
  )
}
