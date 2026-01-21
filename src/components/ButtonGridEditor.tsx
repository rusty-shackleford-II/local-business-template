/**
 * ButtonGridEditor.tsx
 * 
 * A drag-and-drop grid editor for hero CTA buttons.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * COORDINATE SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Each button has integer coordinates (col, row):
 *   - col: horizontal position (0 = leftmost after normalization)
 *   - row: vertical position (0 = topmost after normalization)
 * 
 * Example with 6 buttons in a 3×2 grid:
 * 
 *       [1] [2] [3]     row 0
 *       [4] [5] [6]     row 1
 *        ↑   ↑   ↑
 *       c0  c1  c2
 * 
 * Coordinates: 1=(0,0), 2=(1,0), 3=(2,0), 4=(0,1), 5=(1,1), 6=(2,1)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * DRAG & DROP BEHAVIOR
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * When dragging a button:
 *   1. Drop zones appear as ACTUAL GRID CELLS in all valid adjacent positions
 *   2. The grid expands dynamically to show drop zones outside current bounds
 *   3. Drag the button TO the cell where you want it to land
 *   4. Release to drop the button at that position
 * 
 * Drop positions are calculated by checking all 4 directions (left, right, 
 * above, below) from each existing button. Only empty positions are shown.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * NORMALIZATION & GAP COMPRESSION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * After any change, coordinates are normalized:
 *   1. Shift so leftmost col = 0 and topmost row = 0
 *   2. Compress gaps (remove empty rows and columns)
 * 
 * Example: Drag button 3 to left of button 1:
 * 
 *   Before: [1][2][3]  →  3 moves to (-1,0)
 *   After:  [3][1][2]  →  normalized and gap-compressed
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * RENDERING
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * - CSS Grid with dynamic size based on buttons + drop zones
 * - Drop zones render as dashed cells that highlight on hover
 * - Dragged button shows as semi-transparent with floating preview
 * - Grid is centered horizontally
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import type { HeroCtaButton, ButtonGridLayout, ButtonGridPosition, ColorPalette, ButtonStyles } from '../types';
import EditableText from './EditableText';
import ButtonStyleEditor from './ButtonStyleEditor';
import SingleButtonEditor from './SingleButtonEditor';

// ============================================================================
// TYPES
// ============================================================================

type DropDirection = 'above' | 'below' | 'left' | 'right' | 'swap';

type DropTarget = {
  targetButtonId: string;
  direction: DropDirection;
};

// ============================================================================
// GRID UTILITIES
// ============================================================================

/**
 * Normalize positions:
 * 1. Shift so minCol=0 and minRow=0
 * 2. Compress gaps (remove empty rows/columns)
 */
function normalizePositions(positions: ButtonGridPosition[]): ButtonGridPosition[] {
  if (positions.length === 0) return [];
  
  // Step 1: Shift to origin
  const minCol = Math.min(...positions.map(p => p.col));
  const minRow = Math.min(...positions.map(p => p.row));
  
  let normalized = positions.map(p => ({
    buttonId: p.buttonId,
    col: p.col - minCol,
    row: p.row - minRow,
  }));
  
  // Step 2: Compress row gaps
  const usedRows = Array.from(new Set(normalized.map(p => p.row))).sort((a, b) => a - b);
  const rowMap = new Map(usedRows.map((oldRow, newRow) => [oldRow, newRow]));
  
  normalized = normalized.map(p => ({
    ...p,
    row: rowMap.get(p.row) ?? p.row,
  }));
  
  // Step 3: Compress column gaps
  const usedCols = Array.from(new Set(normalized.map(p => p.col))).sort((a, b) => a - b);
  const colMap = new Map(usedCols.map((oldCol, newCol) => [oldCol, newCol]));
  
  normalized = normalized.map(p => ({
    ...p,
    col: colMap.get(p.col) ?? p.col,
  }));
  
  return normalized;
}

/**
 * Get grid dimensions from positions
 */
function getGridDimensions(positions: ButtonGridPosition[]): { cols: number; rows: number } {
  if (positions.length === 0) return { cols: 0, rows: 0 };
  const maxCol = Math.max(...positions.map(p => p.col));
  const maxRow = Math.max(...positions.map(p => p.row));
  return { cols: maxCol + 1, rows: maxRow + 1 };
}

/**
 * Calculate drop target coordinate based on direction
 */
function getDropCoordinate(
  targetPos: ButtonGridPosition,
  direction: DropDirection
): { col: number; row: number } {
  switch (direction) {
    case 'left':  return { col: targetPos.col - 1, row: targetPos.row };
    case 'right': return { col: targetPos.col + 1, row: targetPos.row };
    case 'above': return { col: targetPos.col,     row: targetPos.row - 1 };
    case 'below': return { col: targetPos.col,     row: targetPos.row + 1 };
    case 'swap':  return { col: targetPos.col,     row: targetPos.row }; // Same position (swap)
  }
}


/**
 * Create default layout for buttons (single row or grid based on column count)
 */
function createDefaultLayout(buttons: HeroCtaButton[], columns?: number): ButtonGridLayout {
  const cols = columns || buttons.length;
  return {
    positions: buttons.map((button, index) => ({
      buttonId: button.id,
      col: index % cols,
      row: Math.floor(index / cols),
    })),
  };
}

/**
 * Convert legacy column-based layout to grid layout
 */
export function legacyToGridLayout(buttons: HeroCtaButton[], columns: 1 | 2 | 3 | 4): ButtonGridLayout {
  return createDefaultLayout(buttons, columns);
}

/**
 * Get effective grid layout, falling back to legacy or default
 */
