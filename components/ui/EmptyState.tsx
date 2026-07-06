interface EmptyStateProps {
  title: string;
}

export default function EmptyState({
  title,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border p-8 text-center text-gray-500">
      {title}
    </div>
  );
}