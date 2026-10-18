interface NumberBadgeProps {
  n: number
  size?: 'sm' | 'md'
  dark?: boolean
  className?: string
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

const SIZE_CLASSES: Record<'sm' | 'md', string> = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-11 h-11 text-lg',
}

/** Roman numeral in a fine ring, used instead of emoji or icons throughout the app. */
export function NumberBadge({ n, size = 'md', dark = false, className = '' }: NumberBadgeProps) {
  return (
    <span
      className={`font-display inline-flex shrink-0 items-center justify-center rounded-full border italic ${
        dark ? 'border-[var(--gold)]/60 text-[var(--champagne)]' : 'border-[var(--gold)] text-[var(--cocoa)]'
      } ${SIZE_CLASSES[size]} ${className}`}
    >
      {ROMAN[n] ?? n}
    </span>
  )
}
