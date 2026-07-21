import Image from "next/image";

const mentors = [
  {
    name: "dr. Dicky Dewantoro",
    image: "/mentors/dr-dicky.png",
    achievements: [
      "IPK Profesi Terbaik Universitas Jember periode November 2023 (IPK 3,9)",
      "Finalis IMPhO 2019 tingkat internasional",
      "Finalis IMSPQ 2019 tingkat internasional",
      "Finalis AMYGDALA 2018 UMM tingkat nasional",
    ],
  },
  {
    name: "dr. Bagus Wahyu Mulyono",
    image: "/mentors/dr-bagus.png",
    achievements: [
      "Peringkat 2 OSCE UKMPPD FK UNEJ Batch Mei 2023",
      "Peringkat 3 CBT UKMPPD FK UNEJ Batch Mei 2023",
      "Juara 2 Mahasiswa Berprestasi (MAWAPRES) Fakultas Kedokteran Universitas Jember tahun 2020",
      "Juara 2 Nasional Lomba Literature Review Scientific Atmosphere 12, Fakultas Kedokteran Universitas Udayana, Bali, tahun 2020",
    ],
  },
  {
    name: "dr. Gangsar Lintas Damai",
    image: "/mentors/dr-gangsar.png",
    achievements: [
      "Peringkat 1 OSCE UKMPPD FK Universitas Jember periode Mei 2023",
      "Peringkat 4 CBT UKMPPD FK Universitas Jember periode Mei 2023",
      "Wisudawan dengan IPK Tertinggi FK Universitas Jember Periode IV 2020–2021",
      "Juara 2 Mahasiswa Berprestasi Tingkat Fakultas Kedokteran Universitas Jember tahun 2019",
    ],
  },
];

export default function Mentors() {
  return (
    <section
      id="mentor"
      className="bg-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-[#061827] sm:text-4xl">
            Belajar Bersama Mentor Berprestasi
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Dibimbing oleh dokter dan mentor yang berprestasi.
          </p>
        </div>

        <div className="mt-12 grid gap-7 lg:grid-cols-3">
          {mentors.map((mentor) => (
            <article
              key={mentor.name}
              className="group flex flex-col overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_10px_35px_rgba(3,59,99,0.08)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_45px_rgba(3,59,99,0.14)] sm:flex-row lg:flex-col"
            >
              <div className="relative h-[320px] w-full shrink-0 overflow-hidden bg-gradient-to-br from-[#eaf3ff] via-[#f6f9fe] to-[#dbeafe] sm:h-auto sm:min-h-[340px] sm:w-[42%] lg:h-[320px] lg:min-h-0 lg:w-full">
                <div className="absolute -right-12 top-8 h-40 w-40 rounded-full border-[26px] border-white/30" />

                <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-blue-300/20" />

                <Image
                  src={mentor.image}
                  alt={`Foto ${mentor.name}`}
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1024px) 42vw, 400px"
                  className="relative object-contain object-bottom transition duration-300 group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex flex-1 flex-col p-5 sm:p-7">
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1769cf]">
                  Mentor DokterAmbis
                </span>

                <h3 className="mt-4 text-xl font-extrabold leading-7 text-[#061827]">
                  {mentor.name}
                </h3>

                <div className="my-5 h-px bg-slate-100" />

                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Prestasi
                </p>

                <ul className="mt-4 space-y-3">
                  {mentor.achievements.map(
                    (achievement) => (
                      <li
                        key={achievement}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                      >
                        <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-[#1769cf]">
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            fill="none"
                            className="h-3 w-3"
                          >
                            <path
                              d="m5 10 3 3 7-7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>

                        <span>{achievement}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}