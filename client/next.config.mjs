// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // S3 prod (the URL you’re using on the live site)
      {
        protocol: "https",
        hostname: "cartkoro-prod.s3.ap-south-1.amazonaws.com",
        pathname: "/product/**",   // or "/**" if you store images elsewhere too
      },
      // S3 dev (optional)
      {
        protocol: "https",
        hostname: "cartkoro-dev.s3.ap-south-1.amazonaws.com",
        pathname: "/product/**",
      },
      // GitHub raw (optional)
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/**",
      },
      // Cloudinary (if you still need it)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // (Optional) if you ever request widths outside defaults:
    // deviceSizes: [320,640,768,1024,1280,1536,1920,2560,3200,3840],
    // imageSizes: [16,32,48,64,96,128,256],
  },
};

export default nextConfig;
