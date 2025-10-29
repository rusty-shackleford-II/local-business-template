# Image Bandwidth Protection Guide

This guide explains how to prevent crawlers and bots from running up your image bandwidth costs on sites deployed with the local-business template.

## Overview

**How Deployment Works:**
1. During deployment, images are **copied from Supabase Storage to GitHub**
2. GitHub pushes to Cloudflare Pages
3. Images are served from **Cloudflare CDN**, NOT Supabase
4. Supabase bandwidth is only used **during deployment** (one-time per deploy)
5. All visitor traffic hits Cloudflare, not Supabase ✅

This means crawler protection focuses on **Cloudflare**, not Supabase.

---

## ✅ Already Implemented

### 1. robots.txt Configuration

The `public/robots.txt` file now includes:
- Blocks image crawlers (Googlebot-Image, Bingbot image crawlers)
- Disallows direct crawling of image file extensions
- Note: This is advisory only - malicious bots can ignore it

---

## 🔧 Recommended: Cloudflare Configuration

Since your sites deploy to Cloudflare Pages, you can use Cloudflare's built-in protection features:

### A. Enable Bot Fight Mode (Free)

1. Go to Cloudflare Dashboard → Security → Bots
2. Enable "Bot Fight Mode" (on Free plan) or "Super Bot Fight Mode" (on paid plans)
3. This will challenge or block automated traffic

### B. Configure Rate Limiting

Create a rate limiting rule for images:

**Cloudflare Dashboard → Security → WAF → Rate limiting rules**

```
Rule Name: Image Bandwidth Protection
If incoming requests match:
  - URI Path contains ".jpg" OR ".jpeg" OR ".png" OR ".webp" OR ".gif"
  
Then:
  - Rate: 50 requests per 10 seconds per IP
  - Action: Block for 1 hour
  - Response: Custom HTML or CAPTCHA challenge
```

### C. Hotlink Protection

Prevent other sites from embedding your images:

**Cloudflare Dashboard → Scrape Shield → Hotlink Protection**

1. Enable "Hotlink Protection"
2. This blocks requests where the Referer header doesn't match your domain

Alternative: Create a WAF rule:

```
Rule Name: Block Image Hotlinking
If incoming requests match:
  - URI Path contains ".jpg" OR ".jpeg" OR ".png" OR ".webp"
  AND
  - Referer does not contain "yourdomain.com"
  AND
  - Referer is not empty (allow direct browser access)
  
Then:
  - Action: Block
```

### D. Cache Everything with Long TTL

**Cloudflare Dashboard → Rules → Page Rules (or Cache Rules)**

```
URL Pattern: *.jpg, *.png, *.jpeg, *.webp, *.gif
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 day
```

This reduces hits to your Supabase storage (bandwidth charges).

### E. Enable Image Optimization (Pro plan or higher)

**Cloudflare Dashboard → Speed → Optimization**

- Enable "Polish" (lossless/lossy compression)
- Enable "WebP" conversion for supported browsers
- This reduces bandwidth by serving smaller images

---

## 🛡️ Supabase Storage Configuration

### A. Enable RLS and Create Policies

If your images are in a public bucket, consider adding Row Level Security:

```sql
-- Create a policy that limits access rate
-- (Note: Supabase RLS doesn't have native rate limiting,
--  but you can use edge functions)
```

### B. Supabase Storage (Optional - Only Deployment Traffic)

Since images are only downloaded from Supabase **during deployment** (not visitor traffic), Supabase bandwidth protection is less critical. However, you can still:

1. **Monitor deployment frequency** - Each redeploy re-downloads all images
2. **Set Supabase usage alerts** - Get notified of unusual bandwidth spikes
3. **Use smaller images** - Reduce deployment bandwidth usage

**Note:** Visitor traffic does NOT hit Supabase, so crawler bandwidth issues are minimal here.

---

## 📊 Recommended Configuration Tiers

### Tier 1: Basic (Free)
- ✅ Updated robots.txt (done)
- ✅ Cloudflare Bot Fight Mode (free)
- ✅ Cloudflare Cache Rules (free)
- ✅ Hotlink Protection (free)

**Estimated bandwidth reduction: 40-60%**

### Tier 2: Enhanced (Cloudflare Pro - $20/mo)
- All Tier 1 features
- ✅ Super Bot Fight Mode
- ✅ Advanced Rate Limiting
- ✅ Polish image optimization
- ✅ More granular WAF rules

**Estimated bandwidth reduction: 70-85%**

### Tier 3: Maximum (Cloudflare Business - $200/mo)
- All Tier 2 features
- ✅ Custom SSL certificates
- ✅ 100% uptime SLA
- ✅ DDoS protection
- ✅ Image Resizing at edge

**Estimated bandwidth reduction: 85-95%**

---

## 🎯 Quick Start: Minimal Setup (5 minutes)

1. **Enable Bot Fight Mode** in Cloudflare
2. **Enable Hotlink Protection** in Cloudflare
3. **Create a Page Rule** for image caching:
   - Pattern: `*yourdomain.com/*.{jpg,jpeg,png,webp,gif}`
   - Settings: "Cache Everything" + "Edge Cache TTL: 1 month"

This will handle 90% of common crawler issues with zero code changes.

---

## 📈 Monitoring

### Track bandwidth usage:

1. **Supabase Dashboard** → Project → Storage
   - Monitor "Storage Usage" and "Bandwidth"
   - Set up alerts for unusual spikes

2. **Cloudflare Dashboard** → Analytics → Traffic
   - Monitor "Cached vs Uncached" ratio
   - Check "Threats" section for blocked bots

3. **Set Budget Alerts**
   - In Supabase: Project Settings → Usage Limits
   - Set hard limits to prevent surprise charges

---

## ⚠️ Important Considerations

### SEO Impact
- Blocking Googlebot-Image means your images won't appear in Google Image Search
- If you want images indexed but want to save bandwidth, only use rate limiting and caching
- Consider: Do you need image search traffic, or is regular web search sufficient?

### Legitimate Users
- Rate limiting should be generous enough to not affect real users
- Recommendation: 50 requests per 10 seconds per IP (very generous)
- Most legitimate users won't load 50 images in 10 seconds

### Social Media Previews
- Ensure social media crawlers can still access og:image
- Add exceptions for:
  - `facebookexternalhit`
  - `Twitterbot`
  - `LinkedInBot`
  - `WhatsApp`

Example WAF rule adjustment:
```
If:
  - (URI contains image extensions)
  AND
  - User-Agent does NOT contain "facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp"
Then:
  - Apply rate limit
```

---

## 🔍 Debugging

If legitimate users report issues:

1. Check Cloudflare Firewall Events
   - Security → Security Events
   - Filter by action "Block" or "Challenge"
   - Look for false positives

2. Temporarily disable rules one by one
3. Adjust rate limits or add exceptions
4. Monitor for 24-48 hours

---

## 📚 Additional Resources

- [Cloudflare Bot Management](https://developers.cloudflare.com/bots/)
- [Cloudflare Rate Limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Supabase Storage Rate Limits](https://supabase.com/docs/guides/storage/limits)
- [robots.txt Specification](https://developers.google.com/search/docs/advanced/robots/robots_txt)

---

## 💡 Alternative: Serve Critical Images Only

Another approach is to reduce the number of images loaded:

1. **Lazy load everything** (already implemented via Next.js Image)
2. **Use progressive JPEG** for hero images
3. **Serve WebP with JPEG fallback**
4. **Limit image dimensions** in site.json generation
5. **Use placeholders** for less critical images

This is implemented in the template's `IdbImage.tsx` component, which already handles lazy loading and progressive loading.

