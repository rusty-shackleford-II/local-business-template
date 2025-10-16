import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { objectUrlForKey } from '@/lib/idb';

interface IdbImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
}

/**
 * Custom Image component that handles both regular URLs and idb:// URLs
 * Converts idb:// URLs to object URLs before passing to Next.js Image
 */
const IdbImage: React.FC<IdbImageProps> = ({ 
  src, 
  alt, 
  fill, 
  width, 
  height, 
  className, 
  sizes, 
  loading,
  priority,
  style,
  onLoad
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(src.startsWith('idb://'));
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      if (src.startsWith('idb://')) {
        try {
          setIsLoading(true);
          objectUrl = await objectUrlForKey(src);
          
          if (isMounted) {
            if (objectUrl) {
              setImageSrc(objectUrl);
              setHasError(false);
            } else {
              setHasError(true);
            }
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Failed to load image from IndexedDB:', error);
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
        }
      } else {
        // Regular URL, use as-is
        if (isMounted) {
          setImageSrc(src);
          setIsLoading(false);
          setHasError(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      // Clean up object URL to prevent memory leaks
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  // Show loading placeholder while converting idb:// URL
  if (isLoading) {
    return (
      <div 
        className={`bg-white animate-pulse flex items-center justify-center ${className || ''}`}
        style={fill ? { position: 'absolute', inset: 0, ...style } : { width, height, ...style }}
      >
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  // Show error placeholder if image failed to load
  if (hasError) {
    return (
      <div 
        className={`bg-white flex items-center justify-center ${className || ''}`}
        style={fill ? { position: 'absolute', inset: 0, ...style } : { width, height, ...style }}
      >
        <div className="text-gray-400 text-sm">Image not found</div>
      </div>
    );
  }

  // For blob URLs, use regular img tag since Next.js Image might not support them
  if (imageSrc.startsWith('blob:')) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        style={fill ? { 
          position: 'absolute', 
          inset: 0, 
          width: '100%', 
          height: '100%', 
          objectFit: (className && className.includes('object-contain')) ? 'contain' : (className && className.includes('object-cover')) ? 'cover' : 'cover',
          ...style 
        } : { 
          width, 
          height, 
          ...style 
        }}
        onError={() => setHasError(true)}
        onLoad={onLoad}
        loading={loading}
      />
    );
  }

  // Render Next.js Image with regular URLs
  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      loading={loading}
      priority={priority}
      style={style}
      onError={() => setHasError(true)}
      onLoad={onLoad}
    />
  );
};

export default IdbImage;
