import { PageLoading } from "@/components/shell/page-loading";

// Route-level Suspense fallback for the reporting segment. Reporting pulls
// several report queries on load, so a same-shell skeleton avoids a blank
// flash while they resolve, instead of falling back to the app shell's
// generic boundary.
export default function Loading() {
  return <PageLoading />;
}
