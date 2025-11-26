import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Head from 'next/head';
import { stripPhoneNumber } from '../lib/phoneUtils';
import EditableText from './EditableText';
import IdbImage from './IdbImage';
import type { Hero as HeroCfg, Payment as PaymentCfg, ColorPalette, HeroCtaButton } from '../types';

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
  colorPalette?: ColorPalette;
};

const Hero: React.FC<Props> = ({ hero, payment, isPreview, backgroundClass = 'bg-gradient-to-br from-gray-50 to-white', editable, onEdit, onHeroImageClick, colorPalette }) => {
  const [videoLoading, setVideoLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
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
  
  // Determine layout style - handle both string and potential type mismatches
  const layoutStyle = hero?.layoutStyle || 'standard';
  const isFullwidthOverlay = String(layoutStyle).toLowerCase() === 'fullwidth-overlay';
  
  // Detect mobile screen size for responsive positioning
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on mount
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
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
  
  // Get all hero images (for slideshow support)
  const heroImages = useMemo(() => {
    if (hero?.heroImages && hero.heroImages.length > 0) {
      return hero.heroImages;
    }
    // Backwards compatibility: use single image if no array exists
    if (hero?.heroLargeImageUrl) {
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
    const defaultBg = colorPalette?.primary || hero?.colors?.ctaBackground || '#2563eb';
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
      console.log('Auto-detected Vimeo, using Vimeo embed');
      embedSrc = toVimeoEmbed(input, opts);
    } else if (input.includes('youtube.com') || input.includes('youtu.be')) {
      console.log('Auto-detected YouTube, using YouTube embed');
      embedSrc = toYouTubeEmbed(input, opts);
    } else {
      // Fallback to YouTube if provider is not recognized
      console.warn('Unknown video provider, defaulting to YouTube embed');
      embedSrc = toYouTubeEmbed(input, opts);
    }
    
    return { videoEmbedSrc: embedSrc, videoAspectRatio: aspectRatio };
  }, [hero?.mediaType, hero?.video]);

  // Reset loading states when media type or source changes
  useEffect(() => {
    if (hero?.mediaType === 'video') {
      setVideoLoading(true);
      setImageLoading(false);
    } else {
      setVideoLoading(false);
      setImageLoading(true);
    }
  }, [hero?.mediaType, hero?.video?.url, hero?.heroLargeImageUrl]);
  
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
        
        <section id="home" className={`relative ${backgroundClass} ${isPreview ? '' : 'body-padding'} overflow-hidden`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1 text-left">
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
              />
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
              />
                
                <div className="flex flex-wrap gap-4">
                  {ctaButtons.map((button, index) => (
                    <button
                      key={button.id}
                      onClick={editable ? undefined : () => onButtonClick(button)}
                      className={`group inline-flex items-center px-8 py-4 font-semibold rounded-lg transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl button-press ${index === 0 ? 'cta-pulse' : ''}`}
                      style={{ 
                        ...getButtonStyles(button, hoveredButtonId === button.id, index),
                        cursor: editable ? 'text' : 'pointer'
                      }}
                      onMouseEnter={() => setHoveredButtonId(button.id)}
                      onMouseLeave={() => setHoveredButtonId(null)}
                    >
                      <EditableText
                        value={button.label}
                        path={hero?.ctaButtons ? `hero.ctaButtons.${index}.label` : (payment?.addHeroCta ? "payment.heroCtaLabel" : "hero.cta.label")}
                        editable={editable}
                        onEdit={onEdit}
                        placeholder="Button text"
                        textSize={button.labelTextSize || 1.0}
                        onTextSizeChange={onEdit ? (size: number) => onEdit(hero?.ctaButtons ? `hero.ctaButtons.${index}.labelTextSize` : (payment?.addHeroCta ? 'payment.heroCtaLabelTextSize' : 'hero.cta.labelTextSize'), size.toString()) : undefined}
                        textSizeLabel="CTA Button Text Size"
                      />
                      {(button.showArrow !== false) && (
                        <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Media (Image or Video) */}
            <div className="order-1 lg:order-2">
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
        </div>

          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-primary-100 to-transparent rounded-full transform translate-x-32 opacity-20"></div>
            <div className="absolute bottom-20 left-0 w-96 h-96 bg-gradient-to-tr from-primary-100 to-transparent rounded-full transform -translate-x-32 opacity-20"></div>
          </div>
        </section>
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
      
      <section id="home" className={`relative ${isPreview ? '' : 'body-padding'} overflow-hidden`}>
        {/* Full-width media background */}
        <div className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
          {/* Media layer */}
          {hero?.mediaType === 'video' && videoEmbedSrc ? (
            <div className="absolute inset-0">
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
                className={`absolute transition-opacity duration-300 ${videoLoading ? 'opacity-0' : 'opacity-100'}`}
                style={{ 
                  border: 'none', 
                  pointerEvents: 'none',
                  top: '50%',
                  left: '50%',
                  width: '100vw',
                  height: '100vh',
                  transform: 'translate(-50%, -50%)',
                  minWidth: '100%',
                  minHeight: '100%'
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
          
          {/* Text overlay content - constrained positioning area */}
          <div 
            className="absolute inset-0 z-20 px-4 sm:px-6 lg:px-8"
            style={{
              paddingTop: '2rem',
              paddingBottom: '2rem'
            }}
          >
              <div 
                ref={containerRef}
                className={`relative text-center ${editable && isFullwidthOverlay ? 'cursor-move' : ''} ${isDragging ? 'select-none opacity-80' : ''}`}
                onMouseDown={handleMouseDown}
                style={{
                  // Center content in the available space
                  // On mobile and when no custom position is set, center the content
                  // The parent container now has padding-top for the header, so we center within the remaining space
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '100%',
                  width: '56rem',
                  maxWidth: 'calc(100% - 2rem)',
                  margin: '0 auto',
                  // For custom positioning on desktop (non-mobile)
                  ...((!isMobile && hero?.overlayPosition) ? {
                    position: 'absolute',
                    left: hero.overlayPosition.x !== undefined ? `${hero.overlayPosition.x}%` : '50%',
                    top: hero.overlayPosition.y !== undefined ? `${hero.overlayPosition.y}%` : '50%',
                    transform: 'translate(-50%, -50%)',
                    margin: '0',
                  } : {}),
                  outlineWidth: editable && isFullwidthOverlay ? '2px' : '0',
                  outlineStyle: editable && isFullwidthOverlay ? 'dashed' : 'none',
                  outlineColor: editable && isFullwidthOverlay && !isDragging ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                  outlineOffset: '8px',
                }}
              >
              {hero?.overlayBlur ? (
                <div className="relative bg-black/50 rounded-2xl p-8 md:p-12">
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
                  />
                  <EditableText
                    as="p"
                    className={`text-lg md:text-xl lg:text-2xl mb-8 leading-relaxed text-white/90 ${(hero?.subheadlineBold === true || String(hero?.subheadlineBold) === 'true') ? 'font-bold' : ''}`}
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
                  />
                  
                  <div className="flex flex-wrap gap-4" style={{ justifyContent: hero?.ctaAlign === 'left' ? 'flex-start' : hero?.ctaAlign === 'right' ? 'flex-end' : 'center' }}>
                    {ctaButtons.map((button, index) => (
                      <button
                        key={button.id}
                        onClick={editable ? undefined : () => onButtonClick(button)}
                        className={`group inline-flex items-center px-8 py-4 font-semibold rounded-lg transform hover:scale-105 transition-all duration-200 shadow-2xl hover:shadow-3xl button-press ${index === 0 ? 'cta-pulse' : ''}`}
                        style={{ 
                          ...getButtonStyles(button, hoveredButtonId === button.id, index),
                          cursor: editable ? 'text' : 'pointer'
                        }}
                        onMouseEnter={() => setHoveredButtonId(button.id)}
                        onMouseLeave={() => setHoveredButtonId(null)}
                      >
                        <EditableText
                          value={button.label}
                          path={hero?.ctaButtons ? `hero.ctaButtons.${index}.label` : (payment?.addHeroCta ? "payment.heroCtaLabel" : "hero.cta.label")}
                          editable={editable}
                          onEdit={onEdit}
                          placeholder="Button text"
                          textSize={button.labelTextSize || 1.0}
                          onTextSizeChange={onEdit ? (size: number) => onEdit(hero?.ctaButtons ? `hero.ctaButtons.${index}.labelTextSize` : (payment?.addHeroCta ? 'payment.heroCtaLabelTextSize' : 'hero.cta.labelTextSize'), size.toString()) : undefined}
                          textSizeLabel="CTA Button Text Size"
                          textAlign={hero?.ctaAlign || 'center'}
                          onTextAlignChange={index === 0 && onEdit ? (align: 'left' | 'center' | 'right') => onEdit('hero.ctaAlign', align) : undefined}
                          showAlignmentToggle={index === 0}
                        />
                        {(button.showArrow !== false) && (
                          <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                        )}
                      </button>
                    ))}
                  </div>
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
                  />
                  <EditableText
                    as="p"
                    className={`text-lg md:text-xl lg:text-2xl mb-8 leading-relaxed drop-shadow-xl text-white/90 ${(hero?.subheadlineBold === true || String(hero?.subheadlineBold) === 'true') ? 'font-bold' : ''}`}
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
                  />
                  
                  <div className="flex flex-wrap gap-4" style={{ justifyContent: hero?.ctaAlign === 'left' ? 'flex-start' : hero?.ctaAlign === 'right' ? 'flex-end' : 'center' }}>
                    {ctaButtons.map((button, index) => (
                      <button
                        key={button.id}
                        onClick={editable ? undefined : () => onButtonClick(button)}
                        className={`group inline-flex items-center px-8 py-4 font-semibold rounded-lg transform hover:scale-105 transition-all duration-200 shadow-2xl hover:shadow-3xl button-press ${index === 0 ? 'cta-pulse' : ''}`}
                        style={{ 
                          ...getButtonStyles(button, hoveredButtonId === button.id, index),
                          cursor: editable ? 'text' : 'pointer'
                        }}
                        onMouseEnter={() => setHoveredButtonId(button.id)}
                        onMouseLeave={() => setHoveredButtonId(null)}
                      >
                        <EditableText
                          value={button.label}
                          path={hero?.ctaButtons ? `hero.ctaButtons.${index}.label` : (payment?.addHeroCta ? "payment.heroCtaLabel" : "hero.cta.label")}
                          editable={editable}
                          onEdit={onEdit}
                          placeholder="Button text"
                          textSize={button.labelTextSize || 1.0}
                          onTextSizeChange={onEdit ? (size: number) => onEdit(hero?.ctaButtons ? `hero.ctaButtons.${index}.labelTextSize` : (payment?.addHeroCta ? 'payment.heroCtaLabelTextSize' : 'hero.cta.labelTextSize'), size.toString()) : undefined}
                          textSizeLabel="CTA Button Text Size"
                          textAlign={hero?.ctaAlign || 'center'}
                          onTextAlignChange={index === 0 && onEdit ? (align: 'left' | 'center' | 'right') => onEdit('hero.ctaAlign', align) : undefined}
                          showAlignmentToggle={index === 0}
                        />
                        {(button.showArrow !== false) && (
                          <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
              </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero; 