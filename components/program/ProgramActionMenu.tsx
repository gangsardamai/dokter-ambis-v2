interface Props {
  programId: string;
  status: string;
}

export default function ProgramActionMenu({
  programId,
  status,
}: Props) {

  return (
    <div className="flex justify-end gap-2">

      <button
        className="rounded border px-3 py-1 text-sm"
      >
        Edit
      </button>

      <button
        className="rounded border px-3 py-1 text-sm"
      >
        {status === "active"
          ? "Nonaktifkan"
          : "Aktifkan"}
      </button>

      <button
        className="rounded border border-red-300 px-3 py-1 text-sm text-red-600"
      >
        Hapus
      </button>

    </div>
  );
}