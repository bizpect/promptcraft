type ErrorStateProps = {
  title: string;
  body?: string;
};

export function ErrorState({ title, body }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <p className="font-medium">{title}</p>
      {body && <p className="mt-2">{body}</p>}
    </div>
  );
}
