'use client';

import React, { useState, useMemo } from 'react';

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

// ============================================================================
// TYPES
// ============================================================================

export interface ColorPreset {
  /** The color value (hex or rgba) */
  color: string;
  /** Display label for the preset */
  label: string;
  /** Optional category for grouping (e.g., "site", "button", "custom") */
  category?: string;
}

export interface EditorColorPickerProps {
  /** Label for the color picker */
  label?: string;
  /** Current color value */
  value: string;
  /** Change handler */
  onChange: (color: string) => void;
  /** 
   * Preset colors to display as quick-click swatches.
   * Can include site colors, other button colors, etc.
   */
  presets?: ColorPreset[];
  /** Whether to show the alpha/opacity slider */
  showAlpha?: boolean;
  /** Whether this picker is currently focused (for multi-picker UI) */
  isFocused?: boolean;
  /** Called when this picker gains focus */
  onFocus?: () => void;
  /** Compact mode - just the color swatch and input, no presets inline */
  compact?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * EditorColorPicker - A color picker with HEX/RGBA modes and dynamic presets
 * 
 * Features:
 * - HEX and RGBA mode toggle
 * - Native color input + text input
 * - Alpha slider (optional)
 * - Dynamic preset swatches (site colors, other buttons, custom)
 * - Focus state for multi-picker coordination
 */
export default function EditorColorPicker({
  label,
  value,
  onChange,
  presets = [],
  showAlpha = false,
  isFocused = false,
  onFocus,
  compact = false,
  className = '',
}: EditorColorPickerProps) {
  // Determine initial color mode based on value
  const [colorMode, setColorMode] = useState<'hex' | 'rgba'>(() => 
    hasAlpha(value) || showAlpha ? 'rgba' : 'hex'
  );
  
  // Parse current color
  const parsed = useMemo(() => parseColor(value), [value]);
  const hexValue = rgbaToHex(parsed.r, parsed.g, parsed.b);
  
  // Handle color changes
  const handleColorInputChange = (newHex: string) => {
    if (colorMode === 'rgba') {
      const { r, g, b } = parseColor(newHex);
      onChange(toRgbaString(r, g, b, parsed.a));
    } else {
      onChange(newHex);
    }
  };
  
  const handleTextInputChange = (text: string) => {
    onChange(text);
  };
  
  const handleRgbaChange = (component: 'r' | 'g' | 'b' | 'a', newValue: number) => {
    const updated = { ...parsed, [component]: newValue };
    onChange(toRgbaString(updated.r, updated.g, updated.b, updated.a));
  };
  
  const handlePresetClick = (color: string) => {
    onChange(color);
  };
  
  // Dedupe presets by color value
  const uniquePresets = useMemo(() => {
    const seen = new Set<string>();
    return presets.filter(p => {
      const normalized = p.color.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [presets]);
  
  const containerClasses = isFocused 
    ? 'bg-indigo-500/10 ring-1 ring-indigo-500/50 rounded-lg p-2'
    : compact 
      ? ''
      : 'bg-gray-800/30 border border-white/5 rounded-lg p-2';
  
  return (
    <div 
      className={`space-y-2 ${containerClasses} ${className}`}
      onClick={onFocus}
    >
      {/* Label and Mode Toggle */}
      {(label || !compact) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className={`text-[11px] font-medium uppercase tracking-wider ${
              isFocused ? 'text-indigo-400' : 'text-gray-400'
            }`}>
              {label}
            </label>
          )}
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setColorMode('hex'); }}
              className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
                colorMode === 'hex' 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              HEX
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setColorMode('rgba'); }}
              className={`px-1.5 py-0.5 text-[9px] rounded transition-colors ${
                colorMode === 'rgba' 
                  ? 'bg-indigo-500 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              RGBA
            </button>
          </div>
        </div>
      )}
      
      {/* Color Input Row */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => handleColorInputChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-white/20 hover:border-white/40 transition-colors flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        
        {colorMode === 'hex' ? (
          <input
            type="text"
            value={value.startsWith('#') ? value : hexValue}
            onChange={(e) => handleTextInputChange(e.target.value)}
            className="flex-1 bg-gray-800/50 text-white text-xs px-2 py-1.5 rounded border border-white/10 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none font-mono"
            placeholder="#000000"
          />
        ) : (
          <div className="flex-1 grid grid-cols-4 gap-1">
            <input
              type="number"
              min="0"
              max="255"
              value={parsed.r}
              onChange={(e) => handleRgbaChange('r', parseInt(e.target.value) || 0)}
              className="w-full bg-gray-800/50 text-white text-center text-[10px] py-1.5 rounded border border-white/10 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
              title="Red (0-255)"
            />
            <input
              type="number"
              min="0"
              max="255"
              value={parsed.g}
              onChange={(e) => handleRgbaChange('g', parseInt(e.target.value) || 0)}
              className="w-full bg-gray-800/50 text-white text-center text-[10px] py-1.5 rounded border border-white/10 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
              title="Green (0-255)"
            />
            <input
              type="number"
              min="0"
              max="255"
              value={parsed.b}
              onChange={(e) => handleRgbaChange('b', parseInt(e.target.value) || 0)}
              className="w-full bg-gray-800/50 text-white text-center text-[10px] py-1.5 rounded border border-white/10 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
              title="Blue (0-255)"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={parsed.a.toFixed(2)}
              onChange={(e) => handleRgbaChange('a', parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800/50 text-white text-center text-[10px] py-1.5 rounded border border-white/10 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
              title="Alpha (0-1)"
            />
          </div>
        )}
      </div>
      
      {/* Alpha Slider (RGBA mode only) */}
      {colorMode === 'rgba' && showAlpha && (
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-500 w-8">Alpha</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={parsed.a}
            onChange={(e) => handleRgbaChange('a', parseFloat(e.target.value))}
            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, rgba(${parsed.r},${parsed.g},${parsed.b},0), rgba(${parsed.r},${parsed.g},${parsed.b},1))`,
            }}
          />
          <span className="text-[9px] text-gray-400 w-8 text-right">
            {Math.round(parsed.a * 100)}%
          </span>
        </div>
      )}
      
      {/* Preset Swatches */}
      {uniquePresets.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pt-1">
          {uniquePresets.map((preset, i) => (
            <button
              key={`${preset.color}-${i}`}
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePresetClick(preset.color); }}
              className="w-5 h-5 rounded border border-white/20 hover:border-white hover:scale-110 transition-all"
              style={{ 
                backgroundColor: preset.color,
                boxShadow: preset.color.toLowerCase() === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined,
              }}
              title={`${preset.label}: ${preset.color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PRESET HELPERS
// ============================================================================

/**
 * Build preset colors from various sources
 * Use this to create the presets array from site colors, other buttons, etc.
 */
export function buildColorPresets(options: {
  /** Site color palette */
  colorPalette?: { primary?: string; secondary?: string; accent?: string };
  /** Include white and black */
  includeBasics?: boolean;
  /** Additional custom presets */
  custom?: ColorPreset[];
  /** Other button colors (for button editors) */
  otherButtonColors?: Array<{ color: string; label: string }>;
}): ColorPreset[] {
  const presets: ColorPreset[] = [];
  
  // Basic colors
  if (options.includeBasics !== false) {
    presets.push({ color: '#ffffff', label: 'White', category: 'basic' });
    presets.push({ color: '#000000', label: 'Black', category: 'basic' });
  }
  
  // Site palette colors
  if (options.colorPalette) {
    if (options.colorPalette.primary) {
      presets.push({ color: options.colorPalette.primary, label: 'Primary', category: 'site' });
    }
    if (options.colorPalette.secondary) {
      presets.push({ color: options.colorPalette.secondary, label: 'Secondary', category: 'site' });
    }
    if (options.colorPalette.accent) {
      presets.push({ color: options.colorPalette.accent, label: 'Accent', category: 'site' });
    }
  }
  
  // Other button colors
  if (options.otherButtonColors) {
    options.otherButtonColors.forEach(btn => {
      presets.push({ color: btn.color, label: btn.label, category: 'buttons' });
    });
  }
  
  // Custom presets
  if (options.custom) {
    presets.push(...options.custom);
  }
  
  return presets;
}
