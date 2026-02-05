import { Html, Head, Main, NextScript } from 'next/document';
import site from '../data/site.json';

// RTL languages that need right-to-left text direction
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

export default function Document() {
  // Determine language and direction from site.json
  const defaultLanguage = (site as any)?.i18n?.defaultLanguage || 'en';
  const isRTL = RTL_LANGUAGES.includes(defaultLanguage);
  const direction = isRTL ? 'rtl' : 'ltr';

  return (
    <Html lang={defaultLanguage} dir={direction}>
      <Head>
        {/* Explicit UTF-8 charset to prevent encoding issues */}
        <meta charSet="utf-8" />
        
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload Inter font for better performance */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          as="style"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Load Arabic font if needed */}
        {defaultLanguage === 'ar' && (
          <>
            <link
              rel="preload"
              href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap"
              as="style"
            />
            <link
              href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap"
              rel="stylesheet"
            />
          </>
        )}
      </Head>
      <body className="font-sans">
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
