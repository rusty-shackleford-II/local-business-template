/**
 * SingleButtonEditor.tsx
 * 
 * A modal for customizing a single hero CTA button's properties.
 * Appears when clicking directly on a button in edit mode.
 * Edits only the clicked button - not all buttons.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { HeroCtaButton, ColorPalette, ButtonStyles } from '../types';

// ============================================================================
// COLOR UTILITIES
// ============================================================================

function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  let r = 0, g = 0, b = 0, a = 1;
  
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
  } else if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
      a = match[4] ? parseFloat(match[4]) : 1;
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    }
  }
  
  return { r, g, b, a };
}

function rgbaToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toRgbaString(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(2)})`;
}

function hasAlpha(color: string): boolean {
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba\([^)]+,\s*([\d.]+)\)/);
    return match ? parseFloat(match[1]) < 1 : false;
  }
  if (color.startsWith('#') && color.length === 9) {
    return parseInt(color.slice(7, 9), 16) < 255;
  }
  return false;
}

type SingleButtonEditorProps = {
  button: HeroCtaButton;
  buttonIndex: number;
  onClose: () => void;
  onEdit: (path: string, value: any) => void;
  defaultCtaBg?: string;
  defaultCtaText?: string;
  colorPalette?: ColorPalette;
  buttonStyles?: ButtonStyles;
  isLegacyButton?: boolean; // True if this button uses legacy hero.cta format
  allButtons?: HeroCtaButton[]; // All buttons (for migration purposes)
};

const SingleButtonEditor: React.FC<SingleButtonEditorProps> = ({
  button,
  buttonIndex,
  onClose,
  onEdit,
  defaultCtaBg = '#3b82f6',
  defaultCtaText = '#ffffff',
  colorPalette,
  buttonStyles = {},
  isLegacyButton = false,
  allButtons = [],
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Button state - with defaults from global or button-specific values
  const backgroundColor = button.backgroundColor || defaultCtaBg;
  const textColor = button.textColor || defaultCtaText;
  const variant = button.variant || 'primary';
  const actionType = button.actionType || 'contact';
  const showArrow = button.showArrow !== false;
  
  // Color mode tracking
  const [bgColorMode, setBgColorMode] = useState<'hex' | 'rgba'>(() => hasAlpha(backgroundColor) ? 'rgba' : 'hex');
  const [textColorMode, setTextColorMode] = useState<'hex' | 'rgba'>(() => hasAlpha(textColor) ? 'rgba' : 'hex');
  const [focusedColorField, setFocusedColorField] = useState<'background' | 'text'>('background');
  
  // Parse current colors
  const bgParsed = useMemo(() => parseColor(backgroundColor), [backgroundColor]);
  const textParsed = useMemo(() => parseColor(textColor), [textColor]);
  
  // Pulse animation state
  const [showPulse, setShowPulse] = useState(true);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Global button styles for preview
  const paddingX = buttonStyles.paddingX ?? 32;
  const paddingY = buttonStyles.paddingY ?? 16;
  const borderRadius = buttonStyles.borderRadius ?? 8;
  const fontFamily = buttonStyles.fontFamily ?? '';
  const fontSize = buttonStyles.fontSize ?? 16;
  const fontWeight = buttonStyles.fontWeight ?? 600;
  
  // Check if buttonStyles has any explicit customization (matches ButtonGridEditor logic)
  const hasCustomStyles = buttonStyles && (
    buttonStyles.paddingX !== undefined ||
    buttonStyles.paddingY !== undefined ||
    buttonStyles.borderRadius !== undefined ||
    buttonStyles.fontSize !== undefined ||
    buttonStyles.fontWeight !== undefined ||
    buttonStyles.fontFamily !== undefined
  );
  
  // Pulse effect on open
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 600);
    return () => clearTimeout(timer);
  }, []);
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  // Build preset colors
  const presetColors = useMemo(() => {
    const colors: Array<{ color: string; label: string }> = [
      { color: '#ffffff', label: 'White' },
      { color: '#000000', label: 'Black' },
    ];
    
    if (colorPalette) {
      if (colorPalette.primary) colors.push({ color: colorPalette.primary, label: 'Primary' });
      if (colorPalette.secondary) colors.push({ color: colorPalette.secondary, label: 'Secondary' });
    }
    
    // Add the global default if different
    if (defaultCtaBg && !colors.some(c => c.color === defaultCtaBg)) {
      colors.push({ color: defaultCtaBg, label: 'Global CTA' });
    }
    
    return colors;
  }, [colorPalette, defaultCtaBg]);
  
  // Handle button property changes
  // For legacy buttons, migrate to ctaButtons format on first edit
  const updateButton = useCallback((field: string, value: any) => {
    if (isLegacyButton) {
      // Migrate legacy button to ctaButtons format
      // Create a new button with the updated field and proper ID
      const migratedButton: HeroCtaButton = {
        ...button,
        id: `btn-${Date.now()}`, // Give it a proper ID
        [field]: value,
      };
      // Set the entire ctaButtons array (this migrates from legacy cta to new format)
      onEdit('hero.ctaButtons', [migratedButton]);
    } else {
      // Standard update for ctaButtons format
      const path = `hero.ctaButtons.${buttonIndex}.${field}`;
      onEdit(path, value);
    }
  }, [buttonIndex, onEdit, isLegacyButton, button]);
  
  // Apply preset color to whichever field is focused
  const applyPresetColor = useCallback((color: string) => {
    const field = focusedColorField === 'background' ? 'backgroundColor' : 'textColor';
    updateButton(field, color);
  }, [focusedColorField, updateButton]);
  
  // Stop click from closing modal
  const stopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Get button preview styles
  // Must match ButtonGridEditor's customButtonStyle logic to show accurate preview
  const getPreviewStyle = (): React.CSSProperties => {
    // Match ButtonGridEditor's sizing logic:
    // - Legacy mode (no custom styles): use padding-based natural sizing
    // - Custom styles mode: use explicit width/height based on paddingX/paddingY
    const baseStyle: React.CSSProperties = hasCustomStyles ? {
      // Custom styles mode: explicit dimensions (matches ButtonGridEditor non-fluid custom mode)
      minWidth: `${paddingX * 2 + 100}px`,
      height: `${paddingY * 2 + 20}px`,
      padding: 0,
      borderRadius: `${borderRadius}px`,
      fontFamily: fontFamily || 'inherit',
      fontSize: `${fontSize}px`,
      fontWeight,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
    } : {
      // Legacy mode: natural sizing with padding (matches ButtonGridEditor non-fluid legacy mode)
      padding: '14px 32px',
      borderRadius: '8px',
      fontFamily: 'inherit',
      fontSize: '16px',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
    };
    
    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor,
          color: textColor,
          opacity: 0.9,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          color: backgroundColor,
          border: `2px solid ${backgroundColor}`,
        };
      case 'primary':
      default:
        return {
          ...baseStyle,
          backgroundColor,
          color: textColor,
        };
    }
  };
  
  // Modal content
  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={popoverRef}
        className="fixed z-[9999] w-full max-w-lg bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '90vh',
        }}
        onClick={stopClick}
        onMouseDown={stopClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <ArrowRightIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Edit Button</h2>
              <p className="text-xs text-gray-400 truncate max-w-[200px]">{button.label || 'Untitled Button'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Delete button - only show if there's more than one button */}
            {allButtons.length > 1 && !isLegacyButton && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                title="Delete this button"
              >
                <TrashIcon className="h-5 w-5 text-gray-400 hover:text-red-400" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm font-medium mb-3">
                Are you sure you want to delete this button?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Remove this button from the array
                    const updatedButtons = allButtons.filter((_, i) => i !== buttonIndex);
                    onEdit('hero.ctaButtons', updatedButtons);
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Subtitle explaining scope */}
          {!showDeleteConfirm && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-amber-400/90 text-xs">Editing only this button — not all buttons</p>
            </div>
          )}
          
          {/* Button Preview */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Preview</label>
            <div 
              className="flex justify-center items-center py-8 bg-gray-800/30 border border-white/5 rounded-xl"
              style={{ minHeight: '100px' }}
            >
              <button
                className="shadow-lg select-none pointer-events-none"
                style={{
                  ...getPreviewStyle(),
                  animation: showPulse ? 'pulse-highlight 0.6s ease-out' : undefined,
                  boxShadow: showPulse ? '0 0 0 4px rgba(99, 102, 241, 0.5)' : undefined,
                }}
              >
                {button.label || 'Button Text'}
                {showArrow && <ArrowRightIcon className="ml-2 h-5 w-5" />}
              </button>
            </div>
          </div>
        
          {/* Button Label */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Button Label</label>
            <input
              type="text"
              value={button.label || ''}
              onChange={(e) => updateButton('label', e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              placeholder="Enter button text"
            />
          </div>
          
          {/* Variant Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Button Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(['primary', 'secondary', 'outline'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => updateButton('variant', v)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    variant === v 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
                      : 'bg-gray-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Button Action</label>
            <select
              value={actionType}
              onChange={(e) => updateButton('actionType', e.target.value)}
              className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            >
              <option value="contact">Scroll to Contact Form</option>
              <option value="external">Open External Link</option>
              <option value="phone">Call Phone Number</option>
            </select>
          </div>
          
          {/* Conditional fields based on action type */}
          {actionType === 'external' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Link URL</label>
              <input
                type="text"
                value={button.href || ''}
                onChange={(e) => updateButton('href', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="https://example.com or #section-id"
              />
              <p className="text-xs text-gray-500">Use # for anchor links (e.g., #about) or full URLs for external sites</p>
            </div>
          )}
          
          {actionType === 'phone' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                value={button.phoneNumber || ''}
                onChange={(e) => updateButton('phoneNumber', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          )}
          
          {/* Show Arrow Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-white/5 rounded-xl">
            <div>
              <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">Show Arrow Icon</label>
              <p className="text-xs text-gray-500 mt-0.5">Display → arrow after button text</p>
            </div>
            <button
              onClick={() => updateButton('showArrow', !showArrow)}
              className={`relative w-12 h-6 rounded-full transition-colors ${showArrow ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showArrow ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        
          {/* Color Pickers Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Background Color */}
            <div 
              className={`p-3 rounded-xl transition-all cursor-pointer ${focusedColorField === 'background' ? 'bg-indigo-500/10 ring-2 ring-indigo-500/50' : 'bg-gray-800/50 border border-white/5'}`}
              onClick={() => setFocusedColorField('background')}
            >
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-medium uppercase tracking-wider ${focusedColorField === 'background' ? 'text-indigo-400' : 'text-gray-300'}`}>
                  Background {focusedColorField === 'background' && <span className="text-xs opacity-60">●</span>}
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setBgColorMode('hex'); }}
                    className={`px-2 py-0.5 text-[10px] rounded ${bgColorMode === 'hex' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                  >
                    HEX
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setBgColorMode('rgba'); }}
                    className={`px-2 py-0.5 text-[10px] rounded ${bgColorMode === 'rgba' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                  >
                    RGBA
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={rgbaToHex(bgParsed.r, bgParsed.g, bgParsed.b)}
                  onChange={(e) => {
                    const { r, g, b } = parseColor(e.target.value);
                    if (bgColorMode === 'rgba') {
                      updateButton('backgroundColor', toRgbaString(r, g, b, bgParsed.a));
                    } else {
                      updateButton('backgroundColor', e.target.value);
                    }
                  }}
                  onFocus={() => setFocusedColorField('background')}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/20 hover:border-white/40 transition-colors flex-shrink-0"
                  style={{ backgroundColor }}
                />
                {bgColorMode === 'hex' ? (
                  <input
                    type="text"
                    value={backgroundColor.startsWith('#') ? backgroundColor : rgbaToHex(bgParsed.r, bgParsed.g, bgParsed.b)}
                    onChange={(e) => updateButton('backgroundColor', e.target.value)}
                    onFocus={() => setFocusedColorField('background')}
                    className="flex-1 bg-gray-800/50 text-white text-xs px-2 py-2 rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none font-mono"
                    placeholder="#000000"
                  />
                ) : (
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    <input type="number" min="0" max="255" value={bgParsed.r}
                      onChange={(e) => updateButton('backgroundColor', toRgbaString(parseInt(e.target.value) || 0, bgParsed.g, bgParsed.b, bgParsed.a))}
                      onFocus={() => setFocusedColorField('background')}
                      className="w-full bg-gray-800/50 text-white text-center text-xs py-1.5 rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                      title="Red (0-255)"
                    />
                    <input type="number" min="0" max="255" value={bgParsed.g}
                      onChange={(e) => updateButton('backgroundColor', toRgbaString(bgParsed.r, parseInt(e.target.value) || 0, bgParsed.b, bgParsed.a))}
                      onFocus={() => setFocusedColorField('background')}
                      className="w-full bg-gray-800/50 text-white text-center text-xs py-1.5 rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                      title="Green (0-255)"
                    />
                    <input type="number" min="0" max="255" value={bgParsed.b}
                      onChange={(e) => updateButton('backgroundColor', toRgbaString(bgParsed.r, bgParsed.g, parseInt(e.target.value) || 0, bgParsed.a))}
                      onFocus={() => setFocusedColorField('background')}
                      className="w-full bg-gray-800/50 text-white text-center text-xs py-1.5 rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                      title="Blue (0-255)"
                    />
                    <input type="number" min="0" max="1" step="0.01" value={bgParsed.a.toFixed(2)}
                      onChange={(e) => updateButton('backgroundColor', toRgbaString(bgParsed.r, bgParsed.g, bgParsed.b, parseFloat(e.target.value) || 0))}
                      onFocus={() => setFocusedColorField('background')}
                      className="w-full bg-gray-800/50 text-white text-center text-xs py-1.5 rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                      title="Alpha (0-1)"
                    />
                  </div>
                )}
              </div>
              
              {/* Clear to use global color */}
              {button.backgroundColor && (
                <button
                  onClick={() => updateButton('backgroundColor', undefined)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Reset to global color
                </button>
              )}
            </div>
            
            {/* Text Color */}
            <div 
              className={`p-3 rounded-xl transition-all cursor-pointer ${focusedColorField === 'text' ? 'bg-indigo-500/10 ring-2 ring-indigo-500/50' : 'bg-gray-800/50 border border-white/5'}`}
              onClick={() => setFocusedColorField('text')}
            >
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-medium uppercase tracking-wider ${focusedColorField === 'text' ? 'text-indigo-400' : 'text-gray-300'}`}>
                  Text {focusedColorField === 'text' && <span className="text-xs opacity-60">●</span>}
                </label>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setTextColorMode('hex'); }}
                    className={`px-2 py-0.5 text-[10px] rounded ${textColorMode === 'hex' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                  >
                    HEX
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setTextColorMode('rgba'); }}
                    className={`px-2 py-0.5 text-[10px] rounded ${textColorMode === 'rgba' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                  >
                    RGBA
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={rgbaToHex(textParsed.r, textParsed.g, textParsed.b)}
                  onChange={(e) => {
                    const { r, g, b } = parseColor(e.target.value);
                    if (textColorMode === 'rgba') {
                      updateButton('textColor', toRgbaString(r, g, b, textParsed.a));
                    } else {
                      updateButton('textColor', e.target.value);
                    }
                  }}
                  onFocus={() => setFocusedColorField('text')}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/20 hover:border-white/40 transition-colors flex-shrink-0"
                  style={{ backgroundColor: textColor }}
                />
                {textColorMode === 'hex' ? (
                  <input
                    type="text"
                    value={textColor.startsWith('#') ? textColor : rgbaToHex(textParsed.r, textParsed.g, textParsed.b)}
                    onChange={(e) => updateButton('textColor', e.target.value)}
                    onFocus={() => setFocusedColorField('text')}
                    className="flex-1 bg-gray-800/50 text-white text-xs px-2 py-2 rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none font-mono"
                    placeholder="#ffffff"
                  />
                ) : (
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    <input type="number" min="0" max="255" value={textParsed.r}
                      onChange={(e) => updateButton('textColor', toRgbaString(parseInt(e.target.value) || 0, textParsed.g, textParsed.b, textParsed.a))}
                      onFocus={() => setFocusedColorField('text')}
                      className="w-full bg-gray-800/50 text-white text-center text-xs py-1.5 rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                      title="Red (0-255)"
                    />
                    <input type="number" min="0" max="255" value={textParsed.g}
                      onChange={(e) => updateButton('textColor', toRgbaString(textParsed.r, parseInt(e.target.value) || 0, textParsed.b, textParsed.a))}
                      onFocus={() => setFocusedColorField('text')}
                      className="w-full bg-gray-800/50 text-white text-center text-xs py-1.5 rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                      title="Green (0-255)"
                    />
                    <input type="number" min="0" max="255" value={textParsed.b}
                      onChange={(e) => updateButton('textColor', toRgbaString(textParsed.r, textParsed.g, parseInt(e.target.value) || 0, textParsed.a))}
                      onFocus={() => setFocusedColorField('text')}
                      className="w-full bg-gray-800/50 text-white text-center text-xs py-1.5 rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                      title="Blue (0-255)"
                    />
                    <input type="number" min="0" max="1" step="0.01" value={textParsed.a.toFixed(2)}
                      onChange={(e) => updateButton('textColor', toRgbaString(textParsed.r, textParsed.g, textParsed.b, parseFloat(e.target.value) || 0))}
                      onFocus={() => setFocusedColorField('text')}
                      className="w-full bg-gray-800/50 text-white text-center text-xs py-1.5 rounded-lg border border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                      title="Alpha (0-1)"
                    />
                  </div>
                )}
              </div>
              
              {/* Clear to use global color */}
              {button.textColor && (
                <button
                  onClick={() => updateButton('textColor', undefined)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Reset to global color
                </button>
              )}
            </div>
          </div>
          
          {/* Preset Colors */}
          <div className="p-4 bg-gray-800/50 border border-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
                Presets → <span className="text-indigo-400">{focusedColorField === 'background' ? 'Background' : 'Text'}</span>
              </span>
              <span className="text-xs text-gray-500">Click to apply</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {presetColors.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => applyPresetColor(preset.color)}
                  className="w-8 h-8 rounded-lg border-2 border-white/20 hover:border-white hover:scale-110 transition-all relative group"
                  style={{ 
                    backgroundColor: preset.color,
                    boxShadow: preset.color === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined,
                  }}
                  title={`${preset.label}: ${preset.color}`}
                >
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-4 border-t border-white/10 bg-black/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg shadow-lg shadow-indigo-500/25 transition-all"
          >
            Done
          </button>
        </div>
      </div>
      
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse-highlight {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          50% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
      `}</style>
    </>
  );
  
  // Use portal to render at document body level
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
};

export default SingleButtonEditor;

