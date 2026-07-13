import { Chip } from "@/components/ui/chip";
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
    <Chip tone="tint" color={color} size="lg">
      {PORTAL_STATUS_LABELS[status]}
    </Chip>
  );
}
