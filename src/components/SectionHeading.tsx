interface SectionHeadingProps {
  eyebrow?: string
  line1: string
  /** Second line, set in italic — "Özenle işlenmiş, / titizlikle tasarlanmış." */
  line2?: string
  dark?: boolean
  align?: 'center' | 'left'
  className?: string
  as?: 'h2' | 'h3'
}

export function SectionHeading({ eyebrow, line1, line2, dark = false, align = 'center', className = '', as: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <div className={`${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      {eyebrow && <p className={`eyebrow mb-4 ${dark ? 'text-[var(--gold)]' : 'text-[var(--accent)]'}`}>{eyebrow}</p>}
      <Tag className={`font-display text-[clamp(2.1rem,4.6vw,3.4rem)] leading-[1.08] text-balance ${dark ? 'text-[var(--bg-card)]' : 'text-[var(--text)]'}`}>
        {line1}
        {line2 && (
          <>
            <br />
            <em className={`font-normal ${dark ? 'text-[var(--champagne)]' : 'text-[var(--cocoa)]'}`}>{line2}</em>
          </>
        )}
      </Tag>
    </div>
  )
}
