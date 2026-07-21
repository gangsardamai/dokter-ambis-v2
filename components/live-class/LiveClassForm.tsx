"use client";

import { useState } from "react";

import {
  TextInput,
  SelectField,
} from "@/components/ui";

export type LiveClassFormData = {
  lesson_id: string;
  title: string;
  meeting_date: string;
  meeting_link: string;
  recording_path: string;
};

interface SelectOption {
  value: string;
  label: string;
}

interface LiveClassFormProps {
  initialData?: LiveClassFormData;
  lessonOptions: SelectOption[];
  submitLabel?: string;
  onSubmit: (
    data: LiveClassFormData
  ) => Promise<void>;
}

export default function LiveClassForm({
  initialData,
  lessonOptions,
  submitLabel = "Simpan",
  onSubmit,
}: LiveClassFormProps) {

  const [lessonId, setLessonId] =
    useState(initialData?.lesson_id ?? "");

  const [title, setTitle] =
    useState(initialData?.title ?? "");

  const [meetingDate, setMeetingDate] =
    useState(initialData?.meeting_date ?? "");

  const [meetingLink, setMeetingLink] =
    useState(initialData?.meeting_link ?? "");

  const [recordingPath, setRecordingPath] =
    useState(initialData?.recording_path ?? "");

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setLoading(true);

    try {

      await onSubmit({

        lesson_id: lessonId,

        title: title.trim(),

        meeting_date: meetingDate,

        meeting_link:
          meetingLink.trim(),

        recording_path:
          recordingPath.trim(),

      });

    } finally {

      setLoading(false);

    }

  }

  return (

    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >

      <SelectField
        label="Materi"
        value={lessonId}
        options={[
          {
            value: "",
            label: "Pilih Materi",
          },
          ...lessonOptions,
        ]}
        onChange={setLessonId}
      />

      <TextInput
        label="Judul Live Class"
        value={title}
        required
        onChange={setTitle}
      />

      <TextInput
        label="Tanggal Meeting"
        type="datetime-local"
        value={meetingDate}
        onChange={setMeetingDate}
      />

      <TextInput
        label="Meeting Link"
        value={meetingLink}
        onChange={setMeetingLink}
      />

      <TextInput
        label="Recording Path"
        value={recordingPath}
        onChange={setRecordingPath}
      />

      <div className="flex justify-end">

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? "Menyimpan..."
            : submitLabel}
        </button>

      </div>

    </form>

  );

}