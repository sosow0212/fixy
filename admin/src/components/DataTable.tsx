import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  getKey,
  empty,
  onRowClick,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900">
        <div className="px-6 py-10 text-center text-sm text-slate-500">
          {empty ?? "데이터가 없습니다."}
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {rows.map((row) => (
              <tr
                key={getKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={
                  onRowClick
                    ? "cursor-pointer transition hover:bg-slate-800/60"
                    : ""
                }
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-4 py-3 text-slate-300 ${col.className ?? ""}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
