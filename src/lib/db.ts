/**
 * Database Connection for Static Site Generation
 * Fetches product data from PostgreSQL during build time
 * Falls back to mock data if database is unavailable
 */

import { Pool } from 'pg';

let pool: Pool | null = null;
let useMockData = false;

const dbPassword = import.meta.env.DB_PASSWORD || process.env.DB_PASSWORD;

// Check if we should use mock data (no password configured)
if (!dbPassword) {
  console.warn('[db] DB_PASSWORD not set - using mock data for SSG');
  useMockData = true;
}

export function getDbPool() {
  if (useMockData) {
    throw new Error('Mock data mode - no database connection');
  }

  if (!pool) {
    pool = new Pool({
      host: import.meta.env.DB_HOST || process.env.DB_HOST || '100.101.131.71',
      port: parseInt(import.meta.env.DB_PORT || process.env.DB_PORT || '5432'),
      database: import.meta.env.DB_NAME || process.env.DB_NAME || 'mtb_lens',
      user: import.meta.env.DB_USER || process.env.DB_USER || 'mtb_lens',
      password: dbPassword,
    });
  }
  return pool;
}

// Mock data for development/build without database
const MOCK_PRODUCTS: Product[] = [
  {
    product_id: 'mock-1',
    brand: 'Nike',
    model_name: 'Pegasus 41',
    slug: 'nike-pegasus-41',
    gender_target: 'Unisex',
    category: 'Road Running',
    price_tier: 'Mid-range',
    price_range_min: 4500,
    price_range_max: 5500,
    description_en: 'The reliable daily trainer with responsive cushioning.',
    description_th: 'รองเท้าวิ่งทุกวันที่เชื่อถือได้พร้อมการรองรับแรงกระแทกที่ตอบสนอง',
    primary_image_url: null,
    official_url: 'https://nike.com',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    product_id: 'mock-2',
    brand: 'Adidas',
    model_name: 'Ultraboost Light',
    slug: 'adidas-ultraboost-light',
    gender_target: 'Unisex',
    category: 'Road Running',
    price_tier: 'Premium',
    price_range_min: 6500,
    price_range_max: 7500,
    description_en: 'Lightweight comfort with BOOST technology.',
    description_th: 'น้ำหนักเบาสบายด้วยเทคโนโลยี BOOST',
    primary_image_url: null,
    official_url: 'https://adidas.com',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    product_id: 'mock-3',
    brand: 'ASICS',
    model_name: 'Gel-Nimbus 26',
    slug: 'asics-gel-nimbus-26',
    gender_target: 'Unisex',
    category: 'Road Running',
    price_tier: 'Premium',
    price_range_min: 6000,
    price_range_max: 7000,
    description_en: 'Maximum cushioning for long runs.',
    description_th: 'รองรับแรงกระแทกสูงสุดสำหรับการวิ่งระยะไกล',
    primary_image_url: null,
    official_url: 'https://asics.com',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    product_id: 'mock-4',
    brand: 'New Balance',
    model_name: 'Fresh Foam 1080v14',
    slug: 'new-balance-fresh-foam-1080v14',
    gender_target: 'Unisex',
    category: 'Daily Trainer',
    price_tier: 'Premium',
    price_range_min: 5500,
    price_range_max: 6500,
    description_en: 'Plush daily trainer with Fresh Foam cushioning.',
    description_th: 'รองเท้าฝึกซ้อมทุกวันนุ่มสบายด้วย Fresh Foam',
    primary_image_url: null,
    official_url: 'https://newbalance.com',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    product_id: 'mock-5',
    brand: 'Hoka',
    model_name: 'Clifton 9',
    slug: 'hoka-clifton-9',
    gender_target: 'Unisex',
    category: 'Road Running',
    price_tier: 'Mid-range',
    price_range_min: 5000,
    price_range_max: 5800,
    description_en: 'Lightweight maximalist cushioning for everyday running.',
    description_th: 'รองรับแรงกระแทกสูงสุดน้ำหนักเบาสำหรับวิ่งทุกวัน',
    primary_image_url: null,
    official_url: 'https://hoka.com',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    product_id: 'mock-6',
    brand: 'Mizuno',
    model_name: 'Wave Rider 28',
    slug: 'mizuno-wave-rider-28',
    gender_target: 'Unisex',
    category: 'Road Running',
    price_tier: 'Mid-range',
    price_range_min: 4800,
    price_range_max: 5500,
    description_en: 'Smooth ride with Wave technology.',
    description_th: 'การวิ่งที่ราบรื่นด้วยเทคโนโลยี Wave',
    primary_image_url: null,
    official_url: 'https://mizuno.com',
    created_at: new Date(),
    updated_at: new Date()
  }
];

