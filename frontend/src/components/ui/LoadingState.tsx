export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-civic-line bg-civic-panel p-6 text-sm text-civic-muted">
      {label}
    </div>
  );
}
