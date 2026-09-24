/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prepare for future API route proxying
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
