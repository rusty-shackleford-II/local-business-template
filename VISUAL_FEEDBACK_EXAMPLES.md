# Visual Feedback Examples for Translation

## Quick Examples: Show Translation Progress

### Example 1: Simple Loading Toast

```tsx
import { useAutoTranslateWithState } from '../hooks/useAutoTranslateWithState';

export default function Editor({ site, onEdit }) {
  const {
    handleEdit,
    isTranslating,
    translatingField,
  } = useAutoTranslateWithState({
    siteData: site,
    onEdit,
  });

  return (
    <>
      {/* Fixed position indicator */}
      {isTranslating && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-in">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            />
          </svg>
          <div>
            <div className="font-semibold">Translating...</div>
            <div className="text-xs opacity-90">
              {translatingField?.split('.').pop()}
            </div>
          </div>
        </div>
      )}

      <YourComponent onEdit={handleEdit} />
    </>
  );
}
```

### Example 2: Progress Bar

```tsx
import { useAutoTranslateWithState } from '../hooks/useAutoTranslateWithState';
import { useI18nContext } from '../components/I18nProvider';

export default function Editor({ site, onEdit }) {
  const i18nContext = useI18nContext();
  const languageCount = i18nContext?.availableLanguages?.length || 1;
  
  const {
    handleEdit,
    isTranslating,
  } = useAutoTranslateWithState({
    siteData: site,
    onEdit,
  });

  return (
    <>
      {/* Progress bar at top */}
      {isTranslating && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
          <div className="h-full bg-blue-500 animate-progress" />
        </div>
      )}

      <YourComponent onEdit={handleEdit} />
      
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out;
        }
      `}</style>
    </>
  );
}
```

### Example 3: Badge on Edited Field

```tsx
import { useAutoTranslateWithState } from '../hooks/useAutoTranslateWithState';
import EditableText from './EditableText';

export function EditableWithBadge({ path, value, ...props }: any) {
  const { translatingField } = useAutoTranslateWithState();
  const isThisFieldTranslating = translatingField === path;

  return (
    <div className="relative inline-block">
      <EditableText
        path={path}
        value={value}
        {...props}
      />
      
      {isThisFieldTranslating && (
        <span className="absolute -top-2 -right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full animate-pulse">
          Translating...
        </span>
      )}
    </div>
  );
}
```

### Example 4: Status Bar in Editor Header

```tsx
import { useAutoTranslateWithState } from '../hooks/useAutoTranslateWithState';
import { useI18nContext } from '../components/I18nProvider';

export function EditorHeader({ site, onEdit }: any) {
  const i18nContext = useI18nContext();
  const {
    handleEdit,
    isTranslating,
    translatingField,
    translationHistory,
  } = useAutoTranslateWithState({
    siteData: site,
    onEdit,
  });

  const successCount = translationHistory.filter(t => t.success).length;
  const errorCount = translationHistory.filter(t => !t.success).length;

  return (
    <div className="border-b bg-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Site Editor</h1>
        
        {/* Translation Status */}
        <div className="flex items-center gap-2 text-sm">
          {isTranslating ? (
            <>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-blue-600 font-medium">
                Translating {translatingField?.split('.').pop()}...
              </span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="text-gray-600">
                Ready ({successCount} translations)
              </span>
            </>
          )}
        </div>

        {/* Language Count */}
        {i18nContext?.enabled && (
          <div className="text-sm text-gray-500">
            {i18nContext.availableLanguages.length} languages
          </div>
        )}
      </div>

      {/* Error indicator */}
      {errorCount > 0 && (
        <div className="text-sm text-red-600">
          {errorCount} translation errors
        </div>
      )}
    </div>
  );
}
```

### Example 5: Modal/Overlay During Translation

```tsx
import { useAutoTranslateWithState } from '../hooks/useAutoTranslateWithState';

