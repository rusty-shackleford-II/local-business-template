'use client';

import React, { useMemo } from 'react';
import {
  EditorModal,
  EditorSlider,
  EditorColorPicker,
  EditorToggle,
  buildColorPresets,
  type ColorPreset,
} from './editor-ui';

// Icon for the modal header
const FooterStyleIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

type FooterStylePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  // Footer background color
  footerColor?: string;
  onFooterColorChange?: (color: string) => void;
  // Nav link size
  navLinkSize?: number;
  onNavLinkSizeChange?: (size: number) => void;
  // Nav link color
  navLinkColor?: string;
  onNavLinkColorChange?: (color: string) => void;
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
  footerColor = '#ffffff',
  onFooterColorChange,
  navLinkSize = 1.0,
  onNavLinkSizeChange,
  navLinkColor = '#4B5563',
  onNavLinkColorChange,
  showPrivacyPolicy = false,
  onShowPrivacyPolicyChange,
  showTermsAndConditions = false,
  onShowTermsAndConditionsChange,
  presetColors = [],
}: FooterStylePopupProps) {
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
      title="Footer Style"
      icon={<FooterStyleIcon />}
      width="md"
      backdropOpacity={0}
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
