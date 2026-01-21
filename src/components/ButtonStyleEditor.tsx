/**
 * ButtonStyleEditor.tsx
 * 
 * A modal for customizing hero CTA button styles.
 * Appears when clicking in the button grid area (not on a button).
 * Uses a portal to render at document body level (prevents clipping).
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ButtonStyles, ColorPalette } from '../types';

// ============================================================================
// COLOR UTILITIES
// ============================================================================

// Parse any color string to RGBA components
function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  // Default
  let r = 0, g = 0, b = 0, a = 1;
  
  // Handle hex
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
  }
  // Handle rgba()
  else if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
      a = match[4] ? parseFloat(match[4]) : 1;
    }
  }
  // Handle rgb()
  else if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    }
  }
  
  return { r, g, b, a };
}

// Convert RGBA to hex (6 digit, no alpha)
function rgbaToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert to rgba() string
function toRgbaString(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a.toFixed(2)})`;
}

// Detect if color has alpha < 1
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

// Common web-safe fonts
const FONT_OPTIONS = [
  { value: '', label: 'Default (Inherit)' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Courier New", monospace', label: 'Courier New' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
  { value: '"Palatino Linotype", serif', label: 'Palatino' },
  { value: '"Lucida Console", monospace', label: 'Lucida Console' },
];

type ButtonStyleEditorProps = {
  styles: ButtonStyles;
  onChange: (styles: ButtonStyles) => void;
  onClose: () => void;
  backgroundColor?: string;
  textColor?: string;
  onBackgroundColorChange?: (color: string) => void;
  onTextColorChange?: (color: string) => void;
  colorPalette?: ColorPalette;
};

const ButtonStyleEditor: React.FC<ButtonStyleEditorProps> = ({
  styles,
  onChange,
  onClose,
  backgroundColor = '#3b82f6',
  textColor = '#ffffff',
  onBackgroundColorChange,
  onTextColorChange,
  colorPalette,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Default values
  const paddingX = styles.paddingX ?? 32;
  const paddingY = styles.paddingY ?? 16;
  const borderRadius = styles.borderRadius ?? 8;
  const fontFamily = styles.fontFamily ?? '';
  const fontSize = styles.fontSize ?? 16;
  const fontWeight = styles.fontWeight ?? 600;
  
  // Pulse animation state
  const [showPulse, setShowPulse] = useState(true);
  
  // Track which color input is focused (for preset clicks)
  const [focusedColorField, setFocusedColorField] = useState<'background' | 'text'>('background');
  
  // Color mode (hex vs rgba) for each field
  const [bgColorMode, setBgColorMode] = useState<'hex' | 'rgba'>(() => hasAlpha(backgroundColor) ? 'rgba' : 'hex');
  const [textColorMode, setTextColorMode] = useState<'hex' | 'rgba'>(() => hasAlpha(textColor) ? 'rgba' : 'hex');
  
  // Parse current colors
  const bgParsed = useMemo(() => parseColor(backgroundColor), [backgroundColor]);
  const textParsed = useMemo(() => parseColor(textColor), [textColor]);
  
  // Resize state - use refs to avoid stale closures during drag
  const [isResizing, setIsResizing] = useState(false);
  const resizeStateRef = useRef({
    type: null as 'width' | 'height' | 'corner' | null,
    startX: 0,
    startY: 0,
    startPaddingX: paddingX,
    startPaddingY: paddingY,
  });
  
  // Keep onChange ref stable
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const stylesRef = useRef(styles);
  stylesRef.current = styles;
  
  // Pulse effect on open
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 600);
    return () => clearTimeout(timer);
  }, []);
  
  // Resize handlers for the mock button
  const handleResizeStart = useCallback((e: React.MouseEvent, type: 'width' | 'height' | 'corner') => {
    e.preventDefault();
    e.stopPropagation();
    
    resizeStateRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startPaddingX: paddingX,
      startPaddingY: paddingY,
    };
    
    setIsResizing(true);
    
    // Set cursor
    document.body.style.cursor = type === 'corner' ? 'nwse-resize' : type === 'width' ? 'ew-resize' : 'ns-resize';
  }, [paddingX, paddingY]);
  
  // Global mousemove handler - uses refs to avoid stale closures
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = resizeStateRef.current;
      if (!state.type) return;
      
      const deltaX = e.clientX - state.startX;
      const deltaY = e.clientY - state.startY;
      
      const updates: Partial<ButtonStyles> = {};
      
      if (state.type === 'width') {
        updates.paddingX = Math.round(Math.max(12, Math.min(150, state.startPaddingX + deltaX / 2)));
      } else if (state.type === 'height') {
        updates.paddingY = Math.round(Math.max(8, Math.min(60, state.startPaddingY + deltaY / 2)));
      } else if (state.type === 'corner') {
        updates.paddingX = Math.round(Math.max(12, Math.min(150, state.startPaddingX + deltaX / 2)));
        updates.paddingY = Math.round(Math.max(8, Math.min(60, state.startPaddingY + deltaY / 2)));
      }
      
      if (Object.keys(updates).length > 0) {
        onChangeRef.current({ ...stylesRef.current, ...updates });
      }
    };
    
    const handleMouseUp = () => {
      resizeStateRef.current.type = null;
      setIsResizing(false);
      document.body.style.cursor = '';
    };
    
    // Always listen - the handler checks if we're resizing
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, []); // Empty deps - handler uses refs
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  // Build preset colors: white, black, then brand colors from palette
  const presetColors = useMemo(() => {
    const colors: Array<{ color: string; label: string }> = [
      { color: '#ffffff', label: 'White' },
      { color: '#000000', label: 'Black' },
    ];
    
    if (colorPalette) {
      if (colorPalette.primary) colors.push({ color: colorPalette.primary, label: 'Primary' });
      if (colorPalette.secondary) colors.push({ color: colorPalette.secondary, label: 'Secondary' });
      if (colorPalette.accent) colors.push({ color: colorPalette.accent, label: 'Accent' });
      if (colorPalette.background && colorPalette.background !== '#ffffff') {
        colors.push({ color: colorPalette.background, label: 'Background' });
      }
      if (colorPalette.text && colorPalette.text !== '#000000') {
        colors.push({ color: colorPalette.text, label: 'Text' });
      }
    }
    
    return colors;
  }, [colorPalette]);
  
  // Apply preset color to whichever field is focused
  const applyPresetColor = useCallback((color: string) => {
    if (focusedColorField === 'background') {
      onBackgroundColorChange?.(color);
    } else {
      onTextColorChange?.(color);
    }
  }, [focusedColorField, onBackgroundColorChange, onTextColorChange]);
  
  // Handle style changes from controls
  const updateStyles = useCallback((updates: Partial<ButtonStyles>) => {
    onChange({ ...styles, ...updates });
  }, [styles, onChange]);
  
  // Stop click from closing modal
  const stopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Modal content
  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[9998]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        ref={popoverRef}
        className="fixed z-[9999] bg-gray-900 rounded-xl shadow-2xl border border-gray-700 p-6"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '580px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={stopClick}
        onMouseDown={stopClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold text-lg">Button Style</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Subtitle explaining scope */}
        <p className="text-blue-400/90 text-sm mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
          </svg>
          Edits ALL buttons at once — click a button to edit just that one
        </p>
        
        {/* Mock Button Preview - Resizable - WIDE container */}
        <div 
          className="mb-6 flex justify-center items-center py-8 bg-gray-800/50 rounded-lg overflow-visible"
          style={{ minHeight: '120px' }}
        >
          <div className="relative inline-block">
            {/* The actual button - uses explicit dimensions so font size doesn't affect button size */}
            <button
              className="shadow-lg select-none pointer-events-none flex items-center justify-content"
              style={{
                backgroundColor,
                color: textColor,
                // Fixed dimensions based on padding only (base text area ~100x20px)
                width: `${paddingX * 2 + 100}px`,
                height: `${paddingY * 2 + 20}px`,
                borderRadius: `${borderRadius}px`,
                fontFamily: fontFamily || 'inherit',
                fontSize: `${fontSize}px`,
                fontWeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: showPulse ? 'pulse-highlight 0.6s ease-out' : undefined,
                boxShadow: showPulse ? '0 0 0 4px rgba(59, 130, 246, 0.5)' : undefined,
                transition: 'none', // Disable transitions during resize for snappy feedback
              }}
            >
              Sample Button
            </button>
            
            {/* RIGHT HANDLE - Width */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'width')}
              className="absolute top-1/2 -translate-y-1/2 cursor-ew-resize flex items-center justify-center group"
              style={{ right: '-20px', width: '24px', height: '50px' }}
            >
              <div className="flex flex-col gap-0.5 items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:bg-blue-400 transition-colors" />
                <div className="w-0.5 h-6 bg-blue-500 group-hover:bg-blue-400 transition-colors" />
                <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:bg-blue-400 transition-colors" />
              </div>
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-[10px] text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ← →
              </span>
            </div>
            
            {/* BOTTOM HANDLE - Height */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'height')}
              className="absolute left-1/2 -translate-x-1/2 cursor-ns-resize flex items-center justify-center group"
              style={{ bottom: '-20px', height: '24px', width: '50px' }}
            >
              <div className="flex flex-row gap-0.5 items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full group-hover:bg-green-400 transition-colors" />
                <div className="h-0.5 w-6 bg-green-500 group-hover:bg-green-400 transition-colors" />
                <div className="w-2 h-2 bg-green-500 rounded-full group-hover:bg-green-400 transition-colors" />
              </div>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-green-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ↑ ↓
              </span>
            </div>
            
            {/* CORNER HANDLE - Both */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'corner')}
              className="absolute cursor-nwse-resize flex items-center justify-center group"
              style={{ bottom: '-20px', right: '-20px', width: '28px', height: '28px' }}
            >
              <div className="w-4 h-4 bg-purple-500 rounded-md group-hover:bg-purple-400 group-hover:scale-125 transition-all flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">⤡</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 text-center mb-5">
          Drag the <span className="text-blue-400">blue</span>, <span className="text-green-400">green</span>, or <span className="text-purple-400">purple</span> handles to resize
        </p>
        
        {/* Color Pickers Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Background Color */}
          <div 
            className={`p-3 rounded-lg transition-all ${focusedColorField === 'background' ? 'bg-blue-500/10 ring-2 ring-blue-500/50' : 'bg-gray-800/30'}`}
            onClick={() => setFocusedColorField('background')}
          >
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${focusedColorField === 'background' ? 'text-blue-400' : 'text-gray-300'}`}>
                Background {focusedColorField === 'background' && <span className="text-xs opacity-60">●</span>}
              </label>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setBgColorMode('hex'); }}
                  className={`px-2 py-0.5 text-[10px] rounded ${bgColorMode === 'hex' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                >
                  HEX
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setBgColorMode('rgba'); }}
                  className={`px-2 py-0.5 text-[10px] rounded ${bgColorMode === 'rgba' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
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
                    onBackgroundColorChange?.(toRgbaString(r, g, b, bgParsed.a));
                  } else {
                    onBackgroundColorChange?.(e.target.value);
                  }
                }}
                onFocus={() => setFocusedColorField('background')}
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-600 hover:border-gray-500 transition-colors flex-shrink-0"
                style={{ backgroundColor }}
              />
              {bgColorMode === 'hex' ? (
                <input
                  type="text"
                  value={backgroundColor.startsWith('#') ? backgroundColor : rgbaToHex(bgParsed.r, bgParsed.g, bgParsed.b)}
                  onChange={(e) => onBackgroundColorChange?.(e.target.value)}
                  onFocus={() => setFocusedColorField('background')}
                  className="flex-1 bg-gray-800 text-white text-sm px-2 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-xs"
                  placeholder="#000000"
                />
              ) : (
                <div className="flex-1 grid grid-cols-4 gap-1">
                  <input type="number" min="0" max="255" value={bgParsed.r}
                    onChange={(e) => onBackgroundColorChange?.(toRgbaString(parseInt(e.target.value) || 0, bgParsed.g, bgParsed.b, bgParsed.a))}
                    onFocus={() => setFocusedColorField('background')}
                    className="w-full bg-gray-800 text-white text-center text-xs py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    title="Red (0-255)"
                  />
                  <input type="number" min="0" max="255" value={bgParsed.g}
                    onChange={(e) => onBackgroundColorChange?.(toRgbaString(bgParsed.r, parseInt(e.target.value) || 0, bgParsed.b, bgParsed.a))}
                    onFocus={() => setFocusedColorField('background')}
                    className="w-full bg-gray-800 text-white text-center text-xs py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    title="Green (0-255)"
                  />
                  <input type="number" min="0" max="255" value={bgParsed.b}
                    onChange={(e) => onBackgroundColorChange?.(toRgbaString(bgParsed.r, bgParsed.g, parseInt(e.target.value) || 0, bgParsed.a))}
                    onFocus={() => setFocusedColorField('background')}
                    className="w-full bg-gray-800 text-white text-center text-xs py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    title="Blue (0-255)"
                  />
                  <input type="number" min="0" max="1" step="0.01" value={bgParsed.a.toFixed(2)}
                    onChange={(e) => onBackgroundColorChange?.(toRgbaString(bgParsed.r, bgParsed.g, bgParsed.b, parseFloat(e.target.value) || 0))}
                    onFocus={() => setFocusedColorField('background')}
                    className="w-full bg-gray-800 text-white text-center text-xs py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    title="Alpha (0-1)"
                  />
                </div>
              )}
            </div>
            
            {/* Alpha slider for RGBA mode */}
            {bgColorMode === 'rgba' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-8">Alpha</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={bgParsed.a}
                  onChange={(e) => onBackgroundColorChange?.(toRgbaString(bgParsed.r, bgParsed.g, bgParsed.b, parseFloat(e.target.value)))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgba(${bgParsed.r},${bgParsed.g},${bgParsed.b},0), rgba(${bgParsed.r},${bgParsed.g},${bgParsed.b},1))`,
                  }}
                />
                <span className="text-[10px] text-gray-400 w-8 text-right">{Math.round(bgParsed.a * 100)}%</span>
              </div>
            )}
          </div>
          
          {/* Text Color */}
          <div 
            className={`p-3 rounded-lg transition-all ${focusedColorField === 'text' ? 'bg-blue-500/10 ring-2 ring-blue-500/50' : 'bg-gray-800/30'}`}
            onClick={() => setFocusedColorField('text')}
          >
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${focusedColorField === 'text' ? 'text-blue-400' : 'text-gray-300'}`}>
                Text {focusedColorField === 'text' && <span className="text-xs opacity-60">●</span>}
              </label>
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setTextColorMode('hex'); }}
                  className={`px-2 py-0.5 text-[10px] rounded ${textColorMode === 'hex' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                >
                  HEX
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setTextColorMode('rgba'); }}
                  className={`px-2 py-0.5 text-[10px] rounded ${textColorMode === 'rgba' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
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
                    onTextColorChange?.(toRgbaString(r, g, b, textParsed.a));
                  } else {
                    onTextColorChange?.(e.target.value);
                  }
                }}
                onFocus={() => setFocusedColorField('text')}
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-600 hover:border-gray-500 transition-colors flex-shrink-0"
                style={{ backgroundColor: textColor }}
              />
              {textColorMode === 'hex' ? (
                <input
                  type="text"
                  value={textColor.startsWith('#') ? textColor : rgbaToHex(textParsed.r, textParsed.g, textParsed.b)}
                  onChange={(e) => onTextColorChange?.(e.target.value)}
                  onFocus={() => setFocusedColorField('text')}
                  className="flex-1 bg-gray-800 text-white text-sm px-2 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-xs"
                  placeholder="#ffffff"
                />
              ) : (
                <div className="flex-1 grid grid-cols-4 gap-1">
                  <input type="number" min="0" max="255" value={textParsed.r}
                    onChange={(e) => onTextColorChange?.(toRgbaString(parseInt(e.target.value) || 0, textParsed.g, textParsed.b, textParsed.a))}
                    onFocus={() => setFocusedColorField('text')}
                    className="w-full bg-gray-800 text-white text-center text-xs py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    title="Red (0-255)"
                  />
                  <input type="number" min="0" max="255" value={textParsed.g}
                    onChange={(e) => onTextColorChange?.(toRgbaString(textParsed.r, parseInt(e.target.value) || 0, textParsed.b, textParsed.a))}
                    onFocus={() => setFocusedColorField('text')}
                    className="w-full bg-gray-800 text-white text-center text-xs py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    title="Green (0-255)"
                  />
                  <input type="number" min="0" max="255" value={textParsed.b}
                    onChange={(e) => onTextColorChange?.(toRgbaString(textParsed.r, textParsed.g, parseInt(e.target.value) || 0, textParsed.a))}
                    onFocus={() => setFocusedColorField('text')}
                    className="w-full bg-gray-800 text-white text-center text-xs py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    title="Blue (0-255)"
                  />
                  <input type="number" min="0" max="1" step="0.01" value={textParsed.a.toFixed(2)}
                    onChange={(e) => onTextColorChange?.(toRgbaString(textParsed.r, textParsed.g, textParsed.b, parseFloat(e.target.value) || 0))}
                    onFocus={() => setFocusedColorField('text')}
                    className="w-full bg-gray-800 text-white text-center text-xs py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                    title="Alpha (0-1)"
                  />
                </div>
              )}
            </div>
            
            {/* Alpha slider for RGBA mode */}
            {textColorMode === 'rgba' && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-8">Alpha</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={textParsed.a}
                  onChange={(e) => onTextColorChange?.(toRgbaString(textParsed.r, textParsed.g, textParsed.b, parseFloat(e.target.value)))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgba(${textParsed.r},${textParsed.g},${textParsed.b},0), rgba(${textParsed.r},${textParsed.g},${textParsed.b},1))`,
                  }}
                />
                <span className="text-[10px] text-gray-400 w-8 text-right">{Math.round(textParsed.a * 100)}%</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Preset Colors - applies to whichever field is focused */}
        <div className="mb-5 p-3 bg-gray-800/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              Presets → <span className={focusedColorField === 'background' ? 'text-blue-400' : 'text-blue-400'}>{focusedColorField === 'background' ? 'Background' : 'Text'}</span>
            </span>
            <span className="text-xs text-gray-500">Click to apply</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {presetColors.map((preset, i) => (
              <button
                key={i}
                onClick={() => applyPresetColor(preset.color)}
                className="w-8 h-8 rounded-md border-2 border-gray-600 hover:border-white hover:scale-110 transition-all relative group"
                style={{ 
                  backgroundColor: preset.color,
                  boxShadow: preset.color === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined,
                }}
                title={`${preset.label}: ${preset.color}`}
              >
                {/* Tooltip */}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Font Controls */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-sm text-gray-300 block mb-2 font-medium">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => updateStyles({ fontFamily: e.target.value })}
              className="w-full bg-gray-800 text-white text-sm px-3 py-2.5 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              {FONT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-sm text-gray-300 block mb-2 font-medium">Font Weight</label>
            <select
              value={fontWeight}
              onChange={(e) => updateStyles({ fontWeight: parseInt(e.target.value) })}
              className="w-full bg-gray-800 text-white text-sm px-3 py-2.5 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value={400}>Normal</option>
              <option value={500}>Medium</option>
              <option value={600}>Semi-bold</option>
              <option value={700}>Bold</option>
              <option value={800}>Extra-bold</option>
            </select>
          </div>
        </div>
        
        {/* Sliders */}
        <div className="space-y-4">
          {/* Font Size */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-300 font-medium">Font Size</label>
              <span className="text-sm text-gray-400">{fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="28"
              value={fontSize}
              onChange={(e) => updateStyles({ fontSize: parseInt(e.target.value) })}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((fontSize - 12) / 16) * 100}%, #374151 ${((fontSize - 12) / 16) * 100}%, #374151 100%)`,
              }}
            />
          </div>
          
          {/* Border Radius */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-300 font-medium">Border Radius</label>
              <span className="text-sm text-gray-400">{borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={borderRadius}
              onChange={(e) => updateStyles({ borderRadius: parseInt(e.target.value) })}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(borderRadius / 32) * 100}%, #374151 ${(borderRadius / 32) * 100}%, #374151 100%)`,
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse-highlight {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          50% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </>
  );
  
  // Use portal to render at document body level (prevents clipping by parent containers)
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
};

export default ButtonStyleEditor;
