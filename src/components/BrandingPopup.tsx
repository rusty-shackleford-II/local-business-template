"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type BrandingPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  targetElement?: HTMLElement | null;
  location: 'header' | 'footer';
  // Logo toggle
  showLogo: boolean;
  onShowLogoChange: (show: boolean) => void;
  onLogoUpload?: () => void;
  logoUrl?: string;
  // Business name toggle and text
  showBusinessName: boolean;
  onShowBusinessNameChange: (show: boolean) => void;
  brandText: string;
  onBrandTextChange: (text: string) => void;
  // Text styling
  textSize?: number;
  onTextSizeChange?: (size: number) => void;
  textColor?: string;
  onTextColorChange?: (color: string) => void;
  // Logo size (for header)
  logoSize?: number;
  onLogoSizeChange?: (size: number) => void;
  // Preset colors from palette
  presetColors?: string[];
};

export default function BrandingPopup({
  isOpen,
  onClose,
  targetElement,
  location,
  showLogo,
  onShowLogoChange,
  onLogoUpload,
  logoUrl,
  showBusinessName,
  onShowBusinessNameChange,
  brandText,
  onBrandTextChange,
  textSize = 1.0,
  onTextSizeChange,
  textColor,
  onTextColorChange,
  logoSize = 1.0,
  onLogoSizeChange,
  presetColors = [],
}: BrandingPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [positionCalculated, setPositionCalculated] = useState(false);
  const [localBrandText, setLocalBrandText] = useState(brandText);

  // Sync local state with prop
  useEffect(() => {
    setLocalBrandText(brandText);
  }, [brandText]);

  // Handle mounting for SSR compatibility
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset position calculation when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      setPositionCalculated(false);
    }
  }, [isOpen]);

  // Position popup below or above target element
  useEffect(() => {
    if (!isOpen || !targetElement || !mounted) return;

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect();
      const popupElement = popupRef.current;
      if (!popupElement) return;
      
      const popupWidth = popupElement.offsetWidth;
      const popupHeight = popupElement.offsetHeight;
      const gap = 16;
      const screenMargin = 16;
      
      let top, left;
      
      // Center horizontally relative to target
      const targetCenterX = rect.left + rect.width / 2;
      left = targetCenterX - popupWidth / 2;
      
      // Position below by default (for header), above for footer
      const screenMidpoint = window.innerHeight / 2;
      const targetVerticalCenter = rect.top + rect.height / 2;
      const isInBottomHalf = targetVerticalCenter > screenMidpoint;
      
      if (isInBottomHalf || location === 'footer') {
        // Position above
        top = rect.top - popupHeight - gap;
      } else {
        // Position below
        top = rect.bottom + gap;
      }
      
      // Keep on screen horizontally
      if (left + popupWidth > window.innerWidth - screenMargin) {
        left = window.innerWidth - popupWidth - screenMargin;
      }
      if (left < screenMargin) {
        left = screenMargin;
      }
      
      // Keep on screen vertically
      if (top < screenMargin) {
        top = rect.bottom + gap; // Flip to below if no room above
      }
      if (top + popupHeight > window.innerHeight - screenMargin) {
        top = rect.top - popupHeight - gap; // Flip to above if no room below
      }
      
      setPosition({ top, left });
      setPositionCalculated(true);
    };

    // Small delay to ensure popup is rendered
    const timer = setTimeout(updatePosition, 10);
    
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, targetElement, mounted, location]);

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

  const handleBrandTextBlur = () => {
    if (localBrandText !== brandText) {
      onBrandTextChange(localBrandText);
    }
  };

  if (!isOpen || !mounted) return null;

  const popupContent = (
    <>
      {/* Backdrop */}
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
        className="fixed bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[320px] max-w-[400px]"
        style={{
          top: positionCalculated ? `${position.top}px` : '-9999px',
          left: positionCalculated ? `${position.left}px` : '-9999px',
          zIndex: 9999,
          opacity: positionCalculated ? 1 : 0,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="text-sm font-semibold text-gray-900">
              {location === 'header' ? 'Header' : 'Footer'} Branding
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Logo Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Logo</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(e) => onShowLogoChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {showLogo && (
              <div className="pl-2 space-y-3 border-l-2 border-gray-100">
                {/* Logo preview and upload */}
                {onLogoUpload && (
                  <button
                    onClick={onLogoUpload}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    {logoUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="Logo" className="h-6 w-auto object-contain" />
                        <span className="text-gray-600">Change Logo</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">Upload Logo</span>
                      </>
                    )}
                  </button>
                )}
                
                {/* Logo size slider */}
                {onLogoSizeChange && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Logo Size</span>
                      <span className="font-medium">{Math.round(logoSize * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      value={logoSize}
                      onChange={(e) => onLogoSizeChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Business Name Section */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Business Name</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBusinessName}
                  onChange={(e) => onShowBusinessNameChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {showBusinessName && (
              <div className="pl-2 space-y-3 border-l-2 border-gray-100">
                {/* Text input */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Text</label>
                  <input
                    type="text"
                    value={localBrandText}
                    onChange={(e) => setLocalBrandText(e.target.value)}
                    onBlur={handleBrandTextBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleBrandTextBlur();
                      }
                    }}
                    placeholder="Business Name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Text size slider */}
                {onTextSizeChange && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Text Size</span>
                      <span className="font-medium">{Math.round(textSize * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.75}
                      max={1.5}
                      step={0.05}
                      value={textSize}
                      onChange={(e) => onTextSizeChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
                
                {/* Text color picker */}
                {onTextColorChange && (
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-500">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={textColor || '#111827'}
                        onChange={(e) => onTextColorChange(e.target.value)}
                        className="h-8 w-12 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={textColor || '#111827'}
                        onChange={(e) => onTextColorChange(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                        placeholder="#111827"
                      />
                    </div>
                    {/* Preset colors */}
                    {presetColors.length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {presetColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => onTextColorChange(color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              textColor === color ? 'border-blue-500 scale-110' : 'border-gray-200 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Help text */}
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            💡 Toggle elements on/off and customize their appearance
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(popupContent, document.body);
}
