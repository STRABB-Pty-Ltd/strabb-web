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
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center justify-center rounded-md border py-xl">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-body">
        <thead>
          <tr className="bg-muted/50 border-b">
            {columns.map((col) => (
              <th key={String(col.key)} className="px-sm py-sm text-left font-medium">
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