export interface Product {
  product_id: string;
  brand: string;
  model_name: string;
  slug: string;
  gender_target: string;
  category: string;
  price_tier: string;
  price_range_min: number;
  price_range_max: number;
  description_en: string | null;
  description_th: string | null;
  primary_image_url: string | null;
  official_url: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get all products for static page generation
 */
export async function getAllProducts(): Promise<Product[]> {
  if (useMockData) {
    return MOCK_PRODUCTS;
  }

  const pool = getDbPool();

  const result = await pool.query<Product>(`
    SELECT
      product_id,
      brand,
      model_name,
      slug,
      gender_target,
      product_type as category,
      price_tier,
      price_range_min,
      price_range_max,
      description_en,
      description_th,
      primary_image_url,
      official_url,
      created_at,
      updated_at
    FROM mtb_lens.products
    WHERE deleted_at IS NULL
    ORDER BY brand, model_name
  `);

  return result.rows;
}

/**
 * Get single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (useMockData) {
    return MOCK_PRODUCTS.find(p => p.slug === slug) || null;
  }

  const pool = getDbPool();

  const result = await pool.query<Product>(`
    SELECT
      product_id,
      brand,
      model_name,
      slug,
      gender_target,
      product_type as category,
      price_tier,
      price_range_min,
      price_range_max,
      description_en,
      description_th,
      primary_image_url,
      official_url,
      created_at,
      updated_at
    FROM mtb_lens.products
    WHERE slug = $1 AND deleted_at IS NULL
    LIMIT 1
  `, [slug]);

  return result.rows[0] || null;
}

/**
 * Get products by brand
 */
export async function getProductsByBrand(brand: string): Promise<Product[]> {
  if (useMockData) {
    return MOCK_PRODUCTS.filter(p => p.brand === brand);
  }

  const pool = getDbPool();

  const result = await pool.query<Product>(`
    SELECT
      product_id,
      brand,
      model_name,
      slug,
      gender_target,
      product_type as category,
      price_tier,
      price_range_min,
      price_range_max,
      description_en,
      description_th,
      primary_image_url,
      official_url,
      created_at,
      updated_at
    FROM mtb_lens.products
    WHERE brand = $1 AND deleted_at IS NULL
    ORDER BY model_name
  `, [brand]);

  return result.rows;
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (useMockData) {
    return MOCK_PRODUCTS.filter(p => p.category === category);
  }

  const pool = getDbPool();

  const result = await pool.query<Product>(`
    SELECT
      product_id,
      brand,
      model_name,
      slug,
      gender_target,
      product_type as category,
      price_tier,
      price_range_min,
      price_range_max,
      description_en,
      description_th,
      primary_image_url,
      official_url,
      created_at,
      updated_at
    FROM mtb_lens.products
    WHERE product_type = $1 AND deleted_at IS NULL
    ORDER BY brand, model_name
  `, [category]);

  return result.rows;
}

/**
 * Get unique brands with product counts
 */
export async function getAllBrands(): Promise<{ brand: string; product_count: number }[]> {
  if (useMockData) {
    const brandCounts = MOCK_PRODUCTS.reduce((acc, p) => {
      acc[p.brand] = (acc[p.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(brandCounts)
      .map(([brand, product_count]) => ({ brand, product_count }))
      .sort((a, b) => b.product_count - a.product_count);
  }

  const pool = getDbPool();

  const result = await pool.query<{ brand: string; product_count: number }>(`
    SELECT
      brand,
      COUNT(*)::int as product_count
    FROM mtb_lens.products
    WHERE deleted_at IS NULL AND brand IS NOT NULL
    GROUP BY brand
    ORDER BY product_count DESC, brand
  `);

  return result.rows;
}

/**
 * Get unique categories with product counts
 */
export async function getAllCategories(): Promise<{ category: string; product_count: number }[]> {
  if (useMockData) {
    const catCounts = MOCK_PRODUCTS.reduce((acc, p) => {
      if (p.category) {
        acc[p.category] = (acc[p.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(catCounts)
      .map(([category, product_count]) => ({ category, product_count }))
      .sort((a, b) => b.product_count - a.product_count);
  }

  const pool = getDbPool();

  const result = await pool.query<{ category: string; product_count: number }>(`
    SELECT
      product_type as category,
      COUNT(*)::int as product_count
    FROM mtb_lens.products
    WHERE product_type IS NOT NULL AND product_type != '' AND deleted_at IS NULL
    GROUP BY product_type
    ORDER BY product_count DESC, product_type
  `);

  return result.rows;
}

/**
 * Close database connection (for cleanup)
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
