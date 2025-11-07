"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TextSizePopup from "./TextSizePopup";

// Utility function to decode common HTML entities that might appear in text content
const decodeHtmlEntities = (text: string): string => {
  const entityMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };
  
  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entityMap[entity] || entity);
};

type EditableTextProps = {
  value?: string | number | null;
  onChange?: (next: string) => void;
  className?: string;
  placeholder?: string;
  as?: keyof React.JSX.IntrinsicElements;
  multiline?: boolean;
  editable?: boolean;
  // Path-based editing support
  path?: string;
  onEdit?: (path: string, value: string) => void;
  // Custom onBlur handler
  onBlur?: () => void;
  // Text size support - ALL editable text gets this
  textSize?: number;
  onTextSizeChange?: (size: number) => void;
  textSizeLabel?: string; // Custom label for the popup
  // Text size popup configuration
  textSizePresets?: number[];
  textSizeNormal?: number;
  textSizeMin?: number;
  textSizeMax?: number;
  // Color picker support
  textColor?: string;
  onTextColorChange?: (color: string) => void;
  showColorPicker?: boolean;
  presetColors?: string[];
  // Bold toggle support
  textBold?: boolean;
  onTextBoldChange?: (bold: boolean) => void;
  showBoldToggle?: boolean;
  // Alignment toggle support
  textAlign?: 'left' | 'center' | 'right';
  onTextAlignChange?: (align: 'left' | 'center' | 'right') => void;
  showAlignmentToggle?: boolean;
  // Standard HTML attributes
  style?: React.CSSProperties;
  id?: string;
  'data-testid'?: string;
  // Anchor-specific props (when as="a")
  href?: string;
  target?: string;
  rel?: string;
};

/**
 * Minimal content-editable text wrapper for in-place editing.
 * - Shows subtle outline on hover/focus when editable
 * - Emits onChange on blur or Enter (when not multiline)
 */
