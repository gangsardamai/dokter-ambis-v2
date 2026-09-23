import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/kelas",
          "/universitas",
          "/program",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/daftar/",
          "/login",
          "/materi/",
          "/register",
        ],
      },
    ],
  };
}
