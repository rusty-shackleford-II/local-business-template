# Automatic Translation on Edit

This guide shows how to enable automatic translation when users edit text in the live preview.

## How It Works

```
User edits text in live preview
    ↓
Edit handler called with new value
    ↓
1. Update site.json (existing behavior)
    ↓
2. Update source language translation file (e.g., en/common.json)
    ↓
3. Call OpenAI to translate to each target language
    ↓
4. Update each target language file (es/common.json, fr/common.json, etc.)
    ↓
5. I18nProvider reloads translations
    ↓
All language versions now updated! 🎉
```

## Quick Start (3 Methods)

### Method 1: Use the Hook (Recommended)

Use `useAutoTranslate` in your component:

```tsx
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import EditableText from './EditableText';

const MyComponent = ({ site, editable, onEdit }) => {
  const { handleEdit } = useAutoTranslate({
    siteData: site,
    onEdit: onEdit,
    enableAutoTranslate: true,
  });

  return (
    <EditableText
      value={site.hero.headline}
      path="hero.headline"
      editable={editable}
      onEdit={handleEdit} // Use enhanced handler
    />
  );
};
```

### Method 2: Use the Wrapper Component

Replace `EditableText` with `EditableWithAutoTranslate`:

```tsx
import EditableWithAutoTranslate from './EditableWithAutoTranslate';

const MyComponent = ({ site, editable, onEdit }) => {
  return (
    <EditableWithAutoTranslate
      value={site.hero.headline}
      path="hero.headline"
      editable={editable}
      onEdit={onEdit}
      siteData={site}
      className="text-4xl font-bold"
    />
  );
};
```

### Method 3: Manual Integration

For more control, call the translation functions directly:

```tsx
import { updateTranslationWithAutoTranslate } from '../utils/i18nHelpers';
import { useI18nContext } from './I18nProvider';

const MyComponent = ({ site, editable, onEdit }) => {
  const i18nContext = useI18nContext();

  const handleEdit = async (path: string, value: string) => {
    // Update site.json
    onEdit(path, value);

    // Auto-translate if i18n enabled
    if (i18nContext?.enabled) {
      await updateTranslationWithAutoTranslate({
        i18nKey: path, // or convert path to proper key
        newValue: value,
        sourceLang: i18nContext.currentLanguage,
        targetLangs: i18nContext.availableLanguages,
      });
    }
  };

  return (
    <EditableText
      value={site.hero.headline}
      path="hero.headline"
      editable={editable}
      onEdit={handleEdit}
    />
  );
};
```

## Complete Example: Hero Component

Here's a complete example of a Hero component with auto-translation:

```tsx
import React from 'react';
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { useI18nContext } from './I18nProvider';
import EditableText from './EditableText';

interface HeroProps {
  site: any;
  editable?: boolean;
  onEdit?: (path: string, value: string) => void;
}

const Hero: React.FC<HeroProps> = ({ site, editable, onEdit }) => {
  const i18nContext = useI18nContext();
  const { handleEdit } = useAutoTranslate({
    siteData: site,
    onEdit,
  });

  // Get text - use translation if available, fallback to site.json
  const headline = i18nContext?.enabled 
    ? i18nContext.t('hero.headline', site.hero?.headline)
    : site.hero?.headline;

  const subheadline = i18nContext?.enabled
    ? i18nContext.t('hero.subheadline', site.hero?.subheadline)
    : site.hero?.subheadline;

  return (
    <section className="hero">
      <EditableText
        value={headline}
        path="hero.headline"
        editable={editable}
        onEdit={handleEdit} // Auto-translates on edit!
        className="text-4xl font-bold"
      />
      
      <EditableText
        value={subheadline}
        path="hero.subheadline"
        editable={editable}
        onEdit={handleEdit} // Auto-translates on edit!
        className="text-xl text-gray-600"
        multiline
      />
    </section>
  );
};

export default Hero;
```

## How Path → i18n Key Conversion Works

The `useAutoTranslate` hook automatically converts site.json paths to i18n keys:

| Path | i18n Key | Notes |
|------|----------|-------|
| `hero.headline` | `hero.headline` | Direct mapping |
| `services.items.0.title` | `services.dine-in.title` | Uses item ID if available |
| `services.items.0.description` | `services.dine-in.description` | Uses item ID if available |
| `testimonials.items.1.text` | `testimonials.john-doe.text` | Uses item ID if available |

The hook looks for:
1. `item.id` field (best - stable and semantic)
2. Slug of `item.title` (good fallback)
3. `item-{index}` (last resort)

**Pro Tip:** Always add `id` fields to array items in site.json:

```json
{
  "services": {
    "items": [
      {
        "id": "dine-in",  // ← Add this!
        "title": "Dine In",
        "description": "Enjoy our cozy atmosphere"
      }
    ]
  }
}
```

## Testing Auto-Translation

### 1. Set Up OpenAI API Key

```bash
export OPENAI_API_KEY="your_key_here"
```

