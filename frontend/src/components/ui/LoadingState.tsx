export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 rounded-xl border border-civic-line bg-civic-panel p-6 text-sm text-civic-muted">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-civic-line border-t-civic-teal" />
      <span className="animate-pulse">{label}</span>
    </div>
  );
}
