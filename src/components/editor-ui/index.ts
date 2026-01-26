/**
 * Editor UI Components
 * 
 * A shared component library for inline editor popups/modals.
 * All components follow a consistent dark gradient theme with indigo/purple accents.
 */

// Base modal container
export { default as EditorModal } from './EditorModal';
export type { EditorModalProps } from './EditorModal';

// Form controls
export { default as EditorInput } from './EditorInput';
export type { EditorInputProps } from './EditorInput';

export { default as EditorSelect } from './EditorSelect';
export type { EditorSelectProps, EditorSelectOption } from './EditorSelect';

export { default as EditorToggle } from './EditorToggle';
export type { EditorToggleProps } from './EditorToggle';

export { default as EditorSlider } from './EditorSlider';
export type { EditorSliderProps, EditorSliderPreset } from './EditorSlider';

// Color picker
export { default as EditorColorPicker, buildColorPresets } from './EditorColorPicker';
export type { EditorColorPickerProps, ColorPreset } from './EditorColorPicker';

export { default as EditorPresetSwatches } from './EditorPresetSwatches';
export type { EditorPresetSwatchesProps } from './EditorPresetSwatches';

// Text styling
export { 
  default as EditorTextStyle,
  FONT_FAMILY_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  TEXT_ALIGN_OPTIONS,
} from './EditorTextStyle';
export type { EditorTextStyleProps, TextStyleValues } from './EditorTextStyle';

// Layout components
export { default as EditorSection } from './EditorSection';
export type { EditorSectionProps } from './EditorSection';

export { default as EditorInfoBox } from './EditorInfoBox';
export type { EditorInfoBoxProps } from './EditorInfoBox';

// Image input
export { default as EditorImageInput, EditorImageInputCompact } from './EditorImageInput';
export type { EditorImageInputProps, EditorImageInputCompactProps } from './EditorImageInput';

// Image cropper
export { default as EditorImageCropper, CROP_CONFIGS } from './EditorImageCropper';
export type { EditorImageCropperProps, CropType, CropConfig, CropData } from './EditorImageCropper';

// Image cropper hook (manages full flow: file select → crop → IndexedDB)
export { default as useImageCropper } from './useImageCropper';
export type { UseImageCropperOptions, UseImageCropperReturn, ImageStorageAdapter } from './useImageCropper';
