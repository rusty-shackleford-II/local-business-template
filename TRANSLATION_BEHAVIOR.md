# Translation Behavior & Timing

## ✅ Current Behavior (Already Correct!)

**Translations ONLY happen on blur (focus out), not on every keystroke.**

### The Flow

```
User clicks on text field
    ↓
User types "Hello World" (no API calls yet)
    ↓
User clicks away or tabs out (BLUR EVENT)
    ↓
EditableText.onCommit() is called
    ↓
onEdit(path, "Hello World") is triggered
    ↓
useAutoTranslate intercepts the call
    ↓
1. Updates site.json
2. Starts translation process
3. Calls OpenAI for each language
4. Updates translation files
    ↓
Translation complete! (2-3 seconds)
```

### Key Points

✅ **No translation during typing** - User can type freely  
✅ **Translation on blur only** - Only when focus leaves the field  
✅ **Non-blocking** - Edit saves immediately, translation happens async  
✅ **Efficient** - Only one translation per edit session  

---

## Visual Feedback (Optional)

While the current behavior is correct, you may want to show the user that translation is in progress:

### Option 1: Global Translation Indicator

```tsx
import { useState } from 'react';
import { useAutoTranslate } from '../hooks/useAutoTranslate';

const MyEditor = ({ site, onEdit }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  
  const handleSiteEdit = async (path: string, value: string) => {
    const updated = updateNestedValue(site, path, value);
    setSite(updated);
    saveSiteData(updated);
  };

  const { handleEdit } = useAutoTranslate({
    siteData: site,
    onEdit: handleSiteEdit,
  });

  // Wrap with loading indicator
  const handleEditWithIndicator = async (path: string, value: string) => {
    setIsTranslating(true);
    try {
      await handleEdit(path, value);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <>
      {isTranslating && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Translating to {site.i18n?.availableLanguages?.length - 1} languages...
        </div>
      )}
      
      <YourComponent onEdit={handleEditWithIndicator} />
    </>
  );
};
```

### Option 2: Per-Field Indicator

Track which field is being translated:

```tsx
const [translatingField, setTranslatingField] = useState<string | null>(null);

const handleEditWithIndicator = async (path: string, value: string) => {
  setTranslatingField(path);
  try {
    await handleEdit(path, value);
  } finally {
    setTranslatingField(null);
  }
};

// In your component
<div className="relative">
  <EditableText
    onEdit={handleEditWithIndicator}
    {...props}
  />
  {translatingField === 'hero.headline' && (
    <div className="absolute -right-8 top-0">
      <Spinner size="sm" />
    </div>
  )}
</div>
```

### Option 3: Toast Notifications

```tsx
import { toast } from 'react-hot-toast'; // or your toast library

const handleEditWithToast = async (path: string, value: string) => {
  const toastId = toast.loading('Translating...');
  
  try {
    await handleEdit(path, value);
    toast.success('Translated to all languages!', { id: toastId });
  } catch (error) {
    toast.error('Translation failed', { id: toastId });
  }
};
```

---

## Advanced: Enhanced Hook with Loading State

Create an enhanced version of the hook that includes loading state:

```tsx
// src/hooks/useAutoTranslateWithState.ts
import { useState, useCallback } from 'react';
import { useAutoTranslate } from './useAutoTranslate';

export function useAutoTranslateWithState(options: any) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  const { handleEdit: originalHandleEdit, ...rest } = useAutoTranslate(options);

  const handleEdit = useCallback(async (path: string, value: string) => {
    setIsTranslating(true);
    setTranslatingField(path);
    setLastError(null);
    
    try {
      await originalHandleEdit(path, value);
      console.log(`✅ Successfully translated: ${path}`);
    } catch (error) {
      console.error(`❌ Translation failed for ${path}:`, error);
      setLastError(error as Error);
    } finally {
      setIsTranslating(false);
      setTranslatingField(null);
    }
  }, [originalHandleEdit]);

  return {
    handleEdit,
    isTranslating,
    translatingField,
    lastError,
    ...rest,
  };
}
```

**Usage:**

```tsx
const {
  handleEdit,
  isTranslating,
  translatingField,
  lastError
} = useAutoTranslateWithState({
  siteData: site,
  onEdit: handleSiteEdit,
});

return (
  <>
    {isTranslating && <LoadingIndicator field={translatingField} />}
    {lastError && <ErrorToast message={lastError.message} />}
    <EditableText onEdit={handleEdit} {...props} />
  </>
);
```

---

## Performance Considerations

### Current Behavior is Optimal

The current "translate on blur" behavior is ideal because:

1. **No wasted API calls** - User can edit multiple times before blur
2. **Better UX** - No lag during typing
3. **Cost efficient** - Only translates final value
4. **Fewer rate limits** - Fewer API calls to OpenAI

### What to Avoid

❌ **Don't translate on every keystroke:**
```tsx
// BAD - translates on every character!
<input onChange={(e) => handleEdit('field', e.target.value)} />
```

❌ **Don't use short debounce for auto-translate:**
```tsx
// BAD - still causes many API calls
const debouncedEdit = debounce(handleEdit, 500);
```

✅ **Do use blur (current implementation):**
```tsx
// GOOD - EditableText already does this!
<EditableText onEdit={handleEdit} />
```

---

## Testing the Blur Behavior

### Test 1: Type Without Blur

1. Click on editable text field
2. Type "Hello World"
3. Keep focus in the field (don't click away)
4. Check console - **No translation logs should appear**
5. Click away from the field
6. Now see: `🌐 Auto-translating: hero.headline`

### Test 2: Multiple Edits

1. Click on field, type "Hello"
2. Don't blur, continue typing " World"
3. Blur (click away)
4. Only ONE translation should happen (for "Hello World")

### Test 3: Quick Edit-Blur

1. Click, type one character, immediately blur
2. Translation should still work
3. No debouncing or delays

---

## FAQ

### Q: Can I add debouncing on top of blur?
A: Not recommended. Blur already ensures the edit is "final". Adding debounce would just delay the translation unnecessarily.

### Q: What if I want to translate while typing?
A: This would be expensive (many API calls) and slow (lag during typing). Current behavior is better.

### Q: Can I manually trigger translation?
A: Yes! Use the `translateManually()` function from the hook:

```tsx
const { translateManually } = useAutoTranslate({ siteData, onEdit });

await translateManually('hero.headline', 'New text');
```

### Q: Does this work with multiline text?
A: Yes! Multiline EditableText also triggers on blur, when user clicks outside the text area.

### Q: What about pressing Enter in single-line fields?
A: EditableText also commits on Enter for single-line fields. The translation will trigger then too.

---

## Summary

✅ **Current behavior is correct** - Translation only on blur  
✅ **No changes needed** - Already works as requested  
✅ **Optional enhancements** - Add visual feedback if desired  
✅ **Optimal performance** - One translation per edit session  

The implementation is already exactly what you want! 🎉

