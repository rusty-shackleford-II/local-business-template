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

export default function LocalBusinessLandingPage(site: SiteData) {
  // Set CSS custom properties for color palette
  React.useEffect(() => {
    if (site.colorPalette) {
      document.documentElement.style.setProperty('--palette-primary', site.colorPalette.primary);
      document.documentElement.style.setProperty('--palette-secondary', site.colorPalette.secondary);
    }
  }, [site.colorPalette]);
  // Build sections list from layout or fallback to default order
  const defaultOrder: SectionKey[] = ['hero', 'about', 'services', 'benefits', 'menu', 'testimonials', 'payment', 'videos', 'upcomingEvents', 'contact'];
  
  // Safely get sections array, ensuring it's always an array
  const sectionsSource = (site.layout?.sections && Array.isArray(site.layout.sections)) 
    ? site.layout.sections 
    : defaultOrder;
  
  const normalizedSections: { id: SectionKey; enabled: boolean }[] = sectionsSource
    .map((entry) => {
      if (typeof entry === 'string') return { id: entry as SectionKey, enabled: true };
      return { id: entry.id as SectionKey, enabled: entry.enabled !== false };
    })
    .filter((section, index, array) => {
      // Remove duplicates - keep the first occurrence of each section
      return array.findIndex(s => s.id === section.id) === index;
    });
  

  const renderSection = (section: SectionKey, index: number) => {
    // Alternating backgrounds: even index = white, odd index = gray-50
    // Hero always starts with white (index 0), then alternates
    const isEven = index % 2 === 0;
    const backgroundClass = isEven ? 'bg-white' : 'bg-gray-50';
    
    
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
        {normalizedSections.filter(s => s.enabled).map(({ id }, index) => (
          <React.Fragment key={id}>{renderSection(id, index)}</React.Fragment>
        ))}
      </main>
      <Footer 
        businessName={site.businessInfo?.businessName || site.businessName || 'Local Business'} 
        logoUrl={site.logoUrl} 
        footer={site.footer} 
        layout={site.layout}
        editable={site.editable}
        onEdit={site.onEdit}
      />
    </div>
  );
}


