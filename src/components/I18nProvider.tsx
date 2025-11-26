import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

// RTL languages that need right-to-left text direction
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

// Deep merge utility for combining UI and business translations
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

interface I18nContextType {
  enabled: boolean;
  currentLanguage: string;
  availableLanguages: string[];
  defaultLanguage: string;
  changeLanguage: (lang: string) => void;
  t: (key: string, defaultValue?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const useI18nContext = () => {
  return useContext(I18nContext);
};

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLanguage: string;
  availableLanguages: string[];
  siteData?: any;
  enabled?: boolean;
  persistLanguage?: boolean;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLanguage,
  availableLanguages,
  siteData,
  enabled = true,
  persistLanguage = true
}) => {
  const normalizedLanguages = Array.isArray(availableLanguages) && availableLanguages.length > 0
    ? availableLanguages
    : ['en'];
  const safeDefaultLanguage = normalizedLanguages.includes(defaultLanguage)
    ? defaultLanguage
    : normalizedLanguages[0];
  const inlineTranslations = useMemo(
    () => (siteData?.i18n?.translations || {}) as Record<string, any>,
    [siteData]
  );
  const [currentLanguage, setCurrentLanguage] = useState(safeDefaultLanguage);
  const [translations, setTranslations] = useState<Record<string, any>>(
    inlineTranslations[safeDefaultLanguage] || {}
  );
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const isI18nActive = Boolean(enabled && normalizedLanguages.length > 0);

  // Keep state in sync when default language changes
  useEffect(() => {
    setCurrentLanguage(safeDefaultLanguage);
  }, [safeDefaultLanguage]);

  // Load translations for current language when enabled
  useEffect(() => {
    if (!isI18nActive) {
      setTranslations({});
      return;
    }

    const controller = new AbortController();

    const loadTranslations = async () => {
      try {
        console.log(`🌐 [I18n] Loading translations for: ${currentLanguage}`);
        
        // Load static UI translations (template strings)
        const uiResponse = await fetch(`/locales/${currentLanguage}/ui.json`, {
          signal: controller.signal,
        });
        
        console.log(`🌐 [I18n] UI file fetch status: ${uiResponse.status}`);
        
        const uiTranslations = uiResponse.ok ? await uiResponse.json() : {};
        console.log(`🌐 [I18n] UI translations loaded:`, Object.keys(uiTranslations));
        
        // Get business content translations from inline (site.json)
        const businessTranslations = inlineTranslations[currentLanguage] || {};
        console.log(`🌐 [I18n] Business translations:`, Object.keys(businessTranslations));
        
        // Deep merge: UI translations as base, business translations supplement
        const merged = deepMerge(uiTranslations, businessTranslations);
        
        console.log(`🌐 [I18n] Merged translations:`, merged);
        setTranslations(merged);
        setTranslationsLoaded(true);
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return;
        console.error('❌ [I18n] Error loading translations:', error);
        // Fallback to inline translations only
        setTranslations(inlineTranslations[currentLanguage] || {});
        setTranslationsLoaded(true);
      }
    };

    loadTranslations();

    return () => controller.abort();
  }, [currentLanguage, isI18nActive, inlineTranslations]);

  const changeLanguage = (lang: string) => {
    if (!normalizedLanguages.includes(lang)) return;
    setCurrentLanguage(lang);
    
    // Update HTML dir attribute for RTL support
    if (typeof document !== 'undefined') {
      const isRTL = RTL_LANGUAGES.includes(lang);
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', lang);
    }
    
    // Store preference in localStorage
    if (typeof window !== 'undefined' && persistLanguage) {
      localStorage.setItem('preferredLanguage', lang);
    }
  };

  // Translation function with deep key support
  const t = (key: string, defaultValue?: string): string => {
    // First check inlineTranslations for the current language (synchronous, no flash)
    const inlineForCurrentLang = inlineTranslations[currentLanguage];
    if (inlineForCurrentLang) {
      const keys = key.split('.');
      let value: any = inlineForCurrentLang;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // Not found in inline translations, fall back to translations state
          break;
        }
      }

      if (typeof value === 'string') {
        return value;
      }
    }

    // Fall back to translations state (for file-based translations)
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Only log warnings after translations have loaded to avoid noise on initial render
        if (translationsLoaded) {
          console.warn(`[I18n] No translation found for "${key}", using default:`, defaultValue || 'undefined');
        }
        return defaultValue || key;
      }
    }

    return typeof value === 'string' ? value : defaultValue || key;
  };

  // Set initial HTML dir attribute based on default language
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isRTL = RTL_LANGUAGES.includes(safeDefaultLanguage);
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', safeDefaultLanguage);
    }
  }, [safeDefaultLanguage]);

  // Load saved language preference on mount
  useEffect(() => {
    if (!isI18nActive || !persistLanguage) return;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('preferredLanguage');
      if (saved && normalizedLanguages.includes(saved)) {
        setCurrentLanguage(saved);
        // Update dir attribute for saved language
        const isRTL = RTL_LANGUAGES.includes(saved);
        document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', saved);
      }
    }
  }, [normalizedLanguages, isI18nActive, persistLanguage]);

  const value: I18nContextType = {
    enabled: isI18nActive,
    currentLanguage,
    availableLanguages: normalizedLanguages,
    defaultLanguage: safeDefaultLanguage,
    changeLanguage,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

