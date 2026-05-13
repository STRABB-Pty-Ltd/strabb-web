import { Inbox, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export interface Column<T> {
  key: keyof T;
  header: string;
  className?: string;
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
  headerRowClassName?: string;
  headerCellClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "No data available",
  emptyDescription,
  emptyIcon = Inbox,
  headerRowClassName = "bg-muted/50 border-b",
  headerCellClassName = "px-sm py-sm text-left font-medium",
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
          <tr className={headerRowClassName}>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                className={`${headerCellClassName} ${col.className ?? ""}`.trim()}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {columns.map((col) => (
                <td key={String(col.key)} className={`px-sm py-sm ${col.className ?? ""}`.trim()}>
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
