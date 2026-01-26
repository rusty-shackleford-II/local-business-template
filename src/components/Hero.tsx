import React, { useMemo, useState, useEffect, useRef, useCallback, type MouseEvent as ReactMouseEvent } from 'react';
import { ArrowRightIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Head from 'next/head';
import { stripPhoneNumber } from '../lib/phoneUtils';
import EditableText from './EditableText';
import IdbImage from './IdbImage';
import ButtonGridEditor, { getEffectiveGridLayout, legacyToGridLayout } from './ButtonGridEditor';
import HeroImageEditor from './HeroImageEditor';
import TextSizePopup from './TextSizePopup';
import { createPortal } from 'react-dom';
import { 
  FaInstagram, 
  FaFacebookF, 
  FaLinkedinIn, 
  FaTiktok,
  FaYelp,
  FaGoogle,
  FaExternalLinkAlt,
  FaYoutube
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import type { Hero as HeroCfg, Payment as PaymentCfg, ColorPalette, HeroCtaButton, SocialLinksConfig, ButtonGridLayout, SocialMedia } from '../types';
import SocialLinksEditorPopup from './SocialLinksEditorPopup';

// Video utility functions (copied from Videos component)
function extractIframeSrc(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('<iframe') && trimmed.includes('src=')) {
    const match = trimmed.match(/src="([^"]+)"/);
    return match ? match[1] : trimmed;
  }
  return trimmed;
}

function extractIframeDimensions(input: string): { width: number; height: number } | null {
  const trimmed = input.trim();
  if (trimmed.startsWith('<iframe')) {
    const widthMatch = trimmed.match(/width="(\d+)"/);
    const heightMatch = trimmed.match(/height="(\d+)"/);
    if (widthMatch && heightMatch) {
      return {
        width: parseInt(widthMatch[1]),
        height: parseInt(heightMatch[1])
      };
    }
  }
  return null;
}

function toYouTubeEmbed(urlOrId: string, opts: { autoplay?: boolean; controls?: boolean; loop?: boolean; muted?: boolean }): string {
  let id = urlOrId;
  try {
    const u = new URL(urlOrId);
    if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v') || id;
    if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/').pop() || id;
  } catch {}
  const params = new URLSearchParams();
  if (opts.autoplay) params.set('autoplay', '1');
  if (opts.controls === false) params.set('controls', '0');
  if (opts.muted) params.set('mute', '1');
  if (opts.loop) {
    params.set('loop', '1');
    params.set('playlist', id);
  }
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

function toVimeoEmbed(urlOrId: string, opts: { autoplay?: boolean; controls?: boolean; loop?: boolean; muted?: boolean }): string {
  let id = urlOrId;
  let hash = '';
  
  try {
    const u = new URL(urlOrId);
    const path = u.pathname.replace(/\/+$/, '');
    // Extract video ID from path like /video/1118851183
    const pathParts = path.split('/');
    id = pathParts[pathParts.length - 1] || id;
    // Extract hash parameter if present (e.g., ?h=f169590806)
    hash = u.searchParams.get('h') || '';
  } catch {
    // If URL parsing fails, try to extract ID from string
    const match = urlOrId.match(/\/video\/(\d+)/);
    if (match) {
      id = match[1];
    }
    // Try to extract hash from string
    const hashMatch = urlOrId.match(/[?&]h=([^&]+)/);
    if (hashMatch) {
      hash = hashMatch[1];
    }
  }
  
  const params = new URLSearchParams();
  
  // Add hash if present (required for private videos)
  if (hash) params.set('h', hash);
  
  // Vimeo-specific parameters - be explicit about values
  if (opts.autoplay) {
    params.set('autoplay', '1');
  }
  if (opts.loop) {
    params.set('loop', '1');
  }
  if (opts.muted) {
    params.set('muted', '1');
  }
  if (opts.controls === false) {
    params.set('controls', '0');
  }
  
  // Additional Vimeo parameters for better control
  params.set('background', (opts.autoplay && opts.muted && !opts.controls) ? '1' : '0');
  params.set('byline', '0'); // Hide video byline
  params.set('portrait', '0'); // Hide author portrait
  params.set('title', '0'); // Hide video title
  
  const finalUrl = `https://player.vimeo.com/video/${id}?${params.toString()}`;
  return finalUrl;
}

type Props = { 
  hero?: HeroCfg; 
  payment?: PaymentCfg; 
  isPreview?: boolean; 
  backgroundClass?: string;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
  onHeroImageClick?: () => void;
  onHeroImageAddClick?: () => void; // For adding images to the slideshow array (with cropper)
  /** Storage adapter for built-in image cropper with bulk support */
  imageStorage?: {
    saveBlob: (key: string, blob: Blob, filename: string) => Promise<void>;
    generateImageKey: (prefix?: string) => string;
  };
  colorPalette?: ColorPalette;
  sectionId?: string;
  socialLinks?: SocialLinksConfig;
};

// Helper function to check if there are any social links (handles both string values and customLinks array)
const hasSocialLinks = (links?: SocialLinksConfig['links']): boolean => {
  if (!links) return false;
  const hasStandardLinks = Object.entries(links).some(([key, value]) => 
    key !== 'customLinks' && typeof value === 'string' && value.trim()
  );
  const hasCustomLinks = links.customLinks?.some(link => link.url?.trim());
  return hasStandardLinks || !!hasCustomLinks;
};

// Social Links Row component for Hero section
const HeroSocialLinks: React.FC<{ 
  socialLinks?: SocialLinksConfig; 
  align?: 'left' | 'center' | 'right';
  isFullwidthOverlay?: boolean;
  compact?: boolean; // Smaller icons for standard layout
  className?: string;
  iconSizeMultiplier?: number; // Size multiplier (0.5 to 2.0, default 1.0)
}> = ({ socialLinks, align = 'left', isFullwidthOverlay = false, compact = false, className = '', iconSizeMultiplier }) => {
  const links = socialLinks?.links;
  
  // Check if we should show social links in hero
  if (!socialLinks?.showInHero || !links) return null;
  
  // Check if there are any social links to display
  if (!hasSocialLinks(links)) return null;
  
  const justifyClass = isFullwidthOverlay 
    ? 'justify-center' 
    : align === 'center' 
      ? 'justify-center' 
      : align === 'right' 
        ? 'justify-end' 
        : 'justify-start';
  
  // Use the size multiplier from props, then from socialLinks config, then default to 1.0
  const sizeMultiplier = iconSizeMultiplier ?? socialLinks?.heroSocialIconSize ?? 1.0;
  
  // Base sizes (compact: 48px container, 20px icon; standard: 56px container, 24px icon)
  const baseContainerSize = compact ? 48 : 56;
  const baseIconSize = compact ? 20 : 24;
  
  // Calculate actual sizes based on multiplier
  const containerSize = Math.round(baseContainerSize * sizeMultiplier);
  const iconSizePx = Math.round(baseIconSize * sizeMultiplier);
  
  // Use inline styles for dynamic sizing
  const containerStyle = { width: `${containerSize}px`, height: `${containerSize}px` };
  const iconStyle = { width: `${iconSizePx}px`, height: `${iconSizePx}px` };
  
  const gapClass = compact ? 'gap-2' : 'gap-3';
  const marginClass = compact ? 'mt-4' : 'mt-6';
  
  // Base class for all icons - white background with shadow (like contact form)
  const baseClass = `rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center`;
  
  // For fullwidth overlay, use semi-transparent white with white icons
  // For standard layout, use white background with brand colors (like contact form)
  const getIconClass = (brandColor: string) => {
    if (isFullwidthOverlay) {
      return `${baseClass} bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm`;
    }
    return `${baseClass} bg-white ${brandColor}`;
  };
  
  return (
    <div className={`flex flex-wrap ${gapClass} ${marginClass} ${justifyClass} ${className}`}>
      {links.facebook && (
        <a
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={getIconClass('text-blue-600')}
          style={containerStyle}
          aria-label="Facebook"
        >
          <FaFacebookF style={iconStyle} />
        </a>
      )}
      {links.twitter && (
        <a
          href={links.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className={getIconClass('text-black')}
          style={containerStyle}
          aria-label="X (Twitter)"
        >
          <FaXTwitter style={iconStyle} />
        </a>
      )}
      {links.instagram && (
        <a
          href={links.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className={getIconClass('text-pink-600')}
          style={containerStyle}
          aria-label="Instagram"
        >
          <FaInstagram style={iconStyle} />
        </a>
      )}
      {links.linkedin && (
        <a
          href={links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={getIconClass('text-blue-700')}
          style={containerStyle}
          aria-label="LinkedIn"
        >
          <FaLinkedinIn style={iconStyle} />
        </a>
      )}
      {links.youtube && (
        <a
          href={links.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className={getIconClass('text-red-600')}
          style={containerStyle}
          aria-label="YouTube"
        >
          <svg style={iconStyle} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </a>
      )}
      {links.tiktok && (
        <a
          href={links.tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className={getIconClass('text-black')}
          style={containerStyle}
          aria-label="TikTok"
        >
          <FaTiktok style={iconStyle} />
        </a>
      )}
      {links.yelp && (
        <a
          href={links.yelp}
          target="_blank"
          rel="noopener noreferrer"
          className={getIconClass('text-red-600')}
          style={containerStyle}
          aria-label="Yelp"
        >
          <FaYelp style={iconStyle} />
        </a>
      )}
      {links.googleBusinessProfile && (
        <a
          href={links.googleBusinessProfile}
          target="_blank"
          rel="noopener noreferrer"
          className={getIconClass('text-blue-600')}
          style={containerStyle}
          aria-label="Google Business"
        >
          <FaGoogle style={iconStyle} />
        </a>
      )}
      {/* Custom external links with custom icons */}
      {links.customLinks?.map((customLink) => (
        customLink.url && (
          <a
            key={customLink.id}
            href={customLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${getIconClass('text-gray-700')} overflow-hidden`}
            style={containerStyle}
            aria-label={customLink.label || 'External Link'}
          >
            {customLink.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={customLink.iconUrl} 
                alt={customLink.label || 'Custom icon'} 
                style={iconStyle}
                className="object-contain"
              />
            ) : (
              <FaExternalLinkAlt style={iconStyle} />
            )}
          </a>
        )
      ))}
    </div>
  );
};

const Hero: React.FC<Props> = ({ hero, payment, isPreview, backgroundClass = 'bg-gradient-to-br from-gray-50 to-white', editable, onEdit, onHeroImageClick, onHeroImageAddClick, imageStorage, colorPalette, sectionId = 'home', socialLinks }) => {
  const [videoLoading, setVideoLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  
  // Measured anchor positions (relative to heroInnerContainerRef - the common parent)
  // These absolute positions are used to calculate container-relative positions on demand
  const [absoluteTextBottom, setAbsoluteTextBottom] = useState(0);
  const [absoluteImageBottom, setAbsoluteImageBottom] = useState(0);
  const [absoluteImageLeft, setAbsoluteImageLeft] = useState(0.5); // As percentage of container width
  const [showImageEditor, setShowImageEditor] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Video container dimensions for cover behavior calculation
  const [videoContainerDims, setVideoContainerDims] = useState({ width: 0, height: 0 });
  const [actualVideoAspect, setActualVideoAspect] = useState<number | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // Overlay resize state
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [resizeStartBottomPadding, setResizeStartBottomPadding] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  // Button group position drag state (for any layout that supports repositioning)
  const [isDraggingButtons, setIsDraggingButtons] = useState(false);
  const [buttonsDragStartPos, setButtonsDragStartPos] = useState({ x: 0, y: 0 });
  const buttonsFloatingRef = useRef<HTMLDivElement>(null);
  
  // Social links position drag state (for fullwidth layout)
  const [isDraggingSocialLinks, setIsDraggingSocialLinks] = useState(false);
  const [socialLinksDragStartPos, setSocialLinksDragStartPos] = useState({ x: 0, y: 0 });
  const socialLinksFloatingRef = useRef<HTMLDivElement>(null);
  
  // Social icon size popup state
  const [showSocialIconSizePopup, setShowSocialIconSizePopup] = useState(false);
  const socialIconSizeTargetRef = useRef<HTMLDivElement>(null);
  
  // Pending drag state for social links - tracks mousedown before drag threshold is met
  const [hasPendingSocialDrag, setHasPendingSocialDrag] = useState(false);
  const pendingSocialDragRef = useRef<{ startX: number; startY: number } | null>(null);
  const SOCIAL_DRAG_THRESHOLD = 5; // pixels
  
  // Get CTA buttons array with backwards compatibility
  // If ctaButtons array exists, use it; otherwise, convert single cta to array format
  const ctaButtons = useMemo((): HeroCtaButton[] => {
    // Check if payment has override CTA
    if (payment?.addHeroCta) {
      return [{
        id: 'payment-cta',
        label: payment?.heroCtaLabel || hero?.cta?.label || 'Buy Now',
        labelTextSize: payment?.heroCtaLabelTextSize || hero?.cta?.labelTextSize,
        actionType: 'contact', // Payment CTA scrolls to payment section
        showArrow: true
      }];
    }
    
    // Use ctaButtons array if it exists and has items
    if (hero?.ctaButtons && hero.ctaButtons.length > 0) {
      return hero.ctaButtons;
    }
    
    // Backwards compatibility: convert single cta to array format
    if (hero?.cta) {
      return [{
        id: 'legacy-cta',
        label: hero.cta.label || 'Get Started Today',
        labelTextSize: hero.cta.labelTextSize,
        href: hero.cta.href,
        actionType: hero.cta.actionType,
        phoneNumber: hero.cta.phoneNumber,
        showArrow: true
      }];
    }
    
    // Default button if nothing is configured
    return [{
      id: 'default-cta',
      label: 'Get Started Today',
      showArrow: true
    }];
  }, [hero?.ctaButtons, hero?.cta, payment?.addHeroCta, payment?.heroCtaLabel, payment?.heroCtaLabelTextSize]);
  
  // Compute grid columns for buttons
  // Auto-detect based on button count if not explicitly set
  const buttonsColumns = useMemo(() => {
    if (hero?.buttonsColumns) return hero.buttonsColumns;
    // Auto-detect: 1 button = 1 col, 2 buttons = 2 cols, 3-4 buttons = 3 or 4 cols
    const count = ctaButtons.length;
    if (count <= 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4 as 1 | 2 | 3 | 4;
  }, [hero?.buttonsColumns, ctaButtons.length]);
  
  // Compute effective grid layout (backwards compatible with buttonsColumns)
  const effectiveGridLayout = useMemo(() => {
    return getEffectiveGridLayout(ctaButtons, hero?.buttonsGridLayout, buttonsColumns);
  }, [ctaButtons, hero?.buttonsGridLayout, buttonsColumns]);
  
  // Handle grid layout changes from the editor
  const handleGridLayoutChange = useCallback((newLayout: ButtonGridLayout) => {
    if (onEdit) {
      onEdit('hero.buttonsGridLayout', newLayout as any);
    }
  }, [onEdit]);
  
  // Handle button style changes from the editor
  const handleButtonStylesChange = useCallback((newStyles: import('../types').ButtonStyles) => {
    if (onEdit) {
      onEdit('hero.buttonStyles', newStyles as any);
    }
  }, [onEdit]);
  
  // Handle hero images change from the image editor
  const handleHeroImagesChange = useCallback((newImages: string[]) => {
    if (onEdit) {
      // Filter out any invalid blob URLs before saving
      const validImages = newImages.filter(url => url && !url.startsWith('blob:'));
      onEdit('hero.heroImages', validImages as any);
      // Also update the primary image for backward compatibility
      if (validImages.length > 0) {
        onEdit('hero.heroLargeImageUrl', validImages[0]);
      }
    }
  }, [onEdit]);
  
  // Handle slideshow interval change
  const handleSlideshowIntervalChange = useCallback((interval: number) => {
    if (onEdit) {
      onEdit('hero.slideshowInterval', interval.toString());
    }
  }, [onEdit]);
  
  // Handle media type change (photo/video toggle)
  const handleMediaTypeChange = useCallback((mediaType: 'photo' | 'video') => {
    if (onEdit) {
      onEdit('hero.mediaType', mediaType);
    }
  }, [onEdit]);
  
  // Handle video config change
  const handleVideoChange = useCallback((video: { provider: 'youtube' | 'vimeo'; url: string; autoplay?: boolean; controls?: boolean; loop?: boolean; muted?: boolean }) => {
    if (onEdit) {
      onEdit('hero.video.provider', video.provider);
      onEdit('hero.video.url', video.url);
      if (video.autoplay !== undefined) onEdit('hero.video.autoplay', video.autoplay.toString());
      if (video.controls !== undefined) onEdit('hero.video.controls', video.controls.toString());
      if (video.loop !== undefined) onEdit('hero.video.loop', video.loop.toString());
      if (video.muted !== undefined) onEdit('hero.video.muted', video.muted.toString());
    }
  }, [onEdit]);
  
  // Handle layout style change (standard vs fullwidth-overlay)
  const handleLayoutStyleChange = useCallback((style: 'standard' | 'fullwidth-overlay') => {
    if (onEdit) {
      onEdit('hero.layoutStyle', style);
      
      if (style === 'fullwidth-overlay') {
        // Switching to fullwidth overlay
        // Auto-set white text colors for better visibility
        onEdit('hero.colors.headline', '#ffffff');
        onEdit('hero.colors.subheadline', '#ffffff');
        // Only set fullwidth positions if they don't exist yet (preserve user's previous positioning)
        if (!hero?.buttonsPosition) {
          onEdit('hero.buttonsPosition', { x: 50, y: 85 } as any);
        }
        if (!hero?.socialLinksPosition) {
          onEdit('hero.socialLinksPosition', { x: 50, y: 92 } as any);
        }
      } else {
        // Switching to standard layout
        // Auto-set dark text colors
        onEdit('hero.colors.headline', '#000000');
        onEdit('hero.colors.subheadline', '#000000');
        // Clear legacy pixel positioning
        onEdit('hero.standardButtonsPosition', null as any);
        onEdit('hero.standardSocialLinksPosition', null as any);
        
        // Check if stored align values are valid (0-1 range). If not, clear them for reinitialization.
        const btnAlign = hero?.standardButtonsHorizontalAlign;
        const socialAlign = hero?.standardSocialLinksHorizontalAlign;
        const btnAlignValid = typeof btnAlign === 'number' && btnAlign >= 0 && btnAlign <= 1;
        const socialAlignValid = typeof socialAlign === 'number' && socialAlign >= 0 && socialAlign <= 1;
        
        if (!btnAlignValid) {
          onEdit('hero.standardButtonsHorizontalAlign', null as any);
          onEdit('hero.standardButtonsVerticalOffset', null as any);
        }
        if (!socialAlignValid) {
          onEdit('hero.standardSocialLinksHorizontalAlign', null as any);
          onEdit('hero.standardSocialLinksVerticalOffset', null as any);
        }
      }
    }
  }, [onEdit, hero?.buttonsPosition, hero?.socialLinksPosition, hero?.standardButtonsHorizontalAlign, hero?.standardSocialLinksHorizontalAlign]);
  
  // Handle overlay blur toggle
  const handleOverlayBlurChange = useCallback((enabled: boolean) => {
    if (onEdit) {
      onEdit('hero.overlayBlur', enabled.toString());
    }
  }, [onEdit]);
  
  // Helper to check if a URL is valid (not an expired blob URL)
  const isValidImageUrl = useCallback((url: string): boolean => {
    if (!url) return false;
    // Blob URLs are temporary and expire - they should never be stored
    if (url.startsWith('blob:')) return false;
    // Valid URLs: idb:// (IndexedDB), https://, http://, or relative paths
    return url.startsWith('idb://') || url.startsWith('https://') || url.startsWith('http://') || url.startsWith('/');
  }, []);
  
  // Determine layout style - handle both string and potential type mismatches
  const layoutStyle = hero?.layoutStyle || 'standard';
  const isFullwidthOverlay = String(layoutStyle).toLowerCase() === 'fullwidth-overlay';
  
  // Legacy mode detection for fullwidth-overlay
  // If no explicit positioning/styling has been set, render buttons inline with text (old behavior)
  // This maintains backwards compatibility with sites created before the drag/position features
  // Sites with overlayBlur are NOT legacy (blur is a newer feature they explicitly enabled)
  const isLegacyFullwidthLayout = isFullwidthOverlay && 
    !hero?.buttonsPosition && 
    !hero?.overlayPosition &&
    !hero?.buttonStyles &&
    !hero?.overlayBlur;
  
  // Detect mobile/tablet screen size for responsive positioning
  // Include tablets (up to 1024px) to ensure buttons are always full-width and properly positioned
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Measure anchor positions after every layout change
  // Use ResizeObserver for reliable size change detection (fires after layout recalculation)
  // All measurements are relative to heroInnerContainerRef (the common parent)
  useEffect(() => {
    if (isMobile) return;
    
    const measure = () => {
      const parentRect = heroInnerContainerRef.current?.getBoundingClientRect();
      const textRect = heroSubheadlineRef.current?.getBoundingClientRect();
      const imageRect = heroMediaContainerRef.current?.getBoundingClientRect();
      
      if (!parentRect || !textRect || !imageRect || parentRect.width === 0) return;
      
      // Measure positions relative to the common parent container
      setAbsoluteTextBottom(textRect.bottom - parentRect.top);
      setAbsoluteImageBottom(imageRect.bottom - parentRect.top);
      setAbsoluteImageLeft((imageRect.left - parentRect.left) / parentRect.width);
    };
    
    // Measure after a brief delay to ensure DOM has updated after layout switch
    const timeoutId = setTimeout(measure, 50);
    
    // Use ResizeObserver for reliable resize detection
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure layout has settled
      requestAnimationFrame(measure);
    });
    
    // Observe all relevant elements
    if (heroInnerContainerRef.current) resizeObserver.observe(heroInnerContainerRef.current);
    if (heroSubheadlineRef.current) resizeObserver.observe(heroSubheadlineRef.current);
    if (heroMediaContainerRef.current) resizeObserver.observe(heroMediaContainerRef.current);
    
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [isMobile, isFullwidthOverlay]); // Re-run when layout changes
  
  // Initialize standard layout button positions AFTER anchors are calculated
  // This runs when switching to standard layout and ensures buttons appear under subtitle
  useEffect(() => {
    // Only run for standard layout when anchors are valid and positions aren't set yet
    const isStandard = !isFullwidthOverlay;
    const anchorsValid = absoluteTextBottom > 50;
    const buttonsNeedInit = hero?.standardButtonsHorizontalAlign == null;
    const socialNeedInit = hero?.standardSocialLinksHorizontalAlign == null;
    
    if (isStandard && anchorsValid && onEdit) {
      if (buttonsNeedInit) {
        // Initialize buttons: left-aligned (0), 16px below subtitle anchor
        onEdit('hero.standardButtonsHorizontalAlign', 0 as any);
        onEdit('hero.standardButtonsVerticalOffset', 16 as any);
      }
      if (socialNeedInit) {
        // Initialize social links: left-aligned (0), below buttons with spacing
        onEdit('hero.standardSocialLinksHorizontalAlign', 0 as any);
        onEdit('hero.standardSocialLinksVerticalOffset', 90 as any);
      }
    }
  }, [isFullwidthOverlay, absoluteTextBottom, hero?.standardButtonsHorizontalAlign, hero?.standardSocialLinksHorizontalAlign, onEdit]);
  
  // Track video container dimensions for cover behavior calculation
  // Re-run when video mode is active to ensure we measure after the container is rendered
  useEffect(() => {
    if (hero?.mediaType !== 'video') return;
    
    const container = videoContainerRef.current;
    if (!container) return;
    
    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setVideoContainerDims({ width: rect.width, height: rect.height });
    };
    
    // Initial measurement after a brief delay to ensure layout is complete
    const timeoutId = setTimeout(updateDimensions, 100);
    
    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);
    
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [hero?.mediaType]);
  
  // Fetch actual video dimensions from oEmbed API
  useEffect(() => {
    if (hero?.mediaType !== 'video' || !hero?.video?.url) return;
    
    const url = hero.video.url;
    let oembedUrl = '';
    
    if (url.includes('vimeo.com')) {
      oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    }
    
    if (!oembedUrl) return;
    
    fetch(oembedUrl)
      .then(res => res.json())
      .then(data => {
        if (data.width && data.height) {
          setActualVideoAspect(data.width / data.height);
        }
      })
      .catch(() => {
        // Fallback to 16:9 if API fails
        setActualVideoAspect(16 / 9);
      });
  }, [hero?.mediaType, hero?.video?.url]);
  
  // Fallback: Clear image loading state after a timeout to prevent infinite loading
  useEffect(() => {
    if (isFullwidthOverlay && imageLoading) {
      const timeout = setTimeout(() => {
        console.warn('Hero image loading timeout - clearing loading state');
        setImageLoading(false);
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isFullwidthOverlay, imageLoading]);
  
  // Debug logging (only in development)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('Hero layoutStyle:', layoutStyle, 'isFullwidthOverlay:', isFullwidthOverlay);
    }
  }, [layoutStyle, isFullwidthOverlay]);
  
  // Get all hero images (for slideshow support), filtering out invalid/expired URLs
  const heroImages = useMemo(() => {
    // Filter function to remove expired blob URLs
    const filterValidUrls = (urls: string[]) => urls.filter(url => 
      url && !url.startsWith('blob:') // Blob URLs are temporary and expire between sessions
    );
    
    if (hero?.heroImages && hero.heroImages.length > 0) {
      const validImages = filterValidUrls(hero.heroImages);
      if (validImages.length > 0) {
        return validImages;
      }
    }
    // Backwards compatibility: use single image if no array exists (or all array images were invalid)
    if (hero?.heroLargeImageUrl && !hero.heroLargeImageUrl.startsWith('blob:')) {
      return [hero.heroLargeImageUrl];
    }
    return [];
  }, [hero?.heroImages, hero?.heroLargeImageUrl]);
  
  const hasMultipleImages = heroImages.length > 1;
  const slideshowInterval = hero?.slideshowInterval || 4000; // Default 4 seconds

  // Helper function to darken a color for hover effect
  const darkenColor = (color: string): string => {
    if (color === '#2563eb') return '#1d4ed8';
    
    // For other colors, try to darken by reducing brightness
    if (color.startsWith('#') && color.length === 7) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      
      // Darken by 20%
      const darkenedR = Math.max(0, Math.floor(r * 0.8));
      const darkenedG = Math.max(0, Math.floor(g * 0.8));
      const darkenedB = Math.max(0, Math.floor(b * 0.8));
      
      return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
    }
    
    return color; // Fallback to original color if we can't parse it
  };

  const onButtonClick = (button: HeroCtaButton) => {
    // Handle different action types based on the actionType field
    // For backward compatibility, if actionType is not set but href exists, treat as external
    let actionType = button.actionType;
    if (!actionType && button.href) {
      actionType = 'external';
    } else if (!actionType) {
      actionType = 'contact';
    }
    
    switch (actionType) {
      case 'phone':
        // Handle phone number action
        if (button.phoneNumber) {
          // Clean the phone number and create tel: link
          const cleanedNumber = stripPhoneNumber(button.phoneNumber);
          window.location.href = `tel:${cleanedNumber}`;
        }
        return;
        
      case 'external':
        // Handle external URL action
        if (button.href) {
          const href = button.href;
          
          // Handle internal anchor links (scroll to section)
          if (href.startsWith('#')) {
            const element = document.getElementById(href.substring(1));
            if (element) {
              // Calculate header height offset
              const isMobileScreen = window.innerWidth < 768;
              const headerOffset = isMobileScreen ? 80 : 96; // Match CSS values
              const elementPosition = element.offsetTop - headerOffset;
              
              window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
              });
            }
            return;
          }
          
          // Handle phone links (direct navigation)
          if (href.startsWith('tel:') || href.startsWith('mailto:')) {
            window.location.href = href;
            return;
          }
          
          // Handle external URLs (open in new tab)
          if (href.startsWith('http://') || href.startsWith('https://')) {
            window.open(href, '_blank', 'noopener,noreferrer');
            return;
          }
          
          // Fallback for any other href values
          window.location.href = href;
        }
        return;
        
      case 'contact':
      default:
        // Default behavior: scroll to contact or payment section
        const targetId = payment?.addHeroCta ? 'payment' : 'contact';
        const element = document.getElementById(targetId);
        if (element) {
          // Calculate header height offset
          const isMobileScreen = window.innerWidth < 768;
          const headerOffset = isMobileScreen ? 80 : 96; // Match CSS values
          const elementPosition = element.offsetTop - headerOffset;
          
          window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
          });
        }
        return;
    }
  };
  
  // Get button styles based on variant
  const getButtonStyles = (button: HeroCtaButton, isHovered: boolean, index: number) => {
    // Prioritize explicitly set ctaBackground over palette
    const defaultBg = hero?.colors?.ctaBackground || colorPalette?.primary || '#2563eb';
    const defaultText = hero?.colors?.ctaText || '#ffffff';
    
    // Use button-specific colors if set, otherwise fall back to defaults
    const bgColor = button.backgroundColor || defaultBg;
    const textColor = button.textColor || defaultText;
    
    // Handle different variants
    switch (button.variant) {
      case 'secondary':
        return {
          backgroundColor: isHovered ? darkenColor(bgColor) : bgColor,
          color: textColor,
          opacity: 0.9
        };
      case 'outline':
        return {
          backgroundColor: isHovered ? bgColor : 'transparent',
          color: isHovered ? defaultText : bgColor,
          border: `2px solid ${bgColor}`
        };
      case 'primary':
      default:
        return {
          backgroundColor: isHovered ? darkenColor(bgColor) : bgColor,
          color: textColor
        };
    }
  };

  // Generate video embed URL and get dimensions
  const { videoEmbedSrc, videoAspectRatio } = useMemo(() => {
    if (hero?.mediaType !== 'video' || !hero?.video?.url) return { videoEmbedSrc: null, videoAspectRatio: 56.25 };
    
    const input = extractIframeSrc(hero.video.url);
    if (!input) return { videoEmbedSrc: null, videoAspectRatio: 56.25 };
    
    // Extract dimensions to get proper aspect ratio
    const dimensions = extractIframeDimensions(hero.video.url);
    const aspectRatio = dimensions 
      ? (dimensions.height / dimensions.width) * 100 
      : 56.25; // Default to 16:9
    
    const opts = {
      autoplay: hero.video.autoplay ?? true,  // Default to autoplay
      controls: hero.video.controls ?? false, // Default to no controls
      loop: hero.video.loop ?? true,          // Default to loop
      muted: hero.video.muted ?? true,        // Default to muted
    };
    
    
    let embedSrc;
    if (hero.video.provider === 'youtube') {
      embedSrc = toYouTubeEmbed(input, opts);
    } else if (hero.video.provider === 'vimeo') {
      embedSrc = toVimeoEmbed(input, opts);
    } else if (input.includes('vimeo.com')) {
      embedSrc = toVimeoEmbed(input, opts);
    } else if (input.includes('youtube.com') || input.includes('youtu.be')) {
      embedSrc = toYouTubeEmbed(input, opts);
    } else {
      // Fallback to YouTube if provider is not recognized
      embedSrc = toYouTubeEmbed(input, opts);
    }
    
    return { videoEmbedSrc: embedSrc, videoAspectRatio: aspectRatio };
  }, [hero?.mediaType, hero?.video]);

  // Calculate video iframe dimensions for "object-fit: cover" behavior
  // Uses actual video aspect ratio from oEmbed API, falls back to 16:9
  const videoCoverDimensions = useMemo(() => {
    if (videoContainerDims.width > 0 && videoContainerDims.height > 0) {
      const { width: cw, height: ch } = videoContainerDims;
      const containerAspect = cw / ch;
      const vidAspect = actualVideoAspect || 16 / 9; // Use actual or fallback
      
      // Standard object-fit: cover calculation
      if (containerAspect > vidAspect) {
        // Container is wider than video - fill width, scale height
        return { width: `${cw}px`, height: `${cw / vidAspect}px` };
      } else {
        // Container is taller than video - fill height, scale width
        return { width: `${ch * vidAspect}px`, height: `${ch}px` };
      }
    }
    return { width: '177.78vh', height: '100vh' };
  }, [videoContainerDims, actualVideoAspect]);

  // Reset loading states when media type or source changes
  useEffect(() => {
    if (hero?.mediaType === 'video') {
      setVideoLoading(true);
      setImageLoading(false);
      
      // Fallback: Force video to show after 3 seconds even if onLoad doesn't fire
      // (Some embeds don't trigger onLoad reliably)
      const fallbackTimer = setTimeout(() => setVideoLoading(false), 3000);
      return () => clearTimeout(fallbackTimer);
    } else {
      setVideoLoading(false);
      setImageLoading(true);
    }
  }, [hero?.mediaType, hero?.video?.url, hero?.heroLargeImageUrl]);
  
  // Reset slide index when images change (e.g., after deletion) to prevent out-of-bounds
  useEffect(() => {
    if (heroImages.length > 0 && currentSlideIndex >= heroImages.length) {
      setCurrentSlideIndex(0);
    }
  }, [heroImages.length, currentSlideIndex]);
  
  // Slideshow auto-advance effect
  useEffect(() => {
    // Only run slideshow if we have multiple images and we're NOT in video mode
    if (!hasMultipleImages || hero?.mediaType === 'video') {
      return;
    }
    
    const timer = setInterval(() => {
      setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, slideshowInterval);
    
    return () => clearInterval(timer);
  }, [hasMultipleImages, heroImages.length, slideshowInterval, hero?.mediaType]);

  // Drag handlers for overlay text positioning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editable || !isFullwidthOverlay) return;
    
    // Only start drag if clicking on the container background (not on text or buttons)
    const target = e.target as HTMLElement;
    
    // Don't drag if clicking on interactive elements
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    // Don't drag if clicking on contentEditable elements (EditableText components)
    if (target.contentEditable === 'true' || target.closest('[contenteditable="true"]')) {
      return;
    }
    
    // Don't drag if clicking on any editable text element or its children
    if (target.classList.contains('editable-text') || target.closest('.editable-text')) {
      return;
    }
    
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !onEdit) return;
    
    // Get the hero container parent
    const heroContainer = containerRef.current.parentElement;
    if (!heroContainer) return;
    
    const containerRect = heroContainer.getBoundingClientRect();
    if (!containerRect) return;
    
    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;
    
    // Calculate new position as percentage (0-100 scale where 50 is center)
    const currentX = hero?.overlayPosition?.x ?? 50;
    const currentY = hero?.overlayPosition?.y ?? 50;
    
    // Convert pixel delta to percentage delta based on parent container
    const percentDeltaX = (deltaX / containerRect.width) * 100;
    const percentDeltaY = (deltaY / containerRect.height) * 100;
    
    // Allow full drag range with minimal constraints
    const newX = Math.max(10, Math.min(90, currentX + percentDeltaX));
    const newY = Math.max(10, Math.min(90, currentY + percentDeltaY));
    
    // Pass the object directly, not stringified
    onEdit('hero.overlayPosition', { x: newX, y: newY } as any);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  }, [dragStartPos, hero?.overlayPosition, onEdit]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Overlay resize handlers
  const handleResizeStart = useCallback((e: ReactMouseEvent, direction: string) => {
    if (!editable || !isFullwidthOverlay || !hero?.overlayBlur) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(direction);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    // Get current size or defaults
    const currentWidth = hero?.overlaySize?.width ?? 60;
    const currentHeight = hero?.overlaySize?.height ?? 50;
    const currentBottomPadding = hero?.overlaySize?.bottomPadding ?? 0;
    setResizeStartSize({ width: currentWidth, height: currentHeight });
    setResizeStartBottomPadding(currentBottomPadding);
  }, [editable, isFullwidthOverlay, hero?.overlayBlur, hero?.overlaySize]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !onEdit) return;
    
    // Get the hero container for percentage calculations
    const heroContainer = containerRef.current?.closest('.relative.w-full') as HTMLElement;
    if (!heroContainer) return;
    
    const containerRect = heroContainer.getBoundingClientRect();
    const deltaX = e.clientX - resizeStartPos.x;
    const deltaY = e.clientY - resizeStartPos.y;
    
    // Convert pixel delta to percentage for width
    const percentDeltaX = (deltaX / containerRect.width) * 100;
    
    let newWidth = resizeStartSize.width;
    
    // Handle width resize directions
    if (isResizing.includes('e')) {
      newWidth = resizeStartSize.width + percentDeltaX * 2; // *2 because we resize from center
    }
    if (isResizing.includes('w')) {
      newWidth = resizeStartSize.width - percentDeltaX * 2;
    }
    
    // Clamp width (allow up to 100%)
    newWidth = Math.max(30, Math.min(100, newWidth));
    
    // Handle bottom padding resize (south direction) - uses pixels directly
    if (isResizing === 's') {
      const newBottomPadding = Math.max(0, Math.min(300, resizeStartBottomPadding + deltaY));
      onEdit('hero.overlaySize', { 
        width: hero?.overlaySize?.width ?? newWidth, 
        height: hero?.overlaySize?.height ?? 50,
        bottomPadding: newBottomPadding 
      } as any);
    } else {
      // Width resize only
      onEdit('hero.overlaySize', { 
        width: newWidth, 
        height: hero?.overlaySize?.height ?? 50,
        bottomPadding: hero?.overlaySize?.bottomPadding ?? 0
      } as any);
    }
  }, [isResizing, resizeStartPos, resizeStartSize, resizeStartBottomPadding, hero?.overlaySize, onEdit]);

  const handleResizeEnd = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Button group position drag handlers (for any layout that supports repositioning)
  const handleButtonsDragStart = useCallback((e: ReactMouseEvent) => {
    if (!editable) return;
    
    // Don't drag if clicking on actual buttons
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    e.preventDefault();
    setIsDraggingButtons(true);
    setButtonsDragStartPos({ x: e.clientX, y: e.clientY });
  }, [editable]);

  const handleButtonsDragMove = useCallback((e: MouseEvent) => {
    if (!isDraggingButtons || !onEdit) return;
    
    // Find the appropriate container based on layout type
    let container: HTMLElement | null = null;
    
    if (isFullwidthOverlay) {
      // For fullwidth, use the hero media container
      container = buttonsFloatingRef.current?.closest('.relative.w-full') as HTMLElement;
    } else {
      // For standard layout, use the text column (parent with 'text-left' class)
      container = buttonsFloatingRef.current?.closest('.text-left') as HTMLElement 
        || buttonsFloatingRef.current?.closest('section') as HTMLElement;
    }
    
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const deltaX = e.clientX - buttonsDragStartPos.x;
    const deltaY = e.clientY - buttonsDragStartPos.y;
    
    const currentX = hero?.buttonsPosition?.x ?? 50;
    const currentY = hero?.buttonsPosition?.y ?? (isFullwidthOverlay ? 85 : 70);
    
    const percentDeltaX = (deltaX / containerRect.width) * 100;
    const percentDeltaY = (deltaY / containerRect.height) * 100;
    
    const newX = Math.max(5, Math.min(95, currentX + percentDeltaX));
    const newY = Math.max(10, Math.min(95, currentY + percentDeltaY));
    
    onEdit('hero.buttonsPosition', { x: newX, y: newY } as any);
    setButtonsDragStartPos({ x: e.clientX, y: e.clientY });
  }, [isDraggingButtons, buttonsDragStartPos, hero?.buttonsPosition, onEdit, isFullwidthOverlay]);

  const handleButtonsDragEnd = useCallback(() => {
    setIsDraggingButtons(false);
  }, []);

  useEffect(() => {
    if (isDraggingButtons) {
      document.addEventListener('mousemove', handleButtonsDragMove);
      document.addEventListener('mouseup', handleButtonsDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleButtonsDragMove);
        document.removeEventListener('mouseup', handleButtonsDragEnd);
      };
    }
  }, [isDraggingButtons, handleButtonsDragMove, handleButtonsDragEnd]);

  // Track if a drag just happened (to prevent click after drag)
  const socialLinksRecentDragRef = useRef(false);
  // Track mousedown position for click detection
  const socialLinksMouseDownRef = useRef<{ x: number; y: number } | null>(null);
  
  // Social links mousedown handler (for fullwidth overlay)
  const handleSocialLinksMouseDown = useCallback((e: ReactMouseEvent) => {
    if (!editable || !isFullwidthOverlay) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) return;
    
    socialLinksMouseDownRef.current = { x: e.clientX, y: e.clientY };
    pendingSocialDragRef.current = { startX: e.clientX, startY: e.clientY };
    setSocialLinksDragStartPos({ x: e.clientX, y: e.clientY });
    setHasPendingSocialDrag(true);
  }, [editable, isFullwidthOverlay]);

  // Handle click on social links - opens popup if no drag occurred
  const handleSocialLinksClick = useCallback((e: ReactMouseEvent, targetElement: HTMLDivElement | null) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) return;
    if (socialLinksRecentDragRef.current) return;
    
    if (socialLinksMouseDownRef.current) {
      const dx = Math.abs(e.clientX - socialLinksMouseDownRef.current.x);
      const dy = Math.abs(e.clientY - socialLinksMouseDownRef.current.y);
      socialLinksMouseDownRef.current = null;
      if (dx > SOCIAL_DRAG_THRESHOLD || dy > SOCIAL_DRAG_THRESHOLD) return;
    }
    
    if (editable) {
      e.stopPropagation();
      socialIconSizeTargetRef.current = targetElement;
      setShowSocialIconSizePopup(true);
    }
  }, [editable]);

  const handleSocialLinksDragMove = useCallback((e: MouseEvent) => {
    // Check for pending drag that hasn't activated yet
    if (pendingSocialDragRef.current && !isDraggingSocialLinks) {
      const dx = Math.abs(e.clientX - pendingSocialDragRef.current.startX);
      const dy = Math.abs(e.clientY - pendingSocialDragRef.current.startY);
      
      // If moved beyond threshold, activate drag
      if (dx > SOCIAL_DRAG_THRESHOLD || dy > SOCIAL_DRAG_THRESHOLD) {
        e.preventDefault();
        setIsDraggingSocialLinks(true);
      }
      return;
    }
    
    if (!isDraggingSocialLinks || !onEdit) return;
    
    // Find the appropriate container based on layout type
    let container: HTMLElement | null = null;
    
    if (isFullwidthOverlay) {
      container = socialLinksFloatingRef.current?.closest('.relative.w-full') as HTMLElement;
    } else {
      container = socialLinksFloatingRef.current?.closest('.grid') as HTMLElement;
    }
    
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const deltaX = e.clientX - socialLinksDragStartPos.x;
    const deltaY = e.clientY - socialLinksDragStartPos.y;
    
    const currentX = hero?.socialLinksPosition?.x ?? (isFullwidthOverlay ? 50 : 25);
    const currentY = hero?.socialLinksPosition?.y ?? (isFullwidthOverlay ? 92 : 85);
    
    const percentDeltaX = (deltaX / containerRect.width) * 100;
    const percentDeltaY = (deltaY / containerRect.height) * 100;
    
    const maxY = isFullwidthOverlay ? 98 : 95;
    const newX = Math.max(5, Math.min(95, currentX + percentDeltaX));
    const newY = Math.max(10, Math.min(maxY, currentY + percentDeltaY));
    
    onEdit('hero.socialLinksPosition', { x: newX, y: newY } as any);
    setSocialLinksDragStartPos({ x: e.clientX, y: e.clientY });
  }, [isDraggingSocialLinks, socialLinksDragStartPos, hero?.socialLinksPosition, onEdit, isFullwidthOverlay]);

  const handleSocialLinksDragEnd = useCallback(() => {
    // Mark if we just dragged to prevent click handler
    if (isDraggingSocialLinks) {
      socialLinksRecentDragRef.current = true;
      setTimeout(() => { socialLinksRecentDragRef.current = false; }, 100);
    }
    // Clear all drag state
    pendingSocialDragRef.current = null;
    socialLinksMouseDownRef.current = null;
    setHasPendingSocialDrag(false);
    setIsDraggingSocialLinks(false);
  }, [isDraggingSocialLinks]);

  // Global listeners for social links drag (fullwidth overlay)
  useEffect(() => {
    if (hasPendingSocialDrag || isDraggingSocialLinks) {
      document.addEventListener('mousemove', handleSocialLinksDragMove);
      document.addEventListener('mouseup', handleSocialLinksDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleSocialLinksDragMove);
        document.removeEventListener('mouseup', handleSocialLinksDragEnd);
      };
    }
  }, [hasPendingSocialDrag, isDraggingSocialLinks, handleSocialLinksDragMove, handleSocialLinksDragEnd]);

  // Preload resources for faster loading
  const preloadHints = useMemo(() => {
    const hints = [];
    
    if (hero?.mediaType === 'video' && videoEmbedSrc) {
      // Preconnect to video providers
      if (videoEmbedSrc.includes('vimeo.com')) {
        hints.push(
          <link key="preconnect-vimeo" rel="preconnect" href="https://player.vimeo.com" />,
          <link key="preconnect-vimeo-i" rel="preconnect" href="https://i.vimeocdn.com" />
        );
      } else if (videoEmbedSrc.includes('youtube.com')) {
        hints.push(
          <link key="preconnect-youtube" rel="preconnect" href="https://www.youtube.com" />,
          <link key="preconnect-youtube-i" rel="preconnect" href="https://i.ytimg.com" />
        );
      }
    } else if (hero?.heroLargeImageUrl && !hero.heroLargeImageUrl.startsWith('idb://')) {
      // Preload hero image
      hints.push(
        <link 
          key="preload-hero-image" 
          rel="preload" 
          href={hero.heroLargeImageUrl} 
          as="image" 
        />
      );
    }
    
    return hints;
  }, [hero?.mediaType, videoEmbedSrc, hero?.heroLargeImageUrl]);
  

  // Standard layout: check if buttons/social have custom positions
  // LEGACY: pixel-based positioning (deprecated but kept for backward compatibility)
  const hasStandardButtonsPosition = hero?.standardButtonsPosition != null;
  const hasStandardSocialLinksPosition = hero?.standardSocialLinksPosition != null;
  
  // NEW: relative horizontal alignment (0-1 scale)
  // Takes precedence over legacy pixel positioning when set
  const hasStandardButtonsHorizontalAlign = hero?.standardButtonsHorizontalAlign != null;
  const hasStandardSocialLinksHorizontalAlign = hero?.standardSocialLinksHorizontalAlign != null;
  
  // Ref for the hero section to calculate drag positions
  const heroSectionRef = useRef<HTMLElement>(null);
  // Refs for measuring button/social element heights for min-height calculation
  const standardButtonsRef = useRef<HTMLDivElement>(null);
  const standardSocialRef = useRef<HTMLDivElement>(null);
  const standardButtonsDraggableRef = useRef<HTMLDivElement>(null);
  const standardSocialDraggableRef = useRef<HTMLDivElement>(null);
  // Ref for the inner container (to calculate positioning bounds)
  const heroInnerContainerRef = useRef<HTMLDivElement>(null);
  // Refs for adaptive hero bottom calculation
  const heroSubheadlineRef = useRef<HTMLDivElement>(null);
  const heroMediaContainerRef = useRef<HTMLDivElement>(null);
  // State for adaptive bottom padding in standard layout
  const [adaptiveBottomPadding, setAdaptiveBottomPadding] = useState(0);
  
  // Drag state for standard layout positioning - simple pixel-based dragging
  const [isDraggingStandardButtons, setIsDraggingStandardButtons] = useState(false);
  const [isDraggingStandardSocial, setIsDraggingStandardSocial] = useState(false);
  const [dragStartMouse, setDragStartMouse] = useState({ x: 0, y: 0 });
  const [dragStartElementLeft, setDragStartElementLeft] = useState(0);
  const [dragStartElementTop, setDragStartElementTop] = useState(0);
  // Live pixel position during drag (to avoid round-trip conversion issues)
  const [liveButtonsLeft, setLiveButtonsLeft] = useState<number | null>(null);
  const [liveButtonsTop, setLiveButtonsTop] = useState<number | null>(null);
  const [liveSocialLeft, setLiveSocialLeft] = useState<number | null>(null);
  const [liveSocialTop, setLiveSocialTop] = useState<number | null>(null);
  const draggedElementRef = useRef<HTMLDivElement | null>(null);
  
  
  // Calculate min-height for hero section based on positioned elements
  // Uses stored value from drag operations, which is recalculated during drag
  const standardHeroMinHeight = useMemo(() => {
    // For new alignment system, we don't need extra min-height since elements
    // are positioned within the text column flow
    if (hasStandardButtonsHorizontalAlign || hasStandardSocialLinksHorizontalAlign) {
      return 0;
    }
    
    // LEGACY: Use stored value for pixel-based positioning
    const storedHeight = hero?.standardHeroMinHeight || 0;
    if (storedHeight > 0) return storedHeight;
    
    // Fallback calculation if no stored value
    let maxBottom = 0;
    if (hero?.standardButtonsPosition) {
      maxBottom = Math.max(maxBottom, hero.standardButtonsPosition.y + 120);
    }
    if (hero?.standardSocialLinksPosition) {
      maxBottom = Math.max(maxBottom, hero.standardSocialLinksPosition.y + 80);
    }
    // Only apply min-height if elements are positioned below ~500px
    return maxBottom > 500 ? maxBottom : 0;
  }, [hero?.standardButtonsPosition, hero?.standardSocialLinksPosition, hero?.standardHeroMinHeight, hasStandardButtonsHorizontalAlign, hasStandardSocialLinksHorizontalAlign]);
  
  // Calculate adaptive min-height for standard layout hero section
  // Ensures hero section bottom lies comfortably below the max of:
  // social icons, button group, hero image, hero subtitle text
  useEffect(() => {
    // Only apply for standard layout (not fullwidth overlay)
    if (isFullwidthOverlay) {
      setAdaptiveBottomPadding(0);
      return;
    }
    
    const calculateAdaptiveBottom = () => {
      if (!heroSectionRef.current) return;
      
      const sectionRect = heroSectionRef.current.getBoundingClientRect();
      const sectionTop = sectionRect.top + window.scrollY; // Account for scroll
      
      // Get absolute bottom positions of all four elements
      const bottoms: number[] = [];
      
      // 1. Social icons bottom
      const socialElement = standardSocialDraggableRef.current || standardSocialRef.current;
      if (socialElement) {
        const rect = socialElement.getBoundingClientRect();
        bottoms.push(rect.bottom + window.scrollY - sectionTop);
      }
      
      // 2. Button group bottom
      const buttonsElement = standardButtonsDraggableRef.current || standardButtonsRef.current;
      if (buttonsElement) {
        const rect = buttonsElement.getBoundingClientRect();
        bottoms.push(rect.bottom + window.scrollY - sectionTop);
      }
      
      // 3. Hero image/media container bottom
      if (heroMediaContainerRef.current) {
        const rect = heroMediaContainerRef.current.getBoundingClientRect();
        bottoms.push(rect.bottom + window.scrollY - sectionTop);
      }
      
      // 4. Hero subtitle text bottom
      if (heroSubheadlineRef.current) {
        const rect = heroSubheadlineRef.current.getBoundingClientRect();
        bottoms.push(rect.bottom + window.scrollY - sectionTop);
      }
      
      if (bottoms.length === 0) {
        setAdaptiveBottomPadding(0);
        return;
      }
      
      // Find the maximum bottom position (lowest element)
      const maxBottom = Math.max(...bottoms);
      
      // Add small padding below the lowest element (main padding comes from inner container's py classes)
      const desiredPadding = 16; // 16px minimal padding below content
      const neededMinHeight = maxBottom + desiredPadding;
      
      // Set the min-height value (will be applied to the section)
      setAdaptiveBottomPadding(neededMinHeight);
    };
    
    // Run calculation after render and on resize
    // Use requestAnimationFrame to ensure DOM is ready
    const runCalculation = () => requestAnimationFrame(calculateAdaptiveBottom);
    
    runCalculation();
    
    // Recalculate on resize
    window.addEventListener('resize', runCalculation);
    
    // Also recalculate after images load or content changes
    const observer = new MutationObserver(runCalculation);
    
    if (heroSectionRef.current) {
      observer.observe(heroSectionRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    
    // Recalculate after delays to account for async content/images
    const timer1 = setTimeout(runCalculation, 100);
    const timer2 = setTimeout(runCalculation, 500);
    
    return () => {
      window.removeEventListener('resize', runCalculation);
      observer.disconnect();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isFullwidthOverlay, hero?.standardButtonsHorizontalAlign, hero?.standardButtonsVerticalOffset, 
      hero?.standardSocialLinksHorizontalAlign, hero?.standardSocialLinksVerticalOffset,
      hero?.standardButtonsPosition, hero?.standardSocialLinksPosition,
      liveButtonsTop, liveSocialTop, isMobile]);
  
  
  // Helper to parse value as number
  const parseNum = (value: number | string | undefined, fallback: number = 0): number => {
    if (value === undefined || value === null) return fallback;
    const num = typeof value === 'number' ? value : parseFloat(value);
    return isNaN(num) ? fallback : num;
  };
  
  // Simple drag handler - element follows mouse EXACTLY within container bounds
  const handleStandardButtonsDragStart = useCallback((e: ReactMouseEvent, elementRef: HTMLDivElement) => {
    if (!editable || isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    
    draggedElementRef.current = elementRef;
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    
    // Get current element position
    const rect = elementRef.getBoundingClientRect();
    const containerRect = standardButtonsRef.current?.getBoundingClientRect();
    if (containerRect) {
      const currentLeft = rect.left - containerRect.left;
      const currentTop = rect.top - containerRect.top;
      setDragStartElementLeft(currentLeft);
      setDragStartElementTop(currentTop);
      // Initialize live position
      setLiveButtonsLeft(currentLeft);
      setLiveButtonsTop(currentTop);
    }
    
    setIsDraggingStandardButtons(true);
  }, [editable, isMobile]);
  
  const handleStandardButtonsDragMove = useCallback((e: MouseEvent) => {
    if (!isDraggingStandardButtons || !standardButtonsRef.current || !draggedElementRef.current) return;
    
    const containerRect = standardButtonsRef.current.getBoundingClientRect();
    const elementRect = draggedElementRef.current.getBoundingClientRect();
    if (containerRect.width === 0) return;
    
    // Calculate new position (element follows mouse EXACTLY)
    const deltaX = e.clientX - dragStartMouse.x;
    const deltaY = e.clientY - dragStartMouse.y;
    
    let newLeft = dragStartElementLeft + deltaX;
    let newTop = dragStartElementTop + deltaY;
    
    // Constrain left edge (can't go negative)
    newLeft = Math.max(0, newLeft);
    // Constrain right edge (element's right edge can't go past container's right edge)
    const maxLeft = containerRect.width - elementRect.width;
    if (maxLeft > 0) {
      newLeft = Math.min(maxLeft, newLeft);
    }
    
    // Constrain vertically: allow movement up/down (more upward range for top-aligned layout)
    newTop = Math.max(-400, Math.min(200, newTop));
    
    // Update live position (used directly for rendering during drag)
    setLiveButtonsLeft(newLeft);
    setLiveButtonsTop(newTop);
  }, [isDraggingStandardButtons, dragStartMouse, dragStartElementLeft, dragStartElementTop]);
  
  const handleStandardButtonsDragEnd = useCallback(() => {
    // Store left position as PERCENTAGE (0-1) for proper scaling when container resizes
    // Store vertical offset RELATIVE TO ANCHOR (text/image bottom) for responsive positioning
    if (onEdit && standardButtonsRef.current && heroInnerContainerRef.current && draggedElementRef.current && liveButtonsLeft !== null && liveButtonsTop !== null) {
      const containerRect = standardButtonsRef.current.getBoundingClientRect();
      const parentRect = heroInnerContainerRef.current.getBoundingClientRect();
      const elementRect = draggedElementRef.current.getBoundingClientRect();
      
      // Calculate left position as percentage of container width
      const leftPercent = liveButtonsLeft / containerRect.width;
      // Clamp to 0-1 range
      const clampedPercent = Math.max(0, Math.min(1, leftPercent));
      
      // Calculate button width as percentage for anchor determination
      const buttonWidthPercent = containerRect.width > 0 ? elementRect.width / containerRect.width : 0.25;
      const buttonRightPercent = clampedPercent + buttonWidthPercent;
      
      // If button's right edge is to the LEFT of image's left edge, use text anchor
      const isInTextZone = buttonRightPercent < absoluteImageLeft;
      const absoluteAnchor = isInTextZone ? absoluteTextBottom : absoluteImageBottom;
      
      // Convert absolute anchor to container-relative for storing offset
      const containerTop = containerRect.top - parentRect.top;
      const containerRelativeAnchor = absoluteAnchor - containerTop;
      
      // Store offset relative to the determined anchor
      const relativeOffset = liveButtonsTop - containerRelativeAnchor;
      
      onEdit('hero.standardButtonsHorizontalAlign', clampedPercent as any);
      onEdit('hero.standardButtonsVerticalOffset', relativeOffset as any);
      onEdit('hero.standardButtonsWidthPercent', buttonWidthPercent as any); // Store width for consistent zone detection
    }
    
    setIsDraggingStandardButtons(false);
    setLiveButtonsLeft(null);
    setLiveButtonsTop(null);
    draggedElementRef.current = null;
  }, [onEdit, liveButtonsLeft, liveButtonsTop, absoluteTextBottom, absoluteImageBottom, absoluteImageLeft]);
  
  // Social links drag handlers
  // Standard layout social drag - uses pending drag pattern
  const [hasPendingStandardSocialDrag, setHasPendingStandardSocialDrag] = useState(false);
  const pendingStandardSocialDragRef = useRef<{ elementRef: HTMLDivElement; startX: number; startY: number } | null>(null);
  const standardSocialRecentDragRef = useRef(false);
  const standardSocialMouseDownRef = useRef<{ x: number; y: number } | null>(null);
  
  const handleStandardSocialMouseDown = useCallback((e: ReactMouseEvent, elementRef: HTMLDivElement) => {
    if (!editable || isMobile) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) return;
    
    standardSocialMouseDownRef.current = { x: e.clientX, y: e.clientY };
    
    // Store pending drag info - don't activate drag yet
    pendingStandardSocialDragRef.current = { elementRef, startX: e.clientX, startY: e.clientY };
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    draggedElementRef.current = elementRef;
    
    const rect = elementRef.getBoundingClientRect();
    const containerRect = standardSocialRef.current?.getBoundingClientRect();
    if (containerRect) {
      const currentLeft = rect.left - containerRect.left;
      const currentTop = rect.top - containerRect.top;
      setDragStartElementLeft(currentLeft);
      setDragStartElementTop(currentTop);
    }
    
    setHasPendingStandardSocialDrag(true);
  }, [editable, isMobile]);
  
  const handleStandardSocialClick = useCallback((e: ReactMouseEvent, targetElement: HTMLDivElement | null) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) {
      return;
    }
    if (standardSocialRecentDragRef.current) {
      return;
    }
    
    if (standardSocialMouseDownRef.current) {
      const dx = Math.abs(e.clientX - standardSocialMouseDownRef.current.x);
      const dy = Math.abs(e.clientY - standardSocialMouseDownRef.current.y);
      standardSocialMouseDownRef.current = null;
      if (dx > SOCIAL_DRAG_THRESHOLD || dy > SOCIAL_DRAG_THRESHOLD) {
        return;
      }
    }
    
    if (editable) {
      e.stopPropagation();
      socialIconSizeTargetRef.current = targetElement;
      setShowSocialIconSizePopup(true);
    }
  }, [editable]);
  
  const handleStandardSocialDragMove = useCallback((e: MouseEvent) => {
    // Check for pending drag that hasn't activated yet
    if (pendingStandardSocialDragRef.current && !isDraggingStandardSocial) {
      const dx = Math.abs(e.clientX - pendingStandardSocialDragRef.current.startX);
      const dy = Math.abs(e.clientY - pendingStandardSocialDragRef.current.startY);
      
      // If moved beyond threshold, activate drag
      if (dx > SOCIAL_DRAG_THRESHOLD || dy > SOCIAL_DRAG_THRESHOLD) {
        e.preventDefault();
        setIsDraggingStandardSocial(true);
        setLiveSocialLeft(dragStartElementLeft);
        setLiveSocialTop(dragStartElementTop);
      }
      return;
    }
    
    if (!isDraggingStandardSocial || !standardSocialRef.current || !draggedElementRef.current) return;
    
    const containerRect = standardSocialRef.current.getBoundingClientRect();
    const elementRect = draggedElementRef.current.getBoundingClientRect();
    if (containerRect.width === 0) return;
    
    const deltaX = e.clientX - dragStartMouse.x;
    const deltaY = e.clientY - dragStartMouse.y;
    
    let newLeft = dragStartElementLeft + deltaX;
    let newTop = dragStartElementTop + deltaY;
    
    newLeft = Math.max(0, newLeft);
    const maxLeft = containerRect.width - elementRect.width;
    if (maxLeft > 0) {
      newLeft = Math.min(maxLeft, newLeft);
    }
    // Constrain vertically: allow movement up/down (more upward range for top-aligned layout)
    newTop = Math.max(-400, Math.min(200, newTop));
    
    setLiveSocialLeft(newLeft);
    setLiveSocialTop(newTop);
  }, [isDraggingStandardSocial, dragStartMouse, dragStartElementLeft, dragStartElementTop]);
  
  const handleStandardSocialDragEnd = useCallback(() => {
    // Mark if we just dragged to prevent click handler
    if (isDraggingStandardSocial) {
      standardSocialRecentDragRef.current = true;
      setTimeout(() => { standardSocialRecentDragRef.current = false; }, 100);
      
      // Save position as percentage (0-1) for proper scaling when container resizes
      // Store vertical offset RELATIVE TO ANCHOR for responsive positioning
      if (onEdit && standardSocialRef.current && heroInnerContainerRef.current && draggedElementRef.current && liveSocialLeft !== null && liveSocialTop !== null) {
        const containerRect = standardSocialRef.current.getBoundingClientRect();
        const parentRect = heroInnerContainerRef.current.getBoundingClientRect();
        const elementRect = draggedElementRef.current.getBoundingClientRect();
        
        // Calculate left position as percentage of container width
        const leftPercent = liveSocialLeft / containerRect.width;
        // Clamp to 0-1 range
        const clampedPercent = Math.max(0, Math.min(1, leftPercent));
        
        // Calculate element width as percentage for anchor determination
        const elementWidthPercent = containerRect.width > 0 ? elementRect.width / containerRect.width : 0.15;
        const elementRightPercent = clampedPercent + elementWidthPercent;
        
        // If element's right edge is to the LEFT of image's left edge, use text anchor
        const isInTextZone = elementRightPercent < absoluteImageLeft;
        const absoluteAnchor = isInTextZone ? absoluteTextBottom : absoluteImageBottom;
        
        // Convert absolute anchor to container-relative for storing offset
        const containerTop = containerRect.top - parentRect.top;
        const containerRelativeAnchor = absoluteAnchor - containerTop;
        
        const relativeOffset = liveSocialTop - containerRelativeAnchor;
        
        onEdit('hero.standardSocialLinksHorizontalAlign', clampedPercent as any);
        onEdit('hero.standardSocialLinksVerticalOffset', relativeOffset as any);
        onEdit('hero.standardSocialLinksWidthPercent', elementWidthPercent as any); // Store width for consistent zone detection
      }
    }
    
    // Clear all drag state
    pendingStandardSocialDragRef.current = null;
    standardSocialMouseDownRef.current = null;
    setHasPendingStandardSocialDrag(false);
    setIsDraggingStandardSocial(false);
    setLiveSocialLeft(null);
    setLiveSocialTop(null);
    draggedElementRef.current = null;
  }, [isDraggingStandardSocial, onEdit, liveSocialLeft, liveSocialTop, absoluteTextBottom, absoluteImageBottom, absoluteImageLeft]);
  
  // LEGACY: Drag handlers for pixel-based positioning (kept for backward compatibility)
  const [legacyDragOffset, setLegacyDragOffset] = useState({ x: 0, y: 0 });
  
  const handleLegacyButtonsDragStart = useCallback((e: ReactMouseEvent) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    setLegacyDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDraggingStandardButtons(true);
  }, [editable]);
  
  const handleLegacyButtonsDragMove = useCallback((e: MouseEvent) => {
    if (!isDraggingStandardButtons || !onEdit || !heroSectionRef.current) return;
    
    const sectionRect = heroSectionRef.current.getBoundingClientRect();
    
    const newX = e.clientX - sectionRect.left - legacyDragOffset.x;
    const newY = e.clientY - sectionRect.top - legacyDragOffset.y;
    
    const clampedX = Math.max(0, Math.min(sectionRect.width - 100, newX));
    const clampedY = Math.max(0, newY);
    
    onEdit('hero.standardButtonsPosition', { x: Math.round(clampedX), y: Math.round(clampedY) } as any);
    
    const buttonsBottom = clampedY + 120;
    const socialY = hero?.standardSocialLinksPosition?.y || 0;
    const socialBottom = socialY > 0 ? socialY + 80 : 0;
    const neededHeight = Math.max(buttonsBottom, socialBottom);
    const minHeightValue = neededHeight > 500 ? neededHeight : 0;
    onEdit('hero.standardHeroMinHeight', minHeightValue.toString());
  }, [isDraggingStandardButtons, legacyDragOffset, hero?.standardSocialLinksPosition, onEdit]);
  
  const handleLegacyButtonsDragEnd = useCallback(() => {
    setIsDraggingStandardButtons(false);
  }, []);
  
  // Legacy social drag - also uses pending drag pattern
  const [hasPendingLegacySocialDrag, setHasPendingLegacySocialDrag] = useState(false);
  const pendingLegacySocialDragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const legacySocialRecentDragRef = useRef(false);
  const legacySocialMouseDownRef = useRef<{ x: number; y: number } | null>(null);
  
  const handleLegacySocialMouseDown = useCallback((e: ReactMouseEvent) => {
    if (!editable) return;
    const targetEl = e.target as HTMLElement;
    if (targetEl.tagName === 'A' || targetEl.closest('a')) return;
    
    legacySocialMouseDownRef.current = { x: e.clientX, y: e.clientY };
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    pendingLegacySocialDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };
    setHasPendingLegacySocialDrag(true);
  }, [editable]);
  
  const handleLegacySocialClick = useCallback((e: ReactMouseEvent, targetElement: HTMLDivElement | null) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) return;
    if (legacySocialRecentDragRef.current) return;
    
    if (legacySocialMouseDownRef.current) {
      const dx = Math.abs(e.clientX - legacySocialMouseDownRef.current.x);
      const dy = Math.abs(e.clientY - legacySocialMouseDownRef.current.y);
      legacySocialMouseDownRef.current = null;
      if (dx > SOCIAL_DRAG_THRESHOLD || dy > SOCIAL_DRAG_THRESHOLD) return;
    }
    
    if (editable) {
      e.stopPropagation();
      socialIconSizeTargetRef.current = targetElement;
      setShowSocialIconSizePopup(true);
    }
  }, [editable]);
  
  const handleLegacySocialDragMove = useCallback((e: MouseEvent) => {
    // Check for pending drag that hasn't activated yet
    if (pendingLegacySocialDragRef.current && !isDraggingStandardSocial) {
      const dx = Math.abs(e.clientX - pendingLegacySocialDragRef.current.startX);
      const dy = Math.abs(e.clientY - pendingLegacySocialDragRef.current.startY);
      
      if (dx > SOCIAL_DRAG_THRESHOLD || dy > SOCIAL_DRAG_THRESHOLD) {
        e.preventDefault();
        setLegacyDragOffset({
          x: pendingLegacySocialDragRef.current.offsetX,
          y: pendingLegacySocialDragRef.current.offsetY
        });
        setIsDraggingStandardSocial(true);
      }
      return;
    }
    
    if (!isDraggingStandardSocial || !onEdit || !heroSectionRef.current) return;
    
    const sectionRect = heroSectionRef.current.getBoundingClientRect();
    
    const newX = e.clientX - sectionRect.left - legacyDragOffset.x;
    const newY = e.clientY - sectionRect.top - legacyDragOffset.y;
    
    const clampedX = Math.max(0, Math.min(sectionRect.width - 100, newX));
    const clampedY = Math.max(0, newY);
    
    onEdit('hero.standardSocialLinksPosition', { x: Math.round(clampedX), y: Math.round(clampedY) } as any);
    
    const socialBottom = clampedY + 80;
    const buttonsY = hero?.standardButtonsPosition?.y || 0;
    const buttonsBottom = buttonsY > 0 ? buttonsY + 120 : 0;
    const neededHeight = Math.max(socialBottom, buttonsBottom);
    const minHeightValue = neededHeight > 500 ? neededHeight : 0;
    onEdit('hero.standardHeroMinHeight', minHeightValue.toString());
  }, [isDraggingStandardSocial, legacyDragOffset, hero?.standardButtonsPosition, onEdit]);
  
  const handleLegacySocialDragEnd = useCallback(() => {
    if (isDraggingStandardSocial) {
      legacySocialRecentDragRef.current = true;
      setTimeout(() => { legacySocialRecentDragRef.current = false; }, 100);
    }
    pendingLegacySocialDragRef.current = null;
    legacySocialMouseDownRef.current = null;
    setHasPendingLegacySocialDrag(false);
    setIsDraggingStandardSocial(false);
  }, [isDraggingStandardSocial]);
  
  // Determine which drag handlers to use based on positioning mode
  const isUsingNewAlignSystem = hasStandardButtonsHorizontalAlign || hasStandardSocialLinksHorizontalAlign;
  const isUsingLegacySystem = (hasStandardButtonsPosition || hasStandardSocialLinksPosition) && !isUsingNewAlignSystem;
  
  // Effect for buttons drag (selects between new and legacy handlers)
  useEffect(() => {
    if (isDraggingStandardButtons) {
      const moveHandler = isUsingLegacySystem ? handleLegacyButtonsDragMove : handleStandardButtonsDragMove;
      const endHandler = isUsingLegacySystem ? handleLegacyButtonsDragEnd : handleStandardButtonsDragEnd;
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', endHandler);
      return () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', endHandler);
      };
    }
  }, [isDraggingStandardButtons, isUsingLegacySystem, handleLegacyButtonsDragMove, handleLegacyButtonsDragEnd, handleStandardButtonsDragMove, handleStandardButtonsDragEnd]);
  
  // Effect for social drag (selects between new and legacy handlers)
  useEffect(() => {
    const hasPending = isUsingLegacySystem ? hasPendingLegacySocialDrag : hasPendingStandardSocialDrag;
    if (hasPending || isDraggingStandardSocial) {
      const moveHandler = isUsingLegacySystem ? handleLegacySocialDragMove : handleStandardSocialDragMove;
      const endHandler = isUsingLegacySystem ? handleLegacySocialDragEnd : handleStandardSocialDragEnd;
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', endHandler);
      return () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', endHandler);
      };
    }
  }, [hasPendingStandardSocialDrag, hasPendingLegacySocialDrag, isDraggingStandardSocial, isUsingLegacySystem, handleLegacySocialDragMove, handleLegacySocialDragEnd, handleStandardSocialDragMove, handleStandardSocialDragEnd]);
  
  // Calculate position style using percentage-based left positioning
  // leftPercent: 0-1 value representing position from left edge (0 = far left, 1 = far right)
  // verticalOffset: pixel offset from the anchor point (text bottom or image bottom)
  // Anchor selection: if element is entirely in text zone (left of image), anchor to text; otherwise to image
  // containerRef: the container element to calculate positions relative to
  const getPositionStyle = (
    leftPercent: number, 
    verticalOffset: number, 
    elementWidthPercent: number = 0.25,
    containerRef: React.RefObject<HTMLDivElement | null>
  ) => {
    // Handle legacy values (pixel offsets from center, typically large numbers or negative)
    // New values are 0-1 percentages
    let safePercent: number;
    if (leftPercent > 1 || leftPercent < 0) {
      // Legacy pixel offset from center - reset to left aligned (0%)
      safePercent = 0;
    } else {
      safePercent = leftPercent;
    }
    
    // Determine anchor based on element position relative to image
    const elementRightPercent = safePercent + elementWidthPercent;
    const isInTextZone = elementRightPercent < absoluteImageLeft;
    
    // Use text anchor if element is entirely in text zone, otherwise use image anchor
    const absoluteAnchor = isInTextZone ? absoluteTextBottom : absoluteImageBottom;
    
    // Convert absolute anchor to container-relative position
    let containerRelativeAnchor = absoluteAnchor;
    if (containerRef.current && heroInnerContainerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const parentRect = heroInnerContainerRef.current.getBoundingClientRect();
      const containerTop = containerRect.top - parentRect.top;
      containerRelativeAnchor = absoluteAnchor - containerTop;
    }
    
    // Calculate final top position: anchor bottom + stored offset
    const finalTop = containerRelativeAnchor + (verticalOffset || 0);
    
    return {
      left: `${safePercent * 100}%`,
      top: `${finalTop}px`,
    };
  };

  // Render standard two-column layout
  if (!isFullwidthOverlay) {
    return (
      <>
        {/* Resource hints for faster loading */}
        {preloadHints.length > 0 && (
          <Head>
            {preloadHints}
          </Head>
        )}
        
        <section 
          ref={heroSectionRef}
          id={sectionId} 
          className={`relative ${backgroundClass} ${isPreview ? '' : 'body-padding'}`}
          style={{
            // Ensure section is tall enough for positioned elements
            // Uses adaptive calculation for standard layout, or legacy value for pixel positioning
            minHeight: adaptiveBottomPadding > 0 
              ? `${adaptiveBottomPadding}px` 
              : (standardHeroMinHeight > 0 ? `${standardHeroMinHeight}px` : undefined)
          }}
        >
          <div 
            ref={heroInnerContainerRef} 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative"
          >
          {/* Alignment guides - shown when dragging */}
          {(isDraggingStandardButtons || isDraggingStandardSocial) && editable && (
            <>
              {/* Vertical center line - dotted, uses hero text color for visibility */}
              <div 
                className="absolute top-0 bottom-0 pointer-events-none z-50"
                style={{ 
                  left: '50%', 
                  width: '2px',
                  backgroundImage: `repeating-linear-gradient(to bottom, ${hero?.colors?.headline || '#000'} 0, ${hero?.colors?.headline || '#000'} 8px, transparent 8px, transparent 16px)`
                }}
              />
              {/* Center line label */}
              <div 
                className="absolute top-2 text-xs px-1.5 py-0.5 rounded pointer-events-none z-50"
                style={{ 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  backgroundColor: hero?.colors?.headline || '#000',
                  color: hero?.colors?.headline === '#ffffff' || hero?.colors?.headline === '#fff' || hero?.colors?.headline === 'white' ? '#000' : '#fff'
                }}
              >
                center
              </div>
            </>
          )}
          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Text Content */}
            <div className="order-2 lg:order-1 text-left relative pt-0 lg:pt-8">
              <div className="animate-fade-in">
              <EditableText
                as="h1"
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-none mb-6"
                style={{ color: hero?.colors?.headline }}
                value={hero?.headline || 'Your Trusted Local Business'}
                path="hero.headline"
                editable={editable}
                onEdit={onEdit}
                placeholder="Enter your main headline"
                textSize={hero?.headlineTextSize || 3.75}
                onTextSizeChange={onEdit ? (size: number) => onEdit('hero.headlineTextSize', size.toString()) : undefined}
                textSizeLabel="Hero Headline Size"
                textSizePresets={[2.5, 3.75, 4.5, 5.5]}
                textSizeNormal={3.75}
                textSizeMin={2.0}
                textSizeMax={6.0}
                textColor={hero?.colors?.headline}
                onTextColorChange={onEdit ? (color: string) => onEdit('hero.colors.headline', color) : undefined}
                showColorPicker={true}
                presetColors={['#000000', '#ffffff', ...(colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : [])]}
                textAlign={hero?.headlineAlign || 'left'}
                onTextAlignChange={onEdit ? (align: 'left' | 'center' | 'right') => onEdit('hero.headlineAlign', align) : undefined}
                showAlignmentToggle={true}
                fontFamily={hero?.headlineFont}
                onFontFamilyChange={onEdit ? (font: string) => onEdit('hero.headlineFont', font) : undefined}
                showFontPicker={true}
              />
              <div ref={heroSubheadlineRef}>
                <EditableText
                  as="p"
                  className={`text-lg md:text-xl text-gray-600 mb-8 leading-relaxed ${(hero?.subheadlineBold === true || String(hero?.subheadlineBold) === 'true') ? 'font-bold' : ''}`}
                  style={{ color: hero?.colors?.subheadline }}
                  value={hero?.subheadline}
                  path="hero.subheadline"
                  editable={editable}
                  onEdit={onEdit}
                  placeholder="Enter your subheadline"
                  multiline
                  textSize={hero?.subheadlineTextSize || 1.25}
                  onTextSizeChange={onEdit ? (size: number) => onEdit('hero.subheadlineTextSize', size.toString()) : undefined}
                  textSizeLabel="Hero Subheadline Size"
                  textSizePresets={[1.0, 1.25, 1.5, 1.75]}
                  textSizeNormal={1.25}
                  textSizeMin={0.875}
                  textSizeMax={2.5}
                  textColor={hero?.colors?.subheadline}
                  onTextColorChange={onEdit ? (color: string) => onEdit('hero.colors.subheadline', color) : undefined}
                  showColorPicker={true}
                  presetColors={['#000000', '#ffffff', ...(colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : [])]}
                  textBold={hero?.subheadlineBold === true || String(hero?.subheadlineBold) === 'true'}
                  onTextBoldChange={onEdit ? (bold: boolean) => onEdit('hero.subheadlineBold', bold.toString()) : undefined}
                  showBoldToggle={true}
                  textAlign={hero?.subheadlineAlign || 'left'}
                  onTextAlignChange={onEdit ? (align: 'left' | 'center' | 'right') => onEdit('hero.subheadlineAlign', align) : undefined}
                  showAlignmentToggle={true}
                  fontFamily={hero?.subheadlineFont}
                  onFontFamilyChange={onEdit ? (font: string) => onEdit('hero.subheadlineFont', font) : undefined}
                  showFontPicker={true}
                />
              </div>
                
              </div>
            </div>

            {/* Hero Media (Image or Video) */}
            <div className="order-1 lg:order-2" ref={heroMediaContainerRef}>
              <div className="relative">
                {/* Decorative elements - behind the media */}
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary-100 rounded-full filter blur-xl opacity-70 animate-pulse -z-10"></div>
                <div className="absolute -bottom-8 -right-8 w-72 h-72 bg-primary-200 rounded-full filter blur-xl opacity-70 animate-pulse delay-700 -z-10"></div>

                {/* Media container */}
                {hero?.mediaType === 'video' && videoEmbedSrc ? (
                  <div className="relative z-10 w-full mx-auto">
                    <div 
                      className="relative w-full overflow-hidden rounded-2xl shadow-2xl"
                      style={{ paddingTop: `${videoAspectRatio}%` }}
                    >
                      {videoLoading && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                          <div className="text-center">
                            <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-2"></div>
                            <p className="text-gray-500 text-sm">Loading video...</p>
                          </div>
                        </div>
                      )}
                      
                      <iframe
                        src={videoEmbedSrc}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${videoLoading ? 'opacity-0' : 'opacity-100'}`}
                        style={{ 
                          border: 'none',
                          width: '100%',
                          height: '100%',
                          position: 'absolute',
                          top: 0,
                          left: 0
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                        allowFullScreen
                        frameBorder="0"
                        title={hero.subheadline || hero.headline || 'Hero Video'}
                        onLoad={() => {
                          setTimeout(() => setVideoLoading(false), 500);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`relative z-10 aspect-[4/3] lg:aspect-[16/10] ${editable && onHeroImageClick ? 'cursor-pointer group' : ''}`}
                    onClick={editable && onHeroImageClick ? onHeroImageClick : undefined}
                    title={editable && onHeroImageClick ? 'Click to upload hero image' : undefined}
                  >
                    {imageLoading && (
                      <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center rounded-2xl">
                        <div className="text-center">
                          <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-2"></div>
                          <p className="text-gray-500 text-sm">Loading image...</p>
                        </div>
                      </div>
                    )}
                    
                    {heroImages.length > 0 ? (
                      <>
                        {heroImages.map((imageUrl, index) => {
                          const isIdbUrl = imageUrl.startsWith('idb://');
                          const ImageComponent = isIdbUrl ? IdbImage : Image;
                          
                          return (
                            <ImageComponent
                              key={`hero-image-${index}`}
                              src={imageUrl} 
                              alt={`${hero?.subheadline || hero?.headline || 'Hero'} - Image ${index + 1}`} 
                              fill
                              className={`object-cover rounded-2xl shadow-2xl hover-lift transition-opacity duration-1000 ${
                                imageLoading ? 'opacity-0' : 
                                index === currentSlideIndex ? 'opacity-100' : 'opacity-0'
                              } ${editable && onHeroImageClick ? 'group-hover:opacity-75' : ''}`}
                              priority={index === 0}
                              loading="eager"
                              sizes={isIdbUrl ? undefined : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                              onLoad={() => {
                                if (index === 0) setImageLoading(false);
                              }}
                            />
                          );
                        })}
                        {/* Edit Image(s) button - top right corner */}
                        {editable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowImageEditor(true);
                            }}
                            className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg shadow-lg transition-all duration-200 hover:scale-105 border border-white/20"
                            title="Edit hero images"
                          >
                            <PhotoIcon className="w-4 h-4" />
                            <span>Edit Image{heroImages.length > 1 ? 's' : ''}</span>
                            {heroImages.length > 1 && (
                              <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">
                                {heroImages.length}
                              </span>
                            )}
                          </button>
                        )}
                        {editable && onHeroImageClick && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            <div className="bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Upload Hero Image
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <Image
                        src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                        alt="Hero"
                        fill
                        className={`object-cover rounded-2xl shadow-2xl hover-lift transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={true}
                        onLoad={() => setImageLoading(false)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 
            Buttons and Social Links Positioning for Standard Layout
            Priority order:
            1. NEW alignment system (0-1 scale) - most flexible
            2. LEGACY pixel positioning - backward compatibility
            3. Inline default - when nothing is configured
            On mobile: always centered, ignoring desktop settings
          */}
          
          {/* CTA Buttons */}
          {(() => {
            // Determine rendering mode
            const useNewAlign = hasStandardButtonsHorizontalAlign && !hasStandardButtonsPosition;
            const useLegacyPixel = hasStandardButtonsPosition && !hasStandardButtonsHorizontalAlign;
            const useInline = !hasStandardButtonsHorizontalAlign && !hasStandardButtonsPosition;
            
            // On mobile: always render full-width column layout with fixed positioning
            // Desktop position settings are ignored - mobile has its own clean layout
            if (isMobile) {
              return (
                <div className="mt-6 w-full px-4" ref={standardButtonsRef}>
                  <ButtonGridEditor
                    buttons={ctaButtons}
                    gridLayout={effectiveGridLayout}
                    onLayoutChange={handleGridLayoutChange}
                    onButtonClick={onButtonClick}
                    editable={editable}
                    colorPalette={colorPalette}
                    defaultCtaBg={hero?.colors?.ctaBackground}
                    defaultCtaText={hero?.colors?.ctaText}
                    getButtonStyles={getButtonStyles}
                    ctaButtons={hero?.ctaButtons}
                    onEdit={onEdit}
                    payment={payment}
                    isFullwidthOverlay={false}
                    isMobile={true}
                    buttonStyles={hero?.buttonStyles}
                    onButtonStylesChange={handleButtonStylesChange}
                  />
                </div>
              );
            }
            
            // NEW: Simple drag positioning - element follows mouse EXACTLY within bounds
            if (useNewAlign) {
              const align = parseNum(hero?.standardButtonsHorizontalAlign, 0);
              const verticalOffset = parseNum(hero?.standardButtonsVerticalOffset, 0);
              const storedWidth = parseNum(hero?.standardButtonsWidthPercent, 0.25); // Use stored width for consistent zone detection
              
              // During drag: use live pixel position directly
              // Not dragging: calculate from stored 0-1 alignment
              const posStyle = (isDraggingStandardButtons && liveButtonsLeft !== null) 
                ? { left: `${liveButtonsLeft}px`, top: `${liveButtonsTop}px` }
                : getPositionStyle(align, verticalOffset, storedWidth, standardButtonsRef);
              
              // Key based on anchor values forces re-render when anchors change
              const positionKey = `btns-${Math.round(absoluteTextBottom)}-${Math.round(absoluteImageBottom)}`;
              
              return (
                <div className="mt-8 w-full relative" ref={standardButtonsRef} style={{ minHeight: '80px' }}>
                  {/* Draggable content */}
                  <div 
                    key={positionKey}
                    ref={standardButtonsDraggableRef}
                    className={`absolute ${editable ? 'cursor-move' : ''} ${isDraggingStandardButtons ? '' : ''}`}
                    style={posStyle}
                    onMouseDown={(e) => standardButtonsDraggableRef.current && handleStandardButtonsDragStart(e, standardButtonsDraggableRef.current)}
                  >
                    {/* Drag handle for editor */}
                    {editable && (
                      <div 
                        className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-500/90 text-white text-xs px-2 py-1 rounded-t flex items-center gap-1 whitespace-nowrap z-10"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        Drag to position
                        {/* Reset button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEdit) {
                              onEdit('hero.standardButtonsHorizontalAlign', null as any);
                              onEdit('hero.standardButtonsVerticalOffset', null as any);
                              onEdit('hero.standardButtonsWidthPercent', null as any);
                            }
                          }}
                          className="ml-2 px-1.5 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10px] transition-colors"
                          title="Reset to default position"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                    <ButtonGridEditor
                      buttons={ctaButtons}
                      gridLayout={effectiveGridLayout}
                      onLayoutChange={handleGridLayoutChange}
                      onButtonClick={onButtonClick}
                      editable={editable}
                      colorPalette={colorPalette}
                      defaultCtaBg={hero?.colors?.ctaBackground}
                      defaultCtaText={hero?.colors?.ctaText}
                      getButtonStyles={getButtonStyles}
                      ctaButtons={hero?.ctaButtons}
                      onEdit={onEdit}
                      payment={payment}
                      isFullwidthOverlay={false}
                      isMobile={isMobile}
                      buttonStyles={hero?.buttonStyles}
                      onButtonStylesChange={handleButtonStylesChange}
                      alignToStart={true}
                    />
                  </div>
                </div>
              );
            }
            
            // LEGACY: Pixel-based absolute positioning (backward compatibility)
            if (useLegacyPixel && hero?.standardButtonsPosition) {
              return (
                <div 
                  className={`absolute z-30 ${editable ? 'cursor-grab' : ''} ${isDraggingStandardButtons ? 'cursor-grabbing opacity-70' : ''}`}
                  style={{
                    left: `${hero.standardButtonsPosition.x}px`,
                    top: `${hero.standardButtonsPosition.y}px`,
                  }}
                  onMouseDown={handleLegacyButtonsDragStart}
                  ref={standardButtonsRef}
                >
                  {/* Drag handle for editor */}
                  {editable && (
                    <div 
                      className="absolute -top-6 left-0 bg-purple-500/90 text-white text-xs px-2 py-1 rounded-t flex items-center gap-1 whitespace-nowrap cursor-grab"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Drag Buttons (Legacy)
                      {/* Reset button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEdit) {
                            onEdit('hero.standardButtonsPosition', null as any);
                            onEdit('hero.standardHeroMinHeight', null as any);
                          }
                        }}
                        className="ml-2 px-1.5 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10px] transition-colors"
                        title="Reset to inline position"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                  <ButtonGridEditor
                    buttons={ctaButtons}
                    gridLayout={effectiveGridLayout}
                    onLayoutChange={handleGridLayoutChange}
                    onButtonClick={onButtonClick}
                    editable={editable}
                    colorPalette={colorPalette}
                    defaultCtaBg={hero?.colors?.ctaBackground}
                    defaultCtaText={hero?.colors?.ctaText}
                    getButtonStyles={getButtonStyles}
                    ctaButtons={hero?.ctaButtons}
                    onEdit={onEdit}
                    payment={payment}
                    isFullwidthOverlay={false}
                    isMobile={isMobile}
                    buttonStyles={hero?.buttonStyles}
                    onButtonStylesChange={handleButtonStylesChange}
                  />
                </div>
              );
            }
            
            // DEFAULT: Inline rendering (no positioning - click to enable positioning)
            return (
              <div 
                className="mt-8"
                ref={standardButtonsRef}
              >
                <div 
                  ref={standardButtonsDraggableRef}
                  className={`inline-block relative ${editable ? 'cursor-pointer' : ''}`}
                  onClick={(e) => {
                    if (!editable) return;
                    // Calculate current position so buttons don't jump when enabling positioning
                    if (onEdit && standardButtonsRef.current && standardButtonsDraggableRef.current && heroInnerContainerRef.current) {
                      const containerRect = standardButtonsRef.current.getBoundingClientRect();
                      const parentRect = heroInnerContainerRef.current.getBoundingClientRect();
                      const elementRect = standardButtonsDraggableRef.current.getBoundingClientRect();
                      
                      // Calculate current left position as percentage of container width
                      const currentLeft = elementRect.left - containerRect.left;
                      const leftPercent = containerRect.width > 0 ? currentLeft / containerRect.width : 0;
                      const clampedPercent = Math.max(0, Math.min(1, leftPercent));
                      
                      // Calculate current top position relative to anchor
                      const currentTop = elementRect.top - containerRect.top;
                      const buttonWidthPercent = containerRect.width > 0 ? elementRect.width / containerRect.width : 0.25;
                      const buttonRightPercent = clampedPercent + buttonWidthPercent;
                      const isInTextZone = buttonRightPercent < absoluteImageLeft;
                      const absoluteAnchor = isInTextZone ? absoluteTextBottom : absoluteImageBottom;
                      const containerTop = containerRect.top - parentRect.top;
                      const containerRelativeAnchor = absoluteAnchor - containerTop;
                      const relativeOffset = currentTop - containerRelativeAnchor;
                      
                      onEdit('hero.standardButtonsHorizontalAlign', clampedPercent as any);
                      onEdit('hero.standardButtonsVerticalOffset', relativeOffset as any);
                      onEdit('hero.standardButtonsWidthPercent', buttonWidthPercent as any);
                    }
                  }}
                >
                  {/* Click hint for editor to enable positioning */}
                  {editable && (
                    <div 
                      className="absolute -top-6 left-0 bg-gray-500/90 text-white text-xs px-2 py-1 rounded-t flex items-center gap-1 whitespace-nowrap z-10"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      Click to enable positioning
                    </div>
                  )}
                  <ButtonGridEditor
                    buttons={ctaButtons}
                    gridLayout={effectiveGridLayout}
                    onLayoutChange={handleGridLayoutChange}
                    onButtonClick={onButtonClick}
                    editable={editable}
                    colorPalette={colorPalette}
                    defaultCtaBg={hero?.colors?.ctaBackground}
                    defaultCtaText={hero?.colors?.ctaText}
                    getButtonStyles={getButtonStyles}
                    ctaButtons={hero?.ctaButtons}
                    onEdit={onEdit}
                    payment={payment}
                    isFullwidthOverlay={false}
                    isMobile={isMobile}
                    buttonStyles={hero?.buttonStyles}
                    onButtonStylesChange={handleButtonStylesChange}
                    alignToStart={true}
                  />
                </div>
              </div>
            );
          })()}
          
          {/* Social Links */}
          {socialLinks?.showInHero && socialLinks?.links && hasSocialLinks(socialLinks.links) && (() => {
            // Determine rendering mode
            const useNewAlign = hasStandardSocialLinksHorizontalAlign && !hasStandardSocialLinksPosition;
            const useLegacyPixel = hasStandardSocialLinksPosition && !hasStandardSocialLinksHorizontalAlign;
            const useInline = !hasStandardSocialLinksHorizontalAlign && !hasStandardSocialLinksPosition;
            
            // On mobile: always render centered (click to edit only, no drag)
            if (isMobile) {
              return (
                <div 
                  className={`mt-4 p-2 -m-2 rounded ${editable ? 'hover:border hover:border-dashed hover:border-gray-400 cursor-pointer' : ''}`} 
                  ref={standardSocialRef}
                  onClick={(e) => {
                    if (!editable) return;
                    if ((e.target as HTMLElement).tagName === 'A' || (e.target as HTMLElement).closest('a')) return;
                    e.stopPropagation();
                    socialIconSizeTargetRef.current = standardSocialRef.current;
                    setShowSocialIconSizePopup(true);
                  }}
                >
                  <HeroSocialLinks socialLinks={socialLinks} align="center" isFullwidthOverlay={false} compact={true} />
                </div>
              );
            }
            
            // NEW: Simple drag positioning - element follows mouse EXACTLY within bounds
            if (useNewAlign) {
              const align = parseNum(hero?.standardSocialLinksHorizontalAlign, 0);
              const verticalOffset = parseNum(hero?.standardSocialLinksVerticalOffset, 0);
              const storedWidth = parseNum(hero?.standardSocialLinksWidthPercent, 0.15); // Use stored width for consistent zone detection
              
              const posStyle = (isDraggingStandardSocial && liveSocialLeft !== null) 
                ? { left: `${liveSocialLeft}px`, top: `${liveSocialTop}px` }
                : getPositionStyle(align, verticalOffset, storedWidth, standardSocialRef);
              
              // Key based on anchor values forces re-render when anchors change
              const positionKey = `social-${Math.round(absoluteTextBottom)}-${Math.round(absoluteImageBottom)}`;
              
              return (
                <div className="mt-4 w-full relative" ref={standardSocialRef} style={{ minHeight: '50px' }}>
                  <div 
                    key={positionKey}
                    ref={standardSocialDraggableRef}
                    className={`absolute ${editable ? 'cursor-move' : ''} ${isDraggingStandardSocial ? 'opacity-70' : ''}`}
                    style={posStyle}
                    onMouseDown={(e) => {
                      standardSocialDraggableRef.current && handleStandardSocialMouseDown(e, standardSocialDraggableRef.current);
                    }}
                    onClick={(e) => {
                      handleStandardSocialClick(e, standardSocialDraggableRef.current);
                    }}
                  >
                    {/* Drag handle for editor */}
                    {editable && (
                      <div 
                        className="absolute -top-6 left-1/2 -translate-x-1/2 bg-purple-500/90 text-white text-xs px-2 py-1 rounded-t flex items-center gap-1 whitespace-nowrap z-10"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        Drag to position
                        {/* Reset button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEdit) {
                              onEdit('hero.standardSocialLinksHorizontalAlign', null as any);
                              onEdit('hero.standardSocialLinksVerticalOffset', null as any);
                              onEdit('hero.standardSocialLinksWidthPercent', null as any);
                            }
                          }}
                          className="ml-2 px-1.5 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10px] transition-colors"
                          title="Reset to default position"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                    <HeroSocialLinks socialLinks={socialLinks} align="left" isFullwidthOverlay={false} compact={true} className="!mt-0" />
                  </div>
                </div>
              );
            }
            
            // LEGACY: Pixel-based absolute positioning (backward compatibility)
            if (useLegacyPixel && hero?.standardSocialLinksPosition) {
              return (
                <div 
                  className={`absolute z-30 p-2 -m-2 rounded ${editable ? 'hover:border hover:border-dashed hover:border-gray-400 cursor-pointer' : ''} ${isDraggingStandardSocial ? 'opacity-70' : ''}`}
                  style={{
                    left: `${hero.standardSocialLinksPosition.x}px`,
                    top: `${hero.standardSocialLinksPosition.y}px`,
                  }}
                  onMouseDown={handleLegacySocialMouseDown}
                  onClick={(e) => handleLegacySocialClick(e, standardSocialRef.current)}
                  ref={standardSocialRef}
                >
                  <HeroSocialLinks socialLinks={socialLinks} align="left" isFullwidthOverlay={false} compact={true} />
                </div>
              );
            }
            
            // DEFAULT: Inline rendering - click to enable positioning (same as buttons)
            return (
              <div className="mt-4" ref={standardSocialRef}>
                <div 
                  ref={standardSocialDraggableRef}
                  className={`inline-block relative p-2 -m-2 rounded ${editable ? 'cursor-pointer' : ''}`}
                  onClick={(e) => {
                    if (!editable) return;
                    if ((e.target as HTMLElement).tagName === 'A' || (e.target as HTMLElement).closest('a')) return;
                    e.stopPropagation();
                    // Calculate current position so social links don't jump when enabling positioning
                    if (onEdit && standardSocialRef.current && standardSocialDraggableRef.current && heroInnerContainerRef.current) {
                      const containerRect = standardSocialRef.current.getBoundingClientRect();
                      const parentRect = heroInnerContainerRef.current.getBoundingClientRect();
                      const elementRect = standardSocialDraggableRef.current.getBoundingClientRect();
                      
                      // Calculate current left position as percentage of container width
                      const currentLeft = elementRect.left - containerRect.left;
                      const leftPercent = containerRect.width > 0 ? currentLeft / containerRect.width : 0;
                      const clampedPercent = Math.max(0, Math.min(1, leftPercent));
                      
                      // Calculate current top position relative to anchor
                      const currentTop = elementRect.top - containerRect.top;
                      const elementWidthPercent = containerRect.width > 0 ? elementRect.width / containerRect.width : 0.15;
                      const elementRightPercent = clampedPercent + elementWidthPercent;
                      const isInTextZone = elementRightPercent < absoluteImageLeft;
                      const absoluteAnchor = isInTextZone ? absoluteTextBottom : absoluteImageBottom;
                      const containerTop = containerRect.top - parentRect.top;
                      const containerRelativeAnchor = absoluteAnchor - containerTop;
                      const relativeOffset = currentTop - containerRelativeAnchor;
                      
                      onEdit('hero.standardSocialLinksHorizontalAlign', clampedPercent as any);
                      onEdit('hero.standardSocialLinksVerticalOffset', relativeOffset as any);
                      onEdit('hero.standardSocialLinksWidthPercent', elementWidthPercent as any);
                    }
                  }}
                >
                  {/* Click hint for editor to enable positioning */}
                  {editable && (
                    <div 
                      className="absolute -top-6 left-0 bg-gray-500/90 text-white text-xs px-2 py-1 rounded-t flex items-center gap-1 whitespace-nowrap z-10"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      Click to enable positioning
                    </div>
                  )}
                  <HeroSocialLinks socialLinks={socialLinks} align="left" isFullwidthOverlay={false} compact={true} className="!mt-0" />
                </div>
              </div>
            );
          })()}
        </div>

          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-primary-100 to-transparent rounded-full transform translate-x-32 opacity-20"></div>
            <div className="absolute bottom-20 left-0 w-96 h-96 bg-gradient-to-tr from-primary-100 to-transparent rounded-full transform -translate-x-32 opacity-20"></div>
          </div>
        </section>
        
        {/* Hero Image Editor Modal */}
        {editable && (
          <HeroImageEditor
            isOpen={showImageEditor}
            layoutStyle={hero?.layoutStyle || 'standard'}
            onLayoutStyleChange={handleLayoutStyleChange}
            overlayBlur={hero?.overlayBlur || false}
            onOverlayBlurChange={handleOverlayBlurChange}
            mediaType={hero?.mediaType || 'photo'}
            onMediaTypeChange={handleMediaTypeChange}
            images={heroImages}
            slideshowInterval={slideshowInterval}
            onImagesChange={handleHeroImagesChange}
            onSlideshowIntervalChange={handleSlideshowIntervalChange}
            onAddImage={onHeroImageAddClick}
            storage={imageStorage}
            video={hero?.video}
            onVideoChange={handleVideoChange}
            onClose={() => setShowImageEditor(false)}
          />
        )}
        
        {/* Social Links Editor Popup - for standard layout */}
        <SocialLinksEditorPopup
          isOpen={showSocialIconSizePopup}
          onClose={() => setShowSocialIconSizePopup(false)}
          socialLinks={socialLinks}
          onEdit={onEdit}
          targetElement={socialIconSizeTargetRef.current}
        />
      </>
    );
  }

  // Render fullwidth overlay layout
  return (
    <>
      {/* Resource hints for faster loading */}
      {preloadHints.length > 0 && (
        <Head>
          {preloadHints}
        </Head>
      )}
      
      <section id={sectionId} className={`relative ${isPreview ? '' : 'body-padding'} overflow-hidden`}>
        {/* Full-width media background */}
        {/* Mobile height is dynamic based on content; desktop uses fixed heights */}
        <div className="relative w-full min-h-[500px] md:h-[700px] lg:h-[800px] overflow-hidden flex flex-col md:block">
          {/* Alignment guides - shown when dragging in fullwidth overlay */}
          {(isDragging || isDraggingButtons || isDraggingSocialLinks) && editable && (
            <>
              {/* Vertical center line - dotted, uses hero text color for visibility */}
              <div 
                className="absolute top-0 bottom-0 pointer-events-none z-50"
                style={{ 
                  left: '50%', 
                  width: '2px',
                  backgroundImage: `repeating-linear-gradient(to bottom, ${hero?.colors?.headline || '#fff'} 0, ${hero?.colors?.headline || '#fff'} 8px, transparent 8px, transparent 16px)`
                }}
              />
              {/* Center line label */}
              <div 
                className="absolute top-2 text-xs px-1.5 py-0.5 rounded pointer-events-none z-50"
                style={{ 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  backgroundColor: hero?.colors?.headline || '#fff',
                  color: hero?.colors?.headline === '#000000' || hero?.colors?.headline === '#000' || hero?.colors?.headline === 'black' ? '#fff' : '#000'
                }}
              >
                center
              </div>
            </>
          )}
          {/* Media layer */}
          {hero?.mediaType === 'video' && videoEmbedSrc ? (
            <div ref={videoContainerRef} className="absolute inset-0">
              {videoLoading && (
                <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center">
                  <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-white/20 border-t-white/60 rounded-full animate-spin mb-2"></div>
                    <p className="text-white/60 text-sm">Loading video...</p>
                  </div>
                </div>
              )}
              
              <iframe
                src={videoEmbedSrc}
                className={`video-cover-iframe absolute transition-opacity duration-300 ${videoLoading ? 'opacity-0' : 'opacity-100'}`}
                style={{ 
                  border: 'none', 
                  pointerEvents: 'none',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  // Object-fit: cover behavior for iframes
                  // We compare container aspect ratio to video aspect ratio (assumed 16:9)
                  // and scale the iframe so the video overflows and covers completely.
                  // videoCoverDimensions is calculated based on measured container size.
                  width: videoCoverDimensions.width,
                  height: videoCoverDimensions.height,
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
                frameBorder="0"
                title={hero?.subheadline || hero?.headline || 'Hero Video'}
                onLoad={() => {
                  setTimeout(() => setVideoLoading(false), 500);
                }}
              />
            </div>
          ) : (
            <div 
              className={`absolute inset-0 ${editable && onHeroImageClick ? 'cursor-pointer group' : ''}`}
              onClick={editable && onHeroImageClick ? (e) => {
                // Only trigger if clicking on the background image, not on overlay content
                if (e.target === e.currentTarget) {
                  onHeroImageClick();
                }
              } : undefined}
              title={editable && onHeroImageClick ? 'Click to upload hero image' : undefined}
            >
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-900 animate-pulse flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-white/20 border-t-white/60 rounded-full animate-spin mb-2"></div>
                    <p className="text-white/60 text-sm">Loading image...</p>
                  </div>
                </div>
              )}
              
              {heroImages.length > 0 ? (
                <>
                  {heroImages.map((imageUrl, index) => {
                    const isIdbUrl = imageUrl.startsWith('idb://');
                    const ImageComponent = isIdbUrl ? IdbImage : Image;
                    
                    // For non-idb URLs, add unoptimized on mobile for better compatibility
                    const imageProps: any = {
                      src: imageUrl,
                      alt: `${hero?.subheadline || hero?.headline || 'Hero'} - Image ${index + 1}`,
                      fill: true,
                      className: `object-cover transition-opacity duration-1000 ${
                        imageLoading ? 'opacity-0' : 
                        index === currentSlideIndex ? 'opacity-100' : 'opacity-0'
                      } ${editable && onHeroImageClick ? 'group-hover:opacity-75' : ''}`,
                      priority: index === 0,
                      sizes: isIdbUrl ? undefined : "100vw",
                      onLoad: () => {
                        if (index === 0) {
                          setImageLoading(false);
                        }
                      },
                      onError: () => {
                        if (index === 0) {
                          console.error('Failed to load hero image:', imageUrl);
                          setImageLoading(false);
                        }
                      }
                    };
                    
                    // Add unoptimized for external images on mobile for better compatibility
                    if (!isIdbUrl && isMobile) {
                      imageProps.unoptimized = true;
                    }
                    
                    return <ImageComponent key={`hero-overlay-image-${index}`} {...imageProps} />;
                  })}
                  {editable && onHeroImageClick && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="bg-black/70 text-white px-6 py-3 rounded-lg text-base font-medium shadow-2xl">
                        <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload Hero Image
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Image
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
                  alt="Hero"
                  fill
                  className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  sizes="100vw"
                  priority={true}
                  onLoad={() => setImageLoading(false)}
                />
              )}
            </div>
          )}
          
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40 z-10"></div>
          
          {/* Edit Image(s) button - positioned above the overlay gradient (z-30) */}
          {editable && hero?.mediaType !== 'video' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImageEditor(true);
              }}
              className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg shadow-lg transition-all duration-200 hover:scale-105 border border-white/20"
              title="Edit hero images"
            >
              <PhotoIcon className="w-4 h-4" />
              <span>Edit Image{heroImages.length > 1 ? 's' : ''}</span>
              {heroImages.length > 1 && (
                <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">
                  {heroImages.length}
                </span>
              )}
            </button>
          )}
          
          {/* Text overlay content - constrained positioning area */}
          {/* On mobile: static positioning with flexbox for proper button layout */}
          {/* On desktop: absolute positioning with custom drag support */}
          <div 
            className={`z-20 px-4 sm:px-6 lg:px-8 ${
              isMobile 
                ? 'relative flex flex-col flex-1 pt-20 pb-0' 
                : 'absolute inset-0'
            }`}
            style={isMobile ? {} : {
              paddingTop: '2rem',
              paddingBottom: '2rem'
            }}
          >
              <div 
                ref={containerRef}
                className={`relative text-center ${editable && isFullwidthOverlay && !isMobile ? 'cursor-move' : ''} ${isDragging ? 'select-none opacity-80' : ''}`}
                onMouseDown={isMobile ? undefined : handleMouseDown}
                style={{
                  // Center content in the available space
                  display: 'flex',
                  flexDirection: 'column',
                  // On mobile, start from top; on desktop, center vertically
                  justifyContent: isMobile ? 'flex-start' : 'center',
                  alignItems: 'center',
                  // On mobile, let content flow naturally; on desktop, fill container
                  minHeight: isMobile ? 'auto' : '100%',
                  // When blur overlay is used, allow full width; otherwise constrain to 56rem
                  width: hero?.overlayBlur ? '100%' : '56rem',
                  maxWidth: hero?.overlayBlur ? '100%' : 'calc(100% - 2rem)',
                  margin: '0 auto',
                  // For custom positioning on desktop (non-mobile)
                  ...((!isMobile && hero?.overlayPosition) ? {
                    position: 'absolute',
                    left: hero.overlayPosition.x !== undefined ? `${hero.overlayPosition.x}%` : '50%',
                    top: hero.overlayPosition.y !== undefined ? `${hero.overlayPosition.y}%` : '50%',
                    transform: 'translate(-50%, -50%)',
                    margin: '0',
                  } : {}),
                  outlineWidth: editable && isFullwidthOverlay && !isMobile ? '2px' : '0',
                  outlineStyle: editable && isFullwidthOverlay && !isMobile ? 'dashed' : 'none',
                  outlineColor: editable && isFullwidthOverlay && !isDragging && !isMobile ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                  outlineOffset: '8px',
                }}
              >
              {hero?.overlayBlur ? (
                <div 
                  ref={overlayRef}
                  className="relative bg-black/50 backdrop-blur-sm rounded-2xl p-8 md:p-12"
                  style={{
                    width: hero?.overlaySize?.width ? `${hero.overlaySize.width}%` : 'auto',
                    minWidth: isMobile ? '90%' : '400px',
                    maxWidth: '100%',
                    paddingBottom: hero?.overlaySize?.bottomPadding ? `${(hero.overlaySize.bottomPadding) + 48}px` : undefined, // 48px is base padding (p-12)
                  }}
                >
                  {/* Recenter button - subtle control in top right */}
                  {editable && !isMobile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEdit) {
                          onEdit('hero.overlayPosition', { x: 50, y: 50 } as any);
                        }
                      }}
                      className="absolute top-2 right-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center gap-1 transition-all duration-200 group z-10"
                      title="Center overlay in hero"
                    >
                      {/* Crosshairs/center icon */}
                      <svg 
                        className="w-3 h-3 text-white/70 group-hover:text-white transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="3" strokeWidth="2" />
                        <path strokeLinecap="round" strokeWidth="2" d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                      </svg>
                      <span className="text-[10px] font-medium text-white/70 group-hover:text-white transition-colors uppercase tracking-wide">
                        Recenter
                      </span>
                    </button>
                  )}
                  <EditableText
                    as="h1"
                    className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 text-white"
                    style={{ 
                      color: hero?.colors?.headline,
                      textAlign: hero?.headlineAlign || 'center'
                    }}
                    value={hero?.headline || 'Your Trusted Local Business'}
                    path="hero.headline"
                    editable={editable}
                    onEdit={onEdit}
                    placeholder="Enter your main headline"
                    textSize={hero?.headlineTextSize || 3.75}
                    onTextSizeChange={onEdit ? (size: number) => onEdit('hero.headlineTextSize', size.toString()) : undefined}
                    textSizeLabel="Hero Headline Size"
                    textSizePresets={[2.5, 3.75, 4.5, 5.5]}
                    textSizeNormal={3.75}
                    textSizeMin={2.0}
                    textSizeMax={7.0}
                    textColor={hero?.colors?.headline}
                    onTextColorChange={onEdit ? (color: string) => onEdit('hero.colors.headline', color) : undefined}
                    showColorPicker={true}
                    presetColors={['#000000', '#ffffff', ...(colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : [])]}
                    textAlign={hero?.headlineAlign || 'center'}
                    onTextAlignChange={onEdit ? (align: 'left' | 'center' | 'right') => onEdit('hero.headlineAlign', align) : undefined}
                    showAlignmentToggle={true}
                    fontFamily={hero?.headlineFont}
                    onFontFamilyChange={onEdit ? (font: string) => onEdit('hero.headlineFont', font) : undefined}
                    showFontPicker={true}
                  />
                  <EditableText
                    as="p"
                    className={`text-lg md:text-xl lg:text-2xl leading-relaxed text-white/90 ${(hero?.subheadlineBold === true || String(hero?.subheadlineBold) === 'true') ? 'font-bold' : ''}`}
                    style={{ 
                      color: hero?.colors?.subheadline,
                      textAlign: hero?.subheadlineAlign || 'center'
                    }}
                    value={hero?.subheadline}
                    path="hero.subheadline"
                    editable={editable}
                    onEdit={onEdit}
                    placeholder="Enter your subheadline"
                    multiline
                    textSize={hero?.subheadlineTextSize || 1.25}
                    onTextSizeChange={onEdit ? (size: number) => onEdit('hero.subheadlineTextSize', size.toString()) : undefined}
                    textSizeLabel="Hero Subheadline Size"
                    textSizePresets={[1.0, 1.25, 1.5, 1.75]}
                    textSizeNormal={1.25}
                    textSizeMin={0.875}
                    textSizeMax={2.5}
                    textColor={hero?.colors?.subheadline}
                    onTextColorChange={onEdit ? (color: string) => onEdit('hero.colors.subheadline', color) : undefined}
                    showColorPicker={true}
                    presetColors={['#000000', '#ffffff', ...(colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : [])]}
                    textBold={hero?.subheadlineBold === true || String(hero?.subheadlineBold) === 'true'}
                    onTextBoldChange={onEdit ? (bold: boolean) => onEdit('hero.subheadlineBold', bold.toString()) : undefined}
                    showBoldToggle={true}
                    textAlign={hero?.subheadlineAlign || 'center'}
                    onTextAlignChange={onEdit ? (align: 'left' | 'center' | 'right') => onEdit('hero.subheadlineAlign', align) : undefined}
                    showAlignmentToggle={true}
                    fontFamily={hero?.subheadlineFont}
                    onFontFamilyChange={onEdit ? (font: string) => onEdit('hero.subheadlineFont', font) : undefined}
                    showFontPicker={true}
                  />
                  
                  {/* Resize handles - only visible in edit mode */}
                  {editable && (
                    <>
                      {/* Left edge */}
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-12 bg-blue-500/80 hover:bg-blue-400 rounded-full cursor-ew-resize transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 'w')}
                        title="Drag to resize width"
                      />
                      {/* Right edge */}
                      <div 
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-12 bg-blue-500/80 hover:bg-blue-400 rounded-full cursor-ew-resize transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 'e')}
                        title="Drag to resize width"
                      />
                      {/* Bottom edge - expands space below text */}
                      <div 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-3 w-12 bg-green-500/80 hover:bg-green-400 rounded-full cursor-ns-resize transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 's')}
                        title="Drag down to add space below text"
                      />
                    </>
                  )}
                </div>
              ) : (
                <>
                  <EditableText
                    as="h1"
                    className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 drop-shadow-2xl text-white"
                    style={{ 
                      color: hero?.colors?.headline,
                      textShadow: '0 2px 20px rgba(0,0,0,0.7), 0 4px 40px rgba(0,0,0,0.5)',
                      textAlign: hero?.headlineAlign || 'center'
                    }}
                    value={hero?.headline || 'Your Trusted Local Business'}
                    path="hero.headline"
                    editable={editable}
                    onEdit={onEdit}
                    placeholder="Enter your main headline"
                    textSize={hero?.headlineTextSize || 3.75}
                    onTextSizeChange={onEdit ? (size: number) => onEdit('hero.headlineTextSize', size.toString()) : undefined}
                    textSizeLabel="Hero Headline Size"
                    textSizePresets={[2.5, 3.75, 4.5, 5.5]}
                    textSizeNormal={3.75}
                    textSizeMin={2.0}
                    textSizeMax={7.0}
                    textColor={hero?.colors?.headline}
                    onTextColorChange={onEdit ? (color: string) => onEdit('hero.colors.headline', color) : undefined}
                    showColorPicker={true}
                    presetColors={['#000000', '#ffffff', ...(colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : [])]}
                    textAlign={hero?.headlineAlign || 'center'}
                    onTextAlignChange={onEdit ? (align: 'left' | 'center' | 'right') => onEdit('hero.headlineAlign', align) : undefined}
                    showAlignmentToggle={true}
                    fontFamily={hero?.headlineFont}
                    onFontFamilyChange={onEdit ? (font: string) => onEdit('hero.headlineFont', font) : undefined}
                    showFontPicker={true}
                  />
                  <EditableText
                    as="p"
                    className={`text-lg md:text-xl lg:text-2xl ${isLegacyFullwidthLayout ? 'mb-10' : 'mb-8'} leading-relaxed drop-shadow-xl text-white/90 ${(hero?.subheadlineBold === true || String(hero?.subheadlineBold) === 'true') ? 'font-bold' : ''}`}
                    style={{ 
                      color: hero?.colors?.subheadline,
                      textShadow: '0 2px 15px rgba(0,0,0,0.6), 0 4px 30px rgba(0,0,0,0.4)',
                      textAlign: hero?.subheadlineAlign || 'center'
                    }}
                    value={hero?.subheadline}
                    path="hero.subheadline"
                    editable={editable}
                    onEdit={onEdit}
                    placeholder="Enter your subheadline"
                    multiline
                    textSize={hero?.subheadlineTextSize || 1.25}
                    onTextSizeChange={onEdit ? (size: number) => onEdit('hero.subheadlineTextSize', size.toString()) : undefined}
                    textSizeLabel="Hero Subheadline Size"
                    textSizePresets={[1.0, 1.25, 1.5, 1.75]}
                    textSizeNormal={1.25}
                    textSizeMin={0.875}
                    textSizeMax={2.5}
                    textColor={hero?.colors?.subheadline}
                    onTextColorChange={onEdit ? (color: string) => onEdit('hero.colors.subheadline', color) : undefined}
                    showColorPicker={true}
                    presetColors={['#000000', '#ffffff', ...(colorPalette ? [colorPalette.primary, colorPalette.secondary].filter(Boolean) : [])]}
                    textBold={hero?.subheadlineBold === true || String(hero?.subheadlineBold) === 'true'}
                    onTextBoldChange={onEdit ? (bold: boolean) => onEdit('hero.subheadlineBold', bold.toString()) : undefined}
                    showBoldToggle={true}
                    textAlign={hero?.subheadlineAlign || 'center'}
                    onTextAlignChange={onEdit ? (align: 'left' | 'center' | 'right') => onEdit('hero.subheadlineAlign', align) : undefined}
                    showAlignmentToggle={true}
                    fontFamily={hero?.subheadlineFont}
                    onFontFamilyChange={onEdit ? (font: string) => onEdit('hero.subheadlineFont', font) : undefined}
                    showFontPicker={true}
                  />
                  {/* Legacy mode: render buttons inline with text (grouped as visual unit) */}
                  {/* On mobile, buttons go to the bottom via floating container instead */}
                  {isLegacyFullwidthLayout && !isMobile && (
                    <div className="flex flex-col items-center">
                      <ButtonGridEditor
                        buttons={ctaButtons}
                        gridLayout={effectiveGridLayout}
                        onLayoutChange={handleGridLayoutChange}
                        onButtonClick={onButtonClick}
                        editable={editable}
                        colorPalette={colorPalette}
                        defaultCtaBg={hero?.colors?.ctaBackground}
                        defaultCtaText={hero?.colors?.ctaText}
                        getButtonStyles={getButtonStyles}
                        ctaButtons={hero?.ctaButtons}
                        onEdit={onEdit}
                        payment={payment}
                        isFullwidthOverlay={true}
                        isMobile={isMobile}
                        buttonStyles={hero?.buttonStyles}
                        onButtonStylesChange={handleButtonStylesChange}
                      />
                      {/* Social links for legacy layout (desktop only - mobile goes to floating container) */}
                      {socialLinks?.showInHero && socialLinks?.links && hasSocialLinks(socialLinks.links) && (
                        <div 
                          className={`mt-6 p-2 -m-2 rounded ${editable ? 'hover:border hover:border-dashed hover:border-white/50 cursor-pointer' : ''}`}
                          onClick={(e) => {
                            if (!editable) return;
                            if ((e.target as HTMLElement).tagName === 'A' || (e.target as HTMLElement).closest('a')) return;
                            e.stopPropagation();
                            socialIconSizeTargetRef.current = e.currentTarget as HTMLDivElement;
                            setShowSocialIconSizePopup(true);
                          }}
                        >
                          <HeroSocialLinks socialLinks={socialLinks} align="center" isFullwidthOverlay={true} className="mt-0" />
                        </div>
                      )}
                    </div>
                  )}
                  {/* Non-legacy: Buttons are rendered in the floating container below */}
                </>
              )}
              </div>
              
              {/* Floating Social Links - positioned separately (when NOT using blur overlay, non-legacy) */}
              {!hero?.overlayBlur && !isLegacyFullwidthLayout && socialLinks?.showInHero && socialLinks?.links && hasSocialLinks(socialLinks.links) && !isMobile && (
                <div 
                  ref={socialLinksFloatingRef}
                  className={`absolute z-30 p-2 -m-2 rounded ${editable ? 'hover:border hover:border-dashed hover:border-white/50 cursor-pointer' : ''} ${isDraggingSocialLinks ? 'opacity-70' : ''}`}
                  style={{
                    left: hero?.socialLinksPosition?.x !== undefined ? `${hero.socialLinksPosition.x}%` : '50%',
                    top: hero?.socialLinksPosition?.y !== undefined ? `${hero.socialLinksPosition.y}%` : '92%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseDown={handleSocialLinksMouseDown}
                  onClick={(e) => handleSocialLinksClick(e, socialLinksFloatingRef.current)}
                >
                  <HeroSocialLinks socialLinks={socialLinks} align="center" isFullwidthOverlay={true} className="mt-0" />
                </div>
              )}
              
              {/* Floating CTA Buttons - positioned separately */}
              {/* On desktop non-legacy: absolute positioning with drag support */}
              {/* On desktop legacy: buttons rendered inline above (not here) */}
              {/* On mobile (all layouts): static positioning at bottom with mt-auto */}
              {(!isLegacyFullwidthLayout || isMobile) && (
                <div 
                  ref={buttonsFloatingRef}
                  className={`z-30 overflow-visible ${
                    isMobile 
                      ? 'w-full mt-auto pb-6 pt-4' 
                      : `absolute ${editable ? 'cursor-move' : ''} ${isDraggingButtons ? 'select-none opacity-80' : ''}`
                  }`}
                  style={isMobile ? {} : {
                    left: hero?.buttonsPosition?.x !== undefined ? `${hero.buttonsPosition.x}%` : '50%',
                    top: hero?.buttonsPosition?.y !== undefined ? `${hero.buttonsPosition.y}%` : '85%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseDown={isMobile ? undefined : handleButtonsDragStart}
                  onClick={(e) => {
                    // Only stop propagation if clicking on the container itself (not on buttons/grid)
                    // This prevents the style editor from opening when clicking the drag area edges
                    if (e.target === e.currentTarget) {
                      e.stopPropagation();
                    }
                  }}
                >
                  {/* Move handle indicator for editor */}
                  {editable && !isMobile && (
                    <div 
                      className="absolute -top-6 left-1/2 -translate-x-1/2 z-10 bg-purple-500/90 text-white text-xs px-2 py-1 rounded-t flex items-center gap-1 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()} // Prevent click from opening style editor
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      Move Buttons
                      {/* Reset button - only show when position has been customized */}
                      {hero?.buttonsPosition && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEdit) {
                              onEdit('hero.buttonsPosition', null as any);
                            }
                          }}
                          className="ml-2 px-1.5 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10px] transition-colors"
                          title="Reset to default position"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* CTA Buttons Grid - visual drag-and-drop editor */}
                  <ButtonGridEditor
                      buttons={ctaButtons}
                      gridLayout={effectiveGridLayout}
                      onLayoutChange={handleGridLayoutChange}
                      onButtonClick={onButtonClick}
                      editable={editable}
                      colorPalette={colorPalette}
                      defaultCtaBg={hero?.colors?.ctaBackground}
                      defaultCtaText={hero?.colors?.ctaText}
                      getButtonStyles={getButtonStyles}
                      ctaButtons={hero?.ctaButtons}
                      onEdit={onEdit}
                      payment={payment}
                      isFullwidthOverlay={true}
                      isMobile={isMobile}
                      buttonStyles={hero?.buttonStyles}
                      onButtonStylesChange={handleButtonStylesChange}
                  />
                  
                  {/* Mobile social links - rendered after buttons in the flow */}
                  {isMobile && socialLinks?.showInHero && socialLinks?.links && hasSocialLinks(socialLinks.links) && (
                    <div 
                      className={`mt-4 p-2 -m-2 rounded ${editable ? 'hover:border hover:border-dashed hover:border-white/50 cursor-pointer' : ''}`}
                      onClick={(e) => {
                        if (!editable) return;
                        if ((e.target as HTMLElement).tagName === 'A' || (e.target as HTMLElement).closest('a')) return;
                        e.stopPropagation();
                        socialIconSizeTargetRef.current = e.currentTarget as HTMLDivElement;
                        setShowSocialIconSizePopup(true);
                      }}
                    >
                      <HeroSocialLinks socialLinks={socialLinks} align="center" isFullwidthOverlay={true} className="mt-0" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Floating Social Links - blur overlay, desktop only */}
              {hero?.overlayBlur && !isMobile && socialLinks?.showInHero && socialLinks?.links && hasSocialLinks(socialLinks.links) && (
                <div 
                  ref={socialLinksFloatingRef}
                  className={`absolute z-30 p-2 -m-2 rounded ${editable ? 'hover:border hover:border-dashed hover:border-white/50 cursor-pointer' : ''} ${isDraggingSocialLinks ? 'opacity-70' : ''}`}
                  style={{
                    left: hero?.socialLinksPosition?.x !== undefined ? `${hero.socialLinksPosition.x}%` : '50%',
                    top: hero?.socialLinksPosition?.y !== undefined ? `${hero.socialLinksPosition.y}%` : '92%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseDown={handleSocialLinksMouseDown}
                  onClick={(e) => handleSocialLinksClick(e, socialLinksFloatingRef.current)}
                >
                  <HeroSocialLinks socialLinks={socialLinks} align="center" isFullwidthOverlay={true} className="mt-0" />
                </div>
              )}
          </div>
        </div>
      </section>
      
      {/* Hero Image Editor Modal */}
      {editable && (
        <HeroImageEditor
          isOpen={showImageEditor}
          layoutStyle={hero?.layoutStyle || 'standard'}
          onLayoutStyleChange={handleLayoutStyleChange}
          overlayBlur={hero?.overlayBlur || false}
          onOverlayBlurChange={handleOverlayBlurChange}
          mediaType={hero?.mediaType || 'photo'}
          onMediaTypeChange={handleMediaTypeChange}
          images={heroImages}
          slideshowInterval={slideshowInterval}
          onImagesChange={handleHeroImagesChange}
          onSlideshowIntervalChange={handleSlideshowIntervalChange}
          onAddImage={onHeroImageAddClick}
          storage={imageStorage}
          video={hero?.video}
          onVideoChange={handleVideoChange}
          onClose={() => setShowImageEditor(false)}
        />
      )}
      
      {/* Social Links Editor Popup - for fullwidth overlay layout */}
      <SocialLinksEditorPopup
        isOpen={showSocialIconSizePopup}
        onClose={() => setShowSocialIconSizePopup(false)}
        socialLinks={socialLinks}
        onEdit={onEdit}
        targetElement={socialIconSizeTargetRef.current}
      />
    </>
  );
};

export default Hero;
