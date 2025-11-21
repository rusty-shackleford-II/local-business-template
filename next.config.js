/** @type {import('next').NextConfig} */

// Note: We use react-i18next for i18n instead of Next.js's built-in i18n
// because Next.js i18n is incompatible with output: 'export' (static export).
// The i18n configuration is handled client-side via I18nProvider component.

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
