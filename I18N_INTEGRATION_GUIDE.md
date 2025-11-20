# i18n Integration Guide for Local Business Template

## Overview

The local business template now supports multilingual websites with backwards compatibility. Sites can have version 1.0 (legacy, single language) or version 2.0 (with i18n support).

## Quick Start

### 1. Upgrade an Existing Site to v2 with i18n

```bash
# From the vending-machine root directory
cd vm-py
conda activate vending-machine

# Upgrade site.json to v2 with English and Spanish
python i18n_utils.py \
  ../vm-web/templates/local-business/data/site.json \
  en \
  es fr
```

This will:
- Create a backup (`site.json.v1.backup.json`)
- Add `version: "2.0"` and `i18n` configuration to site.json
- Generate translation files in `public/locales/en/common.json`, etc.

### 2. Site.json Structure for v2

```json
{
  "version": "2.0",
  "i18n": {
    "enabled": true,
    "defaultLanguage": "en",
    "availableLanguages": ["en", "es", "fr"]
  },
  "businessInfo": {
    "businessName": "Joe's Pizza",
    ...
  },
  ...
}
```

### 3. Translation Files Structure

```
public/
  locales/
    en/
      common.json      ← English translations
    es/
      common.json      ← Spanish translations
    fr/
      common.json      ← French translations
```

Example `common.json`:

```json
{
  "hero": {
    "headline": "Best Pizza in Town",
    "subheadline": "Fresh ingredients daily"
  },
  "services": {
    "headline": "Our Services",
    "dine-in": {
      "title": "Dine In",
      "description": "Enjoy our cozy atmosphere"
    },
    "takeout": {
      "title": "Takeout",
      "description": "Order and pick up"
    }
  }
}
```

## Making Components i18n-Aware

### Pattern 1: Using useI18nContext (Recommended)

```tsx
import { useI18nContext } from './I18nProvider';

const MyComponent = ({ headline, description }) => {
  const i18nContext = useI18nContext();
  
  // Legacy mode (v1): use props directly
  if (!i18nContext?.enabled) {
    return (
      <div>
        <h1>{headline}</h1>
        <p>{description}</p>
      </div>
    );
  }
  
  // i18n mode (v2): use translations with fallback to props
  const { t } = i18nContext;
  
  return (
    <div>
      <h1>{t('hero.headline', headline)}</h1>
      <p>{t('hero.subheadline', description)}</p>
    </div>
  );
};
```

### Pattern 2: Using Conditional Rendering

```tsx
import { useI18nContext } from './I18nProvider';

const ServicesSection = ({ services }) => {
  const i18nContext = useI18nContext();
  
  return (
    <section>
      {!i18nContext?.enabled ? (
        // v1 mode - render directly from props
        <>
          <h2>{services.title}</h2>
          {services.items.map(service => (
            <div key={service.id}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </>
      ) : (
        // v2 mode - use translations
        <>
          <h2>{i18nContext.t('services.headline', services.title)}</h2>
          {services.items.map(service => (
            <div key={service.id}>
              <h3>{i18nContext.t(`services.${service.id}.title`, service.title)}</h3>
              <p>{i18nContext.t(`services.${service.id}.description`, service.description)}</p>
            </div>
          ))}
        </>
      )}
    </section>
  );
};
```

### Pattern 3: Helper Hook

Create a custom hook for cleaner code:

```tsx
// src/hooks/useTranslation.ts
import { useI18nContext } from '../components/I18nProvider';

export function useTranslation() {
  const i18nContext = useI18nContext();
  
  // If i18n not enabled, return a passthrough function
  if (!i18nContext?.enabled) {
    return {
      t: (key: string, fallback: string) => fallback,
      currentLanguage: 'en',
      changeLanguage: () => {},
    };
  }
  
  return {
    t: i18nContext.t,
    currentLanguage: i18nContext.currentLanguage,
    changeLanguage: i18nContext.changeLanguage,
  };
}

// Usage in components
const MyComponent = ({ headline }) => {
  const { t } = useTranslation();
  
  return <h1>{t('hero.headline', headline)}</h1>;
};
```

## Making EditableText i18n-Aware

When a user edits text in the editor, you need to:

1. Update the translation for the current language
2. Automatically translate to other languages
3. Update all translation files

