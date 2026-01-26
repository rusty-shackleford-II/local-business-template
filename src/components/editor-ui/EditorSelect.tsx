'use client';

import React from 'react';

export interface EditorSelectOption {
  value: string;
  label: string;
}

export interface EditorSelectProps {
  /** Select label */
  label?: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Options to display */
  options: EditorSelectOption[];
  /** Description text below select */
  description?: string;
  /** Additional className */
  className?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
}

/**
 * EditorSelect - A styled dropdown select for editor modals
 */
export default function EditorSelect({
  label,
  value,
  onChange,
  options,
  description,
  className = '',
  disabled = false,
}: EditorSelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
