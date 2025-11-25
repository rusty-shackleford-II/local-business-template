import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import LocalBusinessLandingPage from '../src/components/LocalBusinessLandingPage';
import { I18nProvider } from '../src/components/I18nProvider';
import site from '../data/site.json';

// Generate JSON-LD structured data for search engines
// This matches the Python generate_jsonld.py logic
function generateJsonLd(siteData: any) {
  const baseUrl = siteData?.seo?.canonicalUrl?.replace(/\/$/, '') || 'https://example.com';
  const siteUrl = baseUrl + '/';
  
  const businessInfo = siteData?.businessInfo || {};
  const address = businessInfo?.address || {};
  const about = siteData?.about || {};
  const seo = siteData?.seo || {};
  
  // Helper: Get social links
  const getSocialLinks = () => {
    const links: string[] = [];
    const social = siteData?.contact?.social || {};
    ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok', 'yelp', 'googleBusinessProfile', 'other'].forEach(key => {
      if (social[key]?.trim()) links.push(social[key].trim());
    });
    (siteData?.footer?.socialLinks || []).forEach((item: any) => {
      if (item?.href?.trim()) links.push(item.href.trim());
    });
    return links;
  };
  
  // Helper: Get opening hours
  const getOpeningHours = () => {
    const hours = businessInfo?.businessHours || siteData?.contact?.businessHours || {};
    return Object.entries(hours)
      .filter(([_, cfg]: any) => cfg !== 'closed' && typeof cfg === 'object' && cfg?.open && cfg?.close)
      .map(([day, cfg]: any) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [day],
        opens: cfg.open,
        closes: cfg.close
      }));
  };
  
  // Helper: Get aggregate rating
  const getAggregateRating = () => {
    const testimonialsData = siteData?.testimonials || {};
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
    const ratings = items.map((t: any) => t?.rating).filter((r: any) => r && parseFloat(r) > 0).map(parseFloat);
    if (ratings.length === 0) return null;
    return {
      '@type': 'AggregateRating',
      ratingValue: Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 100) / 100,
      reviewCount: ratings.length
    };
  };
  
  // Helper: Get business type
  const getBusinessType = () => {
    const types = ['LocalBusiness'];
    if (businessInfo?.businessCategory && businessInfo.businessCategory !== 'LocalBusiness') {
      types.push(businessInfo.businessCategory);
    }
    return types;
  };
  
  // Build JSON-LD structure
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
      // Organization/Brand Entity (THIS IS WHERE THE LOGO IS FOR SEARCH RESULTS)
      {
        '@type': ['Organization', 'Brand'],
        '@id': `${siteUrl}#organization`,
        name: businessInfo?.businessName || 'Local Business',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          // Use searchResultsIcon first, then logoUrl as fallback
          url: (seo?.searchResultsIcon && 
                (seo.searchResultsIcon.startsWith('http') || seo.searchResultsIcon.startsWith('/')) &&
                !seo.searchResultsIcon.startsWith('ERROR')) 
               ? seo.searchResultsIcon 
               : (siteData?.logoUrl || ''),
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
        image: [siteData?.hero?.heroLargeImageUrl, ...(about?.images || []).map((img: any) => img?.imageUrl)].filter(Boolean),
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
        aggregateRating: getAggregateRating() || undefined,
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
          url: seo?.ogImageUrl || siteData?.hero?.heroLargeImageUrl || '',
          width: 1200,
          height: 630
        },
        inLanguage: businessInfo?.availableLanguages?.[0] || 'en-US'
      }
    ].filter(Boolean)
  };
  
  return JSON.stringify(jsonLd);
}