export function getEffectiveGridLayout(
  buttons: HeroCtaButton[],
  gridLayout?: ButtonGridLayout,
  columns?: 1 | 2 | 3 | 4
): ButtonGridLayout {
  // Use existing layout if it matches current buttons
  if (gridLayout && gridLayout.positions.length > 0) {
    const layoutIds = new Set(gridLayout.positions.map(p => p.buttonId));
    const buttonIds = new Set(buttons.map(b => b.id));
    const allButtonsInLayout = buttons.every(b => layoutIds.has(b.id));
    const allLayoutInButtons = gridLayout.positions.every(p => buttonIds.has(p.buttonId));
    
    if (allButtonsInLayout && allLayoutInButtons) {
      return { positions: normalizePositions(gridLayout.positions) };
    }
  }
  
  // Fall back to column-based or default layout
  const cols = columns || Math.min(buttons.length, 4) as 1 | 2 | 3 | 4;
  return createDefaultLayout(buttons, cols);
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

type ButtonGridEditorProps = {
  buttons: HeroCtaButton[];
  gridLayout: ButtonGridLayout;
  onLayoutChange: (layout: ButtonGridLayout) => void;
  onButtonClick?: (button: HeroCtaButton) => void;
  editable?: boolean;
  colorPalette?: ColorPalette;
  defaultCtaBg?: string;
  defaultCtaText?: string;
  getButtonStyles: (button: HeroCtaButton, isHovered: boolean, index: number) => React.CSSProperties;
  ctaButtons?: HeroCtaButton[];
  onEdit?: (path: string, value: any) => void;
  payment?: { addHeroCta?: boolean };
  isFullwidthOverlay?: boolean;
  isMobile?: boolean;
  buttonStyles?: ButtonStyles;
  onButtonStylesChange?: (styles: ButtonStyles) => void;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ButtonGridEditor: React.FC<ButtonGridEditorProps> = ({
  buttons,
  gridLayout,
  onLayoutChange,
  onButtonClick,
  editable = false,
  colorPalette,
  defaultCtaBg,
  defaultCtaText,
  getButtonStyles,
  ctaButtons,
  onEdit,
  payment,
  isFullwidthOverlay = false,
  isMobile = false,
  buttonStyles = {},
  onButtonStylesChange,
}) => {
  // Drag state
  const [draggedButtonId, setDraggedButtonId] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<DropTarget | null>(null);
  const [hoveredButtonId, setHoveredButtonId] = useState<string | null>(null);
  
  // Style editor state (for ALL buttons)
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  
  // Single button editor state (for individual button)
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  
  // Mouse drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  
  // Track recent drag to prevent click from opening modal right after drag
  const recentDragRef = useRef(false);
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // Grid dimensions
  const { cols, rows } = useMemo(() => getGridDimensions(gridLayout.positions), [gridLayout]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // LAYOUT CALCULATION
  // ──────────────────────────────────────────────────────────────────────────
  
  const calculateNewLayout = useCallback((
    draggedId: string,
    target: DropTarget
  ): ButtonGridLayout => {
    // Find target button's position
    const targetPos = gridLayout.positions.find(p => p.buttonId === target.targetButtonId);
    if (!targetPos) return gridLayout;
    
    // Find dragged button's position (for swap)
    const draggedPos = gridLayout.positions.find(p => p.buttonId === draggedId);
    if (!draggedPos) return gridLayout;
    
    let newPositions: ButtonGridPosition[];
    
    if (target.direction === 'swap') {
      // Swap: dragged takes target's position, target takes dragged's position
      newPositions = gridLayout.positions.map(p => {
        if (p.buttonId === draggedId) {
          return { buttonId: p.buttonId, col: targetPos.col, row: targetPos.row };
        }
        if (p.buttonId === target.targetButtonId) {
          return { buttonId: p.buttonId, col: draggedPos.col, row: draggedPos.row };
        }
        return p;
      });
    } else {
      // Calculate new coordinate for dragged button
      const newCoord = getDropCoordinate(targetPos, target.direction);
      
      // Update positions: change dragged button's coordinate
      newPositions = gridLayout.positions.map(p => {
        if (p.buttonId === draggedId) {
          return { buttonId: p.buttonId, col: newCoord.col, row: newCoord.row };
        }
        return p;
      });
    }
    
    // Normalize so minCol=0, minRow=0
    return { positions: normalizePositions(newPositions) };
  }, [gridLayout]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // MOUSE HANDLERS
  // ──────────────────────────────────────────────────────────────────────────
  
  const handleMouseDown = useCallback((e: React.MouseEvent, buttonId: string) => {
    if (!editable || buttons.length <= 1) return;
    if (e.button !== 0) return; // Left click only
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    setDraggedButtonId(buttonId);
    setIsDragging(true);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragPosition({ x: e.clientX, y: e.clientY });
  }, [editable, buttons.length]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggedButtonId) return;
    
    setDragPosition({ x: e.clientX, y: e.clientY });
    
    // Find drop target under cursor
    const dropZones = document.querySelectorAll('[data-drop-zone]');
    let found: DropTarget | null = null;
    
    dropZones.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const targetId = el.getAttribute('data-target-id');
        const direction = el.getAttribute('data-direction') as DropDirection;
        if (targetId && direction && targetId !== draggedButtonId) {
          found = { targetButtonId: targetId, direction };
        }
      }
    });
    
    setActiveDropTarget(found);
  }, [isDragging, draggedButtonId]);
  
  const handleMouseUp = useCallback(() => {
    if (isDragging && draggedButtonId && activeDropTarget) {
      const newLayout = calculateNewLayout(draggedButtonId, activeDropTarget);
      onLayoutChange(newLayout);
    }
    
    // Mark that a drag just ended to prevent click from opening modal
    if (isDragging) {
      recentDragRef.current = true;
      // Clear the flag after a short delay
      setTimeout(() => { recentDragRef.current = false; }, 100);
    }
    
    setIsDragging(false);
    setDraggedButtonId(null);
    setActiveDropTarget(null);
  }, [isDragging, draggedButtonId, activeDropTarget, calculateNewLayout, onLayoutChange]);
  
  // Global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // ──────────────────────────────────────────────────────────────────────────
  // CALCULATE VALID DROP POSITIONS
  // ──────────────────────────────────────────────────────────────────────────
  
  const getValidDropPositions = useCallback((draggedId: string): Array<{
    col: number;
    row: number;
    targetButtonId: string;
    direction: DropDirection;
  }> => {
    const validPositions: Array<{
      col: number;
      row: number;
      targetButtonId: string;
      direction: DropDirection;
    }> = [];
    
    const occupied = new Set(
      gridLayout.positions
        .filter(p => p.buttonId !== draggedId)
        .map(p => `${p.col},${p.row}`)
    );
    
    // For each button (except the dragged one), check adjacent positions
    for (const pos of gridLayout.positions) {
      if (pos.buttonId === draggedId) continue;
      
      const adjacents: Array<{ col: number; row: number; direction: DropDirection }> = [
        { col: pos.col - 1, row: pos.row, direction: 'left' },
        { col: pos.col + 1, row: pos.row, direction: 'right' },
        { col: pos.col, row: pos.row - 1, direction: 'above' },
        { col: pos.col, row: pos.row + 1, direction: 'below' },
      ];
      
      for (const adj of adjacents) {
        const key = `${adj.col},${adj.row}`;
        // Position is valid if not occupied by another button
        if (!occupied.has(key)) {
          // Check if we already have this position
          const exists = validPositions.some(p => p.col === adj.col && p.row === adj.row);
          if (!exists) {
            validPositions.push({
              col: adj.col,
              row: adj.row,
              targetButtonId: pos.buttonId,
              direction: adj.direction,
            });
          }
        }
      }
    }
    
    return validPositions;
  }, [gridLayout]);
  
  // Get drop positions for current drag
  const dropPositions = useMemo(() => {
    if (!draggedButtonId) return [];
    return getValidDropPositions(draggedButtonId);
  }, [draggedButtonId, getValidDropPositions]);

  // ──────────────────────────────────────────────────────────────────────────
  // CALCULATE GRID BOUNDS (including drop zones when dragging)
  // ──────────────────────────────────────────────────────────────────────────

  const gridBounds = useMemo(() => {
    // Start with button positions
    let minCol = 0, maxCol = cols - 1;
    let minRow = 0, maxRow = rows - 1;
    
    // Expand to include drop zone positions when dragging
    if (isDragging && dropPositions.length > 0) {
      for (const dp of dropPositions) {
        minCol = Math.min(minCol, dp.col);
        maxCol = Math.max(maxCol, dp.col);
        minRow = Math.min(minRow, dp.row);
        maxRow = Math.max(maxRow, dp.row);
      }
    }
    
    return {
      minCol,
      maxCol,
      minRow,
      maxRow,
      totalCols: maxCol - minCol + 1,
      totalRows: maxRow - minRow + 1,
      colOffset: -minCol, // How much to offset grid column indices
      rowOffset: -minRow, // How much to offset grid row indices
    };
  }, [cols, rows, isDragging, dropPositions]);

  // ──────────────────────────────────────────────────────────────────────────
  // BUTTON RENDERER
  // ──────────────────────────────────────────────────────────────────────────
  
  // Compute custom button styles - use explicit dimensions so font size doesn't affect button size
  // This matches the sample button in the style editor exactly
  const paddingX = buttonStyles.paddingX ?? 32;
  const paddingY = buttonStyles.paddingY ?? 16;
  const customButtonStyle: React.CSSProperties = useMemo(() => ({
    // Explicit dimensions based on padding (matches sample button in editor)
    // Base text area assumption: ~100px wide, ~20px tall for "Sample Button"
    minWidth: `${paddingX * 2 + 100}px`,
    height: `${paddingY * 2 + 20}px`,
    // No padding - dimensions already account for visual padding space
    padding: 0,
    borderRadius: `${buttonStyles.borderRadius ?? 8}px`,
    fontFamily: buttonStyles.fontFamily || 'inherit',
    fontSize: buttonStyles.fontSize ? `${buttonStyles.fontSize}px` : undefined,
    fontWeight: buttonStyles.fontWeight ?? 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  }), [buttonStyles, paddingX, paddingY]);
  
  // Track mousedown on grid to detect drags vs clicks
  const handleGridMouseDown = useCallback((e: React.MouseEvent) => {
    // Only track if clicking directly on the grid (not on buttons inside)
    if (e.target === e.currentTarget) {
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);
  
  // Handle click on grid background (not on buttons)
  const handleGridBackgroundClick = useCallback((e: React.MouseEvent) => {
    // Don't open if we just finished a drag operation
    if (recentDragRef.current) {
      recentDragRef.current = false;
      mouseDownPosRef.current = null;
      return;
    }
    
    // If mousedown wasn't on this grid (e.g., from parent drag handle), don't open
    if (!mouseDownPosRef.current) {
      return;
    }
    
    // Check if mouse moved significantly since mousedown (indicates drag, not click)
    const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
    const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
    mouseDownPosRef.current = null;
    
    if (dx > 5 || dy > 5) {
      // User dragged, don't open modal
      return;
    }
    
    // Only open style editor if clicking directly on the grid container
    if (e.target === e.currentTarget && editable) {
      setShowStyleEditor(true);
    }
  }, [editable]);
  
  // Track mouse position on button mousedown to detect clicks vs drags
  const buttonMouseDownRef = useRef<{ x: number; y: number; buttonId: string } | null>(null);
  
  // Handle button click (open single button editor) vs drag
  const handleButtonClick = useCallback((e: React.MouseEvent, button: HeroCtaButton) => {
    // If we just finished dragging, ignore
    if (recentDragRef.current) {
      return;
    }
    
    // Check if mouse moved significantly since mousedown (indicates drag, not click)
    if (buttonMouseDownRef.current) {
      const dx = Math.abs(e.clientX - buttonMouseDownRef.current.x);
      const dy = Math.abs(e.clientY - buttonMouseDownRef.current.y);
      
      // If moved more than 5px, treat as drag not click
      if (dx > 5 || dy > 5) {
        buttonMouseDownRef.current = null;
        return;
      }
      
      buttonMouseDownRef.current = null;
    }
    
    // In edit mode, open the single button editor (works for both legacy cta and ctaButtons)
    if (editable && onEdit) {
      e.stopPropagation();
      setEditingButtonId(button.id);
    }
  }, [editable, onEdit]);
  
  // Modified mouse down to track position for click detection
  const handleButtonMouseDown = useCallback((e: React.MouseEvent, buttonId: string) => {
    // Track position for click detection
    buttonMouseDownRef.current = { x: e.clientX, y: e.clientY, buttonId };
    
    // Also handle drag initiation
    handleMouseDown(e, buttonId);
  }, [handleMouseDown]);
  
  const renderButton = (button: HeroCtaButton, col: number, row: number) => {
    const buttonIndex = buttons.findIndex(b => b.id === button.id);
    const isDraggedButton = draggedButtonId === button.id;
    const isSwapTarget = isDragging && !isDraggedButton && 
                         activeDropTarget?.targetButtonId === button.id && 
                         activeDropTarget?.direction === 'swap';
    
    return (
      <div
        key={button.id}
        data-drop-zone={isDragging && !isDraggedButton ? "true" : undefined}
        data-target-id={isDragging && !isDraggedButton ? button.id : undefined}
        data-direction={isDragging && !isDraggedButton ? "swap" : undefined}
        style={{
          gridColumn: col + 1,
          gridRow: row + 1,
          position: 'relative',
          opacity: isDraggedButton ? 0.3 : 1,
        }}
      >
        {/* Swap highlight overlay */}
        {isSwapTarget && (
          <div style={{
            position: 'absolute',
            inset: '-4px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            border: '3px solid #3b82f6',
            borderRadius: '12px',
            zIndex: 5,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
            }}>
              ⇄ Swap
            </span>
          </div>
        )}
        
        {/* Button wrapper for drag handling */}
        <div
          onMouseDown={(e) => handleButtonMouseDown(e, button.id)}
          onClick={(e) => handleButtonClick(e, button)}
          style={{ cursor: editable && buttons.length > 1 ? 'grab' : editable ? 'pointer' : undefined }}
        >
          <button
            onClick={editable ? undefined : () => onButtonClick?.(button)}
            className="w-full group inline-flex items-center justify-center font-semibold rounded-lg transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl button-press"
            style={{
              ...getButtonStyles(button, hoveredButtonId === button.id, buttonIndex),
              ...customButtonStyle,
              cursor: editable ? (buttons.length > 1 ? 'grab' : 'pointer') : 'pointer',
            }}
            onMouseEnter={() => !isDragging && setHoveredButtonId(button.id)}
            onMouseLeave={() => setHoveredButtonId(null)}
          >
            <EditableText
              value={button.label}
              path={ctaButtons ? `hero.ctaButtons.${buttonIndex}.label` : (payment?.addHeroCta ? "payment.heroCtaLabel" : "hero.cta.label")}
              editable={editable}
              onEdit={onEdit}
              placeholder="Button text"
              textSize={button.labelTextSize || 1.0}
              onTextSizeChange={onEdit ? (size: number) => onEdit(ctaButtons ? `hero.ctaButtons.${buttonIndex}.labelTextSize` : (payment?.addHeroCta ? 'payment.heroCtaLabelTextSize' : 'hero.cta.labelTextSize'), size.toString()) : undefined}
              textSizeLabel="CTA Button Text Size"
              style={buttonStyles.fontSize ? { fontSize: `${buttonStyles.fontSize}px` } : undefined}
            />
            {button.showArrow !== false && (
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            )}
          </button>
        </div>
      </div>
    );
  };
  
  // ──────────────────────────────────────────────────────────────────────────
  // DROP ZONE CELL RENDERER
  // ──────────────────────────────────────────────────────────────────────────
  
  const renderDropZone = (dropPos: typeof dropPositions[0], gridCol: number, gridRow: number) => {
    const isActive = activeDropTarget?.targetButtonId === dropPos.targetButtonId && 
                     activeDropTarget?.direction === dropPos.direction;
    
    return (
      <div
        key={`drop-${dropPos.col}-${dropPos.row}`}
        data-drop-zone="true"
        data-target-id={dropPos.targetButtonId}
        data-direction={dropPos.direction}
        style={{
          gridColumn: gridCol + 1,
          gridRow: gridRow + 1,
          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.15)',
          border: isActive ? '2px solid #3b82f6' : '2px dashed rgba(59, 130, 246, 0.4)',
          borderRadius: '8px',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '56px',
          transform: isActive ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {isActive && (
          <span style={{ 
            color: '#3b82f6', 
            fontSize: '24px',
            fontWeight: 'bold',
            opacity: 0.7,
          }}>
            +
          </span>
        )}
      </div>
    );
  };
  
  // ──────────────────────────────────────────────────────────────────────────
  // FLOATING DRAG PREVIEW
  // ──────────────────────────────────────────────────────────────────────────
  
  const draggedButton = draggedButtonId ? buttons.find(b => b.id === draggedButtonId) : null;
  const draggedButtonIndex = draggedButton ? buttons.findIndex(b => b.id === draggedButton.id) : -1;
  
  const DragPreview = () => {
    if (!isDragging || !draggedButton) return null;
    
    return (
      <div
        style={{
          position: 'fixed',
          left: dragPosition.x - dragOffset.x,
          top: dragPosition.y - dragOffset.y,
          zIndex: 9999,
          pointerEvents: 'none',
          opacity: 0.9,
          transform: 'scale(1.02)',
          filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))',
        }}
      >
        <button
          className="inline-flex items-center justify-center font-semibold rounded-lg"
          style={{
            ...getButtonStyles(draggedButton, false, draggedButtonIndex),
            ...customButtonStyle,
          }}
        >
          {draggedButton.label}
          {draggedButton.showArrow !== false && <ArrowRightIcon className="ml-2 h-5 w-5" />}
        </button>
      </div>
    );
  };
  
  // ──────────────────────────────────────────────────────────────────────────
  // MOBILE LAYOUT (single column, no drag)
  // ──────────────────────────────────────────────────────────────────────────
  
  if (isMobile) {
    // Mobile-specific button sizing
    // For fullwidth overlay, buttons need to be wider and more prominent
    const mobileButtonPadding = isFullwidthOverlay 
      ? { paddingTop: '14px', paddingBottom: '14px', paddingLeft: '24px', paddingRight: '24px' }
      : { paddingTop: '12px', paddingBottom: '12px', paddingLeft: '20px', paddingRight: '20px' };
    
    const mobileFontSize = isFullwidthOverlay
      ? (buttonStyles.fontSize ? `${buttonStyles.fontSize}px` : '16px')
      : (buttonStyles.fontSize ? `${Math.max(14, buttonStyles.fontSize * 0.9)}px` : '14px');
    
    return (
      <div className={`relative ${isFullwidthOverlay ? 'w-full px-4' : ''}`}>
        <div className={`flex flex-col gap-3 ${isFullwidthOverlay ? 'w-full' : 'w-full'}`}>
          {buttons.map((button, index) => (
            <div
              key={button.id}
              onClick={(e) => {
                if (editable && onEdit) {
                  e.stopPropagation();
                  setEditingButtonId(button.id);
                }
              }}
            >
              <button
                onClick={editable ? undefined : () => onButtonClick?.(button)}
                className="w-full group inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl button-press"
                style={{
                  ...getButtonStyles(button, hoveredButtonId === button.id, index),
                  ...customButtonStyle,
                  ...mobileButtonPadding,
                  fontSize: mobileFontSize,
                  cursor: editable ? 'pointer' : 'pointer',
                }}
                onMouseEnter={() => setHoveredButtonId(button.id)}
                onMouseLeave={() => setHoveredButtonId(null)}
              >
                <EditableText
                  value={button.label}
                  path={ctaButtons ? `hero.ctaButtons.${index}.label` : (payment?.addHeroCta ? "payment.heroCtaLabel" : "hero.cta.label")}
                  editable={editable}
                  onEdit={onEdit}
                  placeholder="Button text"
                  textSize={button.labelTextSize || 1.0}
                  onTextSizeChange={onEdit ? (size: number) => onEdit(ctaButtons ? `hero.ctaButtons.${index}.labelTextSize` : (payment?.addHeroCta ? 'payment.heroCtaLabelTextSize' : 'hero.cta.labelTextSize'), size.toString()) : undefined}
                  textSizeLabel="CTA Button Text Size"
                  style={{ fontSize: mobileFontSize }}
                />
                {button.showArrow !== false && (
                  <ArrowRightIcon className="ml-2 h-5 w-5 flex-shrink-0" />
                )}
              </button>
            </div>
          ))}
        </div>
        
        {/* Editor hint and Add Button for mobile */}
        {editable && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400 text-center select-none">
              Tap a button to edit it
            </p>
            {onEdit && buttons.length < 6 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newButton: HeroCtaButton = {
                    id: `btn-${Date.now()}`,
                    label: 'New Button',
                    actionType: 'contact',
                    variant: buttons.length === 0 ? 'primary' : 'secondary',
                    showArrow: buttons.length === 0,
                  };
                  
                  if (ctaButtons && ctaButtons.length > 0) {
                    onEdit('hero.ctaButtons', [...ctaButtons, newButton]);
                  } else {
                    const existingButtons = buttons.map((b) => ({
                      ...b,
                      id: b.id === 'legacy-cta' ? `btn-migrated-${Date.now()}` : b.id,
                    }));
                    onEdit('hero.ctaButtons', [...existingButtons, newButton]);
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Button
              </button>
            )}
          </div>
        )}
        
        {/* Single Button Editor Modal (for mobile) */}
        {editingButtonId && editable && onEdit && (() => {
          const editingButton = buttons.find(b => b.id === editingButtonId);
          const editingButtonIndex = buttons.findIndex(b => b.id === editingButtonId);
          if (!editingButton || editingButtonIndex < 0) return null;
          
          const isLegacyButton = editingButton.id === 'legacy-cta' && (!ctaButtons || ctaButtons.length === 0);
          
          return (
            <SingleButtonEditor
              button={editingButton}
              buttonIndex={editingButtonIndex}
              onClose={() => setEditingButtonId(null)}
              onEdit={onEdit}
              defaultCtaBg={defaultCtaBg}
              defaultCtaText={defaultCtaText}
              colorPalette={colorPalette}
              buttonStyles={buttonStyles}
              isLegacyButton={isLegacyButton}
              allButtons={buttons}
            />
          );
        })()}
      </div>
    );
  }
  
  // ──────────────────────────────────────────────────────────────────────────
  // DESKTOP GRID LAYOUT
  // ──────────────────────────────────────────────────────────────────────────
  
  return (
    <div className="relative">
      {/* CSS Grid container - centered, clickable background for style editor */}
      <div
        className="grid gap-4 mx-auto p-4 -m-4 rounded-lg"
        onMouseDown={handleGridMouseDown}
        onClick={handleGridBackgroundClick}
        style={{
          gridTemplateColumns: `repeat(${gridBounds.totalCols}, minmax(auto, 1fr))`,
          gridTemplateRows: `repeat(${gridBounds.totalRows}, auto)`,
          justifyContent: 'center',
          width: 'fit-content',
          minWidth: gridBounds.totalCols === 1 ? '180px' : gridBounds.totalCols === 2 ? '360px' : gridBounds.totalCols === 3 ? '540px' : '720px',
          transition: isDragging ? 'none' : 'all 0.2s ease',
          cursor: editable && !isDragging ? 'pointer' : undefined,
          backgroundColor: editable && !isDragging ? 'rgba(59, 130, 246, 0.05)' : undefined,
          border: editable && !isDragging ? '1px dashed rgba(59, 130, 246, 0.2)' : undefined,
        }}
      >
        {/* Render drop zones first (behind buttons) */}
        {isDragging && dropPositions.map(dp => 
          renderDropZone(dp, dp.col + gridBounds.colOffset, dp.row + gridBounds.rowOffset)
        )}
        
        {/* Render buttons */}
        {gridLayout.positions.map(pos => {
          const button = buttons.find(b => b.id === pos.buttonId);
          if (!button) return null;
          return renderButton(button, pos.col + gridBounds.colOffset, pos.row + gridBounds.rowOffset);
        })}
      </div>
      
      {/* Floating drag preview */}
      <DragPreview />
      
      {/* Editor hint and Add Button */}
      {editable && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <p className="text-xs text-gray-400 text-center select-none">
            {buttons.length > 1 ? 'Drag buttons to rearrange • ' : ''}Click a button to edit it • Click empty area for global style
          </p>
          {onEdit && buttons.length < 6 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Create a new button and add to array
                const newButton: HeroCtaButton = {
                  id: `btn-${Date.now()}`,
                  label: 'New Button',
                  actionType: 'contact',
                  variant: buttons.length === 0 ? 'primary' : 'secondary',
                  showArrow: buttons.length === 0,
                };
                
                if (ctaButtons && ctaButtons.length > 0) {
                  // Add to existing ctaButtons array
                  onEdit('hero.ctaButtons', [...ctaButtons, newButton]);
                } else {
                  // Migrate from legacy + add new button
                  const existingButtons = buttons.map((b, i) => ({
                    ...b,
                    id: b.id === 'legacy-cta' ? `btn-migrated-${Date.now()}` : b.id,
                  }));
                  onEdit('hero.ctaButtons', [...existingButtons, newButton]);
                }
              }}
              className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/30 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Button
            </button>
          )}
        </div>
      )}
      
      {/* Button Style Editor Modal (edits ALL buttons) */}
      {showStyleEditor && editable && (
        <ButtonStyleEditor
          styles={buttonStyles}
          onChange={(newStyles) => onButtonStylesChange?.(newStyles)}
          onClose={() => setShowStyleEditor(false)}
          backgroundColor={defaultCtaBg || '#3b82f6'}
          textColor={defaultCtaText || '#ffffff'}
          onBackgroundColorChange={(color) => onEdit?.('hero.colors.ctaBackground', color)}
          onTextColorChange={(color) => onEdit?.('hero.colors.ctaText', color)}
          colorPalette={colorPalette}
        />
      )}
      
      {/* Single Button Editor Modal (edits one button) */}
      {editingButtonId && editable && onEdit && (() => {
        const editingButton = buttons.find(b => b.id === editingButtonId);
        const editingButtonIndex = buttons.findIndex(b => b.id === editingButtonId);
        if (!editingButton || editingButtonIndex < 0) return null;
        
        // Determine if this is a legacy button (uses hero.cta) or new format (uses hero.ctaButtons)
        // Legacy buttons have id 'legacy-cta' and ctaButtons array is empty/undefined
        const isLegacyButton = editingButton.id === 'legacy-cta' && (!ctaButtons || ctaButtons.length === 0);
        
        return (
          <SingleButtonEditor
            button={editingButton}
            buttonIndex={editingButtonIndex}
            onClose={() => setEditingButtonId(null)}
            onEdit={onEdit}
            defaultCtaBg={defaultCtaBg}
            defaultCtaText={defaultCtaText}
            colorPalette={colorPalette}
            buttonStyles={buttonStyles}
            isLegacyButton={isLegacyButton}
            allButtons={buttons}
          />
        );
      })()}
    </div>
  );
};

export default ButtonGridEditor;
