"use client";

import { useMemo, useState } from "react";

import FormCard from "@/components/admin/card/FormCard";
import PrimaryButton from "@/components/admin/button/PrimaryButton";
import AnnouncementContentInput from "@/components/admin/announcement/AnnouncementContentInput";
import TextInput from "@/components/admin/form/TextInput";

import type { AnnouncementWithTargets } from "@/repositories/announcement.repository";

interface OrganizationOption {
  id: string;
  title: string;
  shortName: string | null;
}

interface CourseOption {
  id: string;
  title: string;
  organizationId: string;
}

interface AnnouncementFormProps {
  organizations: OrganizationOption[];
  courses: CourseOption[];
  defaultValues?: AnnouncementWithTargets;
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
}

function toJakartaInput(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function targetLabel(
  title: string,
  shortName: string | null,
): string {
  return shortName ? `${shortName} — ${title}` : title;
}

export default function AnnouncementForm({
  organizations,
  courses,
  defaultValues,
  submitLabel,
  action,
}: AnnouncementFormProps) {
  const [allStudents, setAllStudents] = useState(
    defaultValues?.all_students ?? false,
  );
  const [selectedOrganizations, setSelectedOrganizations] =
    useState<string[]>(defaultValues?.organizationIds ?? []);

  const coursesByOrganization = useMemo(() => {
    return organizations.map((organization) => ({
      organization,
      courses: courses.filter(
        (course) => course.organizationId === organization.id,
      ),
    }));
  }, [courses, organizations]);

  return (
    <FormCard>
      <form action={action} className="space-y-7">
        <TextInput
          label="Judul Pengumuman"
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
        />

        <AnnouncementContentInput
          defaultValue={defaultValues?.content ?? ""}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-bold text-slate-700">
            <span>Tanggal Mulai</span>
            <input
              type="datetime-local"
              name="starts_at"
              required
              defaultValue={toJakartaInput(
                defaultValues?.starts_at ?? new Date(),
              )}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="space-y-2 text-sm font-bold text-slate-700">
            <span>Tanggal Berakhir</span>
            <input
              type="datetime-local"
              name="ends_at"
              defaultValue={
                defaultValues?.ends_at
                  ? toJakartaInput(defaultValues.ends_at)
                  : ""
              }
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <span className="block text-xs font-medium text-slate-400">
              Kosongkan bila tidak memiliki batas akhir.
            </span>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm font-bold text-slate-800">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={defaultValues?.is_published ?? true}
              className="h-4 w-4 accent-[#1769cf]"
            />
            Published
          </label>

          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm font-bold text-slate-800">
            <input
              type="checkbox"
              name="show_on_dashboard"
              defaultChecked={
                defaultValues?.show_on_dashboard ?? true
              }
              className="h-4 w-4 accent-[#1769cf]"
            />
            Tampilkan di Dashboard Peserta
          </label>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#061827]">
              Target Pengumuman
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Target bersifat dinamis. Peserta yang memenuhi target di kemudian hari tetap akan menerima pengumuman selama memenuhi periode tayang.
            </p>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-white p-4">
            <input
              type="checkbox"
              name="all_students"
              checked={allStudents}
              onChange={(event) =>
                setAllStudents(event.target.checked)
              }
              className="mt-0.5 h-4 w-4 accent-[#1769cf]"
            />
            <span>
              <span className="block text-sm font-extrabold text-slate-900">
                Semua Peserta
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Termasuk peserta yang baru mendaftar setelah pengumuman dibuat.
              </span>
            </span>
          </label>

          {!allStudents && (
            <div className="mt-5 space-y-6">
              <fieldset>
                <legend className="text-sm font-extrabold text-slate-800">
                  Universitas
                </legend>
                <p className="mt-1 text-xs text-slate-500">
                  Bisa memilih lebih dari satu universitas.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {organizations.map((organization) => {
                    const checked =
                      selectedOrganizations.includes(organization.id);

                    return (
                      <label
                        key={organization.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700"
                      >
                        <input
                          type="checkbox"
                          name="organization_ids"
                          value={organization.id}
                          checked={checked}
                          onChange={(event) => {
                            setSelectedOrganizations((current) =>
                              event.target.checked
                                ? Array.from(
                                    new Set([
                                      ...current,
                                      organization.id,
                                    ]),
                                  )
                                : current.filter(
                                    (id) => id !== organization.id,
                                  ),
                            );
                          }}
                          className="mt-0.5 h-4 w-4 accent-[#1769cf]"
                        />
                        <span>
                          {targetLabel(
                            organization.title,
                            organization.shortName,
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-extrabold text-slate-800">
                  Course
                </legend>
                <p className="mt-1 text-xs text-slate-500">
                  Bisa memilih course lintas universitas sekaligus.
                </p>

                <div className="mt-4 space-y-4">
                  {coursesByOrganization.map(
                    ({ organization, courses: organizationCourses }) =>
                      organizationCourses.length > 0 ? (
                        <div key={organization.id}>
                          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[#1769cf]">
                            {organization.shortName ??
                              organization.title}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {organizationCourses.map((course) => (
                              <label
                                key={course.id}
                                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700"
                              >
                                <input
                                  type="checkbox"
                                  name="course_ids"
                                  value={course.id}
                                  defaultChecked={
                                    defaultValues?.courseIds.includes(
                                      course.id,
                                    ) ?? false
                                  }
                                  className="mt-0.5 h-4 w-4 accent-[#1769cf]"
                                />
                                <span>{course.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null,
                  )}
                </div>
              </fieldset>
            </div>
          )}
        </section>

        <PrimaryButton
          type="submit"
          className="w-full sm:w-auto"
        >
          {submitLabel}
        </PrimaryButton>
      </form>
    </FormCard>
  );
}
