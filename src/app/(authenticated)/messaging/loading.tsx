import { PageLoading } from "@/components/shell/page-loading";

// Route-level Suspense fallback for the messaging segment. The inbox and
// thread queries are the heaviest first paint in the app, so render the
// shell skeleton while they load rather than a blank canvas.
export default function Loading() {
  return <PageLoading />;
}
