# Complete Integration Example

This document shows exactly how to integrate automatic translation into your existing editor.

## Your Current Setup

Based on the local business template, you likely have:

```tsx
// pages/index.tsx or your editor component
import LocalBusinessLandingPage from '../src/components/LocalBusinessLandingPage';
import site from '../data/site.json';

export default function Home() {
  const [siteData, setSiteData] = useState(site);
  
  const handleEdit = (path: string, value: string) => {
    // Update site.json
    const updated = updateNestedValue(siteData, path, value);
    setSiteData(updated);
    
    // Save to backend/file system
    saveSiteData(updated);
  };

  return (
    <LocalBusinessLandingPage
      {...siteData}
      editable={true}
      onEdit={handleEdit}
    />
  );
}
```

## Add Automatic Translation (3 Steps)

### Step 1: Wrap with I18nProvider

```tsx
import { I18nProvider } from '../src/components/I18nProvider';

export default function Home() {
  const [siteData, setSiteData] = useState(site);
  const i18nEnabled = siteData.version === '2.0' && siteData.i18n?.enabled;
  
  const handleEdit = (path: string, value: string) => {
    const updated = updateNestedValue(siteData, path, value);
    setSiteData(updated);
    saveSiteData(updated);
  };

  const content = (
    <LocalBusinessLandingPage
      {...siteData}
      editable={true}
      onEdit={handleEdit}
    />
  );

  // v2 sites: wrap with i18n
  if (i18nEnabled) {
    return (
      <I18nProvider
        defaultLanguage={siteData.i18n.defaultLanguage}
        availableLanguages={siteData.i18n.availableLanguages}
        siteData={siteData}
      >
        {content}
      </I18nProvider>
    );
  }

  // v1 sites: render directly
  return content;
}
```

### Step 2: Use Auto-Translate Hook

```tsx
import { useAutoTranslate } from '../src/hooks/useAutoTranslate';

export default function Home() {
  const [siteData, setSiteData] = useState(site);
  
  // Original edit handler (updates site.json)
  const handleSiteEdit = (path: string, value: string) => {
    const updated = updateNestedValue(siteData, path, value);
    setSiteData(updated);
    saveSiteData(updated);
  };

  // Enhanced handler (updates site.json + translations)
  const { handleEdit } = useAutoTranslate({
    siteData,
    onEdit: handleSiteEdit,
    enableAutoTranslate: true,
  });

  // Pass the enhanced handler to components
  return (
    <I18nProvider {...i18nConfig}>
      <LocalBusinessLandingPage
        {...siteData}
        editable={true}
        onEdit={handleEdit} // ← Now auto-translates!
      />
    </I18nProvider>
  );
}
```

### Step 3: Set OpenAI API Key

```bash
# In your .env.local file
OPENAI_API_KEY=your_openai_api_key_here
```

That's it! Now when users edit text, it automatically translates to all configured languages.

## Complete Working Example

Here's a complete, copy-paste ready example:

