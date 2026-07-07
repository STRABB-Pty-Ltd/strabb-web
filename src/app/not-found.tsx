import { SearchX } from "lucide-react";
import Link from "next/link";

// App Router convention: rendered for any unmatched route, or when a route
// segment calls notFound(). Mirrors the visual language of
// src/components/shell/error-boundary.tsx so an unknown-error boundary and a
// missing-page boundary read as the same system.
export default function NotFound() {
  return (
    <div className="p-lg flex min-h-screen flex-1 items-center justify-center">
      <div className="max-w-md text-center">
        <SearchX size={55} className="mb-md text-highlight-10 mx-auto" aria-hidden="true" />
        <h2 className="mb-base text-subheading font-semibold">Page not found</h2>
        <p className="mb-md text-body text-highlight-10">
          The page you are looking for does not exist or may have moved.
        </p>
        <Link
          href="/dashboard"
          className="gap-base px-sm py-base text-body bg-primary text-primary-foreground hover:bg-primary/80 inline-flex items-center rounded-lg font-medium"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
