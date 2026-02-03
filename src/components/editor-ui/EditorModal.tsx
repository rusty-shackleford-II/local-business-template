'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Modal width: xs (300px), sm (340px), md (380px), lg (440px), xl (520px) */
  width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Backdrop opacity (0-1). Use 0 for no backdrop, low values to see through */
  backdropOpacity?: number;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Show the default "Done" button in footer. Set to false if providing custom footer */
  showDoneButton?: boolean;
  /** Custom done button text */
  doneButtonText?: string;
  /** Show a cancel button in footer */
  showCancelButton?: boolean;
  /** Custom cancel button text */
  cancelButtonText?: string;
  /** Callback when cancel is clicked (defaults to onClose if not provided) */
  onCancel?: () => void;
  /** Target element to position near (modal will avoid covering it) */
  targetElement?: HTMLElement | null;
}

const WIDTH_VALUES: Record<string, number> = {
  xs: 300,
  sm: 340,
  md: 380,
  lg: 440,
  xl: 520,
};

// Estimated modal height (will be refined after render, but helps with initial positioning)
const ESTIMATED_MODAL_HEIGHT = 400;
const PADDING = 16; // Minimum padding from viewport edges and target element

/**
 * EditorModal - A draggable modal container for inline editors
 * 
 * Features:
 * - Draggable via header (smooth, uses direct DOM manipulation)
 * - Dark gradient theme matching modern editor style
 * - Portal rendering to document body
 * - Escape key to close
 * - Optional backdrop (can be transparent to see underneath)
 */
/**
 * Calculate the best position for the modal relative to a target element.
 * Tries to position the modal where there's the most space, avoiding covering the target.
 */
function calculateSmartPosition(
  targetRect: DOMRect,
  modalWidth: number,
  modalHeight: number
): { top: number; left: number; position: 'above' | 'below' | 'left' | 'right' | 'center' } {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  
  // Calculate available space in each direction
  const spaceAbove = targetRect.top - PADDING;
  const spaceBelow = viewport.height - targetRect.bottom - PADDING;
  const spaceLeft = targetRect.left - PADDING;
  const spaceRight = viewport.width - targetRect.right - PADDING;
  
  // Determine if modal fits in each direction
  const fitsAbove = spaceAbove >= modalHeight + PADDING;
  const fitsBelow = spaceBelow >= modalHeight + PADDING;
  const fitsLeft = spaceLeft >= modalWidth + PADDING;
  const fitsRight = spaceRight >= modalWidth + PADDING;
  
  // Horizontal centering helper (center modal to target, but keep in viewport)
  const centerHorizontally = () => {
    const targetCenterX = targetRect.left + targetRect.width / 2;
    let left = targetCenterX - modalWidth / 2;
    // Clamp to viewport
    left = Math.max(PADDING, Math.min(viewport.width - modalWidth - PADDING, left));
    return left;
  };
  
  // Vertical centering helper
  const centerVertically = () => {
    const targetCenterY = targetRect.top + targetRect.height / 2;
    let top = targetCenterY - modalHeight / 2;
    // Clamp to viewport
    top = Math.max(PADDING, Math.min(viewport.height - modalHeight - PADDING, top));
    return top;
  };
  
  // Prefer placing below (most natural), then above, then right, then left
  // But prioritize directions that have the most space
  const directions = [
    { dir: 'below' as const, space: spaceBelow, fits: fitsBelow },
    { dir: 'above' as const, space: spaceAbove, fits: fitsAbove },
    { dir: 'right' as const, space: spaceRight, fits: fitsRight },
    { dir: 'left' as const, space: spaceLeft, fits: fitsLeft },
  ];
  
  // First try directions where the modal fits
  const fittingDirection = directions.find(d => d.fits);
  
  // If nothing fits well, pick the direction with most space
  const bestDirection = fittingDirection || directions.sort((a, b) => b.space - a.space)[0];
  
  let top: number;
  let left: number;
  
  switch (bestDirection.dir) {
    case 'below':
      top = targetRect.bottom + PADDING;
      left = centerHorizontally();
      break;
    case 'above':
      top = targetRect.top - modalHeight - PADDING;
      left = centerHorizontally();
      break;
    case 'right':
      top = centerVertically();
      left = targetRect.right + PADDING;
      break;
    case 'left':
      top = centerVertically();
      left = targetRect.left - modalWidth - PADDING;
      break;
  }
  
  // Final clamp to ensure modal stays in viewport
  top = Math.max(PADDING, Math.min(viewport.height - modalHeight - PADDING, top));
  left = Math.max(PADDING, Math.min(viewport.width - modalWidth - PADDING, left));
  
  return { top, left, position: bestDirection.dir };
}

