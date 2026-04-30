"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { TicketFormDialog } from "@/components/pages/cleaning/tickets/ticket-form-dialog";
import { TicketsListView } from "@/components/pages/cleaning/tickets/tickets-list-view";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useProperties } from "@/hooks/use-properties";
import { type TicketFilters, useTicketsAPI } from "@/lib/api-hooks/tickets-api";
import { TICKET_PRIORITY_OPTIONS, TICKET_STATUS_OPTIONS } from "@/types/ticket";

const PAGE_SIZE = 20;

export default function TicketsPage() {
  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const updateFilter = <K extends keyof TicketFilters>(key: K, value: TicketFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const { data, isLoading } = useTicketsAPI(filters);
  const { data: propertiesData } = useProperties();

  const propertyNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const p of propertiesData?.data ?? []) names[p.id] = p.name;
    return names;
  }, [propertiesData]);

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-md space-y-md">
      <PageHeader
        title="Tickets"
        description="Track tickets across all your properties."
        actions={
          <TicketFormDialog
            trigger={
              <Button>
                <Plus className="size-sm mr-xs" />
                New ticket
              </Button>
            }
          />
        }
      />

      <div className="gap-sm flex flex-wrap">
        <FilterSelect
          label="Status"
          value={filters.status ?? ""}
          options={[{ value: "", label: "All statuses" }, ...TICKET_STATUS_OPTIONS]}
          onChange={(v) => updateFilter("status", v || undefined)}
        />
        <FilterSelect
          label="Priority"
          value={filters.priority ?? ""}
          options={[{ value: "", label: "All priorities" }, ...TICKET_PRIORITY_OPTIONS]}
          onChange={(v) => updateFilter("priority", v || undefined)}
        />
        <FilterSelect
          label="Property"
          value={filters.propertyId ?? ""}
          options={[
            { value: "", label: "All properties" },
            ...(propertiesData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
          ]}
          onChange={(v) => updateFilter("propertyId", v || undefined)}
        />
      </div>

      {isLoading ? (
        <p className="text-body text-gray-400">Loading tickets…</p>
      ) : (
        <>
          <TicketsListView items={items} propertyNames={propertyNames} />
          {meta && meta.totalPages > 1 && (
            <Pagination
              page={filters.page ?? 1}
              totalPages={meta.totalPages}
              total={meta.total}
              onChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          )}
        </>
      )}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="gap-xs text-body flex items-center text-gray-600">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-sm py-xs text-body rounded-lg border bg-white"
        style={{ borderColor: "var(--border)" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  return (
    <div className="gap-base text-body flex items-center justify-end text-gray-500">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-sm py-xs rounded-lg border disabled:opacity-40"
        style={{ borderColor: "var(--border)" }}
      >
        Prev
      </button>
      <span>
        Page {page} of {totalPages} · {total} total
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="px-sm py-xs rounded-lg border disabled:opacity-40"
        style={{ borderColor: "var(--border)" }}
      >
        Next
      </button>
    </div>
  );
}
