/**
 * Internationalization (i18n) Utilities
 * Supports English and Thai bilingual content
 */

export type Locale = 'en' | 'th';

export const defaultLocale: Locale = 'en';
export const locales: Locale[] = ['en', 'th'];

export interface Translations {
  [key: string]: {
    en: string;
    th: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.home': {
    en: 'Home',
    th: 'หน้าหลัก'
  },
  'nav.products': {
    en: 'Products',
    th: 'ผลิตภัณฑ์'
  },
  'nav.compare': {
    en: 'Compare',
    th: 'เปรียบเทียบ'
  },
  'nav.brands': {
    en: 'Brands',
    th: 'แบรนด์'
  },

  // Product Page
  'product.price': {
    en: 'Price',
    th: 'ราคา'
  },
  'product.buy_now': {
    en: 'Buy Now',
    th: 'ซื้อเลย'
  },
  'product.specifications': {
    en: 'Specifications',
    th: 'รายละเอียด'
  },
  'product.reviews': {
    en: 'Reviews',
    th: 'รีวิว'
  },
  'product.related': {
    en: 'Related Products',
    th: 'สินค้าที่เกี่ยวข้อง'
  },

  // Common
  'common.loading': {
    en: 'Loading...',
    th: 'กำลังโหลด...'
  },
  'common.error': {
    en: 'Error',
    th: 'ข้อผิดพลาด'
  },
  'common.not_found': {
    en: 'Not Found',
    th: 'ไม่พบข้อมูล'
  },

  // Category/Brand Pages (E3-S04)
  'brands.title': {
    en: 'Running Shoe Brands',
    th: 'แบรนด์รองเท้าวิ่ง'
  },
  'brands.products': {
    en: 'products',
    th: 'สินค้า'
  },
  'brands.view_all': {
    en: 'View all',
    th: 'ดูทั้งหมด'
  },
  'category.title': {
    en: 'Running Shoe Categories',
    th: 'หมวดหมู่รองเท้าวิ่ง'
  },
  'category.road_running': {
    en: 'Road Running',
    th: 'วิ่งถนน'
  },
  'category.trail_running': {
    en: 'Trail Running',
    th: 'วิ่งเทรล'
  },
  'category.racing': {
    en: 'Racing',
    th: 'แข่งขัน'
  },
  'category.daily_trainer': {
    en: 'Daily Trainer',
    th: 'ฝึกซ้อมทั่วไป'
  },
  'category.stability': {
    en: 'Stability',
    th: 'รองรับเสถียรภาพ'
  },
  'filter.brands': {
    en: 'Brands',
    th: 'แบรนด์'
  },
  'filter.categories': {
    en: 'Categories',
    th: 'หมวดหมู่'
  },
  'filter.clear_all': {
    en: 'Clear all',
    th: 'ล้างทั้งหมด'
  },
  'filter.results': {
    en: 'results',
    th: 'ผลลัพธ์'
  },
  'filter.sort_by': {
    en: 'Sort by',
    th: 'เรียงตาม'
  }
};

export function t(key: string, locale: Locale = defaultLocale): string {
  return translations[key]?.[locale] || key;
}

export function getLocalizedContent(
  contentEn: string | null,
  contentTh: string | null,
  locale: Locale
): string {
  if (locale === 'th' && contentTh) {
    return contentTh;
  }
  return contentEn || contentTh || '';
}
