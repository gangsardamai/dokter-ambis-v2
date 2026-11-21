"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { PendingFormControls, PendingSubmitButton } from "@/components/forms/PendingForm";
import { maxFeaturedCourses, maxMentorPhotoBytes, type LandingMentor } from "@/lib/landing-page";

import { saveLandingPage } from "./actions";

type MentorWithPhoto = LandingMentor & { photoUrl: string };
type EditorMentor = Omit<MentorWithPhoto, "achievements"> & {
  key: string;
  achievements: string;
};

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";
const sectionClass = "space-y-4 rounded-2xl border border-blue-100 bg-white p-5";
const textButtonClass = "rounded-lg px-2 py-1 text-sm font-semibold text-blue-700 disabled:text-slate-400";

export default function LandingPageForm({
  revision, courses, selectedIds, mentors,
}: {
  revision: string;
  courses: { id: string; label: string }[];
  selectedIds: string[];
  mentors: MentorWithPhoto[];
}) {
  const [error, action] = useActionState(saveLandingPage, "");
  const [photoError, setPhotoError] = useState("");
  const [slots, setSlots] = useState(
    Array.from({ length: maxFeaturedCourses }, (_, index) => selectedIds[index] ?? ""),
  );
  const [cards, setCards] = useState<EditorMentor[]>(
    mentors.map((mentor, index) => ({
      ...mentor, key: String(index), achievements: mentor.achievements.join("\n"),
    })),
  );

  function editCard(key: string, changes: Partial<EditorMentor>) {
    setCards((current) => current.map((card) => card.key === key ? { ...card, ...changes } : card));
  }

  function moveCard(index: number, offset: number) {
    setCards((current) => {
      const reordered = [...current];
      const [card] = reordered.splice(index, 1);
      reordered.splice(index + offset, 0, card);
      return reordered;
    });
  }

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const photos = new FormData(event.currentTarget);
        const totalBytes = Array.from(photos.values()).reduce(
          (total, value) => total + (value instanceof File ? value.size : 0),
          0,
        );
        if (totalBytes > maxMentorPhotoBytes) {
          event.preventDefault();
          setPhotoError("Total ukuran foto baru maksimal 3 MB per penyimpanan.");
        } else {
          setPhotoError("");
        }
      }}
    >
      <PendingFormControls className="space-y-6">
        <input type="hidden" name="revision" value={revision} />

        <section className={sectionClass}>
          <h2 className="text-xl font-bold">Yuk Cari Kelas Menarik</h2>
          <p className="text-sm text-slate-600">Pilih maksimal 4 kelas. Urutan kartu mengikuti urutan di bawah ini.</p>
          <div className="grid gap-4 md:grid-cols-2">
            {slots.map((id, index) => (
              <label key={index} className="space-y-1 text-sm font-semibold">
                <span>Kartu kelas {index + 1}</span>
                <select
                  name="course"
                  value={id}
                  onChange={(event) => {
                    const selection = event.target.value;
                    setSlots((current) => current.map((item, slot) => slot === index ? selection : item));
                  }}
                  className={inputClass}
                >
                  <option value="">Kosong</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id} disabled={id !== course.id && slots.includes(course.id)}>
                      {course.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-bold">Belajar Bersama Mentor Berprestasi</h2>
          <p className="text-sm text-slate-600">Isi kartu mentor secara manual. Total ukuran foto baru maksimal 3 MB per penyimpanan.</p>
          {cards.map((card, index) => (
            <fieldset key={card.key} className="space-y-3 rounded-xl border border-slate-200 p-4">
              <legend className="px-1 font-semibold">Mentor {index + 1}</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={index === 0} onClick={() => moveCard(index, -1)} className={textButtonClass}>Naikkan</button>
                <button type="button" disabled={index === cards.length - 1} onClick={() => moveCard(index, 1)} className={textButtonClass}>Turunkan</button>
                <button type="button" onClick={() => setCards((current) => current.filter((item) => item.key !== card.key))} className="rounded-lg px-2 py-1 text-sm font-semibold text-red-700">Hapus kartu</button>
              </div>
              <label className="block space-y-1 text-sm font-semibold">
                <span>Nama mentor</span>
                <input name="mentorName" value={card.name} onChange={(event) => editCard(card.key, { name: event.target.value })} maxLength={120} required className={inputClass} />
              </label>
              <label className="block space-y-1 text-sm font-semibold">
                <span>Deskripsi</span>
                <textarea name={`description-${index}`} value={card.description} onChange={(event) => editCard(card.key, { description: event.target.value })} rows={2} maxLength={1000} className={inputClass} />
              </label>
              <label className="block space-y-1 text-sm font-semibold">
                <span>Prestasi (satu per baris)</span>
                <textarea name={`achievements-${index}`} value={card.achievements} onChange={(event) => editCard(card.key, { achievements: event.target.value })} rows={3} maxLength={2000} className={inputClass} />
              </label>
              <input type="hidden" name={`image-${index}`} value={card.image} />
              {card.photoUrl && (
                <div className="flex items-center gap-3">
                  <Image src={card.photoUrl} alt={`Foto ${card.name}`} width={64} height={64} unoptimized className="size-16 rounded-lg bg-blue-50 object-contain" />
                  <button type="button" onClick={() => editCard(card.key, { image: "", photoUrl: "" })} className={textButtonClass}>Hapus foto</button>
                </div>
              )}
              <label className="block space-y-1 text-sm font-semibold">
                <span>{card.image ? "Ganti foto" : "Unggah foto"} (JPG, PNG, WebP)</span>
                <input type="file" name={`photo-${index}`} accept="image/jpeg,image/png,image/webp" className={inputClass} />
              </label>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={cards.length >= 30}
            onClick={() => setCards((current) => [...current, { key: crypto.randomUUID(), name: "", description: "", achievements: "", image: "", photoUrl: "" }])}
            className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50"
          >
            Tambah mentor
          </button>
        </section>

        {(photoError || error) && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{photoError || error}</p>}
        <PendingSubmitButton pendingLabel="Menyimpan..." className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white">
          Simpan dan terbitkan
        </PendingSubmitButton>
      </PendingFormControls>
    </form>
  );
}