```tsx
import { useI18nContext } from './I18nProvider';
import { updateTranslationWithAutoTranslate } from '../utils/i18nHelpers';
import EditableText from './EditableText';

const MyComponent = ({ editable, onEdit, siteData }) => {
  const i18nContext = useI18nContext();
  
  const handleEdit = async (path: string, value: string) => {
    // Update site.json (existing behavior)
    onEdit?.(path, value);
    
    // If i18n enabled, also update translations
    if (i18nContext?.enabled) {
      const i18nKey = path.replace('services.items.0', 'services.service-1'); // Convert path to i18n key
      
      await updateTranslationWithAutoTranslate({
        i18nKey,
        newValue: value,
        sourceLang: i18nContext.currentLanguage,
        targetLangs: i18nContext.availableLanguages,
      });
    }
  };
  
  return (
    <EditableText
      value={i18nContext?.t('hero.headline', 'Default Headline')}
      path="hero.headline"
      editable={editable}
      onEdit={handleEdit}
    />
  );
};
```

## Translation API

### Using the Translation Endpoint

```typescript
const response = await fetch('/api/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello, world!',
    sourceLang: 'en',
    targetLang: 'es',
    context: 'hero.headline' // Optional: helps with context-aware translation
  })
});

const { text } = await response.json();
// text = "¡Hola, mundo!"
```

### Configuring a Real Translation Service

The `/api/translate` endpoint is currently a placeholder. To use a real translation service:

1. **OpenAI (Recommended for context-aware translation)**:

```typescript
// pages/api/translate.ts
// Uncomment the translateWithOpenAI function
// Set environment variable: OPENAI_API_KEY=your_key
```

2. **Google Cloud Translation**:

```bash
npm install @google-cloud/translate
# Set GOOGLE_TRANSLATE_API_KEY=your_key
```

3. **DeepL**:

```bash
npm install deepl-node
# Set DEEPL_API_KEY=your_key
```

## Deployment

### For v1 Sites (Legacy)

Nothing changes - they deploy exactly as before.

### For v2 Sites (i18n Enabled)

1. Translation files are included in the static export:

```bash
npm run build
# Outputs:
# out/
#   locales/
#     en/common.json
#     es/common.json
#   index.html
#   ...
```

2. Language switching works client-side (no server needed)
3. Users can toggle languages using the dropdown in the header

## Migration Strategy

### Phase 1: Opt-in (Current)

- All existing sites remain v1 (no breaking changes)
- New sites can be created as v2
- Customers can opt-in to upgrade

### Phase 2: Gradual Migration

Add a UI button in the editor:

```tsx
<button onClick={async () => {
  await fetch('/api/upgrade-to-i18n', {
    method: 'POST',
    body: JSON.stringify({
      siteId: currentSite.id,
      additionalLanguages: ['es', 'fr']
    })
  });
}}>
  Enable Multilingual Support
</button>
```

### Phase 3: Auto-upgrade (Optional)

After 6-12 months, auto-upgrade all v1 sites to v2 with `i18n.enabled: false` for single-language sites.

## Testing

### Test v1 Site (Legacy)

```bash
cd vm-web/templates/local-business
npm run dev
# Should work exactly as before - no language toggle
```

### Test v2 Site (i18n)

1. Upgrade a site:
```bash
python vm-py/i18n_utils.py \
  vm-web/templates/local-business/data/site.json \
  en es
```

2. Run dev server:
```bash
cd vm-web/templates/local-business
npm run dev
```

3. You should see:
   - Language toggle in header (🇺🇸 🇪🇸)
   - Clicking switches all text on the page
   - Language preference saved to localStorage

## Troubleshooting

### "Language toggle not appearing"

Check that site.json has:
```json
{
  "version": "2.0",
  "i18n": {
    "enabled": true,
    "availableLanguages": ["en", "es"]  // Must have 2+ languages
  }
}
```

### "Translations not loading"

Check that translation files exist:
```bash
ls public/locales/en/common.json
ls public/locales/es/common.json
```

### "Edits not being translated"

The auto-translation feature requires:
1. A configured translation API (see Translation API section)
2. The `updateTranslationWithAutoTranslate` utility to be called on edit

## i18n Key Naming Conventions

Use stable, semantic keys:

✅ Good:
- `services.dine-in.title`
- `services.takeout.description`
- `testimonials.john-doe.text`

❌ Bad:
- `services.items.0.title` (array index changes)
- `services.service1.title` (non-semantic ID)

Generate keys from:
- service.id (if available)
- slug of title: `title.toLowerCase().replace(/[^a-z0-9]+/g, '-')`

