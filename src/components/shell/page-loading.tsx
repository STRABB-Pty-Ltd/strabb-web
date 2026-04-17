"use client";

export function PageLoading() {
  return (
    <div className="flex h-screen flex-col" role="status" aria-label="Loading page">
      {/* Skeleton top nav */}
      <div
        className="flex shrink-0 items-center gap-md px-md"
        style={{
          height: "var(--topnav-height)",
          backgroundColor: "var(--strabb-primary)",
        }}
      >
        <div className="animate-pulse rounded bg-white/20" style={{ height: 21, width: 89 }} />
        <div className="flex flex-1 justify-center gap-xs">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg bg-white/10"
              style={{ height: 34, width: 89 }}
            />
          ))}
        </div>
        <div className="animate-pulse rounded-lg bg-white/10" style={{ height: 34, width: 89 }} />
      </div>

      {/* Skeleton submenu bar */}
      <div className="flex shrink-0 items-center gap-xs border-b px-md py-base">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-full bg-gray-100"
            style={{ height: 34, width: 89 }}
          />
        ))}
      </div>

      {/* Skeleton body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Skeleton sidebar */}
        <div
          className="hidden shrink-0 border-r p-md lg:block"
          style={{ width: "var(--sidebar-width)" }}
        >
          <div className="space-y-md">
            <div className="animate-pulse rounded bg-gray-100" style={{ height: 13, width: 89 }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded bg-gray-50"
                style={{ height: 34, width: "100%" }}
              />
            ))}
            <div
              className="mt-md animate-pulse rounded bg-gray-100"
              style={{ height: 13, width: 89 }}
            />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded bg-gray-50"
                style={{ height: 21, width: "100%" }}
              />
            ))}
          </div>
        </div>

        {/* Skeleton content */}
        <div className="flex-1 p-lg">
          <div className="space-y-lg">
            <div className="animate-pulse rounded bg-gray-100" style={{ height: 21, width: 144 }} />
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[89px] animate-pulse rounded-lg bg-gray-50" />
              ))}
            </div>
            <div className="h-[233px] animate-pulse rounded-lg bg-gray-50" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
