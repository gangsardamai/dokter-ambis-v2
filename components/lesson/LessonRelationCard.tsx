import { Card } from "@/components/ui";

export default function LessonRelationCard() {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Relasi Materi
        </h2>

        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">

          <p className="font-medium">
            Konten pembelajaran akan muncul di sini.
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Video, file, quiz, dan live class akan
            ditampilkan pada tahap Dashboard
            Integration.
          </p>

        </div>

      </div>

    </Card>

  );

}