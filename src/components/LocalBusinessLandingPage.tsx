import React, { useState, useEffect, useCallback } from "react";
import Header from "./Header";
import Hero from "./Hero";
import About from "./About";
import Services from "./Services";
import BusinessBenefits from "./BusinessBenefits";
import Menu from "./Menu";
import Testimonials from "./Testimonials";
import UpcomingEvents from "./UpcomingEvents";
import Contact from "./Contact";
import Footer from "./Footer";
import Videos from "./Videos";
import Payment from "./Payment";

// Import proper types
import type { SiteData as SiteDataType, SectionKey, Page, PageSection, Hero as HeroType, About as AboutType, Services as ServicesType, BusinessBenefits as BusinessBenefitsType, Menu as MenuType, Testimonials as TestimonialsType, UpcomingEvents as UpcomingEventsType, Contact as ContactType, Videos as VideosType, Payment as PaymentType } from '../types';

// Basic type aligned with data/schema.json
export type SiteData = SiteDataType & {
  // Editor-specific props
  editable?: boolean;
  onEdit?: (path: string, value: string | { open: string; close: string }) => void;
  isPreview?: boolean;
  // Inline editing props
  inlineEditingMode?: boolean;
  onTextSizeChange?: (elementId: string, size: number) => void;
  onTextContentChange?: (elementId: string, text: string) => void;
  getTextSize?: (elementId: string) => number;
  // Image upload handlers
  onLogoClick?: () => void;
  onHeroImageClick?: () => void;
  // Multipage props
  currentPageSlug?: string; // For preview mode - parent controls current page
  onPageChange?: (slug: string) => void; // Callback when page changes
  // Benefits inline editing
  onDeleteBenefit?: (index: number) => void;
  onAddBenefit?: (afterIndex?: number) => void;
};

// Type for any section data
type AnySectionData = HeroType | AboutType | ServicesType | BusinessBenefitsType | MenuType | TestimonialsType | UpcomingEventsType | ContactType | VideosType | PaymentType;

// Helper to extract section type from sectionId
function getSectionType(sectionId: string): SectionKey {
  const parts = sectionId.split('_');
  return parts[0] as SectionKey;
}

// Helper to check if sectionId is a custom instance
function isCustomInstance(sectionId: string): boolean {
  return sectionId.includes('_');
}

// Helper to get section data from site
function getSectionData(site: SiteData, sectionId: string): AnySectionData | undefined {
  const sectionType = getSectionType(sectionId);
  
  // If NOT a custom instance, use top-level data
  if (!isCustomInstance(sectionId)) {
    switch (sectionType) {
      case 'hero': return site.hero;
      case 'about': return site.about;
      case 'services': return site.services;
      case 'benefits': return site.businessBenefits;
      case 'menu': return site.menu;
      case 'testimonials': return site.testimonials;
      case 'upcomingEvents': return site.upcomingEvents;
      case 'contact': return site.contact;
      case 'videos': return site.videos;
      case 'payment': return site.payment;
      default: return undefined;
    }
  }
  
  // Custom instance - look in sectionInstances
  return site.sectionInstances?.[sectionId];
}

// Helper to convert legacy sections to pages format
function migrateLegacySectionsToPages(legacySections: Array<string | { id: string; enabled?: boolean; navLabel?: string; backgroundColor?: string; textColor?: string; fontFamily?: string }>): Page[] {
  return [{
    id: 'home',
    name: 'Home',
    slug: '',
    heroEnabled: true,
    sections: legacySections.map((section): PageSection => {
      if (typeof section === 'string') {
        return { sectionId: section, enabled: true };
      }
      return {
        sectionId: section.id,
        enabled: section.enabled !== false,
        navLabel: section.navLabel,
        backgroundColor: section.backgroundColor,
        textColor: section.textColor,
        fontFamily: section.fontFamily,
      };
    }),
  }];
}

// Helper to get pages from site data with backwards compatibility
function getPages(site: SiteData): Page[] {
  if (site.layout?.pages && site.layout.pages.length > 0) {
    return site.layout.pages;
  }
  
  if (site.layout?.sections) {
    return migrateLegacySectionsToPages(site.layout.sections);
  }
  
  // Default single page with all sections
  return [{
    id: 'home',
    name: 'Home',
    slug: '',
    heroEnabled: true,
    sections: [
      { sectionId: 'hero', enabled: true },
      { sectionId: 'about', enabled: true },
      { sectionId: 'services', enabled: true },
      { sectionId: 'benefits', enabled: true },
      { sectionId: 'testimonials', enabled: true },
      { sectionId: 'contact', enabled: true },
    ],
  }];
}

// Check if site is in multipage mode (more than one page)
function isMultipageMode(site: SiteData): boolean {
  const pages = getPages(site);
  return pages.length > 1;
}

