interface DataTableProps {

  children: React.ReactNode;

}

export default function DataTable({

  children,

}: DataTableProps) {

  return (

    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="min-w-full">

          {children}

        </table>

      </div>

    </div>

  );

}