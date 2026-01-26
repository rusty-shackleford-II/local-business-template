'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PhotoIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// ============================================================================
// IMAGE PREVIEW COMPONENT (handles idb:// URLs)
// ============================================================================

interface ImagePreviewInternalProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Internal image preview that handles idb:// URLs by loading from IndexedDB
 */
function ImagePreviewInternal({ src, alt, className, onLoad, onError }: ImagePreviewInternalProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(src);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;
    
    const loadPreview = async () => {
      if (!src) {
        setHasError(true);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setHasError(false);
      
      if (src.startsWith('idb://')) {
        try {
          // Dynamic import to avoid issues in non-browser environments
          const { objectUrlForKey } = await import('@/lib/idb');
          objectUrl = await objectUrlForKey(src);
          if (mounted) {
            if (objectUrl) {
              setPreviewUrl(objectUrl);
            } else {
              setHasError(true);
            }
            setIsLoading(false);
          }
        } catch (error) {
          console.warn('Failed to load preview from IndexedDB:', error);
          if (mounted) {
            setHasError(true);
            setIsLoading(false);
          }
        }
      } else {
        if (mounted) {
          setPreviewUrl(src);
          setIsLoading(false);
        }
      }
    };
    
    loadPreview();
    
    return () => {
      mounted = false;
      if (objectUrl && objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);
  
  // Handle load/error callbacks
  useEffect(() => {
    if (!isLoading && !hasError) {
      onLoad?.();
    } else if (hasError) {
      onError?.();
    }
  }, [isLoading, hasError, onLoad, onError]);
  
  if (isLoading) {
    return (
      <div className={`${className} bg-gray-800/50 flex items-center justify-center`}>
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  
  if (hasError || !src) {
    return (
      <div className={`${className} bg-gray-800/50 flex items-center justify-center`}>
        <PhotoIcon className="w-10 h-10 text-gray-600" />
      </div>
    );
  }
  
  // Still loading from idb://
  if (previewUrl.startsWith('idb://')) {
    return (
      <div className={`${className} bg-gray-800/50 flex items-center justify-center`}>
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <img
      src={previewUrl}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface EditorImageInputProps {
  /** Label for the image input */
  label?: string;
  /** Current image URL (can be idb://, https://, or blob:) */
  value?: string;
  /** Pending/staged image URL (shown with indicator) */
  pendingValue?: string;
  /** Called when user clicks to select/change image */
  onSelectImage: () => void;
  /** Called when user clears the image (optional - hides clear button if not provided) */
  onClearImage?: () => void;
  /** Alt text for the image preview */
  alt?: string;
  /** Placeholder text when no image */
  placeholder?: string;
  /** Description text below the input */
  description?: string;
  /** Aspect ratio for the preview container */
  aspectRatio?: 'square' | '4/3' | '16/9' | '3/2' | 'auto';
  /** Whether to show a compact version (smaller preview) */
  compact?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

const ASPECT_RATIO_CLASSES = {
  'square': 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '16/9': 'aspect-video',
  '3/2': 'aspect-[3/2]',
  'auto': '',
};

/**
 * EditorImageInput - A styled image input for editor modals
 * 
 * Features:
 * - Image preview with support for idb:// URLs
 * - Pending state indicator (for unsaved changes)
 * - Click to select/change image
 * - Optional clear button
 * - Loading and error states
 * - Configurable aspect ratio
 */
export default function EditorImageInput({
  label,
  value,
  pendingValue,
  onSelectImage,
  onClearImage,
  alt = 'Image preview',
  placeholder = 'Click to upload image',
  description,
  aspectRatio = '4/3',
  compact = false,
  disabled = false,
  className = '',
}: EditorImageInputProps) {
  // Use pending value if available, otherwise current value
  const displayUrl = pendingValue || value;
  const hasPendingChange = !!pendingValue && pendingValue !== value;
  
  const handleClick = useCallback(() => {
    if (!disabled) {
      onSelectImage();
    }
  }, [disabled, onSelectImage]);
  
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClearImage?.();
  }, [onClearImage]);
  
  const aspectClass = ASPECT_RATIO_CLASSES[aspectRatio];
  const heightClass = compact ? 'h-20' : (aspectRatio === 'auto' ? 'min-h-[120px]' : '');
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">
            {label}
          </label>
          {hasPendingChange && (
            <span className="text-amber-400 text-[10px] font-normal flex items-center gap-1">
              <ArrowPathIcon className="w-3 h-3" />
              unsaved
            </span>
          )}
        </div>
      )}
      
      {/* Image Preview / Upload Area */}
      <div 
        className={`relative group cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleClick}
      >
        <div 
          className={`
            ${aspectClass} ${heightClass}
            rounded-xl overflow-hidden 
            bg-gray-800/50 
            border ${hasPendingChange ? 'border-amber-500/50' : 'border-white/10'}
            transition-all
            ${!disabled && 'hover:border-indigo-500/50'}
          `}
        >
          {displayUrl ? (
            <ImagePreviewInternal
              src={displayUrl}
              alt={alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-4">
              <PhotoIcon className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} mb-2`} />
              <span className={`${compact ? 'text-xs' : 'text-sm'} text-center`}>{placeholder}</span>
            </div>
          )}
        </div>
        
        {/* Hover Overlay */}
        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-lg border border-white/20 text-white text-sm font-medium">
              <PhotoIcon className="w-4 h-4" />
              {displayUrl ? 'Change Image' : 'Upload Image'}
            </div>
          </div>
        )}
        
        {/* Clear Button */}
        {displayUrl && onClearImage && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            title="Remove image"
          >
            <XMarkIcon className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
      
      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}

// ============================================================================
// COMPACT VARIANT FOR INLINE USE
// ============================================================================

export interface EditorImageInputCompactProps {
  /** Current image URL */
  value?: string;
  /** Called when user clicks to select/change image */
  onSelectImage: () => void;
  /** Called when user clears the image */
  onClearImage?: () => void;
  /** Alt text */
  alt?: string;
  /** Size of the thumbnail */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

/**
 * EditorImageInputCompact - A compact thumbnail image input
 * 
 * Use this for inline image selection in rows, like logo upload in branding.
 */
export function EditorImageInputCompact({
  value,
  onSelectImage,
  onClearImage,
  alt = 'Image',
  size = 'md',
  className = '',
}: EditorImageInputCompactProps) {
  return (
    <div className={`relative group ${SIZE_CLASSES[size]} ${className}`}>
      <button
        type="button"
        onClick={onSelectImage}
        className={`
          ${SIZE_CLASSES[size]}
          rounded-lg overflow-hidden
          bg-gray-800/50 border border-white/10
          hover:border-indigo-500/50 transition-all
          flex items-center justify-center
        `}
      >
        {value ? (
          <ImagePreviewInternal
            src={value}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <PhotoIcon className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {/* Clear button on hover */}
      {value && onClearImage && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClearImage(); }}
          className="absolute -top-1 -right-1 p-0.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          title="Remove"
        >
          <XMarkIcon className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}