```tsx
// pages/index.tsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import LocalBusinessLandingPage from '../src/components/LocalBusinessLandingPage';
import { I18nProvider } from '../src/components/I18nProvider';
import { useAutoTranslate } from '../src/hooks/useAutoTranslate';
import site from '../data/site.json';

// Helper function to update nested values
function updateNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.');
  const newObj = JSON.parse(JSON.stringify(obj)); // Deep clone
  let current = newObj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return newObj;
}

// Inner component that uses the hook (must be inside I18nProvider)
function EditorContent({ siteData, onSiteDataChange }: any) {
  const handleSiteEdit = (path: string, value: string) => {
    const updated = updateNestedValue(siteData, path, value);
    onSiteDataChange(updated);
    
    // TODO: Save to backend/file system
    console.log('Saving to backend:', { path, value });
  };

  // Enhanced handler with auto-translation
  const { handleEdit, isI18nEnabled } = useAutoTranslate({
    siteData,
    onEdit: handleSiteEdit,
    enableAutoTranslate: true,
  });

  return (
    <LocalBusinessLandingPage
      {...siteData}
      editable={true}
      onEdit={handleEdit} // Auto-translates on edit
    />
  );
}

// Main component
export default function Home() {
  const [siteData, setSiteData] = useState<any>(site);
  
  const i18nEnabled = siteData?.version === '2.0' && siteData?.i18n?.enabled;

  // Head content (shared)
  const headContent = (
    <Head>
      <title>
        {siteData?.seo?.metaTitle || siteData?.businessInfo?.businessName || 'Local Business'}
      </title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
  );

  // v1 site (legacy)
  if (!i18nEnabled) {
    return (
      <>
        {headContent}
        <LocalBusinessLandingPage
          {...siteData}
          editable={true}
          onEdit={(path, value) => {
            const updated = updateNestedValue(siteData, path, value);
            setSiteData(updated);
          }}
        />
      </>
    );
  }

  // v2 site (with i18n)
  return (
    <>
      {headContent}
      <I18nProvider
        defaultLanguage={siteData.i18n.defaultLanguage}
        availableLanguages={siteData.i18n.availableLanguages}
        siteData={siteData}
      >
        <EditorContent
          siteData={siteData}
          onSiteDataChange={setSiteData}
        />
      </I18nProvider>
    </>
  );
}
```

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Edits Text in UI                    │
│              (Changes "Welcome" to "Hello")                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              handleEdit('hero.headline', 'Hello')           │
│                (from useAutoTranslate hook)                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌────────────────────┐              ┌─────────────────────────┐
│  Update site.json  │              │  Is i18n enabled?       │
│  hero.headline     │              │  Are there 2+ langs?    │
│  = "Hello"         │              └──────────┬──────────────┘
└────────────────────┘                         │
        │                                      │ Yes
        │                                      ▼
        │                        ┌──────────────────────────────┐
        │                        │  Update en/common.json        │
        │                        │  hero.headline = "Hello"      │
        │                        └──────────┬───────────────────┘
        │                                   │
        │                                   ▼
        │                        ┌──────────────────────────────┐
        │                        │  Call /api/translate          │
        │                        │  text: "Hello"                │
        │                        │  sourceLang: "en"             │
        │                        │  targetLang: "es"             │
        │                        └──────────┬───────────────────┘
        │                                   │
        │                                   ▼
        │                        ┌──────────────────────────────┐
        │                        │  OpenAI Translation           │
        │                        │  Returns: "Hola"              │
        │                        └──────────┬───────────────────┘
        │                                   │
        │                                   ▼
        │                        ┌──────────────────────────────┐
        │                        │  Update es/common.json        │
        │                        │  hero.headline = "Hola"       │
        │                        └──────────┬───────────────────┘
        │                                   │
        │                                   ▼
        │                        ┌──────────────────────────────┐
        │                        │  Call /api/translate          │
        │                        │  targetLang: "fr"             │
        │                        └──────────┬───────────────────┘
        │                                   │
        │                                   ▼
        │                        ┌──────────────────────────────┐
        │                        │  Update fr/common.json        │
        │                        │  hero.headline = "Bonjour"    │
        │                        └──────────┬───────────────────┘
        │                                   │
        └───────────────┬───────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   Done! ✅             │
            │   - site.json updated  │
            │   - EN updated         │
            │   - ES updated         │
            │   - FR updated         │
            └───────────────────────┘
```

## Testing the Integration

### 1. Create a v2 Test Site

```bash
cd vm-py
conda activate vending-machine
python i18n_utils.py \
  ../vm-web/templates/local-business/data/site.json \
  en es
```

### 2. Set API Key

```bash
export OPENAI_API_KEY="your_key_here"
```

### 3. Start Dev Server

```bash
cd ../vm-web/templates/local-business
npm run dev
```

### 4. Test Editing

1. Open http://localhost:3000
2. Click on the headline text
3. Change it to something new
4. Blur the field (click away)
5. Watch the console:

```
🌐 Auto-translating: hero.headline
Calling translation API for language: es
✅ Updated es/common.json: hero.headline = Nuevo Texto
✅ Translation complete for: hero.headline
```

6. Click the language toggle (🇺🇸 → 🇪🇸)
7. You should see your edit in Spanish!

## Troubleshooting

### "Translation not happening"

Check console for errors. Common issues:
- OpenAI API key not set
- i18n not enabled in site.json
- Only 1 language configured

### "Getting mock translations like [ES] Text"

The API key isn't being used. Make sure:
```bash
echo $OPENAI_API_KEY  # Should print your key
```

### "Edits work but translations don't save"

Check that `/api/update-translation` is working:
```bash
curl -X POST http://localhost:3000/api/update-translation \
  -H "Content-Type: application/json" \
  -d '{"language":"es","keyPath":"test.field","value":"Hola"}'
```

Should return: `{"success":true}`

## Performance Tips

### Add Loading Indicator

```tsx
const { handleEdit, isTranslating } = useAutoTranslate({
  siteData,
  onEdit: handleSiteEdit,
});

return (
  <>
    {isTranslating && (
      <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded">
        Translating... 🌐
      </div>
    )}
    <LocalBusinessLandingPage onEdit={handleEdit} {...siteData} />
  </>
);
```

### Debounce Rapid Edits

```tsx
import { debounce } from 'lodash';

const debouncedEdit = useMemo(
  () => debounce(handleEdit, 1000),
  [handleEdit]
);
```

## Next Steps

1. ✅ Copy the complete example above
2. ✅ Test with your existing editor
3. ✅ Add loading indicators
4. ✅ Add error handling UI
5. ✅ Deploy and test in production

See `AUTO_TRANSLATION_GUIDE.md` for more advanced patterns.

