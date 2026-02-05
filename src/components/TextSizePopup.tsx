"use client";

import React, { useMemo, useCallback } from "react";
import {
  EditorModal,
  EditorSlider,
  EditorColorPicker,
  EditorToggle,
  EditorSelect,
  EditorInfoBox,
  buildColorPresets,
  type ColorPreset,
} from './editor-ui';
import { useTextStyleContext } from './TextStyleContext';

// Font family presets - Google Fonts are loaded dynamically by the template
const FONT_OPTIONS = [
  { value: '', label: 'Default' },
  // Google Fonts - Sans Serif
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Raleway, sans-serif', label: 'Raleway' },
  { value: 'Oswald, sans-serif', label: 'Oswald' },
  { value: 'Nunito, sans-serif', label: 'Nunito' },
  { value: 'Source Sans Pro, sans-serif', label: 'Source Sans Pro' },
  // Google Fonts - Serif
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Merriweather, serif', label: 'Merriweather' },
  // System Fonts (always available)
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Courier New, monospace', label: 'Courier New' },
];

// Icon for the modal header
const TextStyleIcon = () => (
  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);

type TextSizePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Called when cancel button is clicked - parent should restore original values */
  onCancel?: () => void;
  textSize: number;
  onTextSizeChange: (size: number) => void;
  targetElement?: HTMLElement | null; // Used for smart positioning
  label?: string;
  presetSizes?: number[];
  normalSize?: number;
  minSize?: number;
  maxSize?: number;
  onInteractStart?: () => void; // Kept for API compatibility
  onInteractEnd?: () => void; // Kept for API compatibility
  // Color picker support
  textColor?: string;
  onTextColorChange?: (color: string) => void;
  showColorPicker?: boolean;
  presetColors?: string[];
  // Bold toggle support
  textBold?: boolean;
  onTextBoldChange?: (bold: boolean) => void;
  showBoldToggle?: boolean;
  // Alignment toggle support
  textAlign?: 'left' | 'center' | 'right';
  onTextAlignChange?: (align: 'left' | 'center' | 'right') => void;
  showAlignmentToggle?: boolean;
  // Font family support
  fontFamily?: string;
  onFontFamilyChange?: (font: string) => void;
  showFontPicker?: boolean;
};

