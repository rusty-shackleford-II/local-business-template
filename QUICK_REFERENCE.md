# 🚀 Quick Reference Card

## ✅ Important: Translation Timing

**Translations ONLY happen on blur (focus out), NOT while typing!**

- ✅ Type freely without lag
- ✅ Click away or tab out → translation starts
- ✅ No wasted API calls
- ✅ Optimal performance

See `BLUR_BEHAVIOR_CONFIRMED.md` for details.

---

## Setup (One Time)

```bash
# 1. Set API key
export OPENAI_API_KEY="your_key_here"

# 2. Upgrade site to v2
python vm-py/i18n_utils.py path/to/site.json en es fr

# 3. Start dev server
cd vm-web/templates/local-business && npm run dev
```

## Basic Usage

```tsx
import { useAutoTranslate } from '../src/hooks/useAutoTranslate';

const MyComponent = ({ site, onEdit }) => {
  const { handleEdit } = useAutoTranslate({ siteData: site, onEdit });
  
  return <EditableText onEdit={handleEdit} {...props} />;
};
```

## API Endpoints

### Translate Text
```bash
POST /api/translate
{
  "text": "Hello",
  "sourceLang": "en",
  "targetLang": "es",
  "context": "hero.headline"  // optional
}
→ { "translation": "Hola" }
```

### Update Translation File
```bash
POST /api/update-translation
{
  "language": "es",
  "keyPath": "hero.headline",
  "value": "Hola"
}
→ { "success": true }
```

## Component Patterns

### Pattern 1: Hook
```tsx
const { handleEdit } = useAutoTranslate({ siteData: site, onEdit });
<EditableText onEdit={handleEdit} value={text} path="hero.headline" />
```

### Pattern 2: Wrapper
```tsx
<EditableWithAutoTranslate
  siteData={site}
  onEdit={onEdit}
  value={text}
  path="hero.headline"
/>
```

### Pattern 3: Manual
```tsx
await updateTranslationWithAutoTranslate({
  i18nKey: 'hero.headline',
  newValue: 'Hello',
  sourceLang: 'en',
  targetLangs: ['es', 'fr']
});
```

## File Structure

```
pages/api/
  translate.ts          ← OpenAI translation
  update-translation.ts ← File updates

src/
  hooks/
    useAutoTranslate.ts ← Main hook
  components/
    I18nProvider.tsx    ← Language context
    LanguageToggle.tsx  ← UI switcher
    EditableWithAutoTranslate.tsx ← Wrapper
  utils/
    i18nHelpers.ts      ← Helper functions

public/locales/
  en/common.json        ← English
  es/common.json        ← Spanish
  fr/common.json        ← French
```

## Debugging

```tsx
// Check if i18n enabled
console.log(site.version, site.i18n?.enabled);

// Check translation files exist
ls public/locales/*/common.json

// Test translation API
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","targetLang":"es"}'

// Watch console during edit
// Should see: "🌐 Auto-translating: hero.headline"
```

## Common Issues

| Issue | Fix |
|-------|-----|
| No translation | Check OPENAI_API_KEY set |
| [ES] mock text | API key not loaded, restart server |
| Translation error | Check console, verify API key valid |
| Slow translations | Normal (~500ms per language) |
| Files not updating | Check NODE_ENV !== 'production' |

## Cost Calculator

```
1 field × 3 languages = 3 translations × $0.00004 = $0.00012
10 fields × 3 languages = $0.0012
100 fields × 3 languages = $0.012
1000 fields × 3 languages = $0.12
```

## Disable Auto-Translate

```tsx
// Per component
const { handleEdit } = useAutoTranslate({ enableAutoTranslate: false });

// Use original handler
<EditableText onEdit={onEdit} /> // No auto-translate
<EditableText onEdit={handleEdit} /> // With auto-translate
```

## Batch Translation

```tsx
import { batchTranslate } from '../hooks/useAutoTranslate';

await batchTranslate([
  { key: 'hero.headline', value: 'Welcome' },
  { key: 'hero.subheadline', value: 'Great food' },
], 'en', ['es', 'fr']);
```

## Documentation Links

- **AUTO_TRANSLATION_GUIDE.md** - Complete guide
- **INTEGRATION_EXAMPLE.md** - Working code example
- **AUTO_TRANSLATE_SUMMARY.md** - Feature overview
- **I18N_INTEGRATION_GUIDE.md** - i18n architecture
- **QUICK_START_I18N.md** - 5-min setup

## Full Example

```tsx
import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { I18nProvider } from '../components/I18nProvider';
import EditableText from './EditableText';

export default function Page() {
  const [site, setSite] = useState(siteData);
  
  const handleSiteEdit = (path, value) => {
    const updated = updateNestedValue(site, path, value);
    setSite(updated);
    saveSiteData(updated);
  };

  const { handleEdit } = useAutoTranslate({
    siteData: site,
    onEdit: handleSiteEdit,
  });

  return (
    <I18nProvider {...site.i18n}>
      <EditableText
        value={site.hero.headline}
        path="hero.headline"
        editable={true}
        onEdit={handleEdit} // Auto-translates!
      />
    </I18nProvider>
  );
}
```

## Checklist

- [ ] OPENAI_API_KEY set in environment
- [ ] Site upgraded to v2 (has version: "2.0")
- [ ] i18n.enabled = true in site.json
- [ ] 2+ languages in availableLanguages
- [ ] Translation files exist in public/locales/
- [ ] useAutoTranslate hook added to component
- [ ] handleEdit passed to EditableText
- [ ] Tested editing and language switching

## That's It! 🎉

Edit text → Automatically translated → Switch languages to see result!

