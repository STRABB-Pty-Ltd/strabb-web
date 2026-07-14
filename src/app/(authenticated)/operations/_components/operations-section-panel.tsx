"use client";

import { Chip } from "@/components/ui/chip";

export interface SectionColumn {
  id: string;
  label: string;
  count: number;
  cards: React.ReactNode;
}

interface SectionPanelProps {
  title: string;
  columns: SectionColumn[];
}

export function SectionPanel({ title, columns }: SectionPanelProps) {
  return (
    <section
      className="px-sm py-base flex min-w-0 flex-1 flex-col rounded-xl"
      style={{ backgroundColor: "var(--neutral-30)" }}
    >
      <h3
        className="mb-xs text-subheading text-center font-semibold"
        style={{ color: "var(--highlight-10)" }}
      >
        {title}
      </h3>
      {/* Columns stack vertically below lg (M.1's mobile-shell breakpoint):
          a fixed horizontal row of 2-6 columns has no room to shrink into
          below wide-desktop widths, so cards wrapped character-by-character
          and the header label collided with its own count badge (found in
          the M.4 mobile audit). Same fix shape as AlertStrip's responsive
          grid. */}
      <div className="gap-sm flex flex-1 flex-col lg:flex-row">
        {columns.map((col) => (
          <div key={col.id} className="flex min-w-0 flex-1 flex-col">
            <SubColumnHeader label={col.label} count={col.count} />
            <div className="gap-base pt-base flex flex-col">{col.cards}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubColumnHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      className="gap-base px-base py-xs flex items-center border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="text-body text-highlight-10 font-semibold">{label}</span>
      <Chip tone="surface" radius="pill">
        {count}
      </Chip>
    </div>
  );
}
