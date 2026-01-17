# LENS Production Deployment to Cloudflare Pages

**Domain:** shoes.guide
**Date:** 2026-01-16
**Status:** READY FOR DEPLOYMENT
**Story:** E3-S06 Cloudflare Pages Deployment

---

## Pre-Deployment Checklist

✅ **Build Verified:** 18 static pages generated
✅ **Domain Confirmed:** shoes.guide
✅ **Configuration Updated:** astro.config.mjs site URL set to https://shoes.guide
✅ **Security Headers:** Configured in `public/_headers`
✅ **Node Version:** 20 (set in `.node-version`)
✅ **Build Output:** `dist/` directory ready

---

## Deployment Steps

### Step 1: Access Cloudflare Dashboard

1. Go to https://dash.cloudflare.com
2. Log in with Cloudflare account credentials
3. Navigate to **Pages** in the left sidebar

---

### Step 2: Create New Pages Project

1. Click **Create a project**
2. Choose **Connect to Git** (or use Direct Upload for quick start)

#### Option A: Git Connection (Recommended)

1. Select **GitHub** (or your git provider)
2. Authorize Cloudflare to access your repositories
3. Select the **LENS** repository
4. Configure build settings:

```
Build command: npm run build
Build output directory: dist
Root directory: web/lens-web
Branch: main
```

#### Option B: Direct Upload (Quick Start)

1. Select **Upload assets**
2. Navigate to `/srv/projects/lens/web/lens-web/dist/`
3. Drag and drop the entire `dist` folder contents
4. Click **Deploy site**

---

### Step 3: Configure Environment Variables

**IMPORTANT:** Set these in Cloudflare Pages → Settings → Environment variables

#### Production Environment:

```
NODE_VERSION=20
```

**Note:** Database variables are only needed if building on Cloudflare. Since we're using pre-built static files, they're optional.

Optional (for future CI/CD builds):
```
DB_HOST=100.101.131.71
DB_PORT=5432
DB_NAME=mtb_lens
DB_USER=mtb_lens
DB_PASSWORD=<your_secure_password>
```

---

### Step 4: Initial Deployment

1. Cloudflare will automatically build (if using Git) or deploy (if using Direct Upload)
2. Wait for deployment to complete (typically 1-2 minutes)
3. You'll receive a temporary URL: `https://<project-name>.pages.dev`
4. Verify the site loads correctly

**Expected Result:**
- Homepage displays product catalog
- Navigation works (brands, categories, products)
- 18 pages accessible
- Images load correctly

---

### Step 5: Configure Custom Domain (shoes.guide)

#### In Cloudflare Pages:

1. Go to your Pages project
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter: `shoes.guide`
5. Cloudflare will verify domain ownership

#### DNS Configuration:

**If domain is already in Cloudflare:**
- Cloudflare will automatically add the necessary DNS records
- Wait 1-2 minutes for DNS propagation

**If domain is external:**
1. Add CNAME record at your DNS provider:
   ```
   Type: CNAME
   Name: @ (or leave blank for root)
   Value: <your-project>.pages.dev
   ```
2. For root domain (shoes.guide), you may need CNAME flattening or ALIAS record
3. Wait for DNS propagation (up to 48 hours, typically 5-10 minutes)

#### Add www subdomain (optional):

1. In Custom domains, click **Add a domain**
2. Enter: `www.shoes.guide`
3. Cloudflare will configure automatically

---

### Step 6: SSL/TLS Configuration

**Automatic SSL:**
- Cloudflare automatically provisions SSL certificates
- HTTPS is enforced by default
- No additional configuration needed

**Verify SSL:**
1. Visit https://shoes.guide
2. Check for padlock icon in browser
3. Verify certificate is valid

---

### Step 7: Verify Deployment

**Test Checklist:**

✅ **Homepage:** https://shoes.guide/
✅ **Product Pages:** https://shoes.guide/products/nike-pegasus-41/
✅ **Brand Pages:** https://shoes.guide/brands/nike/
✅ **Category Pages:** https://shoes.guide/category/road-running/
✅ **Sitemap:** https://shoes.guide/sitemap-index.xml
✅ **Security Headers:** Check in browser DevTools → Network → Response Headers

**Expected Headers:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Post-Deployment Configuration

### Enable Analytics (Optional)

1. In Cloudflare Pages → **Analytics**
2. Enable **Web Analytics**
3. Cloudflare will automatically inject tracking script

### Configure Caching (Automatic)

Cloudflare automatically caches:
- HTML: `public, max-age=0, must-revalidate`
- Static assets: `public, max-age=31536000, immutable` (from `_headers`)

### Preview Deployments (Git only)

If using Git connection:
- Every commit triggers a new deployment
- Pull requests get preview URLs
- Automatic rollback capability

---

## CI/CD Pipeline (Future Enhancement)

### Automated Deployments via Git:

**Trigger:** Push to `main` branch
**Process:**
1. Cloudflare detects git push
2. Runs `npm run build` in `web/lens-web/`
3. Deploys to production
4. Previous deployment remains accessible for rollback

**Preview Deployments:**
- Pull requests: `https://<branch>.<project>.pages.dev`
- Commits: Unique URLs for each deployment

---

