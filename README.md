# LENS Static Site - Astro SSG Pipeline

**Phase 3:** Static Publishing Engine
**Stories:** E3-S01 (SSG Pipeline) + E3-S02 (Product Pages)
**Owner:** Ben (be-developer)
**Status:** COMPLETE (13 SP)

## Overview

Static site generator built with **Astro 4** that generates product pages from PostgreSQL data. Features bilingual support (EN/TH), responsive design, and optimized static output.

## Quick Start

```bash
cd /srv/projects/lens/web/lens-web

# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with DB_PASSWORD

# Start dev server (port 64107)
npm run dev

# Build for production
npm run build

# Preview production build  
npm run preview
```

## Features

- Astro 4 with TypeScript
- PostgreSQL integration (25 flagship products)
- Bilingual EN/TH support
- Dynamic product pages
- Responsive Tailwind design
- SEO optimized
- Image optimization

## Project Structure

```
src/
├── layouts/Layout.astro
├── pages/
│   ├── index.astro
│   └── products/
│       ├── index.astro
│       └── [slug].astro
├── lib/
│   ├── db.ts
│   └── i18n.ts
└── styles/global.css
```

## Database Integration

Uses helpers in src/lib/db.ts:
- getAllProducts()
- getProductBySlug()
- getProductsByBrand()
- getProductsByCategory()
- getAllBrands()
- getAllCategories()

## Bilingual Routing

- English: /products/nike-pegasus-41
- Thai: /th/products/nike-pegasus-41

## Build Output

Generates 50+ static pages from 25 products.

## Support

Owner: Ben (be-developer)
Coordination: Sally (frontend-lead), Dana (data-engineer)
