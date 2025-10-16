/**
 * Dynamic HTML content loader
 * 
 * This module dynamically requires .html files at build time using webpack's html-loader.
 * We can't use static imports because we don't know which files exist until build time.
 */

export async function loadMenuHtml(tabId: string): Promise<string> {
  try {
    // @ts-ignore - Dynamic require for html files
    const htmlContent = require(`../../public/html-content/menu-${tabId}.html`);
    return htmlContent.default || htmlContent;
  } catch (e) {
    console.warn(`Could not load menu HTML for tab: ${tabId}`, e);
    return '';
  }
}

export async function loadPrivacyPolicy(): Promise<string> {
  try {
    // @ts-ignore
    const htmlContent = require(`../../public/html-content/privacy-policy.html`);
    return htmlContent.default || htmlContent;
  } catch (e) {
    console.warn('Could not load privacy policy HTML', e);
    return '';
  }
}

export async function loadTermsConditions(): Promise<string> {
  try {
    // @ts-ignore
    const htmlContent = require(`../../public/html-content/terms-conditions.html`);
    return htmlContent.default || htmlContent;
  } catch (e) {
    console.warn('Could not load terms & conditions HTML', e);
    return '';
  }
}