## Rollback Procedure

### Via Cloudflare Dashboard:

1. Go to **Deployments** tab
2. Find previous successful deployment
3. Click **...** (three dots)
4. Select **Rollback to this deployment**
5. Confirm rollback

**Note:** All deployments are preserved, allowing instant rollback to any previous version.

---

## Troubleshooting

### Issue: Domain not resolving

**Solution:**
1. Check DNS propagation: https://dnschecker.org
2. Verify CNAME record points to `<project>.pages.dev`
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Wait up to 48 hours for full global DNS propagation

### Issue: SSL certificate not provisioning

**Solution:**
1. Ensure domain is properly configured in Custom domains
2. Remove and re-add custom domain
3. Verify DNS is pointing to Cloudflare
4. Wait 15-30 minutes for certificate issuance

### Issue: 404 on product pages

**Solution:**
1. Verify `dist/` contains all generated pages
2. Check build logs for errors
3. Ensure `build.format: 'directory'` in astro.config.mjs
4. Rebuild: `npm run build`

### Issue: Images not loading

**Solution:**
1. Check `astro.config.mjs` image domains configuration
2. Verify external image URLs are accessible
3. Check browser console for CORS errors

---

## Performance Expectations

### Lighthouse Scores (Expected):

- **Performance:** 95+ (static site, global CDN)
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 100 (sitemap, meta tags, semantic HTML)

### Global CDN:

- **200+ edge locations** worldwide
- **Brotli compression** automatic
- **HTTP/2 & HTTP/3** enabled
- **Smart routing** to nearest data center

---

## Monitoring & Maintenance

### Check Deployment Status:

```bash
# Via API (if wrangler CLI installed)
wrangler pages deployment list --project-name=lens-running-shoes
```

### Monitor Analytics:

1. Cloudflare Pages → **Analytics**
2. View: Page views, visitors, bandwidth
3. Check: Most popular pages, referrers, devices

### Update Content:

**Option 1: Rebuild and Redeploy**
1. Update content in database
2. Run `npm run build` locally
3. Git commit and push (automatic deployment)

**Option 2: Direct Upload**
1. Rebuild locally
2. Upload new `dist/` folder to Cloudflare Pages

---

## Security

### DDoS Protection:

- **Automatic:** Cloudflare's DDoS protection active
- **Rate limiting:** Available in Cloudflare dashboard
- **WAF:** Web Application Firewall available

### HTTPS Enforcement:

- **Forced:** All HTTP requests redirect to HTTPS
- **HSTS:** HTTP Strict Transport Security enabled
- **TLS 1.3:** Modern encryption protocol

---

## Deployment Summary

**Pre-Built Artifacts:**
- Location: `/srv/projects/lens/web/lens-web/dist/`
- Pages: 18 static HTML pages
- Assets: CSS, JavaScript, images
- Size: ~500KB (compressed)

**Deployment Methods:**
1. ✅ Git integration (recommended for CI/CD)
2. ✅ Direct upload (fastest for initial deploy)
3. ✅ Wrangler CLI (for automation)

**Production URL:** https://shoes.guide
**Preview URL:** https://lens-running-shoes.pages.dev (temporary)

---

## Next Steps After Deployment

1. ✅ Verify site loads on https://shoes.guide
2. ✅ Test all pages and navigation
3. ✅ Check mobile responsiveness
4. ✅ Run Lighthouse audit
5. ✅ Set up monitoring alerts
6. ✅ Enable Web Analytics
7. ✅ Configure custom 404 page (optional)
8. ✅ Set up redirect rules if needed

---

## Support & Documentation

**Cloudflare Pages Docs:**
https://developers.cloudflare.com/pages/

**Astro Deployment Guide:**
https://docs.astro.build/en/guides/deploy/cloudflare/

**LENS Project Docs:**
- `/srv/projects/lens/web/lens-web/DEPLOYMENT.md` - Detailed deployment guide
- `/srv/projects/lens/web/lens-web/README.md` - Project overview

---

## Contact

**Deployment Owner:** Ben (be-developer)
**Architect:** Danny (architect)
**Domain:** shoes.guide
**Project:** LENS Running Shoes Guide

---

## Deployment Checklist

Use this checklist during deployment:

- [ ] Cloudflare account logged in
- [ ] Pages project created
- [ ] Build settings configured (if using Git)
- [ ] Environment variables set (NODE_VERSION=20)
- [ ] Initial deployment successful
- [ ] Temporary URL verified working
- [ ] Custom domain shoes.guide added
- [ ] DNS configured (CNAME or automatic)
- [ ] SSL certificate provisioned
- [ ] HTTPS working on shoes.guide
- [ ] All pages accessible (18 pages)
- [ ] Images loading correctly
- [ ] Security headers verified
- [ ] Sitemap accessible
- [ ] Mobile responsive verified
- [ ] Analytics enabled (optional)
- [ ] Team notified of deployment

---

**E3-S06: Production Deployment - READY** ✅

**Build Status:** Complete (18 pages)
**Configuration:** Updated for shoes.guide
**Artifacts:** Ready in `dist/` directory
**Documentation:** Complete

**Ready for Cloudflare Pages deployment!** 🚀

---

**End of Production Deployment Guide**