export default function TextSizePopup({
  isOpen,
  onClose,
  onCancel,
  textSize,
  onTextSizeChange,
  targetElement,
  label = "Text Style",
  presetSizes = [0.75, 1.0, 1.25, 1.5],
  normalSize = 1.0,
  minSize = 0.5,
  maxSize = 2.5,
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
  fontFamily = '',
  onFontFamilyChange,
  showFontPicker = false,
}: TextSizePopupProps) {
  // Get the text style context for recent colors and fonts
  const textStyleContext = useTextStyleContext();

  // Build size presets from prop
  const sizePresets = useMemo(() => 
    presetSizes.map(size => ({
      value: size,
      label: size === normalSize ? 'Normal' : `${Math.round(size * 100)}%`
    })),
    [presetSizes, normalSize]
  );

  // Build color presets - include recent colors from context
  const colorPresets: ColorPreset[] = useMemo(() => {
    const presets: ColorPreset[] = [];
    
    // Add recent colors first (from context)
    if (textStyleContext?.recentColors && textStyleContext.recentColors.length > 0) {
      textStyleContext.recentColors.forEach((color, i) => {
        presets.push({ color, label: `Recent ${i + 1}`, category: 'recent' as any });
      });
    }
    
    // Add site colors from presetColors prop
    presetColors.forEach((color, i) => {
      // Skip if already in recent colors
      if (!textStyleContext?.recentColors?.some(c => c.toLowerCase() === color.toLowerCase())) {
        presets.push({ color, label: `Site ${i + 1}`, category: 'site' });
      }
    });
    
    // Add basic colors
    const basics = buildColorPresets({ includeBasics: true });
    basics.forEach(preset => {
      // Skip if already in presets
      if (!presets.some(p => p.color.toLowerCase() === preset.color.toLowerCase())) {
        presets.push(preset);
      }
    });
    
    return presets;
  }, [presetColors, textStyleContext?.recentColors]);

  // Get font options with recent fonts at top
  const orderedFontOptions = useMemo(() => {
    if (textStyleContext?.getReorderedFonts) {
      return textStyleContext.getReorderedFonts(FONT_OPTIONS);
    }
    return FONT_OPTIONS;
  }, [textStyleContext]);

  // Handle font change - also track in context
  const handleFontChange = useCallback((font: string) => {
    if (font === '__separator__') return; // Ignore separator clicks
    
    if (onFontFamilyChange) {
      onFontFamilyChange(font);
    }
    // Track in context for recent fonts
    if (textStyleContext?.addRecentFont && font) {
      textStyleContext.addRecentFont(font);
    }
  }, [onFontFamilyChange, textStyleContext]);

  // Handle color change - also track in context
  const handleColorChange = useCallback((color: string) => {
    if (onTextColorChange) {
      onTextColorChange(color);
    }
    // Track in context for recent colors
    if (textStyleContext?.addRecentColor && color) {
      textStyleContext.addRecentColor(color);
    }
  }, [onTextColorChange, textStyleContext]);

  return (
    <EditorModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      showCancelButton={!!onCancel}
      title={label}
      icon={<TextStyleIcon />}
      width="sm"
      backdropOpacity={0}
      closeOnBackdropClick={true}
      targetElement={targetElement}
    >
      {/* Font Size Slider */}
      <EditorSlider
        label="Size"
        value={textSize}
        onChange={onTextSizeChange}
        min={minSize}
        max={maxSize}
        step={0.05}
        presets={sizePresets}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        hideMinMax
      />

      {/* Font Family - only show if enabled */}
      {showFontPicker && onFontFamilyChange && (
        <>
          <div className="border-t border-white/10 -mx-4" />
          <div className="space-y-2">
            <EditorSelect
              label="Font"
              value={fontFamily || ''}
              onChange={handleFontChange}
              options={orderedFontOptions}
            />
            {fontFamily && (
              <p 
                className="text-xs text-gray-400 p-2 bg-gray-800/30 rounded"
                style={{ fontFamily }}
              >
                The quick brown fox jumps over the lazy dog
              </p>
            )}
          </div>
        </>
      )}

      {/* Color Picker - only show if enabled */}
      {showColorPicker && onTextColorChange && (
        <>
          <div className="border-t border-white/10 -mx-4" />
          <EditorColorPicker
            label="Color"
            value={textColor || '#000000'}
            onChange={handleColorChange}
            presets={colorPresets}
          />
        </>
      )}

      {/* Bold Toggle - only show if enabled */}
      {showBoldToggle && onTextBoldChange && (
        <>
          <div className="border-t border-white/10 -mx-4" />
          <EditorToggle
            label="Bold Text"
            checked={textBold}
            onChange={onTextBoldChange}
            compact
          />
        </>
      )}

      {/* Alignment Toggle - only show if enabled */}
      {showAlignmentToggle && onTextAlignChange && (
        <>
          <div className="border-t border-white/10 -mx-4" />
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Alignment
            </label>
            <div className="flex gap-1.5">
              <button
                onClick={() => onTextAlignChange('left')}
                className={`flex-1 px-3 py-2 rounded border transition-all ${
                  textAlign === 'left'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-gray-800/50 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
                title="Align Left"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                </svg>
              </button>
              <button
                onClick={() => onTextAlignChange('center')}
                className={`flex-1 px-3 py-2 rounded border transition-all ${
                  textAlign === 'center'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-gray-800/50 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
                title="Align Center"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                </svg>
              </button>
              <button
                onClick={() => onTextAlignChange('right')}
                className={`flex-1 px-3 py-2 rounded border transition-all ${
                  textAlign === 'right'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-gray-800/50 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
                title="Align Right"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Help Info */}
      <EditorInfoBox variant="tip">
        Use presets for common sizes or drag the slider for precise control
      </EditorInfoBox>
    </EditorModal>
  );
}
