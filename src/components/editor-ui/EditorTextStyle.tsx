'use client';

import React from 'react';
import EditorSlider, { type EditorSliderPreset } from './EditorSlider';
import EditorSelect from './EditorSelect';
import EditorColorPicker, { type ColorPreset } from './EditorColorPicker';

// ============================================================================
// FONT PRESETS
// ============================================================================

export const FONT_FAMILY_OPTIONS = [
  { value: '', label: 'Default (Inherit)' },
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
  // Google Fonts - Serif
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Merriweather, serif', label: 'Merriweather' },
  // System Fonts
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
];

export const FONT_WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi-bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra-bold' },
];

export const TEXT_ALIGN_OPTIONS: Array<{ value: 'left' | 'center' | 'right'; label: string; icon: React.ReactNode }> = [
  { 
    value: 'left', 
    label: 'Left',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
      </svg>
    ),
  },
  { 
    value: 'center', 
    label: 'Center',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
      </svg>
    ),
  },
  { 
    value: 'right', 
    label: 'Right',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
      </svg>
    ),
  },
];

// ============================================================================
// TYPES
// ============================================================================

export interface TextStyleValues {
  /** The text content */
  text?: string;
  /** Text size multiplier (1.0 = normal) */
  textSize?: number;
  /** Text color */
  textColor?: string;
  /** Font family */
  fontFamily?: string;
  /** Font weight */
  fontWeight?: number;
  /** Whether text is bold */
  textBold?: boolean;
  /** Text alignment */
  textAlign?: 'left' | 'center' | 'right';
}

export interface EditorTextStyleProps {
  /** Current values */
  values: TextStyleValues;
  /** Change handler - receives partial updates */
  onChange: (updates: Partial<TextStyleValues>) => void;
  /** Which controls to show */
  show?: {
    text?: boolean;
    textSize?: boolean;
    textColor?: boolean;
    fontFamily?: boolean;
    fontWeight?: boolean;
    textBold?: boolean;
    textAlign?: boolean;
  };
  /** Text input configuration */
  textConfig?: {
    label?: string;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
  };
  /** Text size slider configuration */
  textSizeConfig?: {
    label?: string;
    min?: number;
    max?: number;
    presets?: EditorSliderPreset[];
  };
  /** Color picker presets */
  colorPresets?: ColorPreset[];
  /** Additional className */
  className?: string;
}

// Default size presets
const DEFAULT_SIZE_PRESETS: EditorSliderPreset[] = [
  { value: 0.75, label: '0.75x' },
  { value: 1.0, label: 'Normal' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
];

/**
 * EditorTextStyle - A comprehensive text styling component
 * 
 * Features:
 * - Text content editing (optional)
 * - Text size with slider and presets
 * - Text color with color picker
 * - Font family selector
 * - Font weight selector
 * - Bold toggle
 * - Text alignment (left/center/right)
 */
export default function EditorTextStyle({
  values,
  onChange,
  show = {
    text: true,
    textSize: true,
    textColor: true,
    fontFamily: true,
    fontWeight: false,
    textBold: false,
    textAlign: true,
  },
  textConfig = {},
  textSizeConfig = {},
  colorPresets = [],
  className = '',
}: EditorTextStyleProps) {
  const {
    text = '',
    textSize = 1.0,
    textColor = '#ffffff',
    fontFamily = '',
    fontWeight = 400,
    textBold = false,
    textAlign = 'center',
  } = values;
  
  const sizePresets = textSizeConfig.presets || DEFAULT_SIZE_PRESETS;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Text Content */}
      {show.text && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">
            {textConfig.label || 'Text'}
          </label>
          {textConfig.multiline ? (
            <textarea
              value={text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder={textConfig.placeholder}
              rows={textConfig.rows || 3}
              className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          ) : (
            <input
              type="text"
              value={text}
              onChange={(e) => onChange({ text: e.target.value })}
              placeholder={textConfig.placeholder}
              className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          )}
        </div>
      )}
      
      {/* Text Size */}
      {show.textSize && (
        <EditorSlider
          label={textSizeConfig.label || 'Text Size'}
          value={textSize}
          onChange={(v) => onChange({ textSize: v })}
          min={textSizeConfig.min ?? 0.5}
          max={textSizeConfig.max ?? 2.5}
          step={0.05}
          presets={sizePresets}
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      )}
      
      {/* Text Color */}
      {show.textColor && (
        <EditorColorPicker
          label="Text Color"
          value={textColor}
          onChange={(c) => onChange({ textColor: c })}
          presets={colorPresets}
        />
      )}
      
      {/* Font Family and Weight Row */}
      {(show.fontFamily || show.fontWeight) && (
        <div className={`grid gap-3 ${show.fontFamily && show.fontWeight ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {show.fontFamily && (
            <EditorSelect
              label="Font"
              value={fontFamily}
              onChange={(v) => onChange({ fontFamily: v })}
              options={FONT_FAMILY_OPTIONS}
            />
          )}
          {show.fontWeight && (
            <EditorSelect
              label="Weight"
              value={String(fontWeight)}
              onChange={(v) => onChange({ fontWeight: parseInt(v) })}
              options={FONT_WEIGHT_OPTIONS}
            />
          )}
        </div>
      )}
      
      {/* Bold Toggle */}
      {show.textBold && (
        <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl border border-white/5">
          <label className="flex items-center cursor-pointer group flex-1">
            <input
              type="checkbox"
              checked={textBold}
              onChange={(e) => onChange({ textBold: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500/50 h-4 w-4"
            />
            <span className="ml-2 text-sm text-gray-300 group-hover:text-white transition-colors">
              <strong>Bold</strong> text
            </span>
          </label>
        </div>
      )}
      
      {/* Text Alignment */}
      {show.textAlign && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">
            Alignment
          </label>
          <div className="flex gap-2">
            {TEXT_ALIGN_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ textAlign: option.value })}
                className={`flex-1 px-3 py-2.5 rounded-xl border transition-all flex items-center justify-center ${
                  textAlign === option.value
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-gray-800/50 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
                title={option.label}
              >
                {option.icon}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Font Preview */}
      {(show.fontFamily || show.textColor || show.textSize) && (
        <div 
          className="p-4 bg-gray-800/30 rounded-xl border border-white/5 text-center"
          style={{
            fontFamily: fontFamily || 'inherit',
            fontSize: `${textSize * 16}px`,
            fontWeight: textBold ? 700 : fontWeight,
            color: textColor,
            textAlign,
          }}
        >
          {text || 'Preview text'}
        </div>
      )}
    </div>
  );
}
