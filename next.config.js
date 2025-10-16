/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure for static export (required for Cloudflare Pages)
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    remotePatterns: [
      new URL('https://**'),        // any HTTPS host
      new URL('http://**'),         // optional: any HTTP host
    ],
    unoptimized: true, // Required for static export
  },
}

module.exports = nextConfig;
