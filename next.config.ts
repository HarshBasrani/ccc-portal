/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    // This will allow the build to finish even with type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // This will allow the build to finish even with linting errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;