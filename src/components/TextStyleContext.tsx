"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const MAX_RECENT_COLORS = 8;
const MAX_RECENT_FONTS = 5;

interface TextStyleContextType {
  // Recently used colors (most recent first)
  recentColors: string[];
  // Recently used fonts (most recent first)
  recentFonts: string[];
  // Add a color to recent list (called when user selects a color)
  addRecentColor: (color: string) => void;
  // Add a font to recent list (called when user selects a font)
  addRecentFont: (font: string) => void;
  // Get color presets with recent colors at top
  getColorPresets: (basePresets?: string[]) => string[];
  // Get font options with recent fonts at top
  getReorderedFonts: (fontOptions: Array<{ value: string; label: string }>) => Array<{ value: string; label: string }>;
}

const TextStyleContext = createContext<TextStyleContextType | null>(null);

export const useTextStyleContext = () => {
  return useContext(TextStyleContext);
};

interface TextStyleProviderProps {
  children: React.ReactNode;
}

export const TextStyleProvider: React.FC<TextStyleProviderProps> = ({ children }) => {
  // State for recently used colors and fonts
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [recentFonts, setRecentFonts] = useState<string[]>([]);

  // Add a color to the recent list
  const addRecentColor = useCallback((color: string) => {
    if (!color) return;
    
    // Normalize color to lowercase for comparison
    const normalizedColor = color.toLowerCase();
    
    setRecentColors(prev => {
      // Remove if already exists
      const filtered = prev.filter(c => c.toLowerCase() !== normalizedColor);
      // Add to front
      const updated = [color, ...filtered];
      // Keep only MAX_RECENT_COLORS
      return updated.slice(0, MAX_RECENT_COLORS);
    });
  }, []);

  // Add a font to the recent list
  const addRecentFont = useCallback((font: string) => {
    if (!font) return;
    
    setRecentFonts(prev => {
      // Remove if already exists
      const filtered = prev.filter(f => f !== font);
      // Add to front
      const updated = [font, ...filtered];
      // Keep only MAX_RECENT_FONTS
      return updated.slice(0, MAX_RECENT_FONTS);
    });
  }, []);

  // Get color presets with recent colors at top
  const getColorPresets = useCallback((basePresets: string[] = []) => {
    // Combine recent colors with base presets, removing duplicates
    const combined = [...recentColors];
    
    basePresets.forEach(color => {
      if (!combined.some(c => c.toLowerCase() === color.toLowerCase())) {
        combined.push(color);
      }
    });
    
    return combined;
  }, [recentColors]);

  // Get font options with recent fonts at top
  const getReorderedFonts = useCallback((fontOptions: Array<{ value: string; label: string }>) => {
    if (recentFonts.length === 0) {
      return fontOptions;
    }
    
    // Separate recent fonts from others
    const recentOptions: Array<{ value: string; label: string }> = [];
    const otherOptions: Array<{ value: string; label: string }> = [];
    
    // First, collect recent fonts in order
    recentFonts.forEach(font => {
      const option = fontOptions.find(opt => opt.value === font);
      if (option && option.value !== '') {
        recentOptions.push(option);
      }
    });
    
    // Then collect other fonts, excluding recent ones and keeping "Default" at top of others
    fontOptions.forEach(option => {
      if (option.value === '') {
        // "Default" option always comes first
        otherOptions.unshift(option);
      } else if (!recentFonts.includes(option.value)) {
        otherOptions.push(option);
      }
    });
    
    // If we have recent fonts, add a separator indicator and combine
    if (recentOptions.length > 0) {
      return [
        ...recentOptions,
        { value: '__separator__', label: '──────────' }, // Visual separator
        ...otherOptions
      ];
    }
    
    return fontOptions;
  }, [recentFonts]);

  const value: TextStyleContextType = useMemo(() => ({
    recentColors,
    recentFonts,
    addRecentColor,
    addRecentFont,
    getColorPresets,
    getReorderedFonts,
  }), [recentColors, recentFonts, addRecentColor, addRecentFont, getColorPresets, getReorderedFonts]);

  return (
    <TextStyleContext.Provider value={value}>
      {children}
    </TextStyleContext.Provider>
  );
};

export default TextStyleContext;
