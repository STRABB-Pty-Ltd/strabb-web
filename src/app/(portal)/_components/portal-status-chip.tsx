import {
  PORTAL_STATUS_COLORS,
  PORTAL_STATUS_LABELS,
  type PortalTaskStatus,
} from "@/lib/schemas/portal";

/**
 * Status pill for the cleaner portal. Coloured text on a faint tint of the same
 * status token (matching the billing section's chip treatment) so every status
 * reads clearly in both themes without depending on a solid-fill contrast pair.
 */
export function PortalStatusChip({ status }: { status: PortalTaskStatus }) {
  const color = PORTAL_STATUS_COLORS[status];
  return (
    <span
      className="px-sm text-body inline-flex items-center rounded-md font-medium"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
        minHeight: "var(--chip-height)",
      }}
    >
      {PORTAL_STATUS_LABELS[status]}
    </span>
  );
}
