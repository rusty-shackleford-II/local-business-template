/** @type {import('next').NextConfig} */
const fs = require('fs');
const path = require('path');

// Check if site.json has i18n enabled
let i18nConfig = null;
const siteJsonPath = path.join(__dirname, 'data', 'site.json');

if (fs.existsSync(siteJsonPath)) {
  try {
    const site = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8'));
    if (site.version === '2.0' && site.i18n?.enabled) {
      i18nConfig = {
        locales: site.i18n.availableLanguages || ['en'],
        defaultLocale: site.i18n.defaultLanguage || 'en',
        localeDetection: false, // Disable automatic locale detection for static export
      };
      console.log('✅ i18n enabled with locales:', i18nConfig.locales);
    }
  } catch (e) {
    console.warn('⚠️  Could not parse site.json for i18n config:', e.message);
  }
}

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
  // Add i18n config only if enabled in site.json (v2 sites)
  ...(i18nConfig && { i18n: i18nConfig }),
}

module.exports = nextConfig;
