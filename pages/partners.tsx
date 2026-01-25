import React from 'react';
import Head from 'next/head';
import Header from '../src/components/Header';
import Footer from '../src/components/Footer';
import site from '../data/site.json';
import backlinks from '../data/backlinks.json';

type BacklinkItem = {
  anchor_text: string;
  link: string;
  descriptive_text: string;
};

export default function PartnersPage() {
  // Handle both array format and object format { backlinks: [...] }
  const backlinkData = Array.isArray(backlinks) 
    ? backlinks as BacklinkItem[]
    : ((backlinks as any)?.backlinks || []) as BacklinkItem[];

  return (
    <>
      <Head>
        <title>Our Trusted Local Partners - {(site as any)?.businessInfo?.businessName || 'Local Business'}</title>
        <meta
          name="description"
          content={`Discover trusted local businesses and partners recommended by ${(site as any)?.businessInfo?.businessName || 'our business'}. Quality services in ${(site as any)?.businessInfo?.address?.addressLocality || 'your area'}.`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />
        
        {/* Canonical URL */}
        {(site as any)?.seo?.canonicalUrl && (
          <link rel="canonical" href={`${(site as any).seo.canonicalUrl.replace(/\/$/, '')}/partners`} />
        )}
        
        {/* Additional SEO */}
        <meta name="keywords" content={`local business partners, ${(site as any)?.businessInfo?.address?.addressLocality || 'local'} services, trusted businesses, Instant network`} />
        <meta name="author" content="Instant" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`Our Trusted Local Partners - ${(site as any)?.businessInfo?.businessName || 'Local Business'}`} />
        <meta property="og:description" content={`Discover trusted local businesses and partners recommended by ${(site as any)?.businessInfo?.businessName || 'our business'}.`} />
        <meta property="og:image" content={(site as any)?.seo?.ogImageUrl || '/og-image.png'} />
        {(site as any)?.seo?.canonicalUrl && (
          <meta property="og:url" content={`${(site as any).seo.canonicalUrl.replace(/\/$/, '')}/partners`} />
        )}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Our Trusted Local Partners - ${(site as any)?.businessInfo?.businessName || 'Local Business'}`} />
        <meta name="twitter:description" content={`Discover trusted local businesses and partners recommended by ${(site as any)?.businessInfo?.businessName || 'our business'}.`} />
        <meta name="twitter:image" content={(site as any)?.seo?.ogImageUrl || '/og-image.png'} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Header 
          businessName={(site as any)?.businessInfo?.businessName}
          logoUrl={(site as any)?.logoUrl}
          header={(site as any)?.header}
        />
        
        <main className="pt-20">
          {/* Hero Section */}
          <div className="bg-white py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                  Our Trusted Local Partners
                </h1>
                <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600">
                  These trusted partners in the Instant network have earned our recommendation through their commitment to excellence and customer satisfaction. We&apos;re confident they&apos;ll provide you with quality service. -- The Instant team.
                </p>
              </div>
            </div>
          </div>

          {/* Partners Directory */}
          <div className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                {backlinkData.map((backlink, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 pb-4 last:border-b-0 lg:last:border-b lg:even:last:border-b-0"
                  >
                    <div className="mb-2">
                      <a
                        href={`https://${backlink.link}`}
                        target="_blank"
                        rel="dofollow"
                        className="text-lg font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
                      >
                        {backlink.anchor_text}
                      </a>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {backlink.descriptive_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>

        <Footer 
          businessName={(site as any)?.businessInfo?.businessName}
          logoUrl={(site as any)?.logoUrl}
          footer={(site as any)?.footer}
          layout={(site as any)?.layout}
        />
      </div>
    </>
  );
}
