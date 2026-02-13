'use client';

import React, { useMemo, useState } from 'react';
import {
  EditorModal,
  EditorSlider,
  EditorColorPicker,
  EditorToggle,
  buildColorPresets,
  type ColorPreset,
} from './editor-ui';
import type { NavLinkItem } from './HeaderStylePopup';

// Icon for the modal header
const FooterStyleIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

type FooterStylePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Called when cancel button is clicked - parent should restore original values */
  onCancel?: () => void;
  targetElement?: HTMLElement | null; // Used for smart positioning
  // Footer background color
  footerColor?: string;
  onFooterColorChange?: (color: string) => void;
  // Nav link size
  navLinkSize?: number;
  onNavLinkSizeChange?: (size: number) => void;
  // Nav link color
  navLinkColor?: string;
  onNavLinkColorChange?: (color: string) => void;
  // Nav link items for editing names and visibility
  navLinks?: NavLinkItem[];
  onNavLinkLabelChange?: (sectionId: string, label: string) => void;
  onNavLinkVisibilityChange?: (sectionId: string, visible: boolean) => void;
  // Privacy Policy toggle
  showPrivacyPolicy?: boolean;
  onShowPrivacyPolicyChange?: (show: boolean) => void;
  // Terms and Conditions toggle
  showTermsAndConditions?: boolean;
  onShowTermsAndConditionsChange?: (show: boolean) => void;
  // Preset colors from palette
  presetColors?: string[];
};

export default function FooterStylePopup({
  isOpen,
  onClose,
  onCancel,
  targetElement,
  footerColor = '#ffffff',
  onFooterColorChange,
  navLinkSize = 1.0,
  onNavLinkSizeChange,
  navLinkColor = '#4B5563',
  onNavLinkColorChange,
  navLinks,
  onNavLinkLabelChange,
  onNavLinkVisibilityChange,
  showPrivacyPolicy = false,
  onShowPrivacyPolicyChange,
  showTermsAndConditions = false,
  onShowTermsAndConditionsChange,
  presetColors = [],
}: FooterStylePopupProps) {
  // Track which nav link is being edited
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  // Build color presets from the provided palette colors
  const colorPresets: ColorPreset[] = useMemo(() => {
    const presets = buildColorPresets({ includeBasics: true });
    
    // Add any additional preset colors passed in
    presetColors.forEach((color, i) => {
      presets.push({ color, label: `Color ${i + 1}`, category: 'site' });
    });
    
    return presets;
  }, [presetColors]);

  // Nav link size presets
  const navLinkSizePresets = [
    { value: 0.75, label: '75%' },
    { value: 1.0, label: '100%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' },
  ];

  return (
    <EditorModal
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onCancel}
      showCancelButton={!!onCancel}
      title="Footer Style"
      icon={<FooterStyleIcon />}
      width="md"
      backdropOpacity={0}
      closeOnBackdropClick={true}
      targetElement={targetElement}
    >
      {/* Footer Background Color */}
      {onFooterColorChange && (
        <EditorColorPicker
          label="Footer Background"
          value={footerColor}
          onChange={onFooterColorChange}
          presets={colorPresets}
        />
      )}

      {/* Divider */}
      <div className="border-t border-white/10 -mx-4" />

      {/* Nav Link Size */}
      {onNavLinkSizeChange && (
        <EditorSlider
          label="Nav Link Size"
          value={navLinkSize}
          onChange={onNavLinkSizeChange}
          min={0.75}
          max={1.5}
          step={0.05}
          presets={navLinkSizePresets}
          formatValue={(v) => `${Math.round(v * 100)}%`}
          hideMinMax
        />
      )}

      {/* Nav Link Color */}
      {onNavLinkColorChange && (
        <>
          <div className="border-t border-white/10 -mx-4" />
          <EditorColorPicker
            label="Nav Link Color"
            value={navLinkColor}
            onChange={onNavLinkColorChange}
            presets={colorPresets}
          />
        </>
      )}

      {/* Nav Links - Name & Visibility */}
      {navLinks && navLinks.length > 0 && (onNavLinkLabelChange || onNavLinkVisibilityChange) && (
        <>
          <div className="border-t border-white/10 -mx-4" />
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              Nav Links
            </label>
            <div className="space-y-1.5">
              {navLinks.map((link) => (
                <div
                  key={link.sectionId}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800/40 border border-white/5 rounded-lg"
                >
                  {/* Visibility toggle */}
                  {onNavLinkVisibilityChange && (
                    <button
                      type="button"
                      onClick={() => onNavLinkVisibilityChange(link.sectionId, !link.visible)}
                      className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
                        link.visible
                          ? 'text-indigo-400 hover:text-indigo-300'
                          : 'text-gray-600 hover:text-gray-500'
                      }`}
                      title={link.visible ? 'Hide from footer' : 'Show in footer'}
                    >
                      {link.visible ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Label - click to edit */}
                  <div className="flex-1 min-w-0">
                    {editingLinkId === link.sectionId && onNavLinkLabelChange ? (
                      <input
                        type="text"
                        value={link.label}
                        placeholder={link.defaultLabel}
                        onChange={(e) => onNavLinkLabelChange(link.sectionId, e.target.value)}
                        onBlur={() => setEditingLinkId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingLinkId(null);
                        }}
                        autoFocus
                        className="w-full bg-gray-700/50 border border-indigo-500/50 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => onNavLinkLabelChange && setEditingLinkId(link.sectionId)}
                        className={`text-sm truncate w-full text-left transition-colors ${
                          link.visible ? 'text-gray-300' : 'text-gray-500 line-through'
                        } ${onNavLinkLabelChange ? 'hover:text-white cursor-text' : ''}`}
                        title={onNavLinkLabelChange ? 'Click to rename' : undefined}
                      >
                        {link.label || link.defaultLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Divider before legal section */}
      <div className="border-t border-white/10 -mx-4" />

      {/* Legal Links Section */}
      <div className="space-y-3">
        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          Legal Links
        </label>
        
        {onShowPrivacyPolicyChange && (
          <EditorToggle
            label="Show Privacy Policy"
            checked={showPrivacyPolicy}
            onChange={onShowPrivacyPolicyChange}
          />
        )}
        
        {onShowTermsAndConditionsChange && (
          <EditorToggle
            label="Show Terms & Conditions"
            checked={showTermsAndConditions}
            onChange={onShowTermsAndConditionsChange}
          />
        )}
      </div>
    </EditorModal>
  );
}
