import { NumberBadge } from './NumberBadge'

interface SideNoteProps {
  n: number
  text: string
  source?: string
  /** classes for absolute positioning — e.g. "top-16 right-full mr-10" */
  wrapperClassName: string
}

/**
 * A margin note, only shown on wide screens (xl+), where the space either side of the
 * central column would otherwise stay empty. Set like a footnote in a printed menu.
 */
export function SideNote({ n, text, source, wrapperClassName }: SideNoteProps) {
  return (
    <aside className={`absolute hidden w-52 xl:block ${wrapperClassName}`}>
      <div className="border-t border-[var(--gold)] pt-4 text-sm text-[var(--text-muted)]">
        <NumberBadge n={n} size="sm" className="mb-3" />
        <p className="font-display text-lg leading-snug text-[var(--text)] italic">{text}</p>
        {source && <p className="eyebrow mt-3 text-[0.6rem] text-[var(--text-soft)]">{source}</p>}
      </div>
    </aside>
  )
}
