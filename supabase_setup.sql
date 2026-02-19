-- Create Products table
CREATE TABLE products (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  barcode TEXT,
  category TEXT,
  image TEXT,
  show_online BOOLEAN DEFAULT false,
  online_price DECIMAL(10,2),
  long_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Sales table
CREATE TABLE sales (
  id TEXT PRIMARY KEY, -- Using custom Order ID like WEB-123456
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL,
  payment_type TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  source TEXT DEFAULT 'pos', -- 'pos' or 'online'
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Customers table
CREATE TABLE customers (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  debt DECIMAL(10,2) DEFAULT 0,
  last_transaction DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Expenses table
CREATE TABLE expenses (
  id BIGINT PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Purchases table
CREATE TABLE purchases (
  id BIGINT PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  supplier TEXT,
  items_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) - For now keep it simple or allow all
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (Simplified for initial setup)
CREATE POLICY "Public Read Access" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON sales FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON customers FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON expenses FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON purchases FOR SELECT USING (true);

-- Create policies for insert (Simplified)
CREATE POLICY "Public Insert Access" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated All Access" ON products FOR ALL USING (true);
