const fs = require('fs');
const path = require('path');

// Read the site data
const siteDataPath = path.join(__dirname, '../data/site.json');
const site = JSON.parse(fs.readFileSync(siteDataPath, 'utf8'));

// Get the canonical URL from site.json, fallback to a default
const baseUrl = site?.seo?.canonicalUrl || 'https://example.com';

// Ensure the URL has proper protocol
const siteUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

// Remove trailing slash for consistency
const cleanUrl = siteUrl.replace(/\/$/, '');

const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${cleanUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${cleanUrl}/partners</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

// Write sitemap to public folder
const publicDir = path.join(__dirname, '../public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

fs.writeFileSync(sitemapPath, sitemap, 'utf8');

console.log(`✅ Sitemap generated successfully at ${sitemapPath}`);
console.log(`   Base URL: ${cleanUrl}`);
