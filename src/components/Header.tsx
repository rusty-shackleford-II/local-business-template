import React, { useState, useEffect, useRef } from 'react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import EditableText from './EditableText';
import IdbImage from './IdbImage';
import LanguageToggle from './LanguageToggle';
import { useI18nContext } from './I18nProvider';
import type { Header as HeaderCfg, Payment as PaymentCfg, Layout, SectionKey, ColorPalette, Page, PageSection } from '../types';

type Props = {
  businessName?: string;
  logoUrl?: string;
  header?: HeaderCfg;
  payment?: PaymentCfg;
  layout?: Layout;
  // Multipage support
  pages?: Page[];
  currentPageSlug?: string;
  isMultipage?: boolean;
  isPreview?: boolean;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  onTextSizeChange?: (size: number) => void;
  onBusinessNameColorChange?: (color: string) => void;
  onLogoClick?: () => void;
  colorPalette?: ColorPalette;
};

// Navigation link with optional sections for dropdown
type NavLink = {
  id: string;
  label: string;
  slug?: string;
  enabled: boolean;
  isSection: boolean;
  isPage: boolean;
  isActive: boolean;
  sections?: Array<{
    id: string;
    label: string;
    sectionId: string;
  }>;
};

const Header: React.FC<Props> = ({ businessName = 'Local Business', logoUrl, header, payment, layout, pages, currentPageSlug, isMultipage, isPreview, editable, onEdit, onTextSizeChange, onBusinessNameColorChange, onLogoClick, colorPalette }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileNav, setExpandedMobileNav] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const i18n = useI18nContext();
  const t = i18n?.t || ((key: string, defaultValue?: string) => defaultValue || key);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);
  
  // Calculate logo size and header height
  const logoSize = header?.logoSize || 1.0;
  const textSize = header?.textSize || 1.0;
  const expandableHeader = header?.expandableHeader ?? true;
  
  // Base logo heights for different screen sizes (in rem)
  const baseLogoHeights = {
    sm: 2.5,  // h-10 = 2.5rem
    md: 3,    // h-12 = 3rem  
    lg: 3.5   // h-14 = 3.5rem
  };
  
  // Calculate actual logo heights with size multiplier
  const logoHeights = {
    sm: baseLogoHeights.sm * logoSize,
    md: baseLogoHeights.md * logoSize,
    lg: baseLogoHeights.lg * logoSize
  };
  
  // Calculate header height based on logo size (with padding)
  const calculateHeaderHeight = () => {
    if (!expandableHeader) return 'auto';
    const maxLogoHeight = Math.max(logoHeights.sm, logoHeights.md, logoHeights.lg);
    const padding = 1.5; // py-3 = 0.75rem top + 0.75rem bottom = 1.5rem total
    return `${maxLogoHeight + padding}rem`;
  };

  // Set CSS custom property for body padding to match header height
  React.useEffect(() => {
    if (expandableHeader) {
      const headerHeight = calculateHeaderHeight();
      document.documentElement.style.setProperty('--dynamic-header-height', headerHeight);
    } else {
      // Use default header heights for non-expandable headers
      document.documentElement.style.setProperty('--dynamic-header-height', '5rem'); // Default fallback
    }
  }, [logoSize, expandableHeader]);

  const handleNavigation = (linkId: string, isSection: boolean, isPage: boolean = false) => {
    console.log('🔗 [Nav] handleNavigation called:', linkId, 'isSection:', isSection, 'isPage:', isPage);
    setIsMenuOpen(false);
    
    // Handle page navigation (multipage mode)
    if (isPage) {
      if (typeof window === 'undefined') return;
      
      // Find the page by ID or slug
      const targetPage = pages?.find(p => p.id === linkId || p.slug === linkId);
      const slug = targetPage?.slug || linkId;
      
      // Update hash to trigger page change
      if (slug === '' || slug === 'home') {
        window.location.hash = '';
        // Also scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.location.hash = slug;
        // Scroll to top of new page
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    
    // Handle section navigation (single-page mode or scrolling within a page)
    if (isSection) {
      // Only run client-side
      if (typeof window === 'undefined') return;
      
      // Try to scroll to the section
      const element = document.getElementById(linkId);
      console.log('🔗 [Nav] Element found:', !!element, element);
      
      if (element) {
        // Find scrollable ancestor (for preview mode where content is in a scrollable div)
        let scrollableParent: HTMLElement | null = element.parentElement;
        while (scrollableParent) {
          const style = window.getComputedStyle(scrollableParent);
          const overflowY = style.overflowY;
          const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && 
                               scrollableParent.scrollHeight > scrollableParent.clientHeight;
          if (isScrollable) {
            console.log('🔗 [Nav] Found scrollable parent:', scrollableParent.className);
            break;
          }
          scrollableParent = scrollableParent.parentElement;
        }
        
        if (scrollableParent) {
          // Calculate position relative to the scrollable container
          const elementRect = element.getBoundingClientRect();
          const containerRect = scrollableParent.getBoundingClientRect();
          const offset = elementRect.top - containerRect.top + scrollableParent.scrollTop;
          console.log('🔗 [Nav] Scrolling container to offset:', offset);
          
          scrollableParent.scrollTo({
            top: offset,
            behavior: 'smooth'
          });
        } else {
          // Fallback to scrollIntoView
          console.log('🔗 [Nav] No scrollable parent, using scrollIntoView');
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (!isPreview) {
        // Only navigate to a different page if NOT in preview mode
        const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
        console.log('🔗 [Nav] Element not found, navigating. isHomePage:', isHomePage);
        
        if (!isHomePage) {
          window.location.href = `/#${linkId}`;
        }
      } else {
        console.log('🔗 [Nav] Element not found and in preview mode');
      }
    }
  };
  
  // Handle navigation to a section within a specific page (for dropdown items)
  const handleSectionNavigation = (pageSlug: string, sectionId: string) => {
    console.log('🔗 [Nav] handleSectionNavigation:', pageSlug, sectionId);
    setIsMenuOpen(false);
    setOpenDropdown(null);
    setExpandedMobileNav(null);
    
    if (typeof window === 'undefined') return;
    
    // Extract the DOM element ID from sectionId
    // sectionId might be "about" or "about_abc123" for custom instances
    // The DOM element will have id matching the base section type
    const baseSectionType = sectionId.split('_')[0];
    // Map section types to actual DOM IDs (hero uses "home" as its ID)
    const domId = baseSectionType === 'hero' ? 'home' : baseSectionType;
    
    // Check if we're already on the target page
    const isOnTargetPage = currentPageSlug === pageSlug || 
      (pageSlug === '' && (!currentPageSlug || currentPageSlug === 'home'));
    
    const scrollToSection = () => {
      const element = document.getElementById(domId);
      console.log('🔗 [Nav] Looking for element:', domId, 'found:', !!element);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    
    if (isOnTargetPage) {
      // Already on the page, just scroll to section
      scrollToSection();
    } else {
      // Navigate to page first, then scroll to section after page renders
      // Set hash to trigger page change
      window.location.hash = pageSlug || '';
      
      // Use requestAnimationFrame + timeout to wait for React to re-render
      // This gives the new page content time to mount
      const attemptScroll = (attempts: number) => {
        const element = document.getElementById(domId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempts < 10) {
          // Retry up to 10 times (1 second total)
          setTimeout(() => attemptScroll(attempts + 1), 100);
        }
      };
      
      // Start checking after first paint
      requestAnimationFrame(() => {
        setTimeout(() => attemptScroll(0), 50);
      });
    }
  };
  
  // Dropdown hover handlers
  const handleDropdownMouseEnter = (linkId: string) => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setOpenDropdown(linkId);
  };
  
  const handleDropdownMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      setOpenDropdown(null);
      hoverTimeoutRef.current = null;
    }, 150);
  };

  // Generate navigation links based on pages (multipage) or sections (single-page)
  const getNavigationLinks = (): NavLink[] => {
    const sectionLabels: Record<SectionKey, string> = {
      hero: t('nav.home', 'Home'),
      about: t('nav.about', 'About'),
      services: t('nav.services', 'Services'),
      benefits: t('nav.benefits', 'Benefits'),
      menu: t('nav.menu', 'Menu'),
      testimonials: t('nav.testimonials', 'Testimonials'),
      upcomingEvents: t('nav.events', 'Events'),
      contact: t('nav.contact', 'Contact'),
      videos: t('nav.videos', 'Videos'),
      payment: t('nav.shop', 'Shop'),
      partners: 'Partners' // Hidden section - only accessible via HiDev logo
    };
    
    // Helper to get section label from sectionId
    const getSectionLabel = (section: PageSection): string => {
      if (section.navLabel) return section.navLabel;
      // Extract base section type from sectionId (e.g., "services_abc123" -> "services")
      const baseSectionType = section.sectionId.split('_')[0] as SectionKey;
      return sectionLabels[baseSectionType] || section.sectionId;
    };

    // Multipage mode: show pages as nav items with sections in dropdown
    if (isMultipage && pages && pages.length > 1) {
      return pages.map(page => {
        // Get enabled sections for this page (excluding hero which is typically not navigable)
        const pageSections = page.sections
          .filter(section => section.enabled !== false && !section.sectionId.startsWith('hero'))
          .map(section => ({
            id: `${page.slug || 'home'}-${section.sectionId}`,
            label: getSectionLabel(section),
            sectionId: section.sectionId
          }));
        
        return {
          id: page.id,
          label: page.name,
          slug: page.slug,
          enabled: true,
          isSection: false,
          isPage: true,
          isActive: currentPageSlug === page.slug || (page.slug === '' && (!currentPageSlug || currentPageSlug === 'home')),
          sections: pageSections.length > 0 ? pageSections : undefined
        };
      });
    }

    // Single-page mode: show sections as nav items
    // Default sections if no layout is provided
    const defaultSections: SectionKey[] = ['hero', 'about', 'services', 'contact'];
    
    let navigationItems;
    if (!Array.isArray(layout?.sections)) {
      navigationItems = defaultSections.map(section => ({
        id: section,
        label: sectionLabels[section],
        slug: undefined as string | undefined,
        enabled: true,
        isSection: true,
        isPage: false,
        isActive: false
      }));
    } else {
      // Filter enabled sections and map to navigation items
      navigationItems = layout.sections
        .map(section => {
          const sectionData = typeof section === 'string' 
            ? { id: section as SectionKey, enabled: true, navLabel: undefined }
            : { id: section.id, enabled: section.enabled !== false, navLabel: section.navLabel };
          
          return {
            id: sectionData.id,
            // Use custom navLabel if provided, otherwise fall back to default label
            label: sectionData.navLabel || sectionLabels[sectionData.id],
            slug: undefined as string | undefined,
            enabled: sectionData.enabled,
            isSection: true,
            isPage: false,
            isActive: false
          };
        })
        .filter(item => item.enabled && item.label && item.id !== 'partners' && item.id !== 'hero'); // Only show sections with labels, exclude partners and home
    }

    return navigationItems;
  };

  const navigationLinks = getNavigationLinks();

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .logo-container {
            height: var(--logo-height-sm) !important;
            width: auto !important;
            max-width: 200px;
            object-fit: contain;
          }
          @media (min-width: 768px) {
            .logo-container {
              height: var(--logo-height-md) !important;
              max-width: 240px;
            }
          }
          @media (min-width: 1024px) {
            .logo-container {
              height: var(--logo-height-lg) !important;
              max-width: 280px;
            }
          }
        `
      }} />
      <header 
        className={`${isPreview ? 'sticky top-0' : 'fixed left-0 right-0'} z-40 backdrop-blur-sm border-b transition-all duration-300 ease-in-out`}
        style={{ 
          height: expandableHeader ? calculateHeaderHeight() : undefined,
          minHeight: expandableHeader ? calculateHeaderHeight() : '4rem',
          backgroundColor: header?.colors?.background || 'rgba(255, 255, 255, 0.95)',
          borderBottomColor: header?.colors?.background || 'rgba(229, 231, 235, 1)',
          '--logo-height-sm': `${logoHeights.sm}rem`,
          '--logo-height-md': `${logoHeights.md}rem`,
          '--logo-height-lg': `${logoHeights.lg}rem`,
          '--text-size-multiplier': textSize.toString()
        } as React.CSSProperties & { [key: string]: string }}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full py-3">
          {/* Logo */}
          <div className="flex items-center">
            <div 
              className={`flex-shrink-0 ${editable && onLogoClick ? 'cursor-pointer group relative' : ''}`}
              onClick={editable && onLogoClick ? onLogoClick : undefined}
              title={editable && onLogoClick ? 'Click to upload logo' : undefined}
            >
              {logoUrl ? (
                <>
                  <IdbImage 
                    src={logoUrl} 
                    alt={businessName} 
                    width={200}
                    height={60}
                    loading="eager"
                    priority
                    className={`logo-container object-contain logo-hover transition-all duration-300 ease-in-out dynamic-logo ${editable && onLogoClick ? 'group-hover:opacity-75' : ''}`}
                  />
                  {editable && onLogoClick && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload Logo
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={`w-auto flex items-center justify-center bg-primary-100 text-primary-600 font-bold px-4 rounded logo-hover transition-all duration-300 ease-in-out dynamic-logo ${editable && onLogoClick ? 'group-hover:opacity-75' : ''}`}>
                  {businessName?.substring(0, 2).toUpperCase() || 'LB'}
                  {editable && onLogoClick && (
                    <span className="ml-2 text-xs">Click to upload</span>
                  )}
                </div>
              )}
            </div>
            <EditableText
              className="ml-3 text-gray-900 font-semibold" 
              style={{ 
                color: header?.colors?.businessNameColor || header?.colors?.brandText,
                fontSize: `${textSize}rem`
              }}
              value={businessName}
              path="businessInfo.businessName"
              editable={editable}
              onEdit={onEdit}
              placeholder="Business Name"
              textSize={textSize}
              onTextSizeChange={onTextSizeChange}
              textSizeLabel="Business Name Size"
              textSizePresets={[0.875, 1.0, 1.125, 1.25]} // Header navigation text presets
              textSizeNormal={1.0} // 16px - standard navigation text size
              textSizeMin={0.75}
              textSizeMax={1.5}
              textColor={header?.colors?.businessNameColor || header?.colors?.brandText}
              onTextColorChange={onBusinessNameColorChange}
              showColorPicker={true}
              presetColors={colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : []}
            />
          </div>

          {/* Desktop Navigation - Right Aligned */}
          <div className="flex items-center gap-2" ref={dropdownRef}>
            <nav className="hidden md:flex space-x-8 mr-4">
              {navigationLinks.map((link) => (
                <div 
                  key={link.id}
                  className="relative"
                  onMouseEnter={() => link.sections && link.sections.length > 0 ? handleDropdownMouseEnter(link.id) : undefined}
                  onMouseLeave={() => link.sections && link.sections.length > 0 ? handleDropdownMouseLeave() : undefined}
                >
                  <button
                    onClick={() => handleNavigation(link.isPage ? link.slug || link.id : link.id, link.isSection, link.isPage)}
                    className={`nav-link font-medium transition-colors flex items-center gap-1 ${link.isActive ? 'border-b-2' : ''}`}
                    style={{ 
                      color: header?.colors?.navText || '#374151',
                      borderColor: link.isActive ? (colorPalette?.primary || header?.colors?.navText || '#374151') : 'transparent'
                    }}
                  >
                    {link.label}
                    {link.sections && link.sections.length > 0 && (
                      <ChevronDownIcon 
                        className={`h-4 w-4 transition-transform duration-200 ${openDropdown === link.id ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </button>
                  
                  {/* Dropdown menu for sections */}
                  {link.sections && link.sections.length > 0 && openDropdown === link.id && (
                    <div 
                      className="absolute top-full left-0 mt-1 min-w-48 py-2 rounded-lg shadow-lg border border-gray-100 z-50 animate-fade-in"
                      style={{ backgroundColor: header?.colors?.background || '#ffffff' }}
                    >
                      {link.sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => handleSectionNavigation(link.slug || '', section.sectionId)}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                          style={{ color: header?.colors?.navText || '#374151' }}
                        >
                          {section.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {payment?.addHeaderCta && !navigationLinks.some(link => link.id === 'payment') && (
                <button
                  onClick={() => handleNavigation('payment', true, false)}
                  className="ml-2 inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-white text-sm font-semibold shadow hover:bg-black transition"
                >
                  {payment.headerCtaLabel || 'Buy Now'}
                </button>
              )}
            </nav>
            
            {/* Language Toggle - Desktop */}
            <div className="hidden md:block">
              <LanguageToggle 
                navTextColor={header?.colors?.navText}
                enableHoverSelection={false}
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:text-primary-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
              style={{ color: header?.colors?.navText || '#374151' }}
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6 transition-transform duration-200" />
              ) : (
                <Bars3Icon className="h-6 w-6 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div 
            className="md:hidden absolute top-full left-0 right-0 border-b border-gray-200 shadow-lg z-50 animate-fade-in"
            style={{ backgroundColor: header?.colors?.background || '#ffffff' }}
          >
            <nav className="px-4 py-4 space-y-2">
              {navigationLinks.map((link) => (
                <div key={link.id}>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleNavigation(link.isPage ? link.slug || link.id : link.id, link.isSection, link.isPage)}
                      className={`mobile-nav-link flex-1 text-left font-medium py-2 ${link.isActive ? 'border-l-4 pl-3' : ''}`}
                      style={{ 
                        color: header?.colors?.navText || '#374151',
                        borderColor: link.isActive ? (colorPalette?.primary || header?.colors?.navText || '#374151') : 'transparent'
                      }}
                    >
                      {link.label}
                    </button>
                    {link.sections && link.sections.length > 0 && (
                      <button
                        onClick={() => setExpandedMobileNav(expandedMobileNav === link.id ? null : link.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={`Expand ${link.label} sections`}
                      >
                        <ChevronDownIcon 
                          className={`h-5 w-5 transition-transform duration-200 ${expandedMobileNav === link.id ? 'rotate-180' : ''}`}
                          style={{ color: header?.colors?.navText || '#374151' }}
                        />
                      </button>
                    )}
                  </div>
                  
                  {/* Expandable sections for mobile */}
                  {link.sections && link.sections.length > 0 && expandedMobileNav === link.id && (
                    <div className="pl-6 py-2 space-y-1 border-l-2 border-gray-200 ml-3 animate-fade-in">
                      {link.sections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => handleSectionNavigation(link.slug || '', section.sectionId)}
                          className="block w-full text-left py-2 text-sm transition-colors hover:opacity-75"
                          style={{ color: header?.colors?.navText || '#6b7280' }}
                        >
                          {section.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {payment?.addHeaderCta && !navigationLinks.some(link => link.id === 'payment') && (
                <button
                  onClick={() => handleNavigation('payment', true, false)}
                  className="mobile-nav-link block w-full text-left font-medium py-2"
                  style={{ 
                    color: header?.colors?.navText || '#374151'
                  }}
                >
                  {payment.headerCtaLabel || 'Buy Now'}
                </button>
              )}
              
              {/* Language Toggle - Mobile */}
              <div className="pt-2 border-t border-gray-200">
                <LanguageToggle 
                  navTextColor={header?.colors?.navText}
                  enableHoverSelection={false}
                />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  );
};

export default Header; 