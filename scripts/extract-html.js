const fs = require('fs');
const path = require('path');

// Unescape HTML entities
function unescapeHtml(html) {
  if (!html) return html;
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Extract HTML content from site.json and save as separate .html files
function extractHtml() {
  const siteJsonPath = path.join(__dirname, '..', 'data', 'site.json');
  const outputDir = path.join(__dirname, '..', 'public', 'html-content');

  // Check if site.json exists
  if (!fs.existsSync(siteJsonPath)) {
    console.log('⚠️  site.json not found, skipping HTML extraction');
    return;
  }

  // Read site.json
  const siteData = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8'));
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let filesCreated = 0;

  // Extract privacy policy
  const privacyText = siteData?.footer?.privacyPolicyText;
  if (privacyText) {
    const unescaped = unescapeHtml(privacyText);
    fs.writeFileSync(path.join(outputDir, 'privacy-policy.html'), unescaped, 'utf8');
    console.log('✓ Created privacy-policy.html');
    filesCreated++;
  }

  // Extract terms and conditions
  const termsText = siteData?.footer?.termsAndConditionsText;
  if (termsText) {
    const unescaped = unescapeHtml(termsText);
    fs.writeFileSync(path.join(outputDir, 'terms-conditions.html'), unescaped, 'utf8');
    console.log('✓ Created terms-conditions.html');
    filesCreated++;
  }

  // Extract menu HTML content from tabs
  const tabs = siteData?.menu?.tabs || [];
  tabs.forEach((tab, index) => {
    if (tab.htmlContent) {
      const tabId = tab.id || `tab-${index}`;
      const unescaped = unescapeHtml(tab.htmlContent);
      fs.writeFileSync(path.join(outputDir, `menu-${tabId}.html`), unescaped, 'utf8');
      console.log(`✓ Created menu-${tabId}.html`);
      filesCreated++;
    }
  });

  console.log(`\n✅ HTML extraction complete: ${filesCreated} files created in public/html-content/`);
}

try {
  extractHtml();
} catch (error) {
  console.error('❌ HTML extraction failed:', error.message);
  // Don't fail the build
  process.exit(0);
}