export default function Home() {
  const router = useRouter();
  
  // Check site version and i18n configuration
  const siteVersion = (site as any)?.version || '1.0';
  const i18nConfig = (site as any)?.i18n;
  const i18nEnabled = Boolean(i18nConfig?.enabled && (i18nConfig?.availableLanguages?.length ?? 0) > 0);
  // Head content (shared between both versions)
  const headContent = (
    <>
      <Head>
        <title>{(site as any)?.seo?.metaTitle || (site as any)?.businessInfo?.businessName || (site as any)?.businessName || 'Local Business'}</title>
        <meta
          name="description"
          content={(site as any)?.seo?.metaDescription || (site as any)?.about?.description || 'Local business services'}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
        {(site as any)?.seo?.canonicalUrl ? (
          <link rel="canonical" href={(site as any).seo.canonicalUrl} />
        ) : null}
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={(site as any)?.seo?.metaTitle || (site as any)?.hero?.headline || (site as any)?.businessInfo?.businessName || (site as any)?.businessName || 'Local Business'} />
        <meta property="og:description" content={(site as any)?.seo?.metaDescription || (site as any)?.about?.description || 'Local business services'} />
        <meta property="og:image" content={(site as any)?.seo?.ogImageUrl || '/og-image.png'} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={(site as any)?.seo?.metaTitle || (site as any)?.businessInfo?.businessName || (site as any)?.businessName || 'Local Business'} />
        <meta property="og:site_name" content={(site as any)?.businessInfo?.businessName || (site as any)?.businessName || (site as any)?.seo?.metaTitle || 'Local Business'} />
        <meta property="og:locale" content="en_US" />
        {/* Use canonical URL for og:url */}
        <meta property="og:url" content={(site as any)?.seo?.canonicalUrl || ''} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={(site as any)?.seo?.metaTitle || (site as any)?.hero?.headline || (site as any)?.businessInfo?.businessName || (site as any)?.businessName || 'Local Business'} />
        <meta name="twitter:description" content={(site as any)?.seo?.metaDescription || (site as any)?.about?.description || 'Local business services'} />
        <meta name="twitter:image" content={(site as any)?.seo?.ogImageUrl || '/og-image.png'} />
        <meta name="twitter:image:alt" content={(site as any)?.seo?.metaTitle || (site as any)?.businessInfo?.businessName || (site as any)?.businessName || 'Local Business'} />
        
        {/* Additional SEO Meta Tags */}
        <meta name="author" content={(site as any)?.businessInfo?.businessName || (site as any)?.businessName || 'Local Business'} />
        
        {/* Google Analytics */}
        {(site as any)?.seo?.googleAnalyticsId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${(site as any).seo.googleAnalyticsId}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${(site as any).seo.googleAnalyticsId}');
                `,
              }}
            />
          </>
        )}
        
        {/* Icons */}
        {(site as any)?.seo?.searchResultsIcon && 
         (((site as any).seo.searchResultsIcon.startsWith('http') || (site as any).seo.searchResultsIcon.startsWith('/'))) &&
         !((site as any).seo.searchResultsIcon.startsWith('ERROR')) ? (
          <>
            <link rel="icon" href={(site as any).seo.searchResultsIcon} type="image/png" />
            <link rel="apple-touch-icon" href={(site as any).seo.searchResultsIcon} />
          </>
        ) : (
          <>
            <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            <link rel="apple-touch-icon" href="/favicon.png" />
          </>
        )}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* JSON-LD Structured Data for Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: generateJsonLd(site) }}
        />
      </Head>
    </>
  );

  // Legacy sites (v1) - render directly without i18n wrapper
  if (siteVersion === '1.0' || !i18nEnabled) {
    return (
      <>
        {headContent}
        <LocalBusinessLandingPage {...(site as any)} />
      </>
    );
  }

  // New sites (v2+) - wrap with i18n provider
  return (
    <>
      {headContent}
      <I18nProvider
        defaultLanguage={i18nConfig?.defaultLanguage || 'en'}
        availableLanguages={i18nConfig?.availableLanguages || ['en']}
        siteData={site}
        enabled={i18nEnabled}
      >
        <LocalBusinessLandingPage {...(site as any)} />
      </I18nProvider>
    </>
  );
}
