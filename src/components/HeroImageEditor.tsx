/**
 * HeroImageEditor.tsx
 * 
 * A modal for managing hero section images (slideshow).
 * Allows adding, removing, reordering images, and configuring slideshow settings.
 * Uses a portal to render at document body level (prevents clipping).
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, TrashIcon, PlusIcon, PhotoIcon, Bars3Icon } from '@heroicons/react/24/outline';
import IdbImage from './IdbImage';
import Image from 'next/image';

type HeroImageEditorProps = {
  images: string[];
  slideshowInterval: number;
  onImagesChange: (images: string[]) => void;
  onSlideshowIntervalChange: (interval: number) => void;
  onAddImage?: () => void; // Optional: Triggers the parent's image upload flow (with cropper)
  onClose: () => void;
};

// Filter out invalid/expired blob URLs
const filterValidImageUrls = (urls: string[]): string[] => {
  return urls.filter(url => url && !url.startsWith('blob:'));
};

const HeroImageEditor: React.FC<HeroImageEditorProps> = ({
  images: rawImages,
  slideshowInterval,
  onImagesChange,
  onSlideshowIntervalChange,
  onAddImage,
  onClose,
}) => {
  // Filter out invalid blob URLs - they expire and cause errors
  const images = filterValidImageUrls(rawImages);
  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  
  // Image loading states
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  
  // Convert interval ms to seconds for display
  const intervalSeconds = slideshowInterval / 1000;
  
  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Create a custom drag image
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
    setIsDragging(false);
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
  
  // Move image up
  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    onImagesChange(newImages);
  }, [images, onImagesChange]);
  
  // Move image down
  const handleMoveDown = useCallback((index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    onImagesChange(newImages);
  }, [images, onImagesChange]);
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  // Mark image as loaded
  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set([...Array.from(prev), index]));
    setFailedImages(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);
  
  // Mark image as failed
  const handleImageError = useCallback((index: number) => {
    setFailedImages(prev => new Set([...Array.from(prev), index]));
    setLoadedImages(prev => new Set([...Array.from(prev), index])); // Stop loading animation
  }, []);
  
  // Handle add image - triggers parent's cropper flow
  const handleAddImageClick = useCallback(() => {
    if (onAddImage) {
      onClose(); // Close modal - cropper will open
      onAddImage();
    }
  }, [onAddImage, onClose]);
  
  // Stop click propagation
  const stopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-[9998]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className="fixed z-[9999] bg-gray-900 rounded-xl shadow-2xl border border-gray-700"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '680px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={stopClick}
        onMouseDown={stopClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
              <PhotoIcon className="w-5 h-5 text-blue-400" />
              Hero Images
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {images.length === 0 
                ? 'Add images to create a slideshow'
                : images.length === 1 
                  ? '1 image • Add more for a slideshow'
                  : `${images.length} images • Drag to reorder`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Images Grid */}
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                <PhotoIcon className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-4">No hero images yet</p>
              <button
                onClick={handleAddImageClick}
                disabled={!onAddImage}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Add First Image
              </button>
            </div>
          ) : (
            <div className="space-y-3">
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
                      relative flex items-center gap-4 p-3 rounded-xl border-2 transition-all
                      ${isBeingDragged 
                        ? 'opacity-50 border-blue-500 bg-blue-500/10' 
                        : isDraggedOver 
                          ? 'border-blue-400 bg-blue-500/20 scale-[1.02]' 
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }
                    `}
                    style={{ cursor: 'grab' }}
                  >
                    {/* Drag handle */}
                    <div className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors cursor-grab active:cursor-grabbing">
                      <Bars3Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Image thumbnail */}
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-700">
                      {!loadedImages.has(index) && (
                        <div className="absolute inset-0 animate-pulse bg-gray-700" />
                      )}
                      {failedImages.has(index) ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                          <span className="text-red-300 text-xs text-center px-1">Failed to load</span>
                        </div>
                      ) : (
                        <ImageComponent
                          src={imageUrl}
                          alt={`Hero image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="96px"
                          onLoad={() => handleImageLoad(index)}
                          onError={() => handleImageError(index)}
                        />
                      )}
                    </div>
                    
                    {/* Image info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">
                        Image {index + 1}
                        {index === 0 && (
                          <span className="ml-2 text-xs text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs truncate mt-0.5" title={imageUrl}>
                        {isIdbUrl ? 'Local upload' : imageUrl.split('/').pop()?.substring(0, 40)}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Move up/down buttons */}
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={`p-2 rounded-lg transition-colors ${
                          index === 0 
                            ? 'text-gray-600 cursor-not-allowed' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === images.length - 1}
                        className={`p-2 rounded-lg transition-colors ${
                          index === images.length - 1 
                            ? 'text-gray-600 cursor-not-allowed' 
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove image"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Add Image Button */}
          {images.length > 0 && images.length < 10 && onAddImage && (
            <button
              onClick={handleAddImageClick}
              className="mt-4 w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl text-gray-400 hover:text-blue-400 transition-all hover:bg-blue-500/5"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Another Image</span>
              <span className="text-gray-600 text-sm">({10 - images.length} remaining)</span>
            </button>
          )}
          
          {images.length >= 10 && (
            <p className="mt-4 text-center text-gray-500 text-sm">
              Maximum of 10 images reached
            </p>
          )}
        </div>
        
        {/* Footer - Slideshow Settings */}
        {images.length > 1 && (
          <div className="border-t border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-white font-medium text-sm block">
                  Slideshow Speed
                </label>
                <p className="text-gray-500 text-xs mt-0.5">
                  Time between image transitions
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="0.5"
                  value={intervalSeconds}
                  onChange={(e) => onSlideshowIntervalChange(parseFloat(e.target.value) * 1000)}
                  className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((intervalSeconds - 2) / 8) * 100}%, #374151 ${((intervalSeconds - 2) / 8) * 100}%, #374151 100%)`,
                  }}
                />
                <span className="text-white font-mono text-sm w-12 text-right">
                  {intervalSeconds}s
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Close Button */}
        <div className="border-t border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
      
      {/* Hidden drag ghost element */}
      <div
        ref={dragNodeRef}
        style={{
          position: 'fixed',
          top: -1000,
          left: -1000,
          width: 100,
          height: 100,
          pointerEvents: 'none',
        }}
      />
    </>
  );
  
  // Use portal to render at document body level
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
};

export default HeroImageEditor;

