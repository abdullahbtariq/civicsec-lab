import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  data,
  columns,
  getRowKey,
}: {
  data: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string | number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-paper-line">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-paper-raise text-label uppercase text-ink-faint">
            <tr>
              {columns.map((column) => (
                <th className={cn("px-4 py-2.5 font-semibold", column.className)} key={column.key}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line bg-paper-card">
            {data.map((row) => (
              <tr className="transition-colors hover:bg-paper-raise" key={getRowKey(row)}>
                {columns.map((column) => (
                  <td className={cn("px-4 py-3 align-middle text-ink-soft", column.className)} key={column.key}>
                    {column.cell(row)}
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
