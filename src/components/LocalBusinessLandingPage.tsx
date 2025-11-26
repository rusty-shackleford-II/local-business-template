import React from "react";
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
import type { SiteData as SiteDataType, SectionKey } from '../types';

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
};

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
  // Set CSS custom properties for color palette
  React.useEffect(() => {
    if (site.colorPalette) {
      document.documentElement.style.setProperty('--palette-primary', site.colorPalette.primary);
      document.documentElement.style.setProperty('--palette-secondary', site.colorPalette.secondary);
    }
  }, [site.colorPalette]);

  // Dynamically load Google Fonts used by sections
  React.useEffect(() => {
    // Collect all fonts used across sections
    const fontsToLoad = new Set<string>();
    
    if (site.layout?.sections && Array.isArray(site.layout.sections)) {
      for (const section of site.layout.sections) {
        if (typeof section === 'object' && section.fontFamily) {
          const googleFontName = GOOGLE_FONTS_MAP[section.fontFamily];
          if (googleFontName) {
            fontsToLoad.add(googleFontName);
          }
        }
      }
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
  }, [site.layout?.sections]);
  // Build sections list from layout or fallback to default order
  const defaultOrder: SectionKey[] = ['hero', 'about', 'services', 'benefits', 'menu', 'testimonials', 'payment', 'videos', 'upcomingEvents', 'contact'];
  
  // Safely get sections array, ensuring it's always an array
  const sectionsSource = (site.layout?.sections && Array.isArray(site.layout.sections)) 
    ? site.layout.sections 
    : defaultOrder;
  
  const normalizedSections: { id: SectionKey; enabled: boolean; backgroundColor?: string; textColor?: string; fontFamily?: string }[] = sectionsSource
    .map((entry) => {
      if (typeof entry === 'string') return { id: entry as SectionKey, enabled: true };
      return { 
        id: entry.id as SectionKey, 
        enabled: entry.enabled !== false,
        backgroundColor: entry.backgroundColor,
        textColor: entry.textColor,
        fontFamily: entry.fontFamily
      };
    })
    .filter((section, index, array) => {
      // Remove duplicates - keep the first occurrence of each section
      return array.findIndex(s => s.id === section.id) === index;
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

  const renderSection = (section: SectionKey, index: number, backgroundColor?: string) => {
    // Get background class - use transparent if custom color (parent wrapper handles it), otherwise alternate
    const backgroundClass = backgroundColor ? 'bg-transparent' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50');
    
    
    switch (section) {
      case 'hero':
        return <Hero 
          hero={site.hero} 
          payment={(site as any).payment} 
          isPreview={site.isPreview}
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit}
          onHeroImageClick={site.onHeroImageClick}
          colorPalette={site.colorPalette}
        />;
      case 'about':
        return <About 
          about={site.about} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit}
          colorPalette={site.colorPalette}
        />;
      case 'services':
        return <Services 
          services={site.services} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit}
          colorPalette={site.colorPalette}
        />;
      case 'benefits':
        return <BusinessBenefits 
          businessBenefits={site.businessBenefits} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit}
          colorPalette={site.colorPalette}
        />;
      case 'menu':
        return <Menu 
          menu={(site as any).menu} 
          editable={site.editable}
          onMenuUpdate={site.onEdit ? (updatedMenu) => {
            site.onEdit!('menu', JSON.stringify(updatedMenu));
          } : undefined}
          onEdit={site.onEdit}
          backgroundClass={backgroundClass}
          isPreview={site.isPreview}
        />;
      case 'testimonials':
        return <Testimonials 
          testimonials={site.testimonials} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit}
          colorPalette={site.colorPalette}
        />;
      case 'videos':
        return <Videos 
          videos={site.videos} 
          isPreview={site.isPreview} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit}
        />;
      case 'payment':
        return <Payment 
          payment={(site as any).payment} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit}
          colorPalette={site.colorPalette}
        />;
      case 'upcomingEvents':
        return <UpcomingEvents 
          upcomingEvents={site.upcomingEvents} 
          contact={site.contact} 
          businessInfo={site.businessInfo} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit}
          colorPalette={site.colorPalette}
        />;
      case 'contact':
        return <Contact 
          contact={site.contact} 
          businessInfo={site.businessInfo} 
          backgroundClass={backgroundClass}
          editable={site.editable}
          onEdit={site.onEdit}
          colorPalette={site.colorPalette}
          siteUrl={site.seo?.canonicalUrl}
        />;
      default:
        return null;
    }
  };

  // Wrap section in a div with custom styles if needed
  const renderSectionWithStyles = (
    sectionConfig: { id: SectionKey; enabled: boolean; backgroundColor?: string; textColor?: string; fontFamily?: string },
    index: number
  ) => {
    const { style, hasWrapper } = getSectionStyle(
      sectionConfig.backgroundColor, 
      sectionConfig.textColor,
      sectionConfig.fontFamily,
      index
    );
    const content = renderSection(sectionConfig.id, index, sectionConfig.backgroundColor);
    
    if (hasWrapper && style) {
      // Custom styles - wrap in a div with the styles
      return (
        <div key={sectionConfig.id} style={style}>
          {content}
        </div>
      );
    }
    
    // No custom styles, render as normal
    return <React.Fragment key={sectionConfig.id}>{content}</React.Fragment>;
  };

  return (
    <div className="App">
      <Header 
        businessName={site.businessInfo?.businessName || site.businessName || 'Local Business'} 
        logoUrl={site.logoUrl} 
        header={site.header} 
        payment={(site as any).payment} 
        layout={site.layout} 
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
        editable={site.editable}
        onEdit={site.onEdit}
        isPreview={site.isPreview}
      />
    </div>
  );
}


