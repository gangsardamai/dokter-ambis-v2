"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  defaultMentors,
  maxFeaturedCourses,
  maxMentorPhotoBytes,
  mentorPhotoBucket,
  type LandingMentor,
} from "@/lib/landing-page";
import { createClient } from "@/lib/supabase/server";
import { profileService } from "@/services";
import { getLandingPageSettings, getPublicLandingCourses } from "@/services/landing-page.service";

const adminPath = "/dashboard/admin/landing-page";
const photoExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function readText(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveLandingPage(
  _previous: string,
  form: FormData,
): Promise<string> {
  const profile = await profileService.getCurrentProfile();
  if (profile?.role !== "admin" || profile.status !== "active") {
    return "Fitur ini hanya tersedia untuk admin aktif.";
  }

  try {
    const [client, settings, courses] = await Promise.all([
      createClient(),
      getLandingPageSettings(),
      getPublicLandingCourses(),
    ]);
    const revision = readText(form, "revision");
    const staleMessage = "Pengaturan sudah berubah. Muat ulang halaman sebelum menyimpan.";
    if (settings.revision !== revision) return staleMessage;

    const courseIds = form.getAll("course").map(String).filter(Boolean);
    const publicIds = new Set(courses.map((course) => course.id));
    if (
      courseIds.length > maxFeaturedCourses ||
      new Set(courseIds).size !== courseIds.length ||
      courseIds.some((id) => !publicIds.has(id))
    ) {
      return "Pilih hingga 4 kelas aktif. Setiap kelas hanya bisa dipilih satu kali.";
    }

    const mentorNames = form.getAll("mentorName");
    if (mentorNames.length > 30) return "Maksimal 30 kartu mentor.";
    const availableImages = new Set(
      [...defaultMentors, ...(settings.mentors ?? [])].map((mentor) => mentor.image),
    );
    const mentors: LandingMentor[] = [];
    const photos: { mentor: LandingMentor; file: File; extension: string }[] = [];

    for (const [index, value] of mentorNames.entries()) {
      const name = String(value).trim();
      const description = readText(form, `description-${index}`);
      const achievements = [...new Set(
        readText(form, `achievements-${index}`).split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
      )];
      const image = readText(form, `image-${index}`);
      if (!name || name.length > 120 || description.length > 1000 || achievements.join("\n").length > 2000) {
        return `Periksa nama, deskripsi, dan prestasi pada kartu mentor ${index + 1}.`;
      }
      if (image && !availableImages.has(image)) return "Foto mentor yang dipilih tidak tersedia.";

      const mentor = { name, description, achievements, image };
      mentors.push(mentor);

      const file = form.get(`photo-${index}`);
      if (file instanceof File && file.size > 0) {
        const extension = photoExtensions[file.type];
        if (!extension) return "Gunakan foto dalam format JPG, PNG, atau WebP.";
        photos.push({ mentor, file, extension });
      }
    }

    if (photos.reduce((total, { file }) => total + file.size, 0) > maxMentorPhotoBytes) {
      return "Total ukuran foto baru maksimal 3 MB per penyimpanan.";
    }

    const bucket = client.storage.from(mentorPhotoBucket);
    for (const { mentor, file, extension } of photos) {
      const imagePath = `${crypto.randomUUID()}.${extension}`;
      const { error } = await bucket.upload(imagePath, file, {
        contentType: file.type,
        cacheControl: "31536000",
      });
      if (error) throw error;
      mentor.image = imagePath;
    }

    const { data, error } = await client
      .from("landing_page_settings")
      .update({ course_ids: courseIds, mentors, revision: crypto.randomUUID() })
      .eq("id", 1)
      .eq("revision", revision)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return staleMessage;
  } catch (error) {
    console.error("Failed to save landing page settings", error);
    return "Pengaturan gagal disimpan. Coba lagi dan pilih kembali foto baru jika diperlukan.";
  }

  revalidatePath("/");
  revalidatePath(adminPath);
  redirect(`${adminPath}?saved=1`);
}
