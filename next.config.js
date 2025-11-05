/** @type {import('next').NextConfig} */
const nextConfig = {
  // No experimental flags needed for Next.js 14
  // Railway deployment configuration
  output: 'standalone', // Creates a standalone build for better Railway deployment
}

module.exports = nextConfig