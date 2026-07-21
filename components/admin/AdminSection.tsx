interface AdminSectionProps {
  label: string;
  value: React.ReactNode;
}

export default function AdminSection({
  label,
  value,
}: AdminSectionProps) {

  return (

    <div>

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <div className="mt-1">
        {value}
      </div>

    </div>

  );

}