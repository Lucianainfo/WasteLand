import type { ReactNode } from 'react'

export function ErrorBanner({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div role="alert" className="border-l-2 border-[#a4452c] bg-[#a4452c]/[0.06] px-5 py-4 text-sm text-[var(--text)]">
      <p>{message}</p>
      {children}
    </div>
  )
}
