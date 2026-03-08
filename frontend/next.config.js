/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
    NEXT_PUBLIC_THINGSPEAK_BASE_URL: 'https://api.thingspeak.com'
  }
}

module.exports = nextConfig
