'use client';

import React, { useMemo } from 'react';
import {
  EditorModal,
  EditorSlider,
  EditorColorPicker,
  buildColorPresets,
  type ColorPreset,
} from './editor-ui';

// Icon for the modal header
const HeaderStyleIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

type HeaderStylePopupProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Called when cancel button is clicked - parent should restore original values */
  onCancel?: () => void;
  targetElement?: HTMLElement | null; // Used for smart positioning
  // Header background color
  headerColor?: string;
  onHeaderColorChange?: (color: string) => void;
  // Nav link size
  navLinkSize?: number;
  onNavLinkSizeChange?: (size: number) => void;
  // Nav link color
  navLinkColor?: string;
  onNavLinkColorChange?: (color: string) => void;
  // Preset colors from palette
  presetColors?: string[];
};

export default function HeaderStylePopup({
  isOpen,
  onClose,
  onCancel,
  targetElement,
  headerColor = 'rgba(255, 255, 255, 0.95)',
  onHeaderColorChange,
  navLinkSize = 1.0,
  onNavLinkSizeChange,
  navLinkColor = '#374151',
  onNavLinkColorChange,
  presetColors = [],
}: HeaderStylePopupProps) {
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
      title="Header Style"
      icon={<HeaderStyleIcon />}
      width="md"
      backdropOpacity={0}
      closeOnBackdropClick={true}
      targetElement={targetElement}
    >
      {/* Header Background Color */}
      {onHeaderColorChange && (
        <EditorColorPicker
          label="Header Background"
          value={headerColor}
          onChange={onHeaderColorChange}
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
    </EditorModal>
  );
}