### 2. Start Dev Server

```bash
cd vm-web/templates/local-business
npm run dev
```

### 3. Edit Text in Live Preview

1. Make sure your site is v2 with i18n enabled
2. Click on any editable text field
3. Make a change and blur the field
4. Check the console - you should see:

```
🌐 Auto-translating: hero.headline
✅ Translation complete for: hero.headline
```

### 4. Switch Languages

Click the language toggle (🇺🇸 → 🇪🇸)

You should see your edit translated to Spanish!

## Batch Translation

For translating many items at once (e.g., when generating a new site):

```tsx
import { batchTranslate } from '../hooks/useAutoTranslate';

// Translate all service items
const translateAllServices = async (services, sourceLang, targetLangs) => {
  const items = services.items.flatMap((service) => [
    { key: `services.${service.id}.title`, value: service.title },
    { key: `services.${service.id}.description`, value: service.description },
  ]);

  await batchTranslate(items, sourceLang, targetLangs);
};

// Usage
await translateAllServices(site.services, 'en', ['es', 'fr', 'de']);
```

## Performance Considerations

### API Costs
- OpenAI gpt-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Average translation: ~50 input + 50 output tokens = ~$0.00004 per translation
- Example: Translating 100 fields to 3 languages = 300 translations = ~$0.012

### Latency
- Each translation takes ~500-1000ms
- Translations happen in sequence (to avoid rate limits)
- 3 languages × 1 field = ~2-3 seconds
- User sees loading indicator during translation

### Optimization Tips

1. **Debounce edits**: Don't translate on every keystroke
```tsx
const debouncedEdit = debounce(handleEdit, 1000);
```

2. **Show loading state**: Give visual feedback
```tsx
const [isTranslating, setIsTranslating] = useState(false);

const handleEdit = async (path, value) => {
  setIsTranslating(true);
  await originalHandleEdit(path, value);
  setIsTranslating(false);
};
```

3. **Skip unchanged text**: Only translate if value actually changed
```tsx
const previousValue = useRef(value);
if (value === previousValue.current) return;
```

4. **Batch edits**: If user edits multiple fields, batch translate
```tsx
const pendingEdits = useRef<Array<{path: string, value: string}>>([]);

// Collect edits for 2 seconds, then batch translate
```

## Disabling Auto-Translation

### Per Component
```tsx
const { handleEdit } = useAutoTranslate({
  enableAutoTranslate: false, // Disable for this component
});
```

### Per Edit
```tsx
// Use the original onEdit to skip translation
<EditableText onEdit={onEdit} /> // Skips auto-translate

// Use the enhanced handler to enable translation
<EditableText onEdit={handleEdit} /> // Enables auto-translate
```

### Globally (for development)
```tsx
// In your editor/preview component
const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);

<EditableText
  onEdit={autoTranslateEnabled ? handleEdit : onEdit}
/>
```

## Error Handling

The hook gracefully handles errors:

```tsx
try {
  await updateTranslationWithAutoTranslate(...);
} catch (error) {
  console.error('Auto-translation failed:', error);
  // Edit still succeeds - translation failure doesn't break editing
}
```

Errors that might occur:
- OpenAI API rate limit
- Network timeout
- Invalid API key
- Malformed translation response

In all cases, the original edit to site.json succeeds. Only the translation fails silently.

## Monitoring Translation Quality

Add logging to track translations:

```tsx
const { handleEdit } = useAutoTranslate({
  onEdit,
  siteData: site,
});

// Enhanced with logging
const loggedHandleEdit = async (path: string, value: string) => {
  console.log(`Translating: ${path}`);
  console.log(`Original (${sourceLang}):`, value);
  
  await handleEdit(path, value);
  
  // Check what was generated
  const esTranslation = await fetch(`/locales/es/common.json`)
    .then(r => r.json())
    .then(data => getNestedValue(data, path));
  
  console.log(`Translated (es):`, esTranslation);
};
```

## FAQ

### Q: Will this slow down the editor?
A: Translations happen asynchronously. The edit saves immediately to site.json. Translations happen in the background (~2-3 seconds per edit).

### Q: What if translation fails?
A: The edit still saves. Translation failures are logged but don't break editing.

### Q: Can I review translations before they're saved?
A: Currently they auto-save. For a review workflow, set `enableAutoTranslate: false` and add a "Translate" button that the user clicks manually.

### Q: Will this translate images/URLs?
A: No - only text fields. Image URLs and other non-text content are skipped.

### Q: Can I customize the translation prompt?
A: Yes - edit `/pages/api/translate.ts` and modify the `systemPrompt` and `userPrompt` variables.

## Next Steps

1. ✅ Set up OpenAI API key
2. ✅ Test with a simple component
3. ✅ Add `id` fields to all array items in site.json
4. ✅ Integrate with your main editor component
5. ✅ Add loading indicators
6. ✅ Monitor translation quality

See `I18N_INTEGRATION_GUIDE.md` for more advanced integration patterns.

