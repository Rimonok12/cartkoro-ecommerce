// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: 'res.cloudinary.com',
              pathname: '**',
          },
          {
              protocol: 'https',
              hostname: 'raw.githubusercontent.com',
              pathname: '**',
          },
      ],
  },
};

export default nextConfig;