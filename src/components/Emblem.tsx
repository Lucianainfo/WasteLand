interface EmblemProps {
  className?: string
}

/** The WasteLand crest: a monogram in a double ring between two wheat sprigs. Draws in currentColor. */
export function Emblem({ className = '' }: EmblemProps) {
  const sprig = (
    <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round">
      <path d="M14 46 C 9 38, 9 26, 15 17" />
      <path d="M12.6 40 c -3 -1, -4.6 -3.2, -5 -5.6 c 2.6 0.4, 4.4 2.2, 5 5.6 z" />
      <path d="M11.4 33.5 c -3 -1.4, -4.2 -3.8, -4.2 -6.2 c 2.6 0.8, 4 3, 4.2 6.2 z" />
      <path d="M11.4 26.8 c -2.6 -1.8, -3.4 -4.2, -3 -6.6 c 2.4 1.2, 3.4 3.6, 3 6.6 z" />
      <path d="M13.1 20.4 c -2 -2, -2.4 -4.4, -1.6 -6.6 c 2 1.6, 2.6 4, 1.6 6.6 z" />
    </g>
  )

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="32" cy="32" r="27.5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
      {sprig}
      <g transform="translate(64 0) scale(-1 1)">{sprig}</g>
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontStyle="italic"
        fontSize="24"
        fill="currentColor"
      >
        W
      </text>
      <path d="M27 47 h10" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="32" cy="12" r="1.1" fill="currentColor" />
    </svg>
  )
}
