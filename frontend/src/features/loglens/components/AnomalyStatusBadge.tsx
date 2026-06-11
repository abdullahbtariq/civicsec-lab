interface Props {
  status: string;
  statusDisplay: string;
}

const colours: Record<string, string> = {
  new: "bg-rose-900/40 text-rose-300 border border-rose-700",
  reviewed: "bg-blue-900/40 text-blue-300 border border-blue-700",
  escalated: "bg-orange-900/40 text-orange-300 border border-orange-700",
  dismissed: "bg-neutral-800 text-neutral-500 border border-neutral-700",
  false_positive: "bg-neutral-800 text-neutral-500 border border-neutral-700",
};

export function AnomalyStatusBadge({ status, statusDisplay }: Props) {
  const classes = colours[status] ?? "bg-neutral-800 text-neutral-400 border border-neutral-700";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${classes}`}>
      {statusDisplay}
    </span>
  );
}
