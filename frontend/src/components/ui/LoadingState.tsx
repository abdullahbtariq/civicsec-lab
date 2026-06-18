/** Skeleton loading placeholder — cream-register, no spinner.
 *
 * Used anywhere async data is being fetched. Renders skeleton rows
 * that match the content area's visual weight, so the layout does not
 * shift when real data arrives.
 *
 * Product register rule: skeleton states only (no spinners in content).
 * Respects prefers-reduced-motion — bars become static when set.
 */
export function LoadingState({ label = "Loading data" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="min-h-48 rounded-xl border border-paper-line bg-paper-card p-6"
    >
      <div className="space-y-2.5">
        {/* Simulated heading */}
        <div className="h-3 w-2/5 animate-pulse rounded-sm bg-paper-raise motion-reduce:animate-none" />
        {/* Simulated body rows */}
        <div className="h-2.5 w-full animate-pulse rounded-sm bg-paper-raise motion-reduce:animate-none" />
        <div className="h-2.5 w-11/12 animate-pulse rounded-sm bg-paper-raise motion-reduce:animate-none" />
        <div className="h-2.5 w-4/5 animate-pulse rounded-sm bg-paper-raise motion-reduce:animate-none" />
        {/* Second block */}
        <div className="pt-3">
          <div className="h-3 w-1/3 animate-pulse rounded-sm bg-paper-raise motion-reduce:animate-none" />
        </div>
        <div className="h-2.5 w-3/4 animate-pulse rounded-sm bg-paper-raise motion-reduce:animate-none" />
        <div className="h-2.5 w-2/3 animate-pulse rounded-sm bg-paper-raise motion-reduce:animate-none" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
