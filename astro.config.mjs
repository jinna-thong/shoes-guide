// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Production URL
  site: 'https://shoes.guide',

  // Static Site Generation
  output: 'static',

  integrations: [
    sitemap(),
  ],

  // Bilingual support (EN/TH)
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'th'],
    routing: {
      prefixDefaultLocale: false
    }
  },

  // Image optimization
  image: {
    domains: ['static.nike.com', 'assets.adidas.com', 'images.asics.com'],
  },

  // Build configuration
  build: {
    format: 'directory', // /products/nike-pegasus-41/ instead of .html
  },

  // Dev server
  server: {
    port: 64107, // LENS port scheme
  },

  vite: {
    plugins: [tailwindcss()]
  }
});