type ErrorStateProps = {
  title: string;
  body?: string;
};

export function ErrorState({ title, body }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-100">
      <p className="font-medium text-red-100">{title}</p>
      {body && <p className="mt-2">{body}</p>}
    </div>
  );
}