export default function Editor({ site, onEdit }) {
  const {
    handleEdit,
    isTranslating,
    translatingField,
  } = useAutoTranslateWithState({
    siteData: site,
    onEdit,
  });

  return (
    <>
      {/* Semi-transparent overlay */}
      {isTranslating && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 shadow-xl flex items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4" 
                fill="none" 
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
              />
            </svg>
            <div>
              <div className="font-semibold text-lg">Translating...</div>
              <div className="text-sm text-gray-600">
                Updating all language versions
              </div>
            </div>
          </div>
        </div>
      )}

      <YourComponent onEdit={handleEdit} />
    </>
  );
}
```

### Example 6: Inline Spinner Next to Field

```tsx
import { useAutoTranslateWithState } from '../hooks/useAutoTranslateWithState';
import EditableText from './EditableText';

export function Hero({ site, editable, onEdit }: any) {
  const {
    handleEdit,
    translatingField,
  } = useAutoTranslateWithState({
    siteData: site,
    onEdit,
  });

  return (
    <section className="hero">
      <div className="flex items-center gap-2">
        <EditableText
          value={site.hero.headline}
          path="hero.headline"
          editable={editable}
          onEdit={handleEdit}
          className="text-4xl font-bold"
        />
        
        {translatingField === 'hero.headline' && (
          <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
            />
          </svg>
        )}
      </div>
    </section>
  );
}
```

---

## Complete Example with All Features

```tsx
import { useState } from 'react';
import { useAutoTranslateWithState } from '../hooks/useAutoTranslateWithState';
import { useI18nContext } from '../components/I18nProvider';
import LocalBusinessLandingPage from './LocalBusinessLandingPage';

export default function EditorWithFeedback({ siteData }: any) {
  const [site, setSite] = useState(siteData);
  const i18nContext = useI18nContext();

  // Original edit handler
  const handleSiteEdit = (path: string, value: string) => {
    const updated = updateNestedValue(site, path, value);
    setSite(updated);
    saveSiteData(updated);
  };

  // Enhanced with loading state
  const {
    handleEdit,
    isTranslating,
    translatingField,
    lastError,
    translationHistory,
    clearError,
  } = useAutoTranslateWithState({
    siteData: site,
    onEdit: handleSiteEdit,
    onTranslationStart: (path) => {
      console.log(`🌐 Started translating: ${path}`);
    },
    onTranslationComplete: (path) => {
      console.log(`✅ Completed translating: ${path}`);
    },
    onTranslationError: (path, error) => {
      console.error(`❌ Failed translating ${path}:`, error);
    },
  });

  return (
    <>
      {/* Status Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Translation Status */}
          <div className="flex items-center gap-4">
            {isTranslating ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-blue-600">Translating...</div>
                  <div className="text-xs text-gray-500">
                    {translatingField} → {i18nContext?.availableLanguages.length - 1} languages
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">
                  Ready to edit • {translationHistory.length} translations today
                </span>
              </div>
            )}
          </div>

          {/* Right: Language Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Languages:</span>
            {i18nContext?.availableLanguages.map((lang) => (
              <span
                key={lang}
                className={`px-2 py-1 rounded ${
                  lang === i18nContext.currentLanguage
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {lang.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {isTranslating && (
          <div className="h-1 bg-gray-200">
            <div className="h-full bg-blue-500 animate-progress" />
          </div>
        )}
      </div>

      {/* Error Toast */}
      {lastError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">Translation Failed</div>
              <div className="text-sm mt-1">{lastError.message}</div>
            </div>
            <button
              onClick={clearError}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-20">
        <LocalBusinessLandingPage
          {...site}
          editable={true}
          onEdit={handleEdit}
        />
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out;
        }
      `}</style>
    </>
  );
}
```

---

## Tailwind Animation Classes

Add these to your Tailwind config for smooth animations:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'progress': 'progress 2s ease-in-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        progress: {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' },
        },
      },
    },
  },
}
```

---

## Summary

Choose the feedback style that matches your UI:

- **Simple Toast** - Unobtrusive, good for most cases
- **Progress Bar** - Visual progress indicator at top
- **Status Bar** - Detailed info in header
- **Modal Overlay** - Blocks interaction during translation
- **Inline Spinner** - Shows exactly which field is translating

All examples use `useAutoTranslateWithState` which provides:
- `isTranslating` - Boolean flag
- `translatingField` - Which field is being translated
- `lastError` - Any error that occurred
- `translationHistory` - Recent translations

Mix and match these patterns to create the perfect UX for your editor!

