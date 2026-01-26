'use client';

import React from 'react';
import type { ColorPreset } from './EditorColorPicker';

export interface EditorPresetSwatchesProps {
  /** Preset colors to display */
  presets: ColorPreset[];
  /** Click handler for a preset */
  onSelect: (color: string) => void;
  /** Label text (e.g., "Presets → Background") */
  label?: string;
  /** Size of swatches: 'sm' (24px), 'md' (28px), 'lg' (32px) */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6',
  md: 'w-7 h-7',
  lg: 'w-8 h-8',
};

/**
 * EditorPresetSwatches - Standalone preset color swatches
 * 
 * Use this when you want to display preset colors separately from the color picker,
 * such as for a shared preset row that applies to multiple color fields.
 */
export default function EditorPresetSwatches({
  presets,
  onSelect,
  label,
  size = 'md',
  className = '',
}: EditorPresetSwatchesProps) {
  if (presets.length === 0) return null;
  
  return (
    <div className={`p-4 bg-gray-800/50 border border-white/5 rounded-xl ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">
            {label}
          </span>
          <span className="text-xs text-gray-500">Click to apply</span>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {presets.map((preset, i) => (
          <button
            key={`${preset.color}-${i}`}
            type="button"
            onClick={() => onSelect(preset.color)}
            className={`${SIZE_CLASSES[size]} rounded-lg border-2 border-white/20 hover:border-white hover:scale-110 transition-all relative group`}
            style={{ 
              backgroundColor: preset.color,
              boxShadow: preset.color.toLowerCase() === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' : undefined,
            }}
            title={`${preset.label}: ${preset.color}`}
          >
            {/* Tooltip */}
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {preset.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
