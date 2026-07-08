import { Card } from "@/components/ui";

export default function CourseRelationCard() {
  return (
    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Relasi Blok
        </h2>

        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">

          <p className="font-medium">
            Belum ada data relasi
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Materi, quiz, live class,
            dan mahasiswa akan
            muncul di sini setelah
            modul berikutnya selesai.
          </p>

        </div>

      </div>

    </Card>
  );
}