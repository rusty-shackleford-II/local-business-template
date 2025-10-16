import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import LocalBusinessLandingPage from '../src/components/LocalBusinessLandingPage';
import site from '../data/site.json';

export default function Home() {
  const router = useRouter();

  return (
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
        {(site as any)?.seo?.searchResultsIcon ? (
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
      </Head>
      
      <LocalBusinessLandingPage {...(site as any)} />
    </>
  );
}
