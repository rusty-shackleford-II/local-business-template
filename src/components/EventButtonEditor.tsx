/**
 * EventButtonEditor.tsx
 * 
 * A modal for customizing event button properties and global button styles.
 * Appears when clicking on a button in edit mode within the events section.
 * Includes global styling options that apply to ALL event buttons.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { EventsButtonStyles, ColorPalette } from '../types';

// Color parsing utility
function parseColor(color: string): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length >= 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  }
  return { r, g, b };
}

function rgbaToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Common web-safe fonts
const FONT_OPTIONS = [
  { value: '', label: 'Default (Inherit)' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
];

type ButtonType = 'secondary' | 'primary';

type EventButtonEditorProps = {
  buttonType: ButtonType;
  label: string;
  actionType?: 'modal' | 'external' | 'contact';
  url?: string;
  eventIndex: number;
  onClose: () => void;
  onEdit: (path: string, value: any) => void;
  colorPalette?: ColorPalette;
  buttonStyles?: EventsButtonStyles;
};

const EventButtonEditor: React.FC<EventButtonEditorProps> = ({
  buttonType,
  label,
  actionType = buttonType === 'secondary' ? 'modal' : 'contact',
  url = '',
  eventIndex,
  onClose,
  onEdit,
  colorPalette,
  buttonStyles = {},
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showPulse, setShowPulse] = useState(true);
  
  // Default values from buttonStyles
  const defaultPrimaryBg = colorPalette?.primary || '#10B981';
  const fontSize = buttonStyles.fontSize ?? 14;
  const borderRadius = buttonStyles.borderRadius ?? 8;
  const fontFamily = buttonStyles.fontFamily ?? '';
  const fontWeight = buttonStyles.fontWeight ?? 500;
  const backgroundColor = buttonStyles.backgroundColor ?? defaultPrimaryBg;
  const textColor = buttonStyles.textColor ?? '#ffffff';
  const secondaryBackgroundColor = buttonStyles.secondaryBackgroundColor ?? '#f3f4f6';
  const secondaryTextColor = buttonStyles.secondaryTextColor ?? '#1f2937';
  const primaryButtonEnabled = buttonStyles.primaryButtonEnabled !== false; // Default true
  const secondaryButtonEnabled = buttonStyles.secondaryButtonEnabled !== false; // Default true
  
  // Pulse effect on open
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 600);
    return () => clearTimeout(timer);
  }, []);
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  // Stop click from closing modal
  const stopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  // Get default label based on button type
  const getDefaultLabel = () => {
    return buttonType === 'secondary' ? 'See More Details' : 'Inquire About This Event';
  };
  
  // Get path prefix
  const getPathPrefix = () => {
    return `upcomingEvents.items.${eventIndex}`;
  };
  
  // Handle label change (per-event)
  const handleLabelChange = (value: string) => {
    const fieldName = buttonType === 'secondary' ? 'detailsButtonLabel' : 'inquireButtonLabel';
    onEdit(`${getPathPrefix()}.${fieldName}`, value);
  };
  
  // Handle action type change (per-event)
  const handleActionChange = (value: string) => {
    if (buttonType === 'secondary') {
      onEdit(`${getPathPrefix()}.detailsButtonAction`, value);
    }
  };
  
  // Handle URL change (per-event)
  const handleUrlChange = (value: string) => {
    if (buttonType === 'secondary') {
      onEdit(`${getPathPrefix()}.detailsButtonUrl`, value);
    } else {
      onEdit(`${getPathPrefix()}.inquireUrl`, value);
    }
  };
  
  // Handle global style changes
  const updateButtonStyles = (updates: Partial<EventsButtonStyles>) => {
    const newStyles = { ...buttonStyles, ...updates };
    onEdit('upcomingEvents.buttonStyles', newStyles);
  };
  
  const isSecondaryButton = buttonType === 'secondary';
  const currentActionType = isSecondaryButton ? actionType : (url ? 'external' : 'contact');
  
  // Build preview styles
  const getPreviewStyle = (isPrimary: boolean): React.CSSProperties => {
    if (!isPrimary) {
      return {
        backgroundColor: secondaryBackgroundColor,
        color: secondaryTextColor,
        border: '1px solid #d1d5db',
        borderRadius: `${borderRadius}px`,
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily || 'inherit',
        fontWeight,
      };
    }
    return {
      backgroundColor,
      color: textColor,
      borderRadius: `${borderRadius}px`,
      fontSize: `${fontSize}px`,
      fontFamily: fontFamily || 'inherit',
      fontWeight,
    };
  };
  
  // Modal content
  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[9998]"
        onClick={onClose}
      />
      
      {/* Modal - wider to accommodate styling options */}
      <div
        ref={popoverRef}
        className="fixed z-[9999] bg-gray-900 rounded-xl shadow-2xl border border-gray-700 p-6"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '640px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={stopClick}
        onMouseDown={stopClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold text-lg">
            Edit {isSecondaryButton ? 'Secondary' : 'Primary'} Button
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Subtitle */}
        <p className="text-gray-400 text-sm mb-5">
          Configure this button for this event. Styling options apply to all event buttons.
        </p>
        
        {/* Button Preview - show both buttons */}
        <div className="mb-6 py-5 bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 text-center mb-3">Preview</p>
          <div className="flex flex-col gap-2 items-center px-6">
            {secondaryButtonEnabled && (
              <button
                className={`w-64 px-4 py-2 font-medium select-none pointer-events-none transition-all ${!isSecondaryButton ? 'opacity-50' : ''}`}
                style={{
                  ...getPreviewStyle(false),
                  animation: showPulse && isSecondaryButton ? 'pulse-highlight 0.6s ease-out' : undefined,
                  boxShadow: showPulse && isSecondaryButton ? '0 0 0 4px rgba(59, 130, 246, 0.5)' : undefined,
                }}
              >
                {isSecondaryButton ? (label || getDefaultLabel()) : 'Secondary Button'}
              </button>
            )}
            {primaryButtonEnabled && (
              <button
                className={`w-64 px-4 py-2 font-medium select-none pointer-events-none transition-all ${isSecondaryButton ? 'opacity-50' : ''}`}
                style={{
                  ...getPreviewStyle(true),
                  animation: showPulse && !isSecondaryButton ? 'pulse-highlight 0.6s ease-out' : undefined,
                  boxShadow: showPulse && !isSecondaryButton ? '0 0 0 4px rgba(59, 130, 246, 0.5)' : undefined,
                }}
              >
                {!isSecondaryButton ? (label || getDefaultLabel()) : 'Primary Button'}
              </button>
            )}
            {!primaryButtonEnabled && !secondaryButtonEnabled && (
              <p className="text-gray-500 text-sm">Both buttons are disabled</p>
            )}
          </div>
        </div>
        
        {/* Two columns layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left column - This Button (per-event settings) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide border-b border-gray-700 pb-2">
              This Event&apos;s Button
            </h4>
            
            {/* Button Label */}
            <div>
              <label className="text-sm text-gray-300 block mb-2 font-medium">Button Text</label>
              <input
                type="text"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder={getDefaultLabel()}
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: &quot;{getDefaultLabel()}&quot;
              </p>
            </div>
            
            {/* Action Type - Secondary button */}
            {isSecondaryButton && (
              <div>
                <label className="text-sm text-gray-300 block mb-2 font-medium">Button Action</label>
                <select
                  value={actionType}
                  onChange={(e) => handleActionChange(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="modal">Open Event Details Modal</option>
                  <option value="external">Open External Link</option>
                </select>
              </div>
            )}
            
            {/* Action Type - Primary button */}
            {!isSecondaryButton && (
              <div>
                <label className="text-sm text-gray-300 block mb-2 font-medium">Button Action</label>
                <select
                  value={url ? 'external' : 'contact'}
                  onChange={(e) => {
                    if (e.target.value === 'contact') {
                      handleUrlChange('');
                    }
                  }}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value="contact">Scroll to Contact Form</option>
                  <option value="external">Open External Link</option>
                </select>
              </div>
            )}
            
            {/* URL field - shown when external link is selected */}
            {((isSecondaryButton && actionType === 'external') || (!isSecondaryButton && currentActionType === 'external')) && (
              <div>
                <label className="text-sm text-gray-300 block mb-2 font-medium">Link URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                  placeholder="https://example.com"
                />
                <p className="text-xs text-gray-500 mt-1">Opens in new tab</p>
              </div>
            )}
          </div>
          
          {/* Right column - Global Styling */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide border-b border-gray-700 pb-2">
              All Buttons Styling
            </h4>
            
            {/* Button Enable/Disable */}
            <div className="p-3 bg-gray-800/50 rounded-lg space-y-2">
              <label className="text-xs text-gray-400 block font-medium mb-2">Show Buttons</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={secondaryButtonEnabled}
                    onChange={(e) => updateButtonStyles({ secondaryButtonEnabled: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  Secondary
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={primaryButtonEnabled}
                    onChange={(e) => updateButtonStyles({ primaryButtonEnabled: e.target.checked })}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  Primary
                </label>
              </div>
            </div>
            
            {/* Font & Radius */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Font Size</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="20"
                    value={fontSize}
                    onChange={(e) => updateButtonStyles({ fontSize: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-400 w-8">{fontSize}px</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Rounding</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={borderRadius}
                    onChange={(e) => updateButtonStyles({ borderRadius: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-400 w-8">{borderRadius}px</span>
                </div>
              </div>
            </div>
            
            {/* Font Family & Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Font</label>
                <select
                  value={fontFamily}
                  onChange={(e) => updateButtonStyles({ fontFamily: e.target.value })}
                  className="w-full bg-gray-800 text-white text-xs px-2 py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  {FONT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Weight</label>
                <select
                  value={fontWeight}
                  onChange={(e) => updateButtonStyles({ fontWeight: parseInt(e.target.value) })}
                  className="w-full bg-gray-800 text-white text-xs px-2 py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
                >
                  <option value={400}>Normal</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semi-bold</option>
                  <option value={700}>Bold</option>
                </select>
              </div>
            </div>
            
            {/* Primary Button Colors */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">Primary Button Colors</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={rgbaToHex(parseColor(backgroundColor).r, parseColor(backgroundColor).g, parseColor(backgroundColor).b)}
                    onChange={(e) => updateButtonStyles({ backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                  />
                  <span className="text-xs text-gray-500">Background</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={rgbaToHex(parseColor(textColor).r, parseColor(textColor).g, parseColor(textColor).b)}
                    onChange={(e) => updateButtonStyles({ textColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                  />
                  <span className="text-xs text-gray-500">Text</span>
                </div>
              </div>
            </div>
            
            {/* Secondary Button Colors */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">Secondary Button Colors</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={rgbaToHex(parseColor(secondaryBackgroundColor).r, parseColor(secondaryBackgroundColor).g, parseColor(secondaryBackgroundColor).b)}
                    onChange={(e) => updateButtonStyles({ secondaryBackgroundColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                  />
                  <span className="text-xs text-gray-500">Background</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={rgbaToHex(parseColor(secondaryTextColor).r, parseColor(secondaryTextColor).g, parseColor(secondaryTextColor).b)}
                    onChange={(e) => updateButtonStyles({ secondaryTextColor: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-600"
                  />
                  <span className="text-xs text-gray-500">Text</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Styling changes apply to all event buttons
          </p>
          <button
            onClick={() => updateButtonStyles({
              fontSize: undefined,
              borderRadius: undefined,
              fontFamily: undefined,
              fontWeight: undefined,
              backgroundColor: undefined,
              textColor: undefined,
              secondaryBackgroundColor: undefined,
              secondaryTextColor: undefined,
              primaryButtonEnabled: undefined,
              secondaryButtonEnabled: undefined,
            })}
            className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded border border-gray-700 hover:border-gray-600 transition-colors"
          >
            Reset Styles
          </button>
        </div>
      </div>
      
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse-highlight {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          50% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
    </>
  );
  
  // Use portal to render at document body level
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
};

export default EventButtonEditor;
