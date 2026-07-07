import { Card } from "@/components/ui";

export default function ProgramRelationCard() {
  return (
    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Relasi Program
        </h2>

        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">

          <p className="font-medium">
            Belum ada data relasi
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Universitas, blok, mentor, dan mahasiswa
            akan muncul di sini setelah fitur terkait
            selesai dibuat.
          </p>

        </div>

      </div>

    </Card>
  );
}