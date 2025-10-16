import React, { useState, useEffect } from 'react';
import IdbImage from './IdbImage';
import { objectUrlForKey } from '@/lib/idb';

interface CropData {
  x: number;      // Crop x position as percentage (0-100)
  y: number;      // Crop y position as percentage (0-100) 
  width: number;  // Crop width as percentage (0-100)
  height: number; // Crop height as percentage (0-100)
}

interface CroppedImageProps {
  src: string;
  alt: string;
  crop?: CropData;
  fill?: boolean;
  className?: string;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  priority?: boolean;
}

/**
 * Component that renders an image with optional crop information applied via CSS transforms
 * Falls back to normal image rendering if no crop data is provided (backwards compatible)
 */
export const CroppedImage: React.FC<CroppedImageProps> = ({
  src,
  alt,
  crop,
  fill = false,
  className = '',
  loading = 'lazy',
  sizes,
  priority = false
}) => {
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadImage = async () => {
      if (src.startsWith('idb://')) {
        try {
          objectUrl = await objectUrlForKey(src);
          if (isMounted && objectUrl) {
            setBlobUrl(objectUrl);
          }
        } catch (error) {
          console.error('Failed to load idb image for background:', error);
        }
      } else {
        if (isMounted) {
          setBlobUrl(src);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  // If no crop data, render normal image
  if (!crop) {
    return (
      <IdbImage
        src={src}
        alt={alt}
        fill={fill}
        className={className}
        loading={loading}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  // If we don't have the blob URL yet, show loading
  if (!blobUrl) {
    return (
      <div 
        className={`${fill ? 'w-full h-full' : ''} ${className} bg-gray-200 animate-pulse`}
        style={{ width: '100%', height: '100%' }}
      />
    );
  }

  // Use actual crop data with correct background-position logic
  const cropWidthPercent = crop.width;
  const cropHeightPercent = crop.height;
  
  // Scale factors
  const bgSizeX = (100 / cropWidthPercent) * 100;
  const bgSizeY = (100 / cropHeightPercent) * 100;
  
  // Center point of crop area
  const cropCenterX = crop.x + (crop.width / 2);
  const cropCenterY = crop.y + (crop.height / 2);
  
  // Background position aligns crop center with container center
  const bgPosX = cropCenterX;
  const bgPosY = cropCenterY;

  console.log('CroppedImage crop calculation:', {
    crop,
    bgSizeX,
    bgSizeY,
    cropCenterX,
    cropCenterY,
    bgPosX,
    bgPosY,
    finalCSS: {
      backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
      backgroundPosition: `${bgPosX}% ${bgPosY}%`
    }
  });
  
  return (
    <div 
      className={`${fill ? 'w-full h-full' : ''} ${className}`}
      style={{
        backgroundImage: `url(${blobUrl})`,
        backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
        backgroundRepeat: 'no-repeat',
        width: '100%',
        height: '100%',
      }}
      role="img"
      aria-label={alt}
    />
  );
};

export default CroppedImage;
