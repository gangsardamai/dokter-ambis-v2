interface AdminPageGridProps {
  main: React.ReactNode;
  sidebar: React.ReactNode;
}

export default function AdminPageGrid({
  main,
  sidebar,
}: AdminPageGridProps) {

  return (

    <div className="grid gap-6 lg:grid-cols-3">

      <div className="space-y-6 lg:col-span-2">
        {main}
      </div>

      <div>
        {sidebar}
      </div>

    </div>

  );

}