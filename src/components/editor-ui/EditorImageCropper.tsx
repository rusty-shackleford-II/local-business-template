/**
 * EditorImageCropper.tsx
 * 
 * A shared image cropper component with modern styling that supports:
 * - Multiple crop types (logo, favicon, OG image, hero, thumbnails, etc.)
 * - Smart padding with edge color detection
 * - Aspect ratio locking or free crop
 * - Integration with IndexedDB for local storage
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import EditorModal from './EditorModal';
import EditorToggle from './EditorToggle';
import EditorSlider from './EditorSlider';
import { PhotoIcon } from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

export type CropType = 
  | 'logo' 
  | 'square' 
  | 'og' 
  | 'hero' 
  | 'hero-fullwidth'
  | 'about' 
  | 'about-thumbnail' 
  | 'service-thumbnail' 
  | 'menu-thumbnail' 
  | 'event-thumbnail' 
  | 'payment-thumbnail'
  | 'free';

export interface CropConfig {
  aspectRatio?: number;
  title: string;
  instructions: string;
  supportsPadding: boolean;
  outputFormat: 'png' | 'jpeg';
  minWidth: number;
  minHeight: number;
}

export interface EditorImageCropperProps {
  isOpen: boolean;
  imageSrc: string;
  cropType: CropType;
  onCropComplete: (croppedBlob: Blob, cropData?: CropData) => void;
  onCancel: () => void;
  onSkip?: () => void;
  title?: string;
  /** For bulk mode: show progress like "2 of 5" */
  bulkProgress?: { current: number; total: number } | null;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Crop Type Configurations
// ============================================================================

export const CROP_CONFIGS: Record<CropType, CropConfig> = {
  logo: {
    aspectRatio: undefined, // Free aspect, but suggests 2.5:1
    title: 'Crop Logo',
    instructions: 'Drag to adjust the crop area for your logo. Wide logos (2-3x wider than tall) work best in headers.',
    supportsPadding: true,
    outputFormat: 'png',
    minWidth: 60,
    minHeight: 20,
  },
  square: {
    aspectRatio: 1,
    title: 'Crop Search Icon',
    instructions: 'Select a square area for your favicon/search icon. Will be resized to 512x512.',
    supportsPadding: true,
    outputFormat: 'png',
    minWidth: 32,
    minHeight: 32,
  },
  og: {
    aspectRatio: 1630 / 853,
    title: 'Crop Social Preview',
    instructions: 'Select the area for social media previews (Facebook, Twitter, LinkedIn). Optimized for 1630x853.',
    supportsPadding: true,
    outputFormat: 'png',
    minWidth: 100,
    minHeight: 50,
  },
  hero: {
    aspectRatio: 1.6,
    title: 'Crop Hero Image',
    instructions: 'Select the area for your hero section. The 16:10 ratio matches the standard desktop hero container.',
    supportsPadding: false,
    outputFormat: 'jpeg',
    minWidth: 160,
    minHeight: 100,
  },
  'hero-fullwidth': {
    aspectRatio: 2.4,
    title: 'Crop Hero Image',
    instructions: 'Select the area for your fullwidth hero. The wider ratio fills the full screen on desktop.',
    supportsPadding: false,
    outputFormat: 'jpeg',
    minWidth: 240,
    minHeight: 100,
  },
  about: {
    aspectRatio: 4 / 3,
    title: 'Crop About Image',
    instructions: 'Select the area for your about section. The 4:3 ratio works well for gallery display.',
    supportsPadding: false,
    outputFormat: 'jpeg',
    minWidth: 120,
    minHeight: 90,
  },
  'about-thumbnail': {
    aspectRatio: 4 / 3,
    title: 'Crop Thumbnail',
    instructions: 'Select the area for the gallery thumbnail. The full image will still be available in modal view.',
    supportsPadding: false,
    outputFormat: 'jpeg',
    minWidth: 120,
    minHeight: 90,
  },
  'service-thumbnail': {
    aspectRatio: 4 / 3,
    title: 'Crop Service Image',
    instructions: 'Select the area for the service card. The 4:3 ratio matches the card container.',
    supportsPadding: false,
    outputFormat: 'jpeg',
    minWidth: 120,
    minHeight: 90,
  },
  'menu-thumbnail': {
    aspectRatio: 4 / 3,
    title: 'Crop Menu Image',
    instructions: 'Select the area for the menu item card. The 4:3 ratio matches the card container.',
    supportsPadding: false,
    outputFormat: 'jpeg',
    minWidth: 120,
    minHeight: 90,
  },
  'event-thumbnail': {
    aspectRatio: 4 / 3,
    title: 'Crop Event Image',
    instructions: 'Select the area for the event card. The 4:3 ratio matches the card container.',
    supportsPadding: false,
    outputFormat: 'jpeg',
    minWidth: 120,
    minHeight: 90,
  },
  'payment-thumbnail': {
    aspectRatio: 1,
    title: 'Crop Product Image',
    instructions: 'Select a square area for the product gallery. Creates consistent product thumbnails.',
    supportsPadding: false,
    outputFormat: 'jpeg',
    minWidth: 120,
    minHeight: 120,
  },
  free: {
    aspectRatio: undefined,
    title: 'Crop Image',
    instructions: 'Drag to select any area you want to crop.',
    supportsPadding: false,
    outputFormat: 'jpeg',
    minWidth: 50,
    minHeight: 50,
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Sample edge pixels and find the most common color (with alpha channel)
 */
function getMostCommonEdgeColor(image: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return 'rgba(255,255,255,1)';
  
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  ctx.drawImage(image, 0, 0);
  
  const colorCounts = new Map<string, number>();
  const sampleDepth = Math.min(10, Math.floor(Math.min(image.naturalWidth, image.naturalHeight) / 20));
  
  try {
    // Sample top and bottom edges
    for (let x = 0; x < image.naturalWidth; x += 2) {
      for (let y = 0; y < sampleDepth; y++) {
        const topData = ctx.getImageData(x, y, 1, 1).data;
        const topColor = `rgba(${topData[0]},${topData[1]},${topData[2]},${topData[3]/255})`;
        colorCounts.set(topColor, (colorCounts.get(topColor) || 0) + 1);
        
        const bottomData = ctx.getImageData(x, image.naturalHeight - y - 1, 1, 1).data;
        const bottomColor = `rgba(${bottomData[0]},${bottomData[1]},${bottomData[2]},${bottomData[3]/255})`;
        colorCounts.set(bottomColor, (colorCounts.get(bottomColor) || 0) + 1);
      }
    }
    
    // Sample left and right edges
    for (let y = 0; y < image.naturalHeight; y += 2) {
      for (let x = 0; x < sampleDepth; x++) {
        const leftData = ctx.getImageData(x, y, 1, 1).data;
        const leftColor = `rgba(${leftData[0]},${leftData[1]},${leftData[2]},${leftData[3]/255})`;
        colorCounts.set(leftColor, (colorCounts.get(leftColor) || 0) + 1);
        
        const rightData = ctx.getImageData(image.naturalWidth - x - 1, y, 1, 1).data;
        const rightColor = `rgba(${rightData[0]},${rightData[1]},${rightData[2]},${rightData[3]/255})`;
        colorCounts.set(rightColor, (colorCounts.get(rightColor) || 0) + 1);
      }
    }
    
    if (colorCounts.size === 0) return 'rgba(255,255,255,1)';
    
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return sortedColors[0][0];
  } catch (error) {
    console.error('Error sampling edge colors:', error);
    return 'rgba(255,255,255,1)';
  }
}

/**
 * Pad an image with its edge color to fit target aspect ratio
 */
function padImageWithEdgeColor(
  imageSrc: string,
  targetAspectRatio: number,
  extraPadding: number = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const currentRatio = img.naturalWidth / img.naturalHeight;
        const edgeColor = getMostCommonEdgeColor(img);
        
        let baseWidth = img.naturalWidth;
        let baseHeight = img.naturalHeight;
        
        if (currentRatio < targetAspectRatio) {
          baseWidth = img.naturalHeight * targetAspectRatio;
        } else {
          baseHeight = img.naturalWidth / targetAspectRatio;
        }
        
        const paddingScale = 1 + extraPadding;
        const newWidth = baseWidth * paddingScale;
        const newHeight = baseHeight * paddingScale;
        
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d', { alpha: true });
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.clearRect(0, 0, newWidth, newHeight);
        ctx.fillStyle = edgeColor;
        ctx.fillRect(0, 0, newWidth, newHeight);
        
        const offsetX = (newWidth - img.naturalWidth) / 2;
        const offsetY = (newHeight - img.naturalHeight) / 2;
        ctx.drawImage(img, offsetX, offsetY);
        
        resolve(canvas.toDataURL('image/png', 1.0));
      } catch (error) {
        console.error('Error padding image:', error);
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}

/**
 * Create a centered crop with the given aspect ratio
 */
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  const mediaAspect = mediaWidth / mediaHeight;
  
  let cropWidth: number;
  let cropHeight: number;
  
  if (mediaAspect > aspect) {
    cropHeight = 100;
    cropWidth = (100 * aspect) / mediaAspect;
  } else {
    cropWidth = 100;
    cropHeight = (100 / aspect) * mediaAspect;
  }
  
  return centerCrop(
    makeAspectCrop(
      { unit: '%', width: cropWidth },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

// ============================================================================
// Component
// ============================================================================

export const EditorImageCropper: React.FC<EditorImageCropperProps> = ({
  isOpen,
  imageSrc,
  cropType,
  onCropComplete,
  onCancel,
  onSkip,
  title: customTitle,
  bulkProgress,
}) => {
  const config = CROP_CONFIGS[cropType];
  
  // Crop state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Padding state
  const [usePadding, setUsePadding] = useState(false);
  const [paddingAmount, setPaddingAmount] = useState(0);
  const [paddedImageSrc, setPaddedImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(imageSrc);
  const paddingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset state when imageSrc changes
  useEffect(() => {
    if (!usePadding) {
      setCurrentSrc(imageSrc);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [imageSrc, usePadding]);
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (paddingDebounceRef.current) {
        clearTimeout(paddingDebounceRef.current);
      }
    };
  }, []);
  
  // Handle padding toggle
  const handlePaddingToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      setIsProcessing(true);
      try {
        let targetRatio: number;
        if (cropType === 'square' || cropType === 'payment-thumbnail') {
          targetRatio = 1;
        } else if (cropType === 'logo') {
          const img = new Image();
          img.src = imageSrc;
          await new Promise((resolve) => { img.onload = resolve; });
          targetRatio = img.naturalWidth / img.naturalHeight;
        } else {
          targetRatio = config.aspectRatio || 1.91;
        }
        const padded = await padImageWithEdgeColor(imageSrc, targetRatio, paddingAmount);
        setPaddedImageSrc(padded);
        setCurrentSrc(padded);
        setUsePadding(true);
        setCrop(undefined);
        setCompletedCrop(undefined);
      } catch (error) {
        console.error('Error padding image:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setCurrentSrc(imageSrc);
      setPaddedImageSrc(null);
      setUsePadding(false);
      setPaddingAmount(0);
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [imageSrc, config.aspectRatio, cropType, paddingAmount]);
  
  // Handle padding amount change with debounce
  const handlePaddingAmountChange = useCallback((newAmount: number) => {
    if (!usePadding) return;
    
    setPaddingAmount(newAmount);
    
    if (paddingDebounceRef.current) {
      clearTimeout(paddingDebounceRef.current);
    }
    
    paddingDebounceRef.current = setTimeout(async () => {
      setIsProcessing(true);
      try {
        let targetRatio: number;
        if (cropType === 'square' || cropType === 'payment-thumbnail') {
          targetRatio = 1;
        } else if (cropType === 'logo') {
          const img = new Image();
          img.src = imageSrc;
          await new Promise((resolve) => { img.onload = resolve; });
          targetRatio = img.naturalWidth / img.naturalHeight;
        } else {
          targetRatio = config.aspectRatio || 1.91;
        }
        const padded = await padImageWithEdgeColor(imageSrc, targetRatio, newAmount);
        setPaddedImageSrc(padded);
        setCurrentSrc(padded);
        setCrop(undefined);
        setCompletedCrop(undefined);
      } catch (error) {
        console.error('Error padding image:', error);
      } finally {
        setIsProcessing(false);
      }
    }, 150);
  }, [usePadding, imageSrc, config.aspectRatio, cropType]);
  
  // Handle image load - set initial crop
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    let newCrop: Crop;
    
    if (config.aspectRatio) {
      newCrop = centerAspectCrop(width, height, config.aspectRatio);
    } else if (cropType === 'logo') {
      newCrop = centerAspectCrop(width, height, 2.5);
    } else {
      return; // Free crop - no initial crop
    }
    
    setCrop(newCrop);
    
    // Convert to pixel crop for preview
    const pixelCrop: PixelCrop = {
      unit: 'px',
      x: (newCrop.x / 100) * width,
      y: (newCrop.y / 100) * height,
      width: (newCrop.width / 100) * width,
      height: (newCrop.height / 100) * height,
    };
    setCompletedCrop(pixelCrop);
  }, [config.aspectRatio, cropType]);
  
  // Recenter crop
  const handleRecenter = useCallback(() => {
    if (!crop || !imgRef.current) return;
    
    const newCrop: Crop = {
      ...crop,
      unit: '%',
      x: 50 - crop.width / 2,
      y: 50 - crop.height / 2,
    };
    setCrop(newCrop);
    
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const pixelCrop: PixelCrop = {
        unit: 'px',
        x: (newCrop.x / 100) * width,
        y: (newCrop.y / 100) * height,
        width: (newCrop.width / 100) * width,
        height: (newCrop.height / 100) * height,
      };
      setCompletedCrop(pixelCrop);
    }
  }, [crop]);
  
  // Generate cropped image blob
  const getCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const cropData = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const pixelRatio = window.devicePixelRatio;
    let canvasWidth = Math.round(cropData.width * pixelRatio * scaleX);
    let canvasHeight = Math.round(cropData.height * pixelRatio * scaleY);
    
    // For locked aspect ratio, ensure exact ratio
    if (config.aspectRatio) {
      if (config.aspectRatio === 1) {
        const squareSize = Math.min(canvasWidth, canvasHeight);
        canvasWidth = squareSize;
        canvasHeight = squareSize;
      } else {
        const exactHeight = Math.round(canvasWidth / config.aspectRatio);
        canvasHeight = exactHeight;
      }
    }
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    
    // For logo-type images, preserve transparency
    const isLogoType = cropType === 'logo' || cropType === 'square' || cropType === 'og';
    
    if (!isLogoType) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const srcX = cropData.x * scaleX;
    const srcY = cropData.y * scaleY;
    const srcWidth = cropData.width * scaleX;
    const srcHeight = cropData.height * scaleY;
    const destWidth = canvasWidth / pixelRatio;
    const destHeight = canvasHeight / pixelRatio;
    
    ctx.drawImage(
      image,
      srcX, srcY, srcWidth, srcHeight,
      0, 0, destWidth, destHeight
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        config.outputFormat === 'png' ? 'image/png' : 'image/jpeg',
        config.outputFormat === 'png' ? 1.0 : 0.95
      );
    });
  }, [completedCrop, config.aspectRatio, config.outputFormat, cropType]);
  
  // Handle crop complete
  const handleCropComplete = useCallback(async () => {
    try {
      const croppedBlob = await getCroppedImage();
      if (croppedBlob) {
        // For thumbnail types, pass crop data
        let cropData: CropData | undefined;
        const isThumbnailCrop = cropType.includes('thumbnail');
        if (isThumbnailCrop && completedCrop && imgRef.current) {
          cropData = {
            x: (completedCrop.x / imgRef.current.naturalWidth) * 100,
            y: (completedCrop.y / imgRef.current.naturalHeight) * 100,
            width: (completedCrop.width / imgRef.current.naturalWidth) * 100,
            height: (completedCrop.height / imgRef.current.naturalHeight) * 100,
          };
        }
        onCropComplete(croppedBlob, cropData);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }, [getCroppedImage, onCropComplete, cropType, completedCrop]);
  
  const modalTitle = bulkProgress 
    ? `${customTitle || config.title} (${bulkProgress.current} of ${bulkProgress.total})`
    : (customTitle || config.title);
  
  return (
    <EditorModal
      isOpen={isOpen}
      onClose={onCancel}
      title={modalTitle}
      icon={<PhotoIcon className="w-3.5 h-3.5 text-white" />}
      width="xl"
      backdropOpacity={0.5}
      showDoneButton={false}
      footer={
        <div className="flex items-center justify-between">
          {/* Left side: Skip button for bulk mode */}
          <div>
            {bulkProgress && onSkip && (
              <button
                onClick={onSkip}
                className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
              >
                Skip This Image
              </button>
            )}
          </div>
          
          {/* Right side: Cancel and Apply */}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
            >
              {bulkProgress ? 'Cancel All' : 'Cancel'}
            </button>
            <button
              onClick={handleCropComplete}
              disabled={!completedCrop || isProcessing}
              className="px-4 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkProgress && bulkProgress.current < bulkProgress.total 
                ? 'Crop & Next' 
                : 'Apply Crop'}
            </button>
          </div>
        </div>
      }
    >
      {/* Bulk Progress Bar */}
      {bulkProgress && bulkProgress.total > 1 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
            <span>Image {bulkProgress.current} of {bulkProgress.total}</span>
            <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
              style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <p className="text-xs text-gray-400 -mt-1 mb-3">
        {config.instructions}
      </p>
      
      {/* Smart Padding Option */}
      {config.supportsPadding && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg space-y-3">
          <EditorToggle
            label="Smart Padding"
            description={
              cropType === 'square' 
                ? 'Extend canvas with edge colors to fit square without cropping'
                : cropType === 'logo'
                ? 'Add breathing room around your logo with matching edge colors'
                : 'Extend canvas with edge colors to fit social dimensions'
            }
            checked={usePadding}
            onChange={handlePaddingToggle}
            compact
          />
          
          {usePadding && (
            <>
              <EditorSlider
                label="Extra Padding"
                value={paddingAmount}
                onChange={handlePaddingAmountChange}
                min={0}
                max={1}
                step={0.05}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                hideMinMax
              />
              
              <button
                onClick={handleRecenter}
                disabled={isProcessing || !crop}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-lg border border-indigo-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                  <path strokeLinecap="round" strokeWidth="2" d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
                Recenter Crop
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Crop Area */}
      <div className="rounded-lg overflow-hidden bg-gray-900/50 border border-white/10">
        {isProcessing ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Processing...</span>
            </div>
          </div>
        ) : (
          <div className="p-3">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={cropType === 'logo' || cropType === 'free' ? undefined : config.aspectRatio}
              minWidth={config.minWidth}
              minHeight={config.minHeight}
              className="max-w-full"
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={currentSrc}
                style={{ 
                  maxHeight: '50vh', 
                  maxWidth: '100%',
                  display: 'block',
                  margin: '0 auto',
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
        )}
      </div>
      
      {/* Hidden canvas for generating cropped image */}
      <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
    </EditorModal>
  );
};

export default EditorImageCropper;