export default function EditorModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  width = 'sm',
  backdropOpacity = 0,
  closeOnBackdropClick = true,
  showDoneButton = true,
  doneButtonText = 'Done',
  showCancelButton = false,
  cancelButtonText = 'Cancel',
  onCancel,
  targetElement,
}: EditorModalProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Use refs for drag state to avoid re-renders during drag
  const isDraggingRef = useRef(false);
  const positionRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const [, forceUpdate] = useState(0); // Only for cursor style
  
  // Track initial position (calculated once when modal opens)
  const [initialPosition, setInitialPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Calculate modal width
  const modalWidth = WIDTH_VALUES[width] || WIDTH_VALUES.sm;
  
  // Calculate smart position when modal opens
  useEffect(() => {
    if (isOpen && targetElement) {
      // Use a small delay to ensure we get the correct target rect
      const timer = setTimeout(() => {
        const targetRect = targetElement.getBoundingClientRect();
        // Use actual modal height if available, otherwise estimate
        const modalHeight = modalRef.current?.offsetHeight || ESTIMATED_MODAL_HEIGHT;
        const pos = calculateSmartPosition(targetRect, modalWidth, modalHeight);
        setInitialPosition({ top: pos.top, left: pos.left });
        positionRef.current = { x: 0, y: 0 };
      }, 0);
      return () => clearTimeout(timer);
    } else if (isOpen && !targetElement) {
      // No target element - use centered positioning
      setInitialPosition(null);
      positionRef.current = { x: 0, y: 0 };
      if (modalRef.current) {
        modalRef.current.style.transform = 'translate(-50%, -50%)';
      }
    }
  }, [isOpen, targetElement, modalWidth]);
  
  // Reset position when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInitialPosition(null);
      positionRef.current = { x: 0, y: 0 };
    }
  }, [isOpen]);
  
  // Handle mounting for SSR
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  // Drag handlers - use direct DOM manipulation for smooth dragging
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Only allow dragging from header area, not buttons
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: positionRef.current.x,
      posY: positionRef.current.y,
    };
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    forceUpdate(n => n + 1); // Update cursor style on header
  }, []);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !modalRef.current) return;
      
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      positionRef.current = {
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY,
      };
      
      // Direct DOM update - no React re-render
      // Use different transform based on whether we have smart positioning
      if (initialPosition) {
        modalRef.current.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`;
      } else {
        modalRef.current.style.transform = `translate(calc(-50% + ${positionRef.current.x}px), calc(-50% + ${positionRef.current.y}px))`;
      }
    };
    
    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      forceUpdate(n => n + 1); // Update cursor style on header
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [initialPosition]);
  
  // Stop propagation on modal click
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  
  // Handle outside clicks via document listener (allows clicks on target element to pass through)
  useEffect(() => {
    if (!isOpen || !closeOnBackdropClick) return;
    
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node;
      
      // Don't close if clicking inside the modal
      if (modalRef.current?.contains(target)) {
        return;
      }
      
      // Don't close if clicking on the target element (e.g., the editable text)
      if (targetElement?.contains(target)) {
        return;
      }
      
      // Close for clicks outside both modal and target
      onClose();
    };
    
    // Use setTimeout to avoid the click that opened the modal from immediately closing it
    const timer = setTimeout(() => {
      document.addEventListener('click', handleDocumentClick);
    }, 0);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isOpen, closeOnBackdropClick, targetElement, onClose]);
  
  if (!isOpen || !mounted) return null;

  const modalContent = (
    // Outer wrapper - covers entire viewport for visual backdrop only
    // pointer-events: none allows clicks to pass through to elements below (like the target element)
    // Outside click detection is handled by document listener in useEffect
    <div
      className="fixed inset-0 z-[9998]"
      style={{
        ...(backdropOpacity > 0 ? { backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})` } : {}),
        pointerEvents: 'none',
      }}
    >
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed z-[9999] bg-gradient-to-b from-gray-900 to-gray-950 rounded-xl shadow-2xl border border-white/20 overflow-hidden"
        style={{
          // Use smart positioning if we have a target element, otherwise center
          top: initialPosition ? `${initialPosition.top}px` : '50%',
          left: initialPosition ? `${initialPosition.left}px` : '50%',
          transform: initialPosition ? 'translate(0, 0)' : 'translate(-50%, -50%)',
          width: `${modalWidth}px`,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto', // Re-enable pointer events for the modal itself
        }}
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
      >
        {/* Header - Draggable */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 border-b border-white/10 ${isDraggingRef.current ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
            )}
            <h2 className="text-sm font-medium text-white truncate">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0 ml-2"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          {children}
        </div>
        
        {/* Footer */}
        {(footer || showDoneButton || showCancelButton) && (
          <div className="flex items-center justify-end px-4 py-2.5 border-t border-white/10 bg-black/20 gap-2">
            {footer}
            {showCancelButton && (
              <button
                onClick={onCancel || onClose}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
              >
                {cancelButtonText}
              </button>
            )}
            {showDoneButton && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg shadow-lg shadow-indigo-500/25 transition-all"
              >
                {doneButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
}
