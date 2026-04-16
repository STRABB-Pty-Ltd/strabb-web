"use client";

export function PageLoading() {
  return (
    <div className="flex h-screen flex-col" role="status" aria-label="Loading page">
      {/* Skeleton top nav */}
      <div
        className="flex shrink-0 items-center gap-4 px-4"
        style={{
          height: "var(--topnav-height)",
          backgroundColor: "var(--strabb-primary)",
        }}
      >
        <div className="h-5 w-20 animate-pulse rounded bg-white/20" />
        <div className="flex flex-1 justify-center gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-16 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
        <div className="h-10 w-16 animate-pulse rounded-lg bg-white/10" />
      </div>

      {/* Skeleton submenu bar */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-gray-100" />
        ))}
      </div>

      {/* Skeleton body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Skeleton sidebar */}
        <div
          className="hidden shrink-0 border-r p-4 lg:block"
          style={{ width: "var(--sidebar-width)" }}
        >
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-full animate-pulse rounded bg-gray-50" />
            ))}
            <div className="mt-6 h-4 w-20 animate-pulse rounded bg-gray-100" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-full animate-pulse rounded bg-gray-50" />
            ))}
          </div>
        </div>

        {/* Skeleton content */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-50" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-gray-50" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
