/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '../.next',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  experimental: {
    // Skip font optimization if there are network restrictions
    optimizeFonts: false,
  },
}
module.exports = nextConfig
