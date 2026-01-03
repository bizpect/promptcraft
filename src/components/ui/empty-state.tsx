type EmptyStateProps = {
  title: string;
  body?: string;
};

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/70">
      <p className="font-medium text-white">{title}</p>
      {body && <p className="mt-2">{body}</p>}
    </div>
  );
}
