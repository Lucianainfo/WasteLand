export function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card-lux overflow-hidden">
          <div className="skeleton-shimmer h-48" />
          <div className="space-y-3 p-6">
            <div className="skeleton-shimmer h-3 w-1/3" />
            <div className="skeleton-shimmer h-6 w-3/4" />
            <div className="skeleton-shimmer h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