// Google Fonts that need to be loaded dynamically
// Maps the font-family CSS value to the Google Fonts family name
const GOOGLE_FONTS_MAP: Record<string, string> = {
  'Inter, sans-serif': 'Inter',
  'Roboto, sans-serif': 'Roboto',
  'Open Sans, sans-serif': 'Open+Sans',
  'Lato, sans-serif': 'Lato',
  'Montserrat, sans-serif': 'Montserrat',
  'Poppins, sans-serif': 'Poppins',
  'Playfair Display, serif': 'Playfair+Display',
  'Merriweather, serif': 'Merriweather',
  'Raleway, sans-serif': 'Raleway',
  'Oswald, sans-serif': 'Oswald',
  'Nunito, sans-serif': 'Nunito',
  'Source Sans Pro, sans-serif': 'Source+Sans+Pro',
};

export default function LocalBusinessLandingPage(site: SiteData) {
  // Get pages with backwards compatibility
  const pages = getPages(site);
  const isMultipage = isMultipageMode(site);
  
  // Current page state - controlled by parent in preview mode, or by hash in production
  const [currentPageSlug, setCurrentPageSlug] = useState<string>(() => {
    if (site.currentPageSlug !== undefined) return site.currentPageSlug;
    if (typeof window === 'undefined') return '';
    const hash = window.location.hash;
    if (!hash || hash === '#' || hash === '#home') return '';
    return hash.substring(1);
  });
  
  // Sync with parent-controlled page slug (preview mode)
  useEffect(() => {
    if (site.currentPageSlug !== undefined) {
      setCurrentPageSlug(site.currentPageSlug);
    }
  }, [site.currentPageSlug]);
  
  // Listen for hash changes (both preview and production mode)
  // In preview mode, this handles nav clicks within the preview iframe
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const newSlug = (!hash || hash === '#' || hash === '#home') ? '' : hash.substring(1);
      setCurrentPageSlug(newSlug);
      site.onPageChange?.(newSlug);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [site.onPageChange]);
  
  // Find current page
  const currentPage = pages.find(p => p.slug === currentPageSlug) || pages[0];
  
  // Set CSS custom properties for color palette
  useEffect(() => {
    if (site.colorPalette) {
      document.documentElement.style.setProperty('--palette-primary', site.colorPalette.primary);
      document.documentElement.style.setProperty('--palette-secondary', site.colorPalette.secondary);
    }
  }, [site.colorPalette]);

  // Dynamically load Google Fonts used by sections and text elements
  useEffect(() => {
    // Collect all fonts used across all pages
    const fontsToLoad = new Set<string>();
    
    // Helper function to add font to load set
    const addFontIfGoogle = (fontFamily: string | undefined) => {
      if (fontFamily) {
        const googleFontName = GOOGLE_FONTS_MAP[fontFamily];
        if (googleFontName) {
          fontsToLoad.add(googleFontName);
        }
      }
    };
    
    for (const page of pages) {
      for (const section of page.sections) {
        addFontIfGoogle(section.fontFamily);
      }
    }
    
    // Also check legacy sections for backwards compat
    if (site.layout?.sections && Array.isArray(site.layout.sections)) {
      for (const section of site.layout.sections) {
        if (typeof section === 'object' && section.fontFamily) {
          addFontIfGoogle(section.fontFamily);
        }
      }
    }
    
    // Check hero headline and subheadline fonts
    if (site.hero) {
      addFontIfGoogle(site.hero.headlineFont);
      addFontIfGoogle(site.hero.subheadlineFont);
    }
    
    // If there are Google Fonts to load, inject the link tag
    if (fontsToLoad.size > 0) {
      const fontFamilies = Array.from(fontsToLoad).map(f => `family=${f}:wght@300;400;500;600;700`).join('&');
      const linkId = 'google-fonts-dynamic';
      
      // Check if link already exists
      let linkElement = document.getElementById(linkId) as HTMLLinkElement | null;
      
      if (!linkElement) {
        // Create preconnect links for faster loading
        const preconnect1 = document.createElement('link');
        preconnect1.rel = 'preconnect';
        preconnect1.href = 'https://fonts.googleapis.com';
        document.head.appendChild(preconnect1);
        
        const preconnect2 = document.createElement('link');
        preconnect2.rel = 'preconnect';
        preconnect2.href = 'https://fonts.gstatic.com';
        preconnect2.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect2);
        
        // Create the font link
        linkElement = document.createElement('link');
        linkElement.id = linkId;
        linkElement.rel = 'stylesheet';
        document.head.appendChild(linkElement);
      }
      
      // Update the href with the fonts to load
      const newHref = `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`;
      if (linkElement.href !== newHref) {
        linkElement.href = newHref;
      }
    }
  }, [pages, site.layout?.sections, site.hero]);
  
  // Get sections for current page
  const currentSections = currentPage?.sections || [];
  
  // Check if this page's hero should be shown (for non-home pages, respect heroEnabled)
  const isHomePage = currentPage?.id === 'home' || currentPage?.slug === '';
  const showPageHero = isHomePage || currentPage?.heroEnabled !== false;
  
  // Normalize sections for rendering
  const normalizedSections: { sectionId: string; sectionType: SectionKey; enabled: boolean; backgroundColor?: string; textColor?: string; fontFamily?: string }[] = currentSections
    .map((section) => {
      const sectionType = getSectionType(section.sectionId);
      
      // For hero sections on non-home pages, respect heroEnabled
      let enabled = section.enabled !== false;
      if (sectionType === 'hero' && !isHomePage && !showPageHero) {
        enabled = false;
      }
      
      return {
        sectionId: section.sectionId,
        sectionType,
        enabled,
        backgroundColor: section.backgroundColor,
        textColor: section.textColor,
        fontFamily: section.fontFamily,
      };
    });
  
  // Helper to get section styles (background, text color, font)
  const getSectionStyle = (
    backgroundColor: string | undefined, 
    textColor: string | undefined, 
    fontFamily: string | undefined,
    index: number
  ) => {
    const hasCustomStyles = backgroundColor || textColor || fontFamily;
    
    if (hasCustomStyles) {
      // Build the style object with any custom properties
      const style: React.CSSProperties = {};
      if (backgroundColor) style.backgroundColor = backgroundColor;
      if (textColor) style.color = textColor;
      if (fontFamily) style.fontFamily = fontFamily;
      
      return { 
        style, 
        className: backgroundColor ? 'bg-transparent' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50'),
        hasWrapper: true
      };
    }
    // Default alternating pattern
    const isEven = index % 2 === 0;
    return { style: undefined, className: isEven ? 'bg-white' : 'bg-gray-50', hasWrapper: false };
  };

  // Render a section using its sectionId to look up data
  const renderSection = (sectionId: string, sectionType: SectionKey, index: number, backgroundColor?: string) => {
    // Get background class - use transparent if custom color (parent wrapper handles it), otherwise alternate
    const backgroundClass = backgroundColor ? 'bg-transparent' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
    
    // Get section data from either top-level or sectionInstances
    const sectionData = getSectionData(site, sectionId);
    
    // Determine the edit path based on whether this is a custom instance
    const editBasePath = isCustomInstance(sectionId) 
      ? `sectionInstances.${sectionId}` 
      : sectionType;
    
    // Only pass sectionId for custom instances (e.g., "about_abc123")
    // Base sections use their component defaults for backwards compatibility
    const customSectionId = isCustomInstance(sectionId) ? sectionId : undefined;
    
    switch (sectionType) {
      case 'hero':
        const heroData = sectionData as HeroType || site.hero;
        return <Hero 
          hero={heroData} 
          payment={site.payment} 
          isPreview={site.isPreview}
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit ? (path, value) => site.onEdit!(`${editBasePath}.${path.replace('hero.', '')}`, value) : undefined}
          onHeroImageClick={site.onHeroImageClick}
          colorPalette={site.colorPalette}
          sectionId={customSectionId}
        />;
      case 'about':
        const aboutData = sectionData as AboutType || site.about;
        return <About 
          about={aboutData} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit ? (path, value) => site.onEdit!(`${editBasePath}.${path.replace('about.', '')}`, value) : undefined}
          colorPalette={site.colorPalette}
          sectionId={customSectionId}
        />;
      case 'services':
        const servicesData = sectionData as ServicesType || site.services;
        return <Services 
          services={servicesData} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit ? (path, value) => site.onEdit!(`${editBasePath}.${path.replace('services.', '')}`, value) : undefined}
          colorPalette={site.colorPalette}
          sectionId={customSectionId}
        />;
      case 'benefits':
        const benefitsData = sectionData as BusinessBenefitsType || site.businessBenefits;
        // For benefits, the data key is 'businessBenefits' not 'benefits', so we need special handling
        const benefitsEditBasePath = isCustomInstance(sectionId) 
          ? `sectionInstances.${sectionId}` 
          : 'businessBenefits';
        return <BusinessBenefits 
          businessBenefits={benefitsData} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit ? (path, value) => site.onEdit!(`${benefitsEditBasePath}.${path.replace('businessBenefits.', '')}`, value) : undefined}
          onDeleteBenefit={site.onDeleteBenefit}
          onAddBenefit={site.onAddBenefit}
          colorPalette={site.colorPalette}
          sectionId={customSectionId}
        />;
      case 'menu':
        const menuData = sectionData as MenuType || site.menu;
        return <Menu 
          menu={menuData} 
          editable={site.editable}
          onMenuUpdate={site.onEdit ? (updatedMenu) => {
            site.onEdit!(editBasePath, JSON.stringify(updatedMenu));
          } : undefined}
          onEdit={site.onEdit ? (path, value) => site.onEdit!(`${editBasePath}.${path.replace('menu.', '')}`, value) : undefined}
          backgroundClass={backgroundClass}
          isPreview={site.isPreview}
          sectionId={customSectionId}
        />;
      case 'testimonials':
        const testimonialsData = sectionData as TestimonialsType || site.testimonials;
        return <Testimonials 
          testimonials={testimonialsData} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit ? (path, value) => site.onEdit!(`${editBasePath}.${path.replace('testimonials.', '')}`, value) : undefined}
          colorPalette={site.colorPalette}
          sectionId={customSectionId}
        />;
      case 'videos':
        const videosData = sectionData as VideosType || site.videos;
        return <Videos 
          videos={videosData} 
          isPreview={site.isPreview} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit ? (path, value) => site.onEdit!(`${editBasePath}.${path.replace('videos.', '')}`, value) : undefined}
          sectionId={customSectionId}
        />;
      case 'payment':
        const paymentData = sectionData as PaymentType || site.payment;
        return <Payment 
          payment={paymentData} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit ? (path, value) => site.onEdit!(`${editBasePath}.${path.replace('payment.', '')}`, value) : undefined}
          colorPalette={site.colorPalette}
          sectionId={customSectionId}
        />;
      case 'upcomingEvents':
        const eventsData = sectionData as UpcomingEventsType || site.upcomingEvents;
        return <UpcomingEvents 
          upcomingEvents={eventsData} 
          contact={site.contact} 
          businessInfo={site.businessInfo} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit ? (path, value) => site.onEdit!(`${editBasePath}.${path.replace('upcomingEvents.', '')}`, value) : undefined}
          colorPalette={site.colorPalette}
          sectionId={customSectionId}
        />;
      case 'contact':
        const contactData = sectionData as ContactType || site.contact;
        return <Contact 
          contact={contactData} 
          businessInfo={site.businessInfo} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit ? (path, value) => site.onEdit!(`${editBasePath}.${path.replace('contact.', '')}`, value) : undefined}
          colorPalette={site.colorPalette}
          siteUrl={site.seo?.canonicalUrl}
          sectionId={customSectionId}
        />;
      default:
        return null;
    }
  };

  // Wrap section in a div with custom styles if needed
  const renderSectionWithStyles = (
    sectionConfig: { sectionId: string; sectionType: SectionKey; enabled: boolean; backgroundColor?: string; textColor?: string; fontFamily?: string },
    index: number
  ) => {
    const { style, hasWrapper } = getSectionStyle(
      sectionConfig.backgroundColor, 
      sectionConfig.textColor,
      sectionConfig.fontFamily,
      index
    );
    const content = renderSection(sectionConfig.sectionId, sectionConfig.sectionType, index, sectionConfig.backgroundColor);
    
    if (hasWrapper && style) {
      // Custom styles - wrap in a div with the styles
      return (
        <div key={sectionConfig.sectionId} style={style}>
          {content}
        </div>
      );
    }
    
    // No custom styles, render as normal
    return <React.Fragment key={sectionConfig.sectionId}>{content}</React.Fragment>;
  };

  return (
    <div className="App">
      <Header 
        businessName={site.businessInfo?.businessName || site.businessName || 'Local Business'} 
        logoUrl={site.logoUrl} 
        header={site.header} 
        payment={site.payment} 
        layout={site.layout}
        pages={pages}
        currentPageSlug={currentPageSlug}
        isMultipage={isMultipage}
        isPreview={site.isPreview}
        editable={site.editable}
        onEdit={site.onEdit}
        onTextSizeChange={site.onEdit ? (size: number) => site.onEdit!('header.textSize', size.toString()) : undefined}
        onBusinessNameColorChange={site.onEdit ? (color: string) => site.onEdit!('header.colors.businessNameColor', color) : undefined}
        onLogoClick={site.onLogoClick}
        colorPalette={site.colorPalette}
      />
      <main>
        {normalizedSections.filter(s => s.enabled).map((sectionConfig, index) => 
          renderSectionWithStyles(sectionConfig, index)
        )}
      </main>
      <Footer 
        businessName={site.businessInfo?.businessName || site.businessName || 'Local Business'} 
        logoUrl={site.logoUrl} 
        footer={site.footer} 
        layout={site.layout}
        pages={pages}
        currentPageSlug={currentPageSlug}
        isMultipage={isMultipage}
        editable={site.editable}
        onEdit={site.onEdit}
        isPreview={site.isPreview}
      />
    </div>
  );
}


