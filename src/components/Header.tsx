import React, { useState, useEffect, useRef } from 'react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import EditableText from './EditableText';
import IdbImage from './IdbImage';
import LanguageToggle from './LanguageToggle';
import BrandingPopup from './BrandingPopup';
import HeaderStylePopup from './HeaderStylePopup';
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
  onShowLogoChange?: (show: boolean) => void;
  onShowBusinessNameChange?: (show: boolean) => void;
  onLogoSizeChange?: (size: number) => void;
  // Header style callbacks
  onHeaderColorChange?: (color: string) => void;
  onNavLinkSizeChange?: (size: number) => void;
  onNavLinkColorChange?: (color: string) => void;
  colorPalette?: ColorPalette;
  /** Storage adapter for built-in image cropper */
  imageStorage?: {
    saveBlob: (key: string, blob: Blob, filename: string) => Promise<void>;
    generateImageKey: (prefix?: string) => string;
  };
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

const Header: React.FC<Props> = ({ businessName = 'Local Business', logoUrl, header, payment, layout, pages, currentPageSlug, isMultipage, isPreview, editable, onEdit, onTextSizeChange, onBusinessNameColorChange, onLogoClick, onShowLogoChange, onShowBusinessNameChange, onLogoSizeChange, onHeaderColorChange, onNavLinkSizeChange, onNavLinkColorChange, colorPalette, imageStorage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileNav, setExpandedMobileNav] = useState<string | null>(null);
  const [brandingPopupOpen, setBrandingPopupOpen] = useState(false);
  const [headerStylePopupOpen, setHeaderStylePopupOpen] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const brandingAreaRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const i18n = useI18nContext();
  const t = i18n?.t || ((key: string, defaultValue?: string) => defaultValue || key);
  
  // Backwards-compatible toggles: default to true when undefined
  // Handle both boolean and string values (editor stores as strings)
  const showLogo = header?.showLogo !== false && header?.showLogo !== 'false';
  const showBusinessName = header?.showBusinessName !== false && header?.showBusinessName !== 'false';
  
  // Backwards-compatible business name text: use header.brandText if defined, otherwise fall back to businessName prop
  const displayBusinessName = header?.brandText !== undefined ? header.brandText : businessName;
  
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
  const navLinkSize = header?.navLinkSize || 1.0;
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
  const calculateHeaderHeight = React.useCallback(() => {
    if (!expandableHeader) return 'auto';
    const maxLogoHeight = Math.max(logoHeights.sm, logoHeights.md, logoHeights.lg);
    const padding = 1.5; // py-3 = 0.75rem top + 0.75rem bottom = 1.5rem total
    return `${maxLogoHeight + padding}rem`;
  }, [expandableHeader, logoHeights.sm, logoHeights.md, logoHeights.lg]);

  // Set CSS custom property for body padding to match header height
  React.useEffect(() => {
    if (expandableHeader) {
      const headerHeight = calculateHeaderHeight();
      document.documentElement.style.setProperty('--dynamic-header-height', headerHeight);
    } else {
      // Use default header heights for non-expandable headers
      document.documentElement.style.setProperty('--dynamic-header-height', '5rem'); // Default fallback
    }
  }, [logoSize, expandableHeader, calculateHeaderHeight]);

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
      
      // Get header offset from CSS variable or fallback
      const getHeaderOffset = (): number => {
        const dynamicHeaderHeight = document.documentElement.style.getPropertyValue('--dynamic-header-height');
        if (dynamicHeaderHeight) {
          const remValue = parseFloat(dynamicHeaderHeight.replace('rem', ''));
          return remValue * 16; // Convert rem to px
        }
        // Fallback to responsive values
        return window.innerWidth < 768 ? 80 : 96;
      };
      
      if (element) {
        if (isPreview) {
          // Preview mode: find scrollable ancestor (content is in a scrollable div)
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
            const headerOffset = getHeaderOffset();
            const offset = elementRect.top - containerRect.top + scrollableParent.scrollTop - headerOffset;
            console.log('🔗 [Nav] Scrolling container to offset:', offset, 'headerOffset:', headerOffset);
            
            scrollableParent.scrollTo({
              top: offset,
              behavior: 'smooth'
            });
          } else {
            // Fallback to scrollIntoView
            console.log('🔗 [Nav] No scrollable parent, using scrollIntoView');
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          // Production mode: use window scrolling with proper offset calculation
          const headerOffset = getHeaderOffset();
          const elementPosition = element.offsetTop - headerOffset;
          console.log('🔗 [Nav] Production scroll to:', elementPosition, 'headerOffset:', headerOffset);
          
          window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          });
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
    
    // Determine the DOM element ID
    // For custom instances (e.g., "about_abc123"), use the full sectionId
    // For base sections, use the sectionId directly (hero->home mapping handled by component defaults)
    const domId = sectionId;
    
    // Check if we're already on the target page
    const isOnTargetPage = currentPageSlug === pageSlug || 
      (pageSlug === '' && (!currentPageSlug || currentPageSlug === 'home'));
    
    // Get header offset from CSS variable or fallback
    const getHeaderOffset = (): number => {
      const dynamicHeaderHeight = document.documentElement.style.getPropertyValue('--dynamic-header-height');
      if (dynamicHeaderHeight) {
        const remValue = parseFloat(dynamicHeaderHeight.replace('rem', ''));
        return remValue * 16; // Convert rem to px
      }
      return window.innerWidth < 768 ? 80 : 96;
    };
    
    const scrollToSection = () => {
      const element = document.getElementById(domId);
      console.log('🔗 [Nav] Looking for element:', domId, 'found:', !!element);
      if (element) {
        if (isPreview) {
          // Preview mode: find scrollable ancestor
          let scrollableParent: HTMLElement | null = element.parentElement;
          while (scrollableParent) {
            const style = window.getComputedStyle(scrollableParent);
            const overflowY = style.overflowY;
            const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && 
                                 scrollableParent.scrollHeight > scrollableParent.clientHeight;
            if (isScrollable) break;
            scrollableParent = scrollableParent.parentElement;
          }
          
          if (scrollableParent) {
            const elementRect = element.getBoundingClientRect();
            const containerRect = scrollableParent.getBoundingClientRect();
            const headerOffset = getHeaderOffset();
            const offset = elementRect.top - containerRect.top + scrollableParent.scrollTop - headerOffset;
            scrollableParent.scrollTo({ top: offset, behavior: 'smooth' });
          } else {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          // Production mode: use window scrolling
          const headerOffset = getHeaderOffset();
          const elementPosition = element.offsetTop - headerOffset;
          window.scrollTo({ top: elementPosition, behavior: 'smooth' });
        }
      }
    };
    
    if (isOnTargetPage) {
      // Already on the page, just scroll to section
      scrollToSection();
    } else {
      // Navigate to page first, then scroll to section after page renders
      window.location.hash = pageSlug || '';
      
      // Wait for page to render, then scroll
      const attemptScroll = (attempts: number) => {
        const element = document.getElementById(domId);
        if (element) {
          if (isPreview) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            const headerOffset = getHeaderOffset();
            const elementPosition = element.offsetTop - headerOffset;
            window.scrollTo({ top: elementPosition, behavior: 'smooth' });
          }
        } else if (attempts < 10) {
          setTimeout(() => attemptScroll(attempts + 1), 100);
        }
      };
      
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
        ref={headerRef}
        className={`${isPreview ? 'sticky top-0' : 'fixed left-0 right-0'} z-40 backdrop-blur-sm border-b transition-all duration-300 ease-in-out ${editable ? 'cursor-pointer hover:ring-2 hover:ring-inset hover:ring-blue-400/40' : ''}`}
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
        onClick={(e) => {
          // Only open header style popup if editable and clicking outside branding area
          if (editable && !brandingAreaRef.current?.contains(e.target as Node)) {
            setHeaderStylePopupOpen(true);
          }
        }}
        title={editable ? 'Click to edit header style' : undefined}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full py-3">
          {/* Logo and Business Name - clickable area for branding popup in edit mode */}
          <div 
            ref={brandingAreaRef}
            className={`flex items-center ${editable ? 'cursor-pointer hover:outline hover:outline-1 hover:outline-dashed hover:outline-blue-400/60 rounded-lg p-1 -m-1' : ''}`}
            onClick={(e) => {
              if (editable) {
                e.stopPropagation();
                setBrandingPopupOpen(true);
              } else if (!editable) {
                // Non-edit mode: scroll to top/hero
                e.preventDefault();
                if (typeof window !== 'undefined') {
                  if (isPreview) {
                    // Preview mode: find scrollable ancestor
                    const headerEl = e.currentTarget.closest('header');
                    if (headerEl) {
                      let scrollableParent: HTMLElement | null = headerEl.nextElementSibling as HTMLElement;
                      while (scrollableParent) {
                        const style = window.getComputedStyle(scrollableParent);
                        const overflowY = style.overflowY;
                        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && 
                                             scrollableParent.scrollHeight > scrollableParent.clientHeight;
                        if (isScrollable) {
                          scrollableParent.scrollTo({ top: 0, behavior: 'smooth' });
                          return;
                        }
                        scrollableParent = scrollableParent.parentElement;
                      }
                    }
                    // Fallback to window scroll
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    // Production mode: scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }
              }
            }}
            title={editable ? 'Click to edit branding' : 'Go to top'}
          >
            {/* Logo - toggleable, defaults to showing */}
            {showLogo && (
              <div className="flex-shrink-0">
                {logoUrl ? (
                  <IdbImage 
                    src={logoUrl} 
                    alt={displayBusinessName} 
                    width={200}
                    height={60}
                    loading="eager"
                    priority
                    className="logo-container object-contain logo-hover transition-all duration-300 ease-in-out dynamic-logo"
                  />
                ) : (
                  <div className="w-auto flex items-center justify-center bg-primary-100 text-primary-600 font-bold px-4 rounded logo-hover transition-all duration-300 ease-in-out dynamic-logo">
                    {displayBusinessName?.substring(0, 2).toUpperCase() || 'LB'}
                  </div>
                )}
              </div>
            )}
            {/* Business Name - toggleable, defaults to showing */}
            {showBusinessName && (
              <span
                className={`${showLogo ? 'ml-4' : ''} text-gray-900 font-semibold`} 
                style={{ 
                  color: header?.colors?.businessNameColor || header?.colors?.brandText,
                  fontSize: `${textSize}rem`
                }}
              >
                {displayBusinessName || 'Logo Text'}
              </span>
            )}
            {/* Show placeholder when both are hidden */}
            {!showLogo && !showBusinessName && editable && (
              <span className="text-gray-400 text-sm italic">Click to add branding</span>
            )}
          </div>

          {/* Desktop Navigation - Right Aligned */}
          <div className="flex items-center gap-4" ref={dropdownRef}>
            <nav className="hidden md:flex space-x-6 lg:space-x-8 mr-2 lg:mr-4">
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
                      borderColor: link.isActive ? (colorPalette?.primary || header?.colors?.navText || '#374151') : 'transparent',
                      fontSize: `${navLinkSize}rem`
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
                          type="button"
                          key={section.id}
                          onClick={() => handleSectionNavigation(link.slug || '', section.sectionId)}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                          style={{ 
                            color: header?.colors?.navText || '#374151',
                            fontSize: `${navLinkSize * 0.875}rem`
                          }}
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
                        borderColor: link.isActive ? (colorPalette?.primary || header?.colors?.navText || '#374151') : 'transparent',
                        fontSize: `${navLinkSize}rem`
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
                          type="button"
                          key={section.id}
                          onClick={() => handleSectionNavigation(link.slug || '', section.sectionId)}
                          className="block w-full text-left py-2 transition-colors hover:opacity-75"
                          style={{ 
                            color: header?.colors?.navText || '#6b7280',
                            fontSize: `${navLinkSize * 0.875}rem`
                          }}
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
                    color: header?.colors?.navText || '#374151',
                    fontSize: `${navLinkSize}rem`
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
      
      {/* Branding Popup for editing logo/business name visibility and text */}
      {editable && (
        <BrandingPopup
          isOpen={brandingPopupOpen}
          onClose={() => setBrandingPopupOpen(false)}
          targetElement={brandingAreaRef.current}
          location="header"
          showLogo={showLogo}
          onShowLogoChange={(show) => {
            if (onShowLogoChange) {
              onShowLogoChange(show);
            } else if (onEdit) {
              onEdit('header.showLogo', show.toString());
            }
          }}
          onLogoUpload={onLogoClick}
          logoUrl={logoUrl}
          storage={imageStorage}
          onLogoChange={(logoKey) => {
            if (onEdit) {
              onEdit('logoUrl', logoKey);
            }
          }}
          showBusinessName={showBusinessName}
          onShowBusinessNameChange={(show) => {
            if (onShowBusinessNameChange) {
              onShowBusinessNameChange(show);
            } else if (onEdit) {
              onEdit('header.showBusinessName', show.toString());
            }
          }}
          brandText={displayBusinessName || ''}
          onBrandTextChange={(text) => {
            if (onEdit) {
              onEdit('header.brandText', text);
            }
          }}
          textSize={textSize}
          onTextSizeChange={onTextSizeChange}
          textColor={header?.colors?.businessNameColor || header?.colors?.brandText}
          onTextColorChange={onBusinessNameColorChange}
          logoSize={logoSize}
          onLogoSizeChange={onLogoSizeChange ? onLogoSizeChange : (size) => {
            if (onEdit) {
              onEdit('header.logoSize', size.toString());
            }
          }}
          presetColors={colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : []}
        />
      )}
      
      {/* Header Style Popup for editing header background, nav link size and color */}
      {editable && (
        <HeaderStylePopup
          isOpen={headerStylePopupOpen}
          onClose={() => setHeaderStylePopupOpen(false)}
          targetElement={headerRef.current}
          headerColor={header?.colors?.background || 'rgba(255, 255, 255, 0.95)'}
          onHeaderColorChange={onHeaderColorChange ? onHeaderColorChange : (color) => {
            if (onEdit) {
              onEdit('header.colors.background', color);
            }
          }}
          navLinkSize={navLinkSize}
          onNavLinkSizeChange={onNavLinkSizeChange ? onNavLinkSizeChange : (size) => {
            if (onEdit) {
              onEdit('header.navLinkSize', size.toString());
            }
          }}
          navLinkColor={header?.colors?.navText || '#374151'}
          onNavLinkColorChange={onNavLinkColorChange ? onNavLinkColorChange : (color) => {
            if (onEdit) {
              onEdit('header.colors.navText', color);
            }
          }}
          presetColors={colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : []}
        />
      )}
    </header>
    </>
  );
};

export default Header; 