# Quick Start: Multilingual Support

## Test the Implementation (5 minutes)

### 1. Run the Test Migration Script

```bash
cd /Users/warren/dev/vending-machine/vm-py
conda activate vending-machine
./test_i18n_migration.sh
```

This will:
- ✅ Upgrade your site.json to v2.0
- ✅ Generate translation files for English, Spanish, and French
- ✅ Create a backup of your original site.json

### 2. Start the Dev Server

```bash
cd /Users/warren/dev/vending-machine/vm-web/templates/local-business
npm run dev
```

### 3. Open in Browser

Navigate to http://localhost:3000

You should see:
- 🇺🇸 🇪🇸 🇫🇷 Language toggle in the header
- Click to switch languages (currently shows mock translations like `[ES] Original Text`)

## Configure Real Translations

### Option 1: OpenAI (Recommended - Best Quality)

1. Get API key from https://platform.openai.com/api-keys

2. Edit `pages/api/translate.ts`:
   - Uncomment the `translateWithOpenAI` function (lines ~86-125)
   - Replace line ~48 with: `const translated = await translateWithOpenAI(text, sourceLang, targetLang, context);`

3. Set environment variable:
```bash
export OPENAI_API_KEY="your_key_here"
```

4. Restart dev server - translations will now be real!

### Option 2: Google Cloud Translation

```bash
npm install @google-cloud/translate
export GOOGLE_TRANSLATE_API_KEY="your_key"
```

Then uncomment the `translateWithGoogle` function in `pages/api/translate.ts`

### Option 3: DeepL

```bash
npm install deepl-node
export DEEPL_API_KEY="your_key"
```

Then uncomment the `translateWithDeepL` function in `pages/api/translate.ts`

## Manual Translation Test

Test the API directly:

```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to our restaurant",
    "sourceLang": "en",
    "targetLang": "es"
  }'
```

## Restore Original Site

If you want to go back to v1:

```bash
cd /Users/warren/dev/vending-machine/vm-web/templates/local-business/data
cp site.json.v1.backup.json site.json
```

## Key Files

- **site.json** - Now v2.0 with i18n config
- **public/locales/\*/common.json** - Translation files
- **I18N_INTEGRATION_GUIDE.md** - Complete integration guide
- **I18N_IMPLEMENTATION_SUMMARY.md** - What was built

## Add More Languages

```bash
cd /Users/warren/dev/vending-machine/vm-py
python i18n_utils.py \
  ../vm-web/templates/local-business/data/site.json \
  en \
  es fr de it pt  # Add German, Italian, Portuguese
```

## Backwards Compatibility

✅ All existing sites (v1) continue working exactly as before  
✅ No breaking changes  
✅ Language toggle only appears for v2 sites  
✅ Easy rollback - just restore backup

That's it! You now have multilingual support with language switching. 🎉

