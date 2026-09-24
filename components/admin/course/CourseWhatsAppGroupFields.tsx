import { TextInput } from "@/components/admin";

interface CourseWhatsAppGroupFieldsProps {
  defaultValue?: string;
}

export default function CourseWhatsAppGroupFields({
  defaultValue = "",
}: CourseWhatsAppGroupFieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-950">
          Grup WhatsApp Peserta
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Masukkan satu link undangan grup untuk course ini. Kolom boleh
          dikosongkan dan dapat diisi atau diubah kembali setelah Course dibuat.
        </p>
      </div>

      <TextInput
        label="Link Grup WhatsApp"
        name="whatsapp_group_url"
        defaultValue={defaultValue}
        placeholder="https://chat.whatsapp.com/..."
      />

      <p className="text-xs leading-5 text-slate-500">
        Hanya link dengan domain chat.whatsapp.com yang dapat disimpan. Siapa
        pun yang memperoleh link tersebut dapat membukanya dan bergabung sesuai
        pengaturan grup di WhatsApp.
      </p>
    </div>
  );
}
