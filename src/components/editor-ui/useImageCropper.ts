/**
 * useImageCropper.ts
 * 
 * A hook that manages the complete image upload + crop flow:
 * 1. File selection via hidden input (single or multiple)
 * 2. Opening the cropper modal
 * 3. Cropping images one by one (for multi-select)
 * 4. Saving cropped images to IndexedDB
 * 5. Returning the idb:// keys
 */

import { useState, useCallback, useRef } from 'react';
import { CropType, CropData } from './EditorImageCropper';

// Storage adapter interface - components provide their own implementation
export interface ImageStorageAdapter {
  saveBlob: (key: string, blob: Blob, filename: string) => Promise<void>;
  generateImageKey: (prefix?: string) => string;
}

export interface UseImageCropperOptions {
  cropType: CropType;
  targetKey: string;
  storage: ImageStorageAdapter;
  /** Called after each image is cropped (for single mode or each in bulk mode) */
  onComplete?: (imageKey: string, cropData?: CropData) => void;
  /** Called after ALL images are cropped in bulk mode */
  onBulkComplete?: (imageKeys: string[]) => void;
  onError?: (error: Error) => void;
  acceptedTypes?: string[];
  /** Allow selecting multiple files at once */
  multiple?: boolean;
}

export interface UseImageCropperReturn {
  // State
  isOpen: boolean;
  imageSrc: string;
  isProcessing: boolean;
  /** For bulk mode: current index and total count */
  bulkProgress: { current: number; total: number } | null;
  
  // Actions
  openFilePicker: () => void;
  handleFileSelect: (file: File) => void;
  handleFilesSelect: (files: File[]) => void;
  handleCropComplete: (blob: Blob, cropData?: CropData) => Promise<void>;
  handleSkip: () => void;
  handleCancel: () => void;
  
  // For the hidden file input
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  fileInputProps: {
    type: 'file';
    accept: string;
    multiple: boolean;
    className: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
];

export function useImageCropper({
  cropType,
  targetKey,
  storage,
  onComplete,
  onBulkComplete,
  onError,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  multiple = false,
}: UseImageCropperOptions): UseImageCropperReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  
  // Bulk mode state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const totalFiles = useRef(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  // Load next file in queue
  const loadNextFile = useCallback((files: File[], index: number) => {
    if (index >= files.length) {
      // All done
      setIsOpen(false);
      setImageSrc('');
      setCurrentFile(null);
      setPendingFiles([]);
      setCurrentIndex(0);
      return false;
    }
    
    const file = files[index];
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setCurrentFile(file);
    setCurrentIndex(index);
    setIsOpen(true);
    return true;
  }, []);
  
  // Handle single file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      onError?.(new Error(`Invalid file type. Please use: ${acceptedTypes.join(', ')}`));
      return;
    }
    
    totalFiles.current = 1;
    setCompletedKeys([]);
    setPendingFiles([file]);
    loadNextFile([file], 0);
  }, [acceptedTypes, onError, loadNextFile]);
  
  // Handle multiple files selection
  const handleFilesSelect = useCallback((files: File[]) => {
    const validFiles = files.filter(f => acceptedTypes.includes(f.type));
    
    if (validFiles.length === 0) {
      onError?.(new Error(`No valid files. Please use: ${acceptedTypes.join(', ')}`));
      return;
    }
    
    if (validFiles.length < files.length) {
      console.warn(`${files.length - validFiles.length} files were skipped due to invalid type`);
    }
    
    totalFiles.current = validFiles.length;
    setCompletedKeys([]);
    setPendingFiles(validFiles);
    loadNextFile(validFiles, 0);
  }, [acceptedTypes, onError, loadNextFile]);
  
  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) return;
    
    // Copy files to array BEFORE clearing the input (clearing also clears the FileList reference)
    const fileArray = Array.from(files);
    
    // Reset input to allow re-selecting same file
    e.currentTarget.value = '';
    
    if (multiple && fileArray.length > 1) {
      handleFilesSelect(fileArray);
    } else {
      handleFileSelect(fileArray[0]);
    }
  }, [handleFileSelect, handleFilesSelect, multiple]);
  
  // Handle crop complete
  const handleCropComplete = useCallback(async (blob: Blob, cropData?: CropData) => {
    setIsProcessing(true);
    
    try {
      // Generate key and save to IndexedDB
      const imageKey = storage.generateImageKey(targetKey);
      const filename = currentFile?.name || `cropped-${Date.now()}.${blob.type.includes('png') ? 'png' : 'jpg'}`;
      
      await storage.saveBlob(imageKey, blob, filename);
      
      // Cleanup current image URL
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
      
      // Track completed key
      const newCompletedKeys = [...completedKeys, imageKey];
      setCompletedKeys(newCompletedKeys);
      
      // Notify parent of this completion
      onComplete?.(imageKey, cropData);
      
      // Check if there are more files
      const nextIndex = currentIndex + 1;
      if (nextIndex < pendingFiles.length) {
        // Load next file
        loadNextFile(pendingFiles, nextIndex);
      } else {
        // All done
        setImageSrc('');
        setCurrentFile(null);
        setIsOpen(false);
        setPendingFiles([]);
        setCurrentIndex(0);
        
        // Notify bulk completion
        if (newCompletedKeys.length > 1) {
          onBulkComplete?.(newCompletedKeys);
        }
      }
    } catch (error) {
      console.error('Error saving cropped image:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to save image'));
    } finally {
      setIsProcessing(false);
    }
  }, [storage, targetKey, currentFile, imageSrc, completedKeys, currentIndex, pendingFiles, onComplete, onBulkComplete, onError, loadNextFile]);
  
  // Skip current image (for bulk mode)
  const handleSkip = useCallback(() => {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < pendingFiles.length) {
      loadNextFile(pendingFiles, nextIndex);
    } else {
      // All done (with some skipped)
      setImageSrc('');
      setCurrentFile(null);
      setIsOpen(false);
      setPendingFiles([]);
      setCurrentIndex(0);
      
      if (completedKeys.length > 0) {
        onBulkComplete?.(completedKeys);
      }
    }
  }, [imageSrc, currentIndex, pendingFiles, completedKeys, onBulkComplete, loadNextFile]);
  
  // Handle cancel (cancels entire batch)
  const handleCancel = useCallback(() => {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageSrc('');
    setCurrentFile(null);
    setIsOpen(false);
    setPendingFiles([]);
    setCurrentIndex(0);
    setCompletedKeys([]);
  }, [imageSrc]);
  
  // Calculate bulk progress
  const bulkProgress = pendingFiles.length > 1 
    ? { current: currentIndex + 1, total: totalFiles.current }
    : null;
  
  return {
    isOpen,
    imageSrc,
    isProcessing,
    bulkProgress,
    openFilePicker,
    handleFileSelect,
    handleFilesSelect,
    handleCropComplete,
    handleSkip,
    handleCancel,
    fileInputRef,
    fileInputProps: {
      type: 'file',
      accept: acceptedTypes.join(','),
      multiple,
      className: 'hidden',
      onChange: handleInputChange,
    },
  };
}

export default useImageCropper;
