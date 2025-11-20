const fs = require('fs');
const path = require('path');

// Read site.json to determine i18n configuration
const siteJsonPath = path.join(__dirname, 'data', 'site.json');
let i18nConfig = {
  defaultLocale: 'en',
  locales: ['en'],
};

if (fs.existsSync(siteJsonPath)) {
  try {
    const site = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8'));
    if (site.version === '2.0' && site.i18n?.enabled) {
      i18nConfig = {
        defaultLocale: site.i18n.defaultLanguage || 'en',
        locales: site.i18n.availableLanguages || ['en'],
      };
    }
  } catch (e) {
    console.warn('⚠️  Could not parse site.json for i18n config:', e.message);
  }
}

module.exports = {
  i18n: {
    defaultLocale: i18nConfig.defaultLocale,
    locales: i18nConfig.locales,
    localeDetection: false,
  },
  localePath: typeof window === 'undefined' ? path.resolve('./public/locales') : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};

