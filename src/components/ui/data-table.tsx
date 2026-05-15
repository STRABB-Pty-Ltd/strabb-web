import { Inbox, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export interface Column<T> {
  key: keyof T;
  header: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: Column<any>[];
  data: T[];
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "No data available",
  emptyDescription,
  emptyIcon = Inbox,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-md border">
        <EmptyState icon={emptyIcon} title={emptyMessage} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="text-body w-full">
        <thead>
          <tr className="bg-muted/50 border-b">
            {columns.map((col) => (
              <th key={String(col.key)} scope="col" className="px-sm py-sm text-left font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-sm py-sm">
                  {col.render
                    ? col.render((row as Record<string, unknown>)[col.key as string], row)
                    : String((row as Record<string, unknown>)[col.key as string] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
