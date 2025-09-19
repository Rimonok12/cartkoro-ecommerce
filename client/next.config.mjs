/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cartkoro-prod.s3.ap-south-1.amazonaws.com",
        pathname: "/product/**",
      },
      {
        protocol: "https",
        hostname: "cartkoro-dev.s3.ap-south-1.amazonaws.com",
        pathname: "/product/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // Optional: extend breakpoints
    // deviceSizes: [320, 640, 768, 1024, 1280, 1536, 1920, 2560, 3200, 3840],
    // imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};

module.exports = nextConfig;
