interface StatCardProps {
  stat: string
  label: string
  source: string
  className?: string
}

export function StatCard({ stat, label, source, className = '' }: StatCardProps) {
  return (
    <div className={`text-center ${className}`}>
      <p className="font-display text-[clamp(2.6rem,5vw,3.6rem)] leading-none text-[var(--cocoa)] whitespace-nowrap">{stat}</p>
      <div className="mx-auto my-5 h-px w-10 bg-[var(--gold)]" />
      <p className="mx-auto max-w-[16rem] text-sm text-[var(--text-muted)]">{label}</p>
      <p className="eyebrow mt-3 text-[0.6rem] text-[var(--text-soft)]">{source}</p>
    </div>
  )
}
