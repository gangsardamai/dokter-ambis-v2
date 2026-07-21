import { Card } from "@/components/ui";

interface AdminCardProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminCard({
  title,
  children,
}: AdminCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        <div className="mt-6">

          {children}

        </div>

      </div>

    </Card>

  );

}