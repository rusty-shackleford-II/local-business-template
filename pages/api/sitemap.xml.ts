import { NextApiRequest, NextApiResponse } from 'next';
import site from '../../data/site.json';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the canonical URL from site.json, fallback to a default
  const baseUrl = (site as any)?.seo?.canonicalUrl || 'https://example.com';
  
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

  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(sitemap);
}
