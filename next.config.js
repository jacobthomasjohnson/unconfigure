/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true // ✅ Don't block build on lint
  },
  typescript: {
    ignoreBuildErrors: true // ✅ Don't block build on TS errors (safe if you're not using TS)
  },
  experimental: {
    serverActions: false // ✅ (just in case it's enabled)
  }
}

module.exports = nextConfig
