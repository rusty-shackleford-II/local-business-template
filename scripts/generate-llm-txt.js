const fs = require('fs');
const path = require('path');

// Read the site data
const siteDataPath = path.join(__dirname, '../data/site.json');
const site = JSON.parse(fs.readFileSync(siteDataPath, 'utf8'));

// --- Mirrors generateJsonLd() from pages/index.tsx ---

const baseUrl = (site?.seo?.canonicalUrl || 'https://example.com').replace(/\/$/, '');
const siteUrl = baseUrl + '/';

const businessInfo = site?.businessInfo || {};
const address = businessInfo?.address || {};
const about = site?.about || {};
const seo = site?.seo || {};

// Helper: Get social links
function getSocialLinks() {
  const links = [];
  const social = site?.contact?.social || {};
  ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok', 'yelp', 'googleBusinessProfile', 'other'].forEach(key => {
    if (social[key]?.trim()) links.push(social[key].trim());
  });
  (site?.footer?.socialLinks || []).forEach(item => {
    if (item?.href?.trim()) links.push(item.href.trim());
  });
  return links;
}

// Helper: Get opening hours
function getOpeningHours() {
  const hours = businessInfo?.businessHours || site?.contact?.businessHours || {};
  return Object.entries(hours)
    .filter(([_, cfg]) => {
      if (cfg === 'closed') return false;
      if (typeof cfg !== 'object' || !cfg?.open || !cfg?.close) return false;
      if (cfg.open === 'Closed' || cfg.close === 'Closed') return false;
      return true;
    })
    .map(([day, cfg]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [day],
      opens: cfg.open,
      closes: cfg.close
    }));
}

// Helper: Get aggregate rating
function getAggregateRating() {
  const testimonialsData = site?.testimonials || {};
  if (testimonialsData?.overallRating && testimonialsData?.totalReviews) {
    const rating = parseFloat(testimonialsData.overallRating);
    const count = parseInt(testimonialsData.totalReviews);
    if (rating > 0 && count > 0) {
      return {
        '@type': 'AggregateRating',
        ratingValue: Math.round(rating * 100) / 100,
        reviewCount: count
      };
    }
  }
  const items = testimonialsData?.items || [];
  const ratings = items.map(t => t?.rating).filter(r => r && parseFloat(r) > 0).map(parseFloat);
  if (ratings.length === 0) return null;
  return {
    '@type': 'AggregateRating',
    ratingValue: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100,
    reviewCount: ratings.length
  };
}

// Helper: Get business type
function getBusinessType() {
  const types = ['LocalBusiness'];
  if (businessInfo?.businessCategory && businessInfo.businessCategory !== 'LocalBusiness') {
    types.push(businessInfo.businessCategory);
  }
  return types;
}

// Build JSON-LD structure
const aggregateRating = getAggregateRating();

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    // WebSite Entity
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      url: siteUrl,
      name: businessInfo?.businessName || 'Local Business',
      publisher: { '@id': `${siteUrl}#organization` },
      inLanguage: businessInfo?.availableLanguages?.[0] || 'en-US'
    },
    // Organization/Brand Entity
    {
      '@type': ['Organization', 'Brand'],
      '@id': `${siteUrl}#organization`,
      name: businessInfo?.businessName || 'Local Business',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: (seo?.searchResultsIcon &&
              (seo.searchResultsIcon.startsWith('http') || seo.searchResultsIcon.startsWith('/')) &&
              !seo.searchResultsIcon.startsWith('ERROR'))
             ? seo.searchResultsIcon
             : (site?.logoUrl || ''),
        width: 512,
        height: 512
      },
      sameAs: getSocialLinks()
    },
    // LocalBusiness Entity
    {
      '@type': getBusinessType(),
      '@id': `${siteUrl}#localbusiness`,
      name: businessInfo?.businessName || 'Local Business',
      url: siteUrl,
      description: about?.description || '',
      telephone: businessInfo?.phone || '',
      email: businessInfo?.email || '',
      priceRange: businessInfo?.priceRange || '',
      image: [site?.hero?.heroLargeImageUrl, ...(about?.images || []).map(img => img?.imageUrl)].filter(Boolean),
      logo: { '@id': `${siteUrl}#organization` },
      sameAs: getSocialLinks(),
      address: {
        '@type': 'PostalAddress',
        streetAddress: address?.streetAddress || '',
        addressLocality: address?.addressLocality || '',
        addressRegion: address?.addressRegion || '',
        postalCode: address?.postalCode || '',
        addressCountry: address?.addressCountry || ''
      },
      areaServed: {
        '@type': 'City',
        name: businessInfo?.areaServed || address?.addressLocality || ''
      },
      openingHoursSpecification: getOpeningHours(),
      ...(aggregateRating ? { aggregateRating } : {}),
      paymentAccepted: businessInfo?.paymentAccepted || [],
      currenciesAccepted: 'USD'
    },
    // WebPage Entity
    {
      '@type': 'WebPage',
      '@id': `${siteUrl}#webpage`,
      url: siteUrl,
      name: seo?.metaTitle || businessInfo?.businessName || 'Local Business',
      description: seo?.metaDescription || about?.description || '',
      isPartOf: { '@id': `${siteUrl}#website` },
      about: { '@id': `${siteUrl}#localbusiness` },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: seo?.ogImageUrl || site?.hero?.heroLargeImageUrl || '',
        width: 1200,
        height: 630
      },
      inLanguage: businessInfo?.availableLanguages?.[0] || 'en-US'
    }
  ].filter(Boolean)
};

// Write to public folder so it ends up in the static export
const publicDir = path.join(__dirname, '../public');
const llmTxtPath = path.join(publicDir, 'llm.txt');

fs.writeFileSync(llmTxtPath, JSON.stringify(jsonLd, null, 2), 'utf8');

console.log(`✅ llm.txt generated successfully at ${llmTxtPath}`);
