interface Props {
  status: string;
  label?: string;
}

const statusConfig: Record<string, string> = {
  pending: "border-neutral-700 bg-neutral-900 text-neutral-400",
  processing: "border-blue-800 bg-blue-950/40 text-blue-300",
  complete: "border-green-800 bg-green-950/40 text-green-300",
  failed: "border-rose-800 bg-rose-950/40 text-rose-300",
};

export function DatasetStatusBadge({ status, label }: Props) {
  const classes =
    statusConfig[status] ?? "border-neutral-700 bg-neutral-900 text-neutral-400";
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label ?? status}
    </span>
  );
}
