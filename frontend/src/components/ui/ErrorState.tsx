export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-civic-rose/40 bg-civic-rose/10 p-5 text-sm text-civic-rose">
      {message}
    </div>
  );
}
