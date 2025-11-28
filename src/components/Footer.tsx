import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import EditableText from './EditableText';
import IdbImage from './IdbImage';
import LegalTextModal from './LegalTextModal';
import { useI18nContext } from './I18nProvider';
import type { Footer as FooterCfg, Layout, SectionKey, Page } from '../types';

// Use public folder assets instead of src/assets to avoid build issues
const logo = '/logo.png';
const hidevLogo = '/hidev_logo.png';

type Props = { 
  businessName?: string; 
  logoUrl?: string; 
  footer?: FooterCfg; 
  layout?: Layout;
  // Multipage support
  pages?: Page[];
  currentPageSlug?: string;
  isMultipage?: boolean;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  isPreview?: boolean;
};

const Footer: React.FC<Props> = ({ businessName = 'Local Business', logoUrl, footer, layout, pages, currentPageSlug, isMultipage, editable, onEdit, isPreview }) => {
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const i18n = useI18nContext();
  const t = i18n?.t || ((key: string, defaultValue?: string) => defaultValue || key);
  
  // Debug: log what translations the footer is getting
  console.log(`🦶 [Footer] RENDER - i18n enabled:`, i18n?.enabled, `language:`, i18n?.currentLanguage);
  console.log(`🦶 [Footer] businessName:`, businessName);
  console.log(`🦶 [Footer] Actual t() results in render:`, {
    privacyPolicy: t('footer.privacyPolicy', 'Privacy Policy'),
    termsAndConditions: t('footer.termsAndConditions', 'Terms and Conditions'),
    allRightsReserved: t('footer.allRightsReserved', 'All rights reserved')
  });
  
  // Force variables to check they're being used
  const privacyText = t('footer.privacyPolicy', 'Privacy Policy');
  const termsText = t('footer.termsAndConditions', 'Terms and Conditions');
  const rightsText = t('footer.allRightsReserved', 'All rights reserved');
  console.log(`🦶 [Footer] Variables:`, { privacyText, termsText, rightsText });
  
  // Convert string booleans to actual booleans (editor stores everything as strings)
  const showPrivacyPolicy = footer?.showPrivacyPolicy === true || footer?.showPrivacyPolicy === 'true';
  const showTermsAndConditions = footer?.showTermsAndConditions === true || footer?.showTermsAndConditions === 'true';
  
  // Calculate logo size
  const logoSize = footer?.logoSize || 1.0;
  
  // Base logo heights for different screen sizes (in rem)
  const baseLogoHeights = {
    sm: 3,    // h-12 = 3rem (mobile)
    md: 3,    // h-12 = 3rem (desktop)
    lg: 3     // h-12 = 3rem (large desktop)
  };
  
  // Calculate actual logo heights with size multiplier
  const logoHeights = {
    sm: baseLogoHeights.sm * logoSize,
    md: baseLogoHeights.md * logoSize,
    lg: baseLogoHeights.lg * logoSize
  };

  // Handle navigation - supports both section scrolling and page switching
  const handleNavigation = (id: string, isPage: boolean = false, slug?: string) => {
    // Only run client-side
    if (typeof window === 'undefined') return;
    
    // Handle page navigation (multipage mode)
    if (isPage) {
      const targetSlug = slug || id;
      
      // Update hash to trigger page change
      if (targetSlug === '' || targetSlug === 'home') {
        window.location.hash = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.location.hash = targetSlug;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    
    // Handle section navigation (scroll)
    const element = document.getElementById(id);
    
    if (element) {
      // Find scrollable ancestor (for preview mode where content is in a scrollable div)
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
        // Calculate position relative to the scrollable container
        const elementRect = element.getBoundingClientRect();
        const containerRect = scrollableParent.getBoundingClientRect();
        const offset = elementRect.top - containerRect.top + scrollableParent.scrollTop;
        
        scrollableParent.scrollTo({
          top: offset,
          behavior: 'smooth'
        });
      } else {
        // Fallback to scrollIntoView
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (!isPreview) {
      // Only navigate to a different page if NOT in preview mode
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
      
      if (!isHomePage) {
        window.location.href = `/#${id}`;
      }
    }
  };

  // Generate footer links based on pages (multipage) or sections (single-page)
  const getFooterLinks = () => {
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

    // Multipage mode: show pages as nav items
    if (isMultipage && pages && pages.length > 1) {
      return pages.map(page => ({
        key: page.name,
        id: page.id,
        slug: page.slug,
        isPage: true,
        isActive: currentPageSlug === page.slug || (page.slug === '' && (!currentPageSlug || currentPageSlug === 'home'))
      }));
    }

    // Single-page mode: show sections as nav items
    // Default sections if no layout is provided
    const defaultSections: SectionKey[] = ['hero', 'about', 'services', 'contact'];
    
    if (!Array.isArray(layout?.sections)) {
      return defaultSections.map(section => ({
        key: sectionLabels[section],
        id: section,
        slug: undefined as string | undefined,
        isPage: false,
        isActive: false
      }));
    }

    // Filter enabled sections and map to footer items
    return layout.sections
      .map(section => {
        const sectionData = typeof section === 'string' 
          ? { id: section as SectionKey, enabled: true, navLabel: undefined }
          : { id: section.id, enabled: section.enabled !== false, navLabel: section.navLabel };
        
        return {
          // Use custom navLabel if provided, otherwise fall back to default label
          key: sectionData.navLabel || sectionLabels[sectionData.id],
          id: sectionData.id,
          slug: undefined as string | undefined,
          enabled: sectionData.enabled,
          isPage: false,
          isActive: false
        };
      })
      .filter(item => item.enabled && item.key && item.id !== 'partners' && item.id !== 'hero'); // Only show sections with labels, exclude partners and home
  };

  const footerLinks = getFooterLinks();

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .footer-logo-container {
            height: var(--logo-height-sm) !important;
            width: auto !important;
            max-width: 200px;
            object-fit: contain;
          }
          @media (min-width: 768px) {
            .footer-logo-container {
              height: var(--logo-height-md) !important;
              max-width: 240px;
            }
          }
          @media (min-width: 1024px) {
            .footer-logo-container {
              height: var(--logo-height-lg) !important;
              max-width: 280px;
            }
          }
          /* HiDev logo fixed sizing - not affected by business logo scaling */
          .hidev-logo-fixed {
            height: 2.5rem !important;
            width: auto !important;
            max-width: 100px !important;
          }
        `
      }} />
      <footer 
        className="border-t border-gray-200"
        style={{ 
          backgroundColor: footer?.colors?.background || '#ffffff',
          '--logo-height-sm': `${logoHeights.sm}rem`,
          '--logo-height-md': `${logoHeights.md}rem`,
          '--logo-height-lg': `${logoHeights.lg}rem`
        } as React.CSSProperties & { [key: string]: string }}
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Logo and Business Name Left */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {logoUrl ? (
                <IdbImage 
                  src={logoUrl} 
                  alt={`${businessName} Logo`} 
                  width={200}
                  height={60}
                  loading="lazy"
                  className="footer-logo-container object-contain logo-hover transition-all duration-300 ease-in-out dynamic-logo" 
                />
              ) : (
                <Image
                  src={logo}
                  alt={`${businessName} Logo`}
                  height={48}
                  width={120}
                  className="w-auto logo-hover transition-all duration-300 ease-in-out dynamic-logo"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            <EditableText
              className="ml-3 text-gray-900 font-semibold" 
              value={businessName}
              path="businessInfo.businessName"
              editable={editable}
              onEdit={onEdit}
              placeholder="Business Name"
              textSize={footer?.textSize || 1.0}
              onTextSizeChange={onEdit ? (size: number) => onEdit('footer.textSize', size.toString()) : undefined}
              textSizeLabel="Footer Business Name Size"
              textSizePresets={[0.875, 1.0, 1.125, 1.25]} // Footer text presets
              textSizeNormal={1.0} // 16px - standard text size
              textSizeMin={0.75}
              textSizeMax={1.5}
            />
          </div>

          {/* Links Center */}
          <nav className="flex space-x-8">
            {footerLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigation(link.id, link.isPage, link.slug)}
                className={`footer-link text-gray-600 font-medium ${link.isActive ? 'underline' : ''}`}
              >
                {link.key}
              </button>
            ))}
          </nav>

          {/* Hi Dev Logo Right */}
          <div className="flex-shrink-0">
            <Link
              href="/partners/"
              className="block logo-hover"
            >
              <Image
                src={hidevLogo}
                alt="Hi Dev Mobile"
                height={40}
                width={100}
                className="hidev-logo-fixed logo-hover transition-all duration-300 ease-in-out"
              />
            </Link>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-6">
          {/* Logo and Business Name Top */}
          <div className="flex flex-col items-center space-y-2">
            <div>
              {logoUrl ? (
                <IdbImage 
                  src={logoUrl} 
                  alt={`${businessName} Logo`} 
                  width={200}
                  height={60}
                  loading="lazy"
                  className="footer-logo-container object-contain logo-hover transition-all duration-300 ease-in-out dynamic-logo" 
                />
              ) : (
                <Image
                  src={logo}
                  alt={`${businessName} Logo`}
                  height={48}
                  width={120}
                  className="w-auto logo-hover transition-all duration-300 ease-in-out dynamic-logo"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            <EditableText
              className="text-gray-900 font-semibold text-center mobile-left" 
              value={businessName}
              path="businessInfo.businessName"
              editable={editable}
              onEdit={onEdit}
              placeholder="Business Name"
              textSize={footer?.textSize || 1.0}
              onTextSizeChange={onEdit ? (size: number) => onEdit('footer.textSize', size.toString()) : undefined}
              textSizeLabel="Footer Business Name Size"
              textSizePresets={[0.875, 1.0, 1.125, 1.25]} // Footer text presets
              textSizeNormal={1.0} // 16px - standard text size
              textSizeMin={0.75}
              textSizeMax={1.5}
            />
          </div>

          {/* Links Center - Conditional Layout */}
          <nav className={`text-center mobile-left ${
            footerLinks.length <= 3 
              ? 'flex flex-wrap justify-center gap-x-6 gap-y-3' 
              : 'grid grid-cols-2 gap-x-6 gap-y-3'
          }`}>
            {footerLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigation(link.id, link.isPage, link.slug)}
                className={`footer-link text-gray-600 font-medium ${link.isActive ? 'underline' : ''}`}
              >
                {link.key}
              </button>
            ))}
          </nav>

          {/* Hi Dev Logo Bottom */}
          <div className="flex justify-center pt-2">
            <Link
              href="/partners/"
              className="block logo-hover"
            >
              <Image
                src={hidevLogo}
                alt="Hi Dev Mobile"
                height={40}
                width={100}
                className="hidev-logo-fixed logo-hover transition-all duration-300 ease-in-out"
              />
            </Link>
          </div>
        </div>

        {/* Copyright and Legal Links */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex flex-col items-center space-y-3">
            {/* Legal Links */}
            {(showPrivacyPolicy || showTermsAndConditions) && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                {showPrivacyPolicy && (
                  <button
                    onClick={() => setPrivacyModalOpen(true)}
                    className="text-gray-600 hover:text-gray-900 underline transition-colors"
                  >
                    {privacyText}
                  </button>
                )}
                {showPrivacyPolicy && showTermsAndConditions && (
                  <span className="text-gray-400">|</span>
                )}
                {showTermsAndConditions && (
                  <button
                    onClick={() => setTermsModalOpen(true)}
                    className="text-gray-600 hover:text-gray-900 underline transition-colors"
                  >
                    {termsText}
                  </button>
                )}
              </div>
            )}

            {/* Copyright */}
            <div className="text-center text-sm text-gray-500">
              {'\u00A9'} {new Date().getFullYear()} <EditableText
                value={businessName || 'Local Business'}
                path="businessInfo.businessName"
                editable={editable}
                onEdit={onEdit}
                placeholder="Business Name"
                textSize={footer?.copyrightTextSize || 0.875} // Default to sister site small text size
                textSizePresets={[0.75, 0.875, 1.0, 1.125]} // Small text presets
                textSizeNormal={0.875} // 14px - sister site small text size
                textSizeMin={0.625}
                textSizeMax={1.5}
                onTextSizeChange={onEdit ? (size: number) => onEdit('footer.copyrightTextSize', size.toString()) : undefined}
                textSizeLabel="Copyright Text Size"
              />. {rightsText}.
            </div>
          </div>
        </div>
      </div>

      {/* Legal Text Modals */}
      <LegalTextModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title={privacyText}
        content={footer?.privacyPolicyText || ''}
        editable={editable}
        onEdit={onEdit ? (value: string) => onEdit('footer.privacyPolicyText', value) : undefined}
      />
      <LegalTextModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title={termsText}
        content={footer?.termsAndConditionsText || ''}
        editable={editable}
        onEdit={onEdit ? (value: string) => onEdit('footer.termsAndConditionsText', value) : undefined}
      />
    </footer>
    </>
  );
};

export default Footer; 