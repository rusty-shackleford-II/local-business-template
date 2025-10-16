import React, { useState, useEffect } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import EditableText from './EditableText';
import IdbImage from './IdbImage';
import type { Header as HeaderCfg, Payment as PaymentCfg, Layout, SectionKey, ColorPalette } from '../types';

type Props = {
  businessName?: string;
  logoUrl?: string;
  header?: HeaderCfg;
  payment?: PaymentCfg;
  layout?: Layout;
  isPreview?: boolean;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  onTextSizeChange?: (size: number) => void;
  onBusinessNameColorChange?: (color: string) => void;
  colorPalette?: ColorPalette;
};

const Header: React.FC<Props> = ({ businessName = 'Local Business', logoUrl, header, payment, layout, isPreview, editable, onEdit, onTextSizeChange, onBusinessNameColorChange, colorPalette }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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

  const handleNavigation = (linkId: string, isSection: boolean) => {
    setIsMenuOpen(false);
    
    // Handle section navigation
    if (isSection) {
      // Only run client-side
      if (typeof window === 'undefined') return;
      
      // Check if we're on the home page
      const isHomePage = window.location.pathname === '/';
      
      if (!isHomePage) {
        // If not on home page, navigate to home page with hash
        window.location.href = `/#${linkId}`;
        return;
      }
      
      // If on home page, scroll to section
      const element = document.getElementById(linkId);
      if (element) {
        // Calculate header height offset using the dynamic header height
        const dynamicHeaderHeight = document.documentElement.style.getPropertyValue('--dynamic-header-height');
        let headerOffset = 80; // Default fallback
        
        if (dynamicHeaderHeight) {
          // Convert rem to pixels (assuming 1rem = 16px)
          const remValue = parseFloat(dynamicHeaderHeight.replace('rem', ''));
          headerOffset = remValue * 16;
        } else {
          // Fallback to responsive values if dynamic height not set
          const isMobile = window.innerWidth < 768;
          headerOffset = isMobile ? 80 : 96;
        }
        
        const elementPosition = element.offsetTop - headerOffset;
        
        window.scrollTo({
          top: elementPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  // Generate navigation links based on enabled sections
  const getNavigationLinks = () => {
    const sectionLabels: Record<SectionKey, string> = {
      hero: 'Home',
      about: 'About',
      services: 'Services',
      menu: 'Menu',
      testimonials: 'Testimonials',
      upcomingEvents: 'Events',
      contact: 'Contact',
      videos: 'Videos',
      payment: 'Shop',
      partners: 'Partners' // Hidden section - only accessible via HiDev logo
    };

    // Default sections if no layout is provided
    const defaultSections: SectionKey[] = ['hero', 'about', 'services', 'contact'];
    
    let navigationItems;
    if (!layout?.sections) {
      navigationItems = defaultSections.map(section => ({
        id: section,
        label: sectionLabels[section],
        enabled: true,
        isSection: true
      }));
    } else {
      // Filter enabled sections and map to navigation items
      navigationItems = layout.sections
        .map(section => {
          const sectionData = typeof section === 'string' 
            ? { id: section as SectionKey, enabled: true }
            : { id: section.id, enabled: section.enabled !== false };
          
          return {
            id: sectionData.id,
            label: sectionLabels[sectionData.id],
            enabled: sectionData.enabled,
            isSection: true
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
        className={`${isPreview ? 'sticky top-0' : 'fixed left-0 right-0'} z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all duration-300 ease-in-out`}
        style={{ 
          height: expandableHeader ? calculateHeaderHeight() : undefined,
          minHeight: expandableHeader ? calculateHeaderHeight() : '4rem',
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
            <div className="flex-shrink-0">
              {logoUrl ? (
                <IdbImage 
                  src={logoUrl} 
                  alt={businessName} 
                  width={200}
                  height={60}
                  className="logo-container object-contain logo-hover transition-all duration-300 ease-in-out dynamic-logo" 
                />
              ) : (
                <div className="w-auto flex items-center justify-center bg-primary-100 text-primary-600 font-bold px-4 rounded logo-hover transition-all duration-300 ease-in-out dynamic-logo">
                  {businessName?.substring(0, 2).toUpperCase() || 'LB'}
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
          <div className="flex items-center">
            <nav className="hidden md:flex space-x-8 mr-4">
              {navigationLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavigation(link.id, link.isSection)}
                  className="nav-link font-medium"
                  style={{ 
                    color: header?.colors?.navText || '#374151'
                  }}
                >
                  {link.label}
                </button>
              ))}
              {payment?.addHeaderCta && !navigationLinks.some(link => link.id === 'payment') && (
                <button
                  onClick={() => handleNavigation('payment', true)}
                  className="ml-2 inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-white text-sm font-semibold shadow hover:bg-black transition"
                >
                  {payment.headerCtaLabel || 'Buy Now'}
                </button>
              )}
            </nav>

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
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 animate-fade-in">
            <nav className="px-4 py-4 space-y-4">
              {navigationLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavigation(link.id, link.isSection)}
                  className="mobile-nav-link block w-full text-left font-medium py-2"
                  style={{ 
                    color: header?.colors?.navText || '#374151'
                  }}
                >
                  {link.label}
                </button>
              ))}
              {payment?.addHeaderCta && !navigationLinks.some(link => link.id === 'payment') && (
                <button
                  onClick={() => handleNavigation('payment', true)}
                  className="mobile-nav-link block w-full text-left font-medium py-2"
                  style={{ 
                    color: header?.colors?.navText || '#374151'
                  }}
                >
                  {payment.headerCtaLabel || 'Buy Now'}
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  );
};

export default Header; 