/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/admin/login",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/adnmin",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/adnmin/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
      {
        source: "/login",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/admin-qr",
        destination: "/admin/qr",
        permanent: false,
      },
      {
        source: "/admin/card",
        destination: "/admin/qr",
        permanent: false,
      },
      {
        source: "/admin/leaflet",
        destination: "/admin/qr",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/media/video/video1.mp4",
        destination: "/media/video/video%201.mp4",
      },
      {
        source: "/media/video/video2.mp4",
        destination: "/media/video/Video%202.mp4",
      },
      {
        source: "/media/video/video3.mp4",
        destination: "/media/video/video%203.mp4",
      },
      {
        source: "/media/video/maa_kali_blessing.mp4",
        destination: "/media/video/video%201.mp4",
      },
      {
        source: "/media/video/mayer_charane_gaan.mp4",
        destination: "/media/video/Video%202.mp4",
      },
      {
        source: "/media/video/day2_bhai_phonta_quiz.mp4",
        destination: "/media/video/video%203.mp4",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/media/video/:path*",
        headers: [
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Content-Type", value: "video/mp4" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
