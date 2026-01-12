/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '../.next',
  reactStrictMode: true,
  env: {
    // Empty string means use relative URLs (same domain)
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
}
module.exports = nextConfig
