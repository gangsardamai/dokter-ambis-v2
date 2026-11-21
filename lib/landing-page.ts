export interface LandingMentor {
  name: string;
  image: string;
  description: string;
  achievements: string[];
}

export const mentorPhotoBucket = "landing-mentor-photos";
export const maxFeaturedCourses = 4;
export const maxMentorPhotoBytes = 3 * 1024 * 1024;

export const defaultMentors: LandingMentor[] = [
  {
    name: "dr. Dicky Dewantoro",
    image: "/mentors/dr-dicky.png",
    description: "",
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
    description: "",
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
    description: "",
    achievements: [
      "Peringkat 1 OSCE UKMPPD FK Universitas Jember periode Mei 2023",
      "Peringkat 4 CBT UKMPPD FK Universitas Jember periode Mei 2023",
      "Wisudawan dengan IPK Tertinggi FK Universitas Jember Periode IV 2020–2021",
      "Juara 2 Mahasiswa Berprestasi Tingkat Fakultas Kedokteran Universitas Jember tahun 2019",
    ],
  },
];

