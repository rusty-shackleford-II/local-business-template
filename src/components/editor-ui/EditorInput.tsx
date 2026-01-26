'use client';

import React from 'react';

export interface EditorInputProps {
  /** Input label */
  label?: string;
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input type */
  type?: 'text' | 'url' | 'tel' | 'email' | 'number';
  /** Description text below input */
  description?: string;
  /** Additional className for the input */
  className?: string;
  /** Whether this is a multiline textarea */
  multiline?: boolean;
  /** Number of rows for textarea */
  rows?: number;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Smaller size variant */
  size?: 'sm' | 'md';
}

/**
 * EditorInput - A styled text input for editor modals
 */
export default function EditorInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  description,
  className = '',
  multiline = false,
  rows = 3,
  disabled = false,
  size = 'sm',
}: EditorInputProps) {
  const sizeClasses = size === 'sm' 
    ? 'px-3 py-2 text-sm' 
    : 'px-4 py-3 text-sm';
  
  const inputClasses = `w-full ${sizeClasses} bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`;
  
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={inputClasses}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />
      )}
      {description && (
        <p className="text-[11px] text-gray-500">{description}</p>
      )}
    </div>
  );
}
