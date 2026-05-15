"use client";

export function PageLoading() {
  return (
    <div className="flex h-screen flex-col" role="status" aria-label="Loading page">
      {/* Skeleton top nav */}
      <div
        className="gap-md px-md flex shrink-0 items-center"
        style={{
          height: "var(--topnav-height)",
          backgroundColor: "var(--highlight-10)",
        }}
      >
        <div
          className="bg-surface-60/20 animate-pulse rounded-md"
          style={{ height: "var(--space-md)", width: 89 }} // 89 = Fibonacci, no project token
        />
        <div className="gap-xs flex flex-1 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-60/10 animate-pulse rounded-lg"
              style={{ height: "var(--space-lg)", width: 89 }}
            />
          ))}
        </div>
        <div
          className="bg-surface-60/10 animate-pulse rounded-lg"
          style={{ height: "var(--space-lg)", width: 89 }}
        />
      </div>

      {/* Skeleton submenu bar */}
      <div className="gap-xs px-md py-base flex shrink-0 items-center border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-neutral-30 animate-pulse rounded-full"
            style={{ height: "var(--space-lg)", width: 89 }}
          />
        ))}
      </div>

      {/* Skeleton body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Skeleton sidebar */}
        <div
          className="p-md hidden shrink-0 border-r lg:block"
          style={{ width: "var(--sidebar-width)" }}
        >
          <div className="space-y-md">
            <div
              className="bg-neutral-30 animate-pulse rounded-md"
              style={{ height: "var(--space-sm)", width: 89 }}
            />
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-neutral-30 animate-pulse rounded-md"
                style={{ height: "var(--space-lg)", width: "100%" }}
              />
            ))}
            <div
              className="mt-md bg-neutral-30 animate-pulse rounded-md"
              style={{ height: "var(--space-sm)", width: 89 }}
            />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-neutral-30 animate-pulse rounded-md"
                style={{ height: "var(--space-md)", width: "100%" }}
              />
            ))}
          </div>
        </div>

        {/* Skeleton content */}
        <div className="p-lg flex-1">
          <div className="space-y-lg">
            <div
              className="bg-neutral-30 animate-pulse rounded-md"
              style={{ height: "var(--space-md)", width: 144 }} // 144 = Fibonacci, no project token
            />
            <div className="gap-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-neutral-30 h-[89px] animate-pulse rounded-lg" />
              ))}
            </div>
            <div className="bg-neutral-30 h-[233px] animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
