-- Web Customers Table for Online Store
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS web_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    address TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE web_customers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to register (insert)
DROP POLICY IF EXISTS "web_customers_insert" ON web_customers;
CREATE POLICY "web_customers_insert" ON web_customers
    FOR INSERT WITH CHECK (true);

-- Allow anyone to read (for login validation)
DROP POLICY IF EXISTS "web_customers_select" ON web_customers;
CREATE POLICY "web_customers_select" ON web_customers
    FOR SELECT USING (true);

-- Allow anyone to update (profile changes)
DROP POLICY IF EXISTS "web_customers_update" ON web_customers;
CREATE POLICY "web_customers_update" ON web_customers
    FOR UPDATE USING (true);

-- Add customer_id column to sales table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE sales ADD COLUMN customer_id UUID REFERENCES web_customers(id);
    END IF;
END $$;

-- Add invoice columns to sales table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales' AND column_name = 'invoice_number'
    ) THEN
        ALTER TABLE sales ADD COLUMN invoice_number TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales' AND column_name = 'invoice_date'
    ) THEN
        ALTER TABLE sales ADD COLUMN invoice_date TIMESTAMPTZ;
    END IF;
END $$;
