import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useI18nContext } from './I18nProvider';
import FlagIcon from './FlagIcon';

// Language name mapping (all in English for clarity)
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  ru: 'Russian',
  hi: 'Hindi',
};

interface LanguageToggleProps {
  navTextColor?: string;
  enableHoverSelection?: boolean;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ navTextColor = '#374151', enableHoverSelection = false }) => {
  const i18nContext = useI18nContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Don't render if i18n is not enabled
  if (!i18nContext || !i18nContext.enabled) {
    return null;
  }

  const { currentLanguage, availableLanguages, changeLanguage } = i18nContext;

  // Only show if there are multiple languages
  if (availableLanguages.length <= 1) {
    return null;
  }

  const openDropdown = () => setIsOpen(true);
  const closeDropdown = () => setIsOpen(false);

  const handleMouseEnterWrapper = () => {
    if (!enableHoverSelection) return;
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    openDropdown();
  };

  const handleMouseLeaveWrapper = () => {
    if (!enableHoverSelection) return;
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(() => {
      closeDropdown();
      hoverTimeoutRef.current = null;
    }, 120);
  };

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
    if (!enableHoverSelection) {
      closeDropdown();
    }
  };

  const currentName = LANGUAGE_NAMES[currentLanguage] || currentLanguage.toUpperCase();

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnterWrapper}
      onMouseLeave={handleMouseLeaveWrapper}
    >
      {/* Language Toggle Button */}
      <button
        onClick={() => {
          if (enableHoverSelection) {
            openDropdown();
            return;
          }
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 p-2 rounded-lg transition-all duration-200 language-toggle-btn"
        style={{ 
          color: navTextColor,
          '--hover-text-color': '#1f2937'
        } as React.CSSProperties & { [key: string]: string }}
        aria-label="Change language"
      >
        <FlagIcon countryCode={currentLanguage} className="w-5 h-5" />
        <span className="font-medium text-sm">{currentLanguage.toUpperCase()}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>
      
      <style jsx>{`
        .language-toggle-btn:hover {
          background-color: rgba(243, 244, 246, 0.95);
          color: var(--hover-text-color) !important;
        }
      `}</style>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {availableLanguages.map((lang) => {
            const name = LANGUAGE_NAMES[lang] || lang.toUpperCase();
            const isActive = lang === currentLanguage;

            return (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                onMouseEnter={() => {
                  if (enableHoverSelection && lang !== currentLanguage) {
                    handleLanguageChange(lang);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 transition text-gray-900 ${
                  isActive ? 'bg-gray-50 font-semibold' : ''
                }`}
              >
                <FlagIcon countryCode={lang} className="w-5 h-5" />
                <span className="text-sm">{name}</span>
                {isActive && (
                  <svg
                    className="ml-auto h-4 w-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageToggle;