export default function EditableText({
  value,
  onChange,
  className,
  placeholder,
  as = "span",
  multiline = false,
  editable = false,
  path,
  onEdit,
  onBlur,
  textSize = 1.0,
  onTextSizeChange,
  textSizeLabel,
  textSizePresets,
  textSizeNormal,
  textSizeMin,
  textSizeMax,
  textColor,
  onTextColorChange,
  showColorPicker = false,
  presetColors,
  textBold = false,
  onTextBoldChange,
  showBoldToggle = false,
  textAlign = 'center',
  onTextAlignChange,
  showAlignmentToggle = false,
  style,
  id,
  'data-testid': dataTestId,
  href,
  target,
  rel,
}: EditableTextProps) {
  const Tag: any = as;
  const [internal, setInternal] = useState<string>(
    value === undefined || value === null ? "" : decodeHtmlEntities(String(value))
  );
  const [showPopup, setShowPopup] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  // Popup manages its own outside-click; we avoid double-handling here
  const isEditingRef = useRef(false);
  const suppressBlurCommitRef = useRef(false);
  const DEBUG = false;
  const isMenuPath = useMemo(() => typeof path === 'string' && path.startsWith('menu.'), [path]);

  useEffect(() => {
    const next = value === undefined || value === null ? "" : decodeHtmlEntities(String(value));
    // Only update internal state if we're not actively editing to prevent cursor jumps
    if (next !== internal && !isEditingRef.current) {
      setInternal(next);
    }
  }, [value, internal]);

  // Intentionally no outside-click handler here; TextSizePopup handles its own

  const onCommit = useCallback(() => {
    if (suppressBlurCommitRef.current) {
      // Defer commit while popup is being interacted with
      return;
    }
    
    let text = "";
    if (multiline && ref.current) {
      // For multiline text, preserve line breaks by converting HTML structure to plain text with \n
      // ContentEditable creates <br> tags and/or <div> elements for line breaks
      const clonedNode = ref.current.cloneNode(true) as HTMLElement;
      
      // Replace <br> tags with newlines
      clonedNode.querySelectorAll('br').forEach(br => {
        br.replaceWith('\n');
      });
      
      // Replace <div> elements with newlines (contentEditable sometimes uses divs for paragraphs)
      clonedNode.querySelectorAll('div').forEach((div, index) => {
        if (index > 0) {
          div.prepend('\n');
        }
        const textNode = document.createTextNode(div.textContent || '');
        div.replaceWith(textNode);
      });
      
      text = (clonedNode.textContent ?? "").trim();
    } else {
      text = (ref.current?.textContent ?? "").trim();
    }
    
    // Use path-based editing if available, otherwise fall back to onChange
    if (path && onEdit) {
      onEdit(path, text);
    } else if (onChange) {
      onChange(text);
    }
  }, [onChange, onEdit, path, multiline]);

  // Use MutationObserver for live updates to avoid cursor position issues
  useEffect(() => {
    if (!ref.current || !editable) return;
    
    const observer = new MutationObserver(() => {
      if (!isEditingRef.current) return;
      if (isMenuPath) {
        // For menu.* fields, avoid live updates; commit on blur to prevent re-renders while typing
        if (DEBUG) {
          // eslint-disable-next-line no-console
          console.log('[MenuDebug EditableText] mutation skipped live update', { path });
        }
        return;
      }
      
      let text = "";
      if (multiline && ref.current) {
        // For multiline text, preserve line breaks
        const clonedNode = ref.current.cloneNode(true) as HTMLElement;
        
        // Replace <br> tags with newlines
        clonedNode.querySelectorAll('br').forEach(br => {
          br.replaceWith('\n');
        });
        
        // Replace <div> elements with newlines
        clonedNode.querySelectorAll('div').forEach((div, index) => {
          if (index > 0) {
            div.prepend('\n');
          }
          const textNode = document.createTextNode(div.textContent || '');
          div.replaceWith(textNode);
        });
        
        text = clonedNode.textContent ?? "";
      } else {
        text = ref.current?.textContent ?? "";
      }
      
      // Send live updates without updating React state to avoid re-renders
      if (path && onEdit) {
        onEdit(path, text);
      } else if (onChange) {
        onChange(text);
      }
    });
    
    observer.observe(ref.current, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    return () => observer.disconnect();
  }, [editable, path, onEdit, onChange, multiline]);

  const handleFocus = useCallback(() => {
    isEditingRef.current = true;
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[MenuDebug EditableText] onFocus', { path });
    }
  }, []);

  const handleBlur = useCallback(() => {
    isEditingRef.current = false;
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[MenuDebug EditableText] onBlur', { path });
    }
    onCommit();
    // Call custom onBlur handler if provided
    if (onBlur) {
      onBlur();
    }
  }, [onCommit, onBlur]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (editable && onTextSizeChange) {
        e.stopPropagation();
        setShowPopup(true);
      }
    },
    [editable, onTextSizeChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!editable) return;
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as any).blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        // Revert on escape
        if (ref.current) ref.current.textContent = internal;
        (e.currentTarget as any).blur();
        // Close popup if open
        if (showPopup) setShowPopup(false);
      }
    },
    [editable, multiline, internal, showPopup]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!editable) return;
      
      // Prevent default paste behavior
      e.preventDefault();
      
      // Get plain text from clipboard, stripping all formatting
      let text = e.clipboardData.getData('text/plain');
      
      // If no plain text, try to get HTML and strip tags
      if (!text) {
        const html = e.clipboardData.getData('text/html');
        if (html) {
          // Create a temporary element to strip HTML tags
          const temp = document.createElement('div');
          temp.innerHTML = html;
          text = temp.textContent || temp.innerText || '';
        }
      }
      
      // Clean up the text (remove extra whitespace, line breaks for single line)
      if (!multiline) {
        text = text.replace(/\s+/g, ' ').trim();
      }
      
      // Insert plain text without formatting
      if (document.execCommand) {
        // For older browsers
        document.execCommand('insertText', false, text);
      } else {
        // For modern browsers
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          
          // Move cursor to end of inserted text
          range.setStartAfter(range.endContainer);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      
      // Trigger change event to update the component state
      setTimeout(() => {
        if (ref.current) {
          let cleanText = "";
          if (multiline) {
            // For multiline text, preserve line breaks
            const clonedNode = ref.current.cloneNode(true) as HTMLElement;
            
            // Replace <br> tags with newlines
            clonedNode.querySelectorAll('br').forEach(br => {
              br.replaceWith('\n');
            });
            
            // Replace <div> elements with newlines
            clonedNode.querySelectorAll('div').forEach((div, index) => {
              if (index > 0) {
                div.prepend('\n');
              }
              const textNode = document.createTextNode(div.textContent || '');
              div.replaceWith(textNode);
            });
            
            cleanText = clonedNode.textContent || '';
          } else {
            cleanText = ref.current.textContent || '';
          }
          
          if (path && onEdit) {
            onEdit(path, cleanText);
          } else if (onChange) {
            onChange(cleanText);
          }
        }
      }, 0);
    },
    [editable, multiline, path, onEdit, onChange]
  );

  const handleTextSizeChange = useCallback(
    (newSize: number) => {
      if (onTextSizeChange) {
        onTextSizeChange(newSize);
      }
    },
    [onTextSizeChange]
  );

  const baseClass = useMemo(() => {
    const classes = [className || ""];
    if (editable) {
      classes.push(
        "editable-text", // Marker class for drag handler detection
        "relative outline-none ring-0 focus:ring-2 focus:ring-blue-400/50 cursor-text",
        "hover:outline hover:outline-1 hover:outline-dashed hover:outline-blue-400/60"
      );
    }
    return classes.filter(Boolean).join(" ");
  }, [className, editable]);

  // Extract font-weight from className to preserve it in contentEditable
  const preserveFontWeight = useMemo(() => {
    if (!className || !editable) return {};
    
    // Check if className contains font-weight classes
    if (className.includes('font-bold')) {
      return { fontWeight: 'bold' };
    } else if (className.includes('font-semibold')) {
      return { fontWeight: '600' };
    } else if (className.includes('font-medium')) {
      return { fontWeight: '500' };
    } else if (className.includes('font-light')) {
      return { fontWeight: '300' };
    } else if (className.includes('font-thin')) {
      return { fontWeight: '100' };
    }
    return {};
  }, [className, editable]);

  // Calculate responsive font size for hero headlines and business name
  const isHeroHeadline = path === 'hero.headline';
  const isHeroSubheadline = path === 'hero.subheadline';
  const isBusinessName = path === 'businessInfo.businessName';
  const responsiveFontSize = useMemo(() => {
    if (isHeroHeadline) {
      // For hero headlines, cap mobile size at 2.25rem (36px) regardless of desktop size
      const mobileSize = Math.min(textSize, 2.25);
      return {
        fontSize: `${mobileSize}rem`, // Mobile size (capped)
        // Use CSS custom properties for responsive sizing
        '--desktop-font-size': `${textSize}rem`,
      };
    }
    if (isHeroSubheadline) {
      // For hero subheadlines, cap mobile size at 1.125rem (18px) regardless of desktop size
      const mobileSize = Math.min(textSize, 1.125);
      return {
        fontSize: `${mobileSize}rem`, // Mobile size (capped)
        // Use CSS custom properties for responsive sizing
        '--desktop-font-size': `${textSize}rem`,
      };
    }
    if (isBusinessName) {
      // For business name in header, cap mobile size at 1.125rem (18px) regardless of desktop size
      const mobileSize = Math.min(textSize, 1.125);
      return {
        fontSize: `${mobileSize}rem`, // Mobile size (capped)
        // Use CSS custom properties for responsive sizing
        '--desktop-font-size': `${textSize}rem`,
      };
    }
    return {
      fontSize: `${textSize}rem`, // Normal behavior for other text
    };
  }, [textSize, isHeroHeadline, isHeroSubheadline, isBusinessName]);

  // Build DOM props explicitly - only include standard HTML attributes
  const domProps: any = {
    ref: ref as any,
    className: baseClass,
    style: {
      ...responsiveFontSize,
      transition: 'font-size 0.2s ease-out', // Smooth size transitions
      ...preserveFontWeight, // Preserve font-weight for contentEditable
      ...style, // Style prop takes precedence over everything
    },
    id,
    'data-testid': dataTestId,
    'data-placeholder': placeholder || "Click to edit",
  };

  // Add anchor-specific props if using as="a"
  if (as === "a") {
    if (href) domProps.href = href;
    if (target) domProps.target = target;
    if (rel) domProps.rel = rel;
  }

  if (!editable) {
    // For multiline text, convert newlines to <br /> tags
    if (multiline && internal) {
      const parts = internal.split('\n');
      return (
        <Tag {...domProps}>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 && <br />}
            </React.Fragment>
          ))}
        </Tag>
      );
    }
    return <Tag {...domProps}>{internal || placeholder || null}</Tag>;
  }

  // For editable multiline text, convert newlines to <br /> tags for display
  const editableContent = multiline && internal ? (
    internal.split('\n').map((part, index, array) => (
      <React.Fragment key={index}>
        {part}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ))
  ) : (
    internal || placeholder || ""
  );

  const editableElement = (
    <Tag
      {...domProps}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Editable text"
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      onPaste={handlePaste}
    >
      {editableContent}
    </Tag>
  );

  // If editable and has text size controls, render popup alongside element
  if (editable && onTextSizeChange) {
    return (
      <>
        {editableElement}
        
        <TextSizePopup
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
          textSize={textSize}
          onTextSizeChange={onTextSizeChange}
          targetElement={ref.current}
          label={textSizeLabel || "Text Size"}
          presetSizes={textSizePresets}
          normalSize={textSizeNormal}
          minSize={textSizeMin}
          maxSize={textSizeMax}
          textColor={textColor}
          onTextColorChange={onTextColorChange}
          showColorPicker={showColorPicker}
          presetColors={presetColors}
          textBold={textBold}
          onTextBoldChange={onTextBoldChange}
          showBoldToggle={showBoldToggle}
          textAlign={textAlign}
          onTextAlignChange={onTextAlignChange}
          showAlignmentToggle={showAlignmentToggle}
          onInteractStart={() => { suppressBlurCommitRef.current = true; }}
          onInteractEnd={() => { suppressBlurCommitRef.current = false; }}
        />
      </>
    );
  }

  // Otherwise, return just the editable element
  return editableElement;
}