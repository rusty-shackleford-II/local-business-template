'use client';

import React from 'react';

export interface EditorToggleProps {
  /** Toggle label */
  label: string;
  /** Optional description */
  description?: string;
  /** Current checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Compact mode - no background box */
  compact?: boolean;
}

/**
 * EditorToggle - A styled toggle switch for editor modals
 */
export default function EditorToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  compact = false,
}: EditorToggleProps) {
  const content = (
    <>
      <div className="min-w-0 flex-1 mr-3">
        <label className="text-sm text-gray-300 font-medium">{label}</label>
        {description && (
          <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${checked ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-700'}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </>
  );

  if (compact) {
    return (
      <div className="flex items-center justify-between py-1">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-gray-800/40 border border-white/5 rounded-lg">
      {content}
    </div>
  );
}
