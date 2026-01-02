type EmptyStateProps = {
  title: string;
  body?: string;
};

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-black/20 bg-white p-6 text-sm text-black/60">
      <p className="font-medium text-black/80">{title}</p>
      {body && <p className="mt-2">{body}</p>}
    </div>
  );
}
