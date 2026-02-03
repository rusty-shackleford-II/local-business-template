'use client';

import React, { useMemo } from 'react';
import {
  EditorModal,
  EditorToggle,
  EditorSlider,
  EditorColorPicker,
  EditorInput,
  EditorImageInputCompact,
  EditorImageCropper,
  useImageCropper,
  buildColorPresets,
  type ColorPreset,
  type ImageStorageAdapter,
} from './editor-ui';

// Icon for the modal header
const BrandingIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

type BrandingPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Called when cancel button is clicked - parent should restore original values */
  onCancel?: () => void;
  targetElement?: HTMLElement | null; // Used for smart positioning
  location: 'header' | 'footer';
  // Logo toggle
  showLogo: boolean;
  onShowLogoChange: (show: boolean) => void;
  /** @deprecated Use storage + onLogoChange instead */
  onLogoUpload?: () => void;
  logoUrl?: string;
  /** Called when logo is cropped and saved (receives idb:// key) */
  onLogoChange?: (logoKey: string) => void;
  /** Storage adapter for built-in cropper */
  storage?: ImageStorageAdapter;
  // Logo text (brand text) toggle and text
  showBusinessName: boolean;
  onShowBusinessNameChange: (show: boolean) => void;
  brandText: string;
  onBrandTextChange: (text: string) => void;
  // Text styling
  textSize?: number;
  onTextSizeChange?: (size: number) => void;
  textColor?: string;
  onTextColorChange?: (color: string) => void;
  // Logo size (for header)
  logoSize?: number;
  onLogoSizeChange?: (size: number) => void;
  // Preset colors from palette
  presetColors?: string[];
};

export default function BrandingPopup({
  isOpen,
  onClose,
  onCancel,
  targetElement,
  location,
  showLogo,
  onShowLogoChange,
  onLogoUpload,
  logoUrl,
  onLogoChange,
  storage,
  showBusinessName,
  onShowBusinessNameChange,
  brandText,
  onBrandTextChange,
  textSize = 1.0,
  onTextSizeChange,
  textColor = '#111827',
  onTextColorChange,
  logoSize = 1.0,
  onLogoSizeChange,
  presetColors = [],
}: BrandingPopupProps) {
  // Build color presets from the provided palette colors
  const colorPresets: ColorPreset[] = useMemo(() => {
    const presets = buildColorPresets({ includeBasics: true });
    
    // Add any additional preset colors passed in
    presetColors.forEach((color, i) => {
      presets.push({ color, label: `Color ${i + 1}`, category: 'site' });
    });
    
    return presets;
  }, [presetColors]);
  
  // Use the image cropper hook when storage is provided
  const cropper = useImageCropper({
    cropType: 'logo',
    targetKey: `${location}-logo`,
    storage: storage || {
      // Dummy adapter if none provided - won't be used
      saveBlob: async () => {},
      generateImageKey: () => '',
    },
    onComplete: (imageKey) => {
      onLogoChange?.(imageKey);
    },
  });

  // Size slider presets
  const logoSizePresets = [
    { value: 0.5, label: '50%' },
    { value: 1.0, label: '100%' },
    { value: 1.5, label: '150%' },
    { value: 2.0, label: '200%' },
  ];

  const textSizePresets = [
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
      title={`${location === 'header' ? 'Header' : 'Footer'} Branding`}
      icon={<BrandingIcon />}
      width="md"
      backdropOpacity={0}
      closeOnBackdropClick={true}
      targetElement={targetElement}
    >
      {/* Logo Section */}
      <div className="space-y-3">
        <EditorToggle
          label="Show Logo"
          checked={showLogo}
          onChange={onShowLogoChange}
        />
        
        {showLogo && (
          <div className="space-y-3 pt-1">
            {/* Logo Upload - with built-in cropper when storage provided */}
            {storage ? (
              <>
                <input ref={cropper.fileInputRef} {...cropper.fileInputProps} />
                <div className="flex items-center gap-3">
                  <EditorImageInputCompact
                    value={logoUrl}
                    onSelectImage={cropper.openFilePicker}
                    alt="Logo"
                    size="md"
                  />
                  <button
                    onClick={cropper.openFilePicker}
                    disabled={cropper.isProcessing}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                  >
                    {cropper.isProcessing ? 'Processing...' : logoUrl ? 'Change logo' : 'Upload logo'}
                  </button>
                </div>
              </>
            ) : onLogoUpload && (
              <div className="flex items-center gap-3">
                <EditorImageInputCompact
                  value={logoUrl}
                  onSelectImage={onLogoUpload}
                  alt="Logo"
                  size="md"
                />
                <button
                  onClick={onLogoUpload}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {logoUrl ? 'Change logo' : 'Upload logo'}
                </button>
              </div>
            )}
            
            {/* Logo Size */}
            {onLogoSizeChange && (
              <EditorSlider
                label="Logo Size"
                value={logoSize}
                onChange={onLogoSizeChange}
                min={0.5}
                max={3.0}
                step={0.1}
                presets={logoSizePresets}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                hideMinMax
              />
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 -mx-4" />

      {/* Logo Text Section */}
      <div className="space-y-3">
        <EditorToggle
          label="Show Text"
          checked={showBusinessName}
          onChange={onShowBusinessNameChange}
        />
        
        {showBusinessName && (
          <div className="space-y-3 pt-1">
            {/* Text Input */}
            <EditorInput
              label="Brand Name"
              value={brandText}
              onChange={onBrandTextChange}
              placeholder="Your Business Name"
            />
            
            {/* Text Size */}
            {onTextSizeChange && (
              <EditorSlider
                label="Text Size"
                value={textSize}
                onChange={onTextSizeChange}
                min={0.75}
                max={1.5}
                step={0.05}
                presets={textSizePresets}
                formatValue={(v) => `${Math.round(v * 100)}%`}
                hideMinMax
              />
            )}
            
            {/* Text Color */}
            {onTextColorChange && (
              <EditorColorPicker
                label="Text Color"
                value={textColor}
                onChange={onTextColorChange}
                presets={colorPresets}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Built-in Logo Cropper */}
      {storage && (
        <EditorImageCropper
          isOpen={cropper.isOpen}
          imageSrc={cropper.imageSrc}
          cropType="logo"
          onCropComplete={cropper.handleCropComplete}
          onCancel={cropper.handleCancel}
          title={`${location === 'header' ? 'Header' : 'Footer'} Logo`}
        />
      )}
    </EditorModal>
  );
}
