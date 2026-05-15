"use client";

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
      <div className="gap-sm flex flex-1">
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
      <span className="px-base py-xs text-body bg-surface-60 text-highlight-10 rounded-full font-medium">
        {count}
      </span>
    </div>
  );
}
