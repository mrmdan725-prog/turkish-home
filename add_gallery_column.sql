-- Add gallery support for multiple images
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;

-- Ensure RLS policies cover the new column (usually automatic for existing rows, but good to check)
COMMENT ON COLUMN products.gallery IS 'Array of additional image URLs for the product';
