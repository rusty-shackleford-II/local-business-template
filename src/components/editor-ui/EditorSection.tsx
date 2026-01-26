'use client';

import React from 'react';

export interface EditorSectionProps {
  /** Section label text */
  label: string;
  /** Optional description below label */
  description?: string;
  /** Content inside the section */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Whether to add a background/border box around content */
  boxed?: boolean;
}

/**
 * EditorSection - A section wrapper with uppercase label styling
 */
export default function EditorSection({
  label,
  description,
  children,
  className = '',
  boxed = false,
}: EditorSectionProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div>
        <label className="text-xs font-medium text-gray-300 uppercase tracking-wider">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      {boxed ? (
        <div className="p-3 bg-gray-800/30 rounded-xl border border-white/5">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
