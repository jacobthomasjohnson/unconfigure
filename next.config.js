/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  trailingSlash: true, // optional: generates /about/index.html instead of about.html
  images: {
    unoptimized: true // Disable built-in image optimization
  }
}

module.exports = nextConfig
