'use client';

import React from 'react';

export interface EditorSliderPreset {
  value: number;
  label: string;
}

export interface EditorSliderProps {
  /** Slider label */
  label?: string;
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step?: number;
  /** Preset buttons to show */
  presets?: EditorSliderPreset[];
  /** Format the displayed value (e.g., "100%" or "16px") */
  formatValue?: (value: number) => string;
  /** Show the value display */
  showValue?: boolean;
  /** Hide min/max labels */
  hideMinMax?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * EditorSlider - A styled slider with optional preset buttons
 */
export default function EditorSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  presets,
  formatValue = (v) => `${Math.round(v * 100)}%`,
  showValue = true,
  hideMinMax = false,
  className = '',
}: EditorSliderProps) {
  // Calculate fill percentage for gradient background
  const fillPercent = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-xs text-gray-300 font-medium">
              {formatValue(value)}
            </span>
          )}
        </div>
      )}
      
      {/* Preset Buttons */}
      {presets && presets.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                Math.abs(value - preset.value) < step / 2
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                  : 'bg-gray-800/50 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
      
      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer slider-track"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${fillPercent}%, #374151 ${fillPercent}%, #374151 100%)`,
        }}
      />
      
      {/* Min/Max Labels */}
      {!hideMinMax && (
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      )}
      
      {/* Slider thumb styles */}
      <style>{`
        .slider-track::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .slider-track::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .slider-track::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
