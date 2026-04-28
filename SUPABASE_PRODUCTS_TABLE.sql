-- ================================================
-- ADD PRODUCTS TABLE TO SUPABASE
-- Bill Management System - Products Feature
-- ================================================
-- Run this script in Supabase SQL Editor
-- ================================================

-- ================================================
-- TABLE: products
-- Stores product catalog for invoices
-- ================================================
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hsn_code VARCHAR(50),
  gst_rate DECIMAL(5, 2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEX for better query performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- ================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ================================================
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on products table
-- ================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES: products
-- ================================================
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own products" ON public.products;
CREATE POLICY "Users can create own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================
-- GRANT PERMISSIONS
-- ================================================
GRANT ALL ON public.products TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE products_id_seq TO anon, authenticated;

-- ================================================
-- SETUP COMPLETE
-- ================================================
SELECT 'Products table setup complete! ✅' AS status;
