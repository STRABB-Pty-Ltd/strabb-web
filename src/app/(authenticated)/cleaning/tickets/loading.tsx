import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsLoading() {
  return (
    <div className="p-md space-y-xs" aria-busy="true">
      <span className="sr-only">Loading tickets</span>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} h={55} />
      ))}
    </div>
  );
}
