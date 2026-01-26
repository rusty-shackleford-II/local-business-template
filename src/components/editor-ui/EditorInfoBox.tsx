'use client';

import React from 'react';

export interface EditorInfoBoxProps {
  /** The message to display */
  children: React.ReactNode;
  /** Variant/color scheme */
  variant?: 'info' | 'warning' | 'success' | 'tip';
  /** Icon to show (uses default based on variant if not provided) */
  icon?: React.ReactNode;
  /** Additional className */
  className?: string;
}

const VARIANT_STYLES = {
  info: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    text: 'text-indigo-300/90',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400/90',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400/90',
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  tip: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-300/90',
    icon: <span className="text-sm">💡</span>,
  },
};

/**
 * EditorInfoBox - A styled info/warning/tip box for editor modals
 */
export default function EditorInfoBox({
  children,
  variant = 'info',
  icon,
  className = '',
}: EditorInfoBoxProps) {
  const styles = VARIANT_STYLES[variant];
  
  return (
    <div className={`flex items-start gap-2 p-3 ${styles.bg} border ${styles.border} rounded-xl ${className}`}>
      <span className={styles.text}>
        {icon || styles.icon}
      </span>
      <p className={`text-xs ${styles.text}`}>{children}</p>
    </div>
  );
}
