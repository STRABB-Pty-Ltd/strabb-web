export const cleaningStatusColors: Record<string, string> = {
  pending: "var(--status-pending)",
  confirmed: "var(--status-confirmed)",
  in_progress: "var(--status-in-progress)",
  completed: "var(--status-completed)",
  cancelled: "var(--status-cancelled)",
};

export function cleaningStatusColor(status: string): string {
  return cleaningStatusColors[status] ?? "var(--highlight-10)";
}
