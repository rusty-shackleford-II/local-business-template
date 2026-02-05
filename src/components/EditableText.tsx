"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TextSizePopup from "./TextSizePopup";
import { useI18nContext } from "./I18nProvider";

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
  // Font family support
  fontFamily?: string;
  onFontFamilyChange?: (font: string) => void;
  showFontPicker?: boolean;
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
  fontFamily,
  onFontFamilyChange,
  showFontPicker = false,
  style,
  id,
  'data-testid': dataTestId,
  href,
  target,
  rel,
}: EditableTextProps) {
  const Tag: any = as;
  const i18nContext = useI18nContext();
  const isDefaultLanguage = !i18nContext?.enabled || i18nContext.currentLanguage === i18nContext.defaultLanguage;
  // Only allow editing in the default language to prevent editing translations
  const effectiveEditable = editable && isDefaultLanguage;
  
  const [internal, setInternal] = useState<string>(
    value === undefined || value === null ? "" : decodeHtmlEntities(String(value))
  );
  const [showPopup, setShowPopup] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  // Popup manages its own outside-click; we avoid double-handling here
  const isEditingRef = useRef(false);
  const suppressBlurCommitRef = useRef(false);
  const isMenuPath = useMemo(() => typeof path === 'string' && path.startsWith('menu.'), [path]);

  useEffect(() => {
    const next = value === undefined || value === null ? "" : decodeHtmlEntities(String(value));
    // Only update internal state if we're not actively editing to prevent cursor jumps
    if (!isEditingRef.current) {
      setInternal(next);
    }
  }, [value]);

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
      
      text = (clonedNode.textContent ?? "");
    } else {
      text = (ref.current?.textContent ?? "");
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
    if (!ref.current || !effectiveEditable) return;
    
    const observer = new MutationObserver(() => {
      if (!isEditingRef.current) return;
      if (isMenuPath) {
        // For menu.* fields, avoid live updates; commit on blur to prevent re-renders while typing
        return;
      }
      
      // Skip live updates for multiline text to prevent duplication issues with Enter key
      // Multiline fields will commit their changes on blur instead
      if (multiline) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveEditable, path, onEdit, onChange, multiline]);

  const handleFocus = useCallback(() => {
    isEditingRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBlur = useCallback(() => {
    isEditingRef.current = false;
    
    // Extract the current text from the DOM
    let text = "";
    if (multiline && ref.current) {
      // For multiline text, preserve line breaks by converting HTML structure to plain text with \n
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
      
      text = clonedNode.textContent ?? "";
      
      // Normalize whitespace around newlines:
      // - Remove trailing spaces before newlines
      // - Remove leading spaces after newlines
      // - Collapse multiple consecutive newlines to double newlines max
      text = text
        .replace(/[ \t]+\n/g, '\n')  // Remove trailing spaces before newlines
        .replace(/\n[ \t]+/g, '\n')  // Remove leading spaces after newlines
        .replace(/\n{3,}/g, '\n\n')  // Collapse 3+ newlines to 2
        .trim();  // Remove leading/trailing whitespace from entire text
    } else {
      text = (ref.current?.textContent ?? "").trim();
    }
    
    // Update internal state with the clean text
    setInternal(text);
    
    // Commit the changes to parent
    if (path && onEdit) {
      onEdit(path, text);
    } else if (onChange) {
      onChange(text);
    }
    
    // Normalize the DOM to our clean structure to prevent React reconciliation errors
    if (ref.current && effectiveEditable) {
      if (multiline) {
        ref.current.innerHTML = text.replace(/\n/g, '<br>');
      } else {
        ref.current.textContent = text;
      }
    }
    
    // Call custom onBlur handler if provided
    if (onBlur) {
      onBlur();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, onEdit, onChange, onBlur, multiline, effectiveEditable]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Always stop propagation when editable to prevent parent click handlers from firing
      if (effectiveEditable) {
        e.stopPropagation();
        // Only show popup if we have a text size change handler
        if (onTextSizeChange) {
          setShowPopup(true);
        }
      }
    },
    [effectiveEditable, onTextSizeChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!effectiveEditable) return;
      
      // Handle Enter key
      if (e.key === "Enter") {
        if (!multiline) {
          // Single-line: blur on Enter
          e.preventDefault();
          (e.currentTarget as any).blur();
        }
        // For multiline, let the browser handle Enter naturally
        // We'll normalize whatever structure it creates on blur
      }
      
      if (e.key === "Escape") {
        e.preventDefault();
        // Revert on escape
        if (ref.current) {
          ref.current.innerHTML = internal.replace(/\n/g, '<br>');
        }
        (e.currentTarget as any).blur();
        // Close popup if open
        if (showPopup) setShowPopup(false);
      }
    },
    [effectiveEditable, multiline, internal, showPopup]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!effectiveEditable) return;
      
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
    [effectiveEditable, multiline, path, onEdit, onChange]
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
    if (effectiveEditable) {
      classes.push(
        "editable-text", // Marker class for drag handler detection
        "relative outline-none ring-0 focus:ring-2 focus:ring-blue-400/50 cursor-text",
        "hover:outline hover:outline-1 hover:outline-dashed hover:outline-blue-400/60"
      );
    }
    return classes.filter(Boolean).join(" ");
  }, [className, effectiveEditable]);

  // Extract font-weight from className to preserve it in contentEditable
  const preserveFontWeight = useMemo(() => {
    if (!className || !effectiveEditable) return {};
    
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
  }, [className, effectiveEditable]);

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
      ...(fontFamily ? { fontFamily } : {}), // Apply font family if specified
      ...style, // Style prop takes precedence over everything
    },
    id,
    'data-testid': dataTestId,
    'data-placeholder': placeholder || "Click to edit",
  };
  
  // Generate a unique key to force React to remount when language/edit mode changes
  // This prevents stale innerHTML from editable mode persisting when switching languages
  const elementKey = `${path || 'editable'}-${i18nContext?.currentLanguage || 'default'}-${effectiveEditable ? 'edit' : 'view'}`;

  // Add anchor-specific props if using as="a"
  if (as === "a") {
    if (href) domProps.href = href;
    if (target) domProps.target = target;
    if (rel) domProps.rel = rel;
  }

  const displayValue = useMemo(() => {
    if (!path || !i18nContext?.enabled) {
      return internal;
    }
    if (i18nContext.currentLanguage === i18nContext.defaultLanguage) {
      return internal;
    }
    // Use value prop directly for translation fallback to avoid flash when switching languages
    const fallbackText = value !== undefined && value !== null ? String(value) : internal;
    const translatedText = i18nContext.t(path, fallbackText);
    
    return translatedText;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internal, path, i18nContext, value]);

  // For contentEditable elements, we use ref to control the DOM directly
  // This prevents React reconciliation errors when the browser modifies the DOM structure
  // NOTE: This hook MUST be defined before any conditional returns to comply with Rules of Hooks
  const setInitialContent = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    
    ref.current = el;
    
    // Only set content when not actively editing
    if (!isEditingRef.current) {
      if (multiline) {
        // Use innerHTML for multiline to support <br> tags
        el.innerHTML = internal ? internal.replace(/\n/g, '<br>') : (placeholder || '');
      } else {
        // Use textContent for single-line (cleaner)
        el.textContent = internal || placeholder || '';
      }
    }
  }, [internal, multiline, placeholder]);

  // Ensure content is synced when switching to editable mode or when internal value changes
  // This handles the case where the callback ref doesn't fire on language switch
  useEffect(() => {
    if (!ref.current || !effectiveEditable) return;
    if (!isEditingRef.current) {
      if (multiline) {
        ref.current.innerHTML = internal ? internal.replace(/\n/g, '<br>') : (placeholder || '');
      } else {
        ref.current.textContent = internal || placeholder || '';
      }
    }
  }, [effectiveEditable, internal, multiline, placeholder]);

  if (!effectiveEditable) {
    // For multiline text, convert newlines to <br /> tags
    if (multiline && displayValue) {
      const parts = (displayValue || "").split('\n');
      return (
        <Tag key={elementKey} {...domProps}>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 && <br />}
            </React.Fragment>
          ))}
        </Tag>
      );
    }
    return <Tag key={elementKey} {...domProps}>{displayValue || placeholder || null}</Tag>;
  }

  // For editable elements, don't use React children - control via ref
  // For non-editable elements, use React children for proper rendering
  const editableElement = effectiveEditable ? (
    <Tag
      key={elementKey}
      {...domProps}
      ref={setInitialContent}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Editable text"
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      onPaste={handlePaste}
    />
  ) : (
    // Non-editable: use React children for proper rendering
    <Tag key={elementKey} {...domProps}>
      {multiline && displayValue ? (
        displayValue.split('\n').map((part, index, array) => (
          <React.Fragment key={index}>
            {part}
            {index < array.length - 1 && <br />}
          </React.Fragment>
        ))
      ) : (
        displayValue || placeholder || null
      )}
    </Tag>
  );

  // If editable and has text size controls, render popup alongside element
  if (effectiveEditable && onTextSizeChange) {
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
          fontFamily={fontFamily}
          onFontFamilyChange={onFontFamilyChange}
          showFontPicker={showFontPicker}
          onInteractStart={() => { suppressBlurCommitRef.current = true; }}
          onInteractEnd={() => { suppressBlurCommitRef.current = false; }}
        />
      </>
    );
  }

  // Otherwise, return just the editable element
  return editableElement;
}