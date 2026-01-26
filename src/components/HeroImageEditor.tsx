/**
 * HeroImageEditor.tsx
 * 
 * A comprehensive modal for managing hero section media (images/video).
 * Allows toggling between photo and video modes, managing slideshow images,
 * and configuring video settings.
 * 
 * Supports bulk image selection with crop-one-by-one flow.
 */

import React, { useState, useCallback, useRef } from 'react';
import { TrashIcon, PlusIcon, PhotoIcon, VideoCameraIcon, Bars3Icon, PlayIcon, Square2StackIcon, RectangleGroupIcon } from '@heroicons/react/24/outline';
import IdbImage from './IdbImage';
import Image from 'next/image';
import { 
  EditorModal, 
  EditorSlider, 
  EditorInput, 
  EditorSelect, 
  EditorToggle,
  EditorInfoBox,
  EditorImageCropper,
  useImageCropper,
  type ImageStorageAdapter,
  type CropType,
} from './editor-ui';

// Video configuration type
type VideoConfig = {
  provider: 'youtube' | 'vimeo';
  url: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
};

type LayoutStyle = 'standard' | 'fullwidth-overlay';

type HeroImageEditorProps = {
  isOpen: boolean;
  // Layout style
  layoutStyle?: LayoutStyle;
  onLayoutStyleChange?: (style: LayoutStyle) => void;
  // Overlay blur (for fullwidth-overlay)
  overlayBlur?: boolean;
  onOverlayBlurChange?: (enabled: boolean) => void;
  // Media type
  mediaType?: 'photo' | 'video';
  onMediaTypeChange?: (type: 'photo' | 'video') => void;
  // Images
  images: string[];
  slideshowInterval: number;
  onImagesChange: (images: string[]) => void;
  onSlideshowIntervalChange: (interval: number) => void;
  /** @deprecated Use storage prop instead for built-in cropper */
  onAddImage?: () => void;
  // Storage adapter for built-in cropper (optional - enables multi-select + crop)
  storage?: ImageStorageAdapter;
  // Video
  video?: VideoConfig;
  onVideoChange?: (video: VideoConfig) => void;
  // Modal
  onClose: () => void;
};

// Filter out invalid/expired blob URLs
const filterValidImageUrls = (urls: string[]): string[] => {
  return urls.filter(url => url && !url.startsWith('blob:'));
};

// Icon for the modal header
const HeroIcon = () => (
  <PhotoIcon className="w-3.5 h-3.5 text-white" />
);

// Slideshow speed presets
const SPEED_PRESETS = [
  { value: 3, label: '3s' },
  { value: 5, label: '5s' },
  { value: 7, label: '7s' },
  { value: 10, label: '10s' },
];

// Video provider options
const VIDEO_PROVIDERS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
];

const HeroImageEditor: React.FC<HeroImageEditorProps> = ({
  isOpen,
  layoutStyle = 'standard',
  onLayoutStyleChange,
  overlayBlur = false,
  onOverlayBlurChange,
  mediaType = 'photo',
  onMediaTypeChange,
  images: rawImages,
  slideshowInterval,
  onImagesChange,
  onSlideshowIntervalChange,
  onAddImage,
  storage,
  video,
  onVideoChange,
  onClose,
}) => {
  // Filter out invalid blob URLs - they expire and cause errors
  const images = filterValidImageUrls(rawImages);
  
  // File input ref for direct upload (fallback when no storage)
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  
  // Image loading states
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  
  // Upload state (for fallback data URL mode)
  const [isUploading, setIsUploading] = useState(false);
  
  // Convert interval ms to seconds for display
  const intervalSeconds = slideshowInterval / 1000;
  
  // Determine crop type based on layout
  const cropType: CropType = layoutStyle === 'fullwidth-overlay' ? 'hero-fullwidth' : 'hero';
  
  // Use the image cropper hook when storage is provided
  const cropper = useImageCropper({
    cropType,
    targetKey: 'hero-image',
    storage: storage || {
      // Dummy adapter if none provided - won't be used
      saveBlob: async () => {},
      generateImageKey: () => '',
    },
    multiple: true,
    onComplete: (imageKey) => {
      // Add each cropped image to the list
      const newImages = [...images, imageKey].slice(0, 10);
      onImagesChange(newImages);
    },
  });
  
  // Handle media type change
  const handleMediaTypeChange = useCallback((type: 'photo' | 'video') => {
    onMediaTypeChange?.(type);
    // Initialize video config if switching to video and none exists
    if (type === 'video' && !video && onVideoChange) {
      onVideoChange({
        provider: 'youtube',
        url: '',
        autoplay: true,
        controls: false,
        loop: true,
        muted: true,
      });
    }
  }, [onMediaTypeChange, video, onVideoChange]);
  
  // Handle video field changes
  const handleVideoFieldChange = useCallback((field: keyof VideoConfig, value: unknown) => {
    if (!onVideoChange) return;
    onVideoChange({
      ...video,
      provider: video?.provider || 'youtube',
      url: video?.url || '',
      [field]: value,
    });
  }, [video, onVideoChange]);
  
  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    if (dragNodeRef.current) {
      e.dataTransfer.setDragImage(dragNodeRef.current, 50, 50);
    }
  }, []);
  
  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);
  
  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);
  
  // Handle drop - reorder images
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      handleDragEnd();
      return;
    }
    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    onImagesChange(newImages);
    handleDragEnd();
  }, [draggedIndex, images, onImagesChange, handleDragEnd]);
  
  // Remove image
  const handleRemoveImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);
  
  // Move image up/down
  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    onImagesChange(newImages);
  }, [images, onImagesChange]);
  
  const handleMoveDown = useCallback((index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    onImagesChange(newImages);
  }, [images, onImagesChange]);
  
  // Mark image as loaded/failed
  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set([...Array.from(prev), index]));
    setFailedImages(prev => { const next = new Set(prev); next.delete(index); return next; });
  }, []);
  
  const handleImageError = useCallback((index: number) => {
    setFailedImages(prev => new Set([...Array.from(prev), index]));
    setLoadedImages(prev => new Set([...Array.from(prev), index]));
  }, []);
  
  // Handle direct file upload (fallback when no parent handler provided)
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const newImageUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Convert to data URL for preview
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newImageUrls.push(dataUrl);
      }
      
      // Add to existing images (max 10)
      const combinedImages = [...images, ...newImageUrls].slice(0, 10);
      onImagesChange(combinedImages);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  }, [images, onImagesChange]);

  return (
    <>
    {/* Hidden file inputs - rendered outside modal so they're always in DOM */}
    {storage ? (
      <input ref={cropper.fileInputRef} {...cropper.fileInputProps} />
    ) : (
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    )}
    
    <EditorModal
      isOpen={isOpen}
      onClose={onClose}
      title="Hero Settings"
      icon={<HeroIcon />}
      width="lg"
      backdropOpacity={0}
    >
      {/* Layout Style Selection */}
      {onLayoutStyleChange && (
        <>
          <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            Layout Style
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Standard Layout Card */}
            <button
              onClick={() => onLayoutStyleChange('standard')}
              className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                layoutStyle === 'standard'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/10 bg-gray-800/30 hover:border-white/20 hover:bg-gray-800/50'
              }`}
            >
              {/* Mini preview */}
              <div className="flex gap-2 mb-2">
                <div className="flex-1 space-y-1">
                  <div className="h-1.5 w-3/4 bg-gray-500/50 rounded" />
                  <div className="h-1 w-1/2 bg-gray-600/50 rounded" />
                  <div className="h-2 w-8 bg-indigo-500/30 rounded mt-1.5" />
                </div>
                <div className="w-10 h-8 bg-gray-600/50 rounded" />
              </div>
              <p className="text-xs font-medium text-white">Standard</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Text beside image</p>
              {layoutStyle === 'standard' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>
            
            {/* Fullwidth Overlay Card */}
            <button
              onClick={() => onLayoutStyleChange('fullwidth-overlay')}
              className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                layoutStyle === 'fullwidth-overlay'
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/10 bg-gray-800/30 hover:border-white/20 hover:bg-gray-800/50'
              }`}
            >
              {/* Mini preview */}
              <div className="relative mb-2">
                <div className="w-full h-8 bg-gray-600/50 rounded" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="h-1.5 w-8 bg-white/70 rounded mb-0.5" />
                  <div className="h-1 w-6 bg-white/40 rounded" />
                </div>
              </div>
              <p className="text-xs font-medium text-white">Fullwidth</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Text over image</p>
              {layoutStyle === 'fullwidth-overlay' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>
          </div>
          
          {/* Overlay Options - only for fullwidth */}
          {layoutStyle === 'fullwidth-overlay' && onOverlayBlurChange && (
            <div className="p-3 bg-gray-800/30 rounded-lg border border-white/5">
              <EditorToggle
                label="Dark Text Background"
                description="Adds a translucent box behind text for better readability"
                checked={overlayBlur}
                onChange={onOverlayBlurChange}
                compact
              />
            </div>
          )}
          
          <div className="border-t border-white/10 -mx-4" />
        </>
      )}
      
      {/* Media Type Toggle */}
      {onMediaTypeChange && (
        <div className="flex gap-2 p-1 bg-gray-800/50 rounded-lg">
          <button
            onClick={() => handleMediaTypeChange('photo')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              mediaType === 'photo'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PhotoIcon className="w-4 h-4" />
            Photo
          </button>
          <button
            onClick={() => handleMediaTypeChange('video')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              mediaType === 'video'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <VideoCameraIcon className="w-4 h-4" />
            Video
          </button>
        </div>
      )}
      
      {/* Photo Mode */}
      {mediaType === 'photo' && (
        <>
          {/* Add Images Button - Always at top when in photo mode */}
          {images.length < 10 && (
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                if (storage) {
                  cropper.openFilePicker();
                } else if (onAddImage) {
                  onAddImage();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              disabled={isUploading || cropper.isProcessing}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-600/30 border border-indigo-500/30 hover:border-indigo-500/50 rounded-lg text-indigo-300 hover:text-white transition-all text-sm font-medium disabled:opacity-50"
            >
              {isUploading || cropper.isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PlusIcon className="w-5 h-5" />
                  {images.length === 0 ? 'Add Hero Images' : 'Add More Images'}
                </>
              )}
            </button>
          )}
          
          {/* Images List */}
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center mb-2">
                <PhotoIcon className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-500 text-xs">No images added yet</p>
              <p className="text-gray-600 text-[10px] mt-1">Click the button above to upload</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500">
                {images.length === 1 ? '1 image • Add more for slideshow' : `${images.length} images • Drag to reorder`}
              </p>
              {images.map((imageUrl, index) => {
                const isIdbUrl = imageUrl.startsWith('idb://');
                const ImageComponent = isIdbUrl ? IdbImage : Image;
                const isDraggedOver = dragOverIndex === index && draggedIndex !== index;
                const isBeingDragged = draggedIndex === index;
                
                return (
                  <div
                    key={`${imageUrl}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`
                      flex items-center gap-2 p-2 rounded-lg border transition-all cursor-grab
                      ${isBeingDragged 
                        ? 'opacity-50 border-indigo-500 bg-indigo-500/10' 
                        : isDraggedOver 
                          ? 'border-indigo-400 bg-indigo-500/20' 
                          : 'border-white/10 bg-gray-800/30 hover:border-white/20'
                      }
                    `}
                  >
                    {/* Drag handle */}
                    <Bars3Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    
                    {/* Thumbnail */}
                    <div className="relative w-14 h-9 rounded overflow-hidden flex-shrink-0 bg-gray-800/50 border border-white/5">
                      {!loadedImages.has(index) && <div className="absolute inset-0 animate-pulse bg-gray-800" />}
                      {failedImages.has(index) ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                          <span className="text-red-400 text-[8px]">Error</span>
                        </div>
                      ) : (
                        <ImageComponent
                          src={imageUrl}
                          alt={`Hero ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="56px"
                          onLoad={() => handleImageLoad(index)}
                          onError={() => handleImageError(index)}
                        />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium">
                        {index === 0 ? (
                          <span className="text-indigo-300">Primary</span>
                        ) : (
                          `Image ${index + 1}`
                        )}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-0.5 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                        disabled={index === 0}
                        className={`p-1.5 rounded transition-colors ${index === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20'}`}
                        title="Move up"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                        disabled={index === images.length - 1}
                        className={`p-1.5 rounded transition-colors ${index === images.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20'}`}
                        title="Move down"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                        className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors"
                        title="Remove"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Max images message */}
          {images.length >= 10 && (
            <p className="text-center text-amber-400/70 text-[10px] py-2">Maximum 10 images reached</p>
          )}
          
          {/* Slideshow Speed - only show when multiple images */}
          {images.length > 1 && (
            <>
              <div className="border-t border-white/10 -mx-4" />
              <EditorSlider
                label="Slideshow Speed"
                value={intervalSeconds}
                onChange={(v) => onSlideshowIntervalChange(v * 1000)}
                min={2}
                max={10}
                step={0.5}
                presets={SPEED_PRESETS}
                formatValue={(v) => `${v}s`}
                hideMinMax
              />
            </>
          )}
        </>
      )}
      
      {/* Video Mode */}
      {mediaType === 'video' && onVideoChange && (
        <>
          {/* Video Provider */}
          <EditorSelect
            label="Video Provider"
            value={video?.provider || 'youtube'}
            onChange={(v) => handleVideoFieldChange('provider', v)}
            options={VIDEO_PROVIDERS}
          />
          
          {/* Video URL */}
          <EditorInput
            label="Video URL"
            value={video?.url || ''}
            onChange={(v) => handleVideoFieldChange('url', v)}
            type="url"
            placeholder={video?.provider === 'vimeo' 
              ? 'https://vimeo.com/123456789' 
              : 'https://youtube.com/watch?v=...'
            }
            description="Paste the video URL or embed code"
            multiline
            rows={2}
          />
          
          {/* Video preview hint */}
          {video?.url && (
            <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg border border-white/5">
              <PlayIcon className="w-5 h-5 text-indigo-400" />
              <p className="text-xs text-gray-400 flex-1">
                Video configured. Preview in the main editor.
              </p>
            </div>
          )}
          
          <div className="border-t border-white/10 -mx-4" />
          
          {/* Video Options */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Playback Options
            </label>
            <div className="grid grid-cols-2 gap-2">
              <EditorToggle
                label="Autoplay"
                checked={video?.autoplay ?? true}
                onChange={(v) => handleVideoFieldChange('autoplay', v)}
                compact
              />
              <EditorToggle
                label="Loop"
                checked={video?.loop ?? true}
                onChange={(v) => handleVideoFieldChange('loop', v)}
                compact
              />
              <EditorToggle
                label="Muted"
                checked={video?.muted ?? true}
                onChange={(v) => handleVideoFieldChange('muted', v)}
                compact
              />
              <EditorToggle
                label="Show Controls"
                checked={video?.controls ?? false}
                onChange={(v) => handleVideoFieldChange('controls', v)}
                compact
              />
            </div>
          </div>
          
          <EditorInfoBox variant="tip">
            For best results as a background video: keep Autoplay, Loop, and Muted enabled with Controls hidden
          </EditorInfoBox>
        </>
      )}
      
      {/* Hidden drag ghost */}
      <div ref={dragNodeRef} style={{ position: 'fixed', top: -1000, left: -1000, width: 100, height: 100, pointerEvents: 'none' }} />
    </EditorModal>
    
    {/* Built-in Image Cropper - rendered outside main modal */}
    {storage && cropper.isOpen && (
      <EditorImageCropper
        isOpen={cropper.isOpen}
        imageSrc={cropper.imageSrc}
        cropType={cropType}
        onCropComplete={cropper.handleCropComplete}
        onCancel={cropper.handleCancel}
        onSkip={cropper.handleSkip}
        bulkProgress={cropper.bulkProgress}
        title="Crop Hero Image"
      />
    )}
  </>
  );
};

export default HeroImageEditor;

