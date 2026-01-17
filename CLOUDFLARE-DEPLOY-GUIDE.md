# Cloudflare Pages Deployment Guide

## Quick Deploy Options

### Option 1: Add GitHub Secret (Recommended)
1. Go to: https://github.com/jinna-thong/shoes-guide/settings/secrets/actions
2. Click "New repository secret"
3. Name: `CLOUDFLARE_API_TOKEN`
4. Value: Your Cloudflare API token (with Pages:Edit permission)
5. Click "Add secret"
6. Re-run workflow: `gh workflow run "Deploy to Production"`

### Option 2: Manual Cloudflare Dashboard Upload
1. Go to: https://dash.cloudflare.com
2. Navigate to: Pages → shoes-guide
3. Click "Create deployment"
4. Upload the `dist/` folder or `shoes-guide-dist.zip`
5. Click "Deploy"

### Option 3: CLI Deploy with Token
```bash
cd /srv/projects/lens/web/lens-web
CLOUDFLARE_API_TOKEN="your-token-here" npx wrangler pages deploy dist --project-name=shoes-guide
```

## How to Get Cloudflare API Token
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template: "Edit Cloudflare Pages"
4. Or create custom token with permissions:
   - Account → Cloudflare Pages → Edit
5. Copy the token (shown only once)

## Verification
After deployment, verify at:
- Production: https://shoes.guide
- Preview: https://<deploy-id>.shoes-guide.pages.dev

## Build Info
- Pages: 309
- Size: 7.6MB
- Build time: ~820ms
- Engine: Astro 5.16.10

## Files Ready
- `dist/` - Static HTML files
- `shoes-guide-dist.zip` - Compressed for manual upload
