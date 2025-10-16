"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TextSizePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  textSize: number;
  onTextSizeChange: (size: number) => void;
  targetElement?: HTMLElement | null;
  label?: string;
  presetSizes?: number[];
  normalSize?: number;
  minSize?: number;
  maxSize?: number;
  onInteractStart?: () => void;
  onInteractEnd?: () => void;
  // Color picker support
  textColor?: string;
  onTextColorChange?: (color: string) => void;
  showColorPicker?: boolean;
  presetColors?: string[]; // Array of preset colors to display as quick options
  // Bold toggle support
  textBold?: boolean;
  onTextBoldChange?: (bold: boolean) => void;
  showBoldToggle?: boolean;
  // Alignment toggle support
  textAlign?: 'left' | 'center' | 'right';
  onTextAlignChange?: (align: 'left' | 'center' | 'right') => void;
  showAlignmentToggle?: boolean;
};

export default function TextSizePopup({
  isOpen,
  onClose,
  textSize,
  onTextSizeChange,
  targetElement,
  label = "Text Size",
  presetSizes = [0.75, 1.0, 1.25, 1.5],
  normalSize = 1.0,
  minSize = 0.5,
  maxSize = 2.5,
  onInteractStart,
  onInteractEnd,
  textColor,
  onTextColorChange,
  showColorPicker = false,
  presetColors = [],
  textBold = false,
  onTextBoldChange,
  showBoldToggle = false,
  textAlign = 'center',
  onTextAlignChange,
  showAlignmentToggle = false,
}: TextSizePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [positionCalculated, setPositionCalculated] = useState(false);
  const [measuring, setMeasuring] = useState(false);

  // Handle mounting for SSR compatibility
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset position calculation when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      setPositionCalculated(false);
      setMeasuring(true);
    }
  }, [isOpen]);

  // Simple positioning: below text by default, above if no space
  useEffect(() => {
    if (!isOpen || !targetElement || !mounted) return;

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Get actual popup dimensions
      const popupElement = popupRef.current;
      if (!popupElement) return;
      
      const popupWidth = popupElement.offsetWidth;
      const popupHeight = popupElement.offsetHeight;
      const gap = 16; // gap between text and popup
      const screenMargin = 16; // margin from screen edges
      
      let top, left;
      
      // Center the popup horizontally relative to the text element
      const textCenterX = rect.left + rect.width / 2;
      left = textCenterX - popupWidth / 2;
      
      // Determine if text is in the bottom half of the screen
      const screenMidpoint = window.innerHeight / 2;
      const textVerticalCenter = rect.top + rect.height / 2;
      const isInBottomHalf = textVerticalCenter > screenMidpoint;
      
      // Position vertically based on which half of screen the text is in
      if (isInBottomHalf) {
        // Text is in bottom half - position popup above the text
        // popup bottom should be (gap) pixels above text top
        // Use viewport coordinates since popup is position:fixed
        top = rect.top - popupHeight - gap;
      } else {
        // Text is in top half - position popup below the text  
        // popup top should be (gap) pixels below text bottom
        // Use viewport coordinates since popup is position:fixed
        top = rect.bottom + gap;
      }
      
      // Adjust horizontal position to keep popup on screen
      if (left + popupWidth > window.innerWidth - screenMargin) {
        // Move popup to the left to fit on screen
        left = window.innerWidth - popupWidth - screenMargin;
      }
      
      // Ensure popup doesn't go off the left edge
      if (left < screenMargin) {
        left = screenMargin;
      }
      
      console.log('Final position calculation:', {
        isInBottomHalf,
        textTop: rect.top,
        textBottom: rect.bottom,
        scrollY,
        calculatedTop: top,
        popupHeight,
        gap,
        screenMidpoint,
        textVerticalCenter,
        expectedTop: isInBottomHalf ? rect.top - popupHeight - gap : rect.bottom + gap,
        calculation: isInBottomHalf ? `${rect.top} - ${popupHeight} - ${gap} = ${rect.top - popupHeight - gap}` : `${rect.bottom} + ${gap} = ${rect.bottom + gap}`,
        popupWillSpan: `${top} to ${top + popupHeight}`,
        textSpans: `${rect.top} to ${rect.bottom}`
      });
      
      setPosition({ top, left });
      setPositionCalculated(true);
      setMeasuring(false);
    };

    updatePosition();
    
    // Update position on scroll/resize
    const handleUpdate = () => updatePosition();
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);
    
    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, targetElement, mounted]);

  // Measure popup dimensions after initial render
  useEffect(() => {
    if (measuring && popupRef.current && isOpen) {
      // Small delay to ensure popup is fully rendered
      const timer = setTimeout(() => {
        if (popupRef.current) {
          // Trigger position calculation now that we have dimensions
          const updateEvent = new Event('resize');
          window.dispatchEvent(updateEvent);
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [measuring, isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        targetElement &&
        !targetElement.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, targetElement]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseFloat(e.target.value);
    onTextSizeChange(newSize);
  };

  const handlePresetClick = (size: number) => {
    onTextSizeChange(size);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onTextColorChange) {
      onTextColorChange(e.target.value);
    }
  };

  const handlePresetColorClick = (color: string) => {
    if (onTextColorChange) {
      onTextColorChange(color);
    }
  };

  if (!isOpen || !mounted) return null;

  const popupContent = (
    <>
    {/* Backdrop to capture clicks and prevent pass-through */}
    <div
      className="fixed inset-0"
      style={{ zIndex: 9998, background: 'transparent' }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onClose();
      }}
    />
    <div
      ref={popupRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[300px]"
      style={{
        top: positionCalculated ? `${position.top}px` : '-9999px',
        left: positionCalculated ? `${position.left}px` : '-9999px',
        zIndex: 9999, // Very high z-index to ensure it's above everything
        opacity: positionCalculated ? 1 : 0,
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (onInteractStart) onInteractStart();
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        if (onInteractEnd) onInteractEnd();
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">{label}</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Preset buttons */}
        <div className="flex gap-2">
          {presetSizes.map((size) => (
            <button
              key={size}
              onClick={() => handlePresetClick(size)}
              className={`px-3 py-1 text-xs rounded-md border transition-all ${
                Math.abs(textSize - size) < 0.05
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {size === normalSize ? 'Normal' : `${size}x`}
            </button>
          ))}
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="range"
              min={minSize}
              max={maxSize}
              step="0.05"
              value={textSize}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-smooth"
              style={{
                background: `linear-gradient(to right, #e5e7eb 0%, #3b82f6 ${((textSize - minSize) / (maxSize - minSize)) * 100}%, #e5e7eb ${((textSize - minSize) / (maxSize - minSize)) * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>Small ({minSize}x)</span>
            <span className="font-medium bg-gray-100 px-2 py-1 rounded">
              {(textSize * 100).toFixed(0)}%
            </span>
            <span>Large ({maxSize}x)</span>
          </div>
        </div>

        {/* Color Picker - only show if enabled */}
        {showColorPicker && onTextColorChange && (
          <div className="space-y-2 pt-2 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700">
              Text Color
            </label>
            
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={textColor || '#000000'}
                onChange={handleColorChange}
                list="preset-colors"
                className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                onMouseDown={() => {
                  if (onInteractStart) onInteractStart();
                }}
                onMouseUp={() => {
                  if (onInteractEnd) onInteractEnd();
                }}
              />
              {/* Datalist for preset colors in the native color picker */}
              {presetColors.length > 0 && (
                <datalist id="preset-colors">
                  {presetColors.map((color) => (
                    <option key={color} value={color} />
                  ))}
                </datalist>
              )}
              <input
                type="text"
                value={textColor || '#000000'}
                onChange={handleColorChange}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded font-mono"
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
        )}

        {/* Bold Toggle - only show if enabled */}
        {showBoldToggle && onTextBoldChange && (
          <div className="pt-2 border-t border-gray-200">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={textBold}
                onChange={(e) => {
                  if (onInteractStart) onInteractStart();
                  onTextBoldChange(e.target.checked);
                  if (onInteractEnd) onInteractEnd();
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                <strong>Bold</strong> text
              </span>
            </label>
          </div>
        )}

        {/* Alignment Toggle - only show if enabled */}
        {showAlignmentToggle && onTextAlignChange && (
          <div className="pt-2 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Alignment
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (onInteractStart) onInteractStart();
                  onTextAlignChange('left');
                  if (onInteractEnd) onInteractEnd();
                }}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all ${
                  textAlign === 'left'
                    ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
                title="Align Left"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (onInteractStart) onInteractStart();
                  onTextAlignChange('center');
                  if (onInteractEnd) onInteractEnd();
                }}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all ${
                  textAlign === 'center'
                    ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
                title="Align Center"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (onInteractStart) onInteractStart();
                  onTextAlignChange('right');
                  if (onInteractEnd) onInteractEnd();
                }}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-all ${
                  textAlign === 'right'
                    ? 'bg-blue-100 border-blue-300 text-blue-700 font-medium'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
                title="Align Right"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          💡 Click preset buttons for common sizes, or drag the slider for precise control
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .slider-smooth {
          transition: all 0.1s ease-out;
        }
        
        .slider-smooth::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.1s ease-out;
        }
        
        .slider-smooth::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
        
        .slider-smooth::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        `
      }} />
    </div>
    </>
  );

  // Use portal to render at document body level to avoid clipping
  return createPortal(popupContent, document.body);
}
