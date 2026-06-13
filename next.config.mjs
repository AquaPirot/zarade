/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',   // static HTML/CSS/JS for shared hosting
  trailingSlash: true,
};

export default nextConfig;
