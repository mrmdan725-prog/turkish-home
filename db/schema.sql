-- Database Schema for Turkish Home POS System

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table (Invoices)
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    total_amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'cash', -- 'cash', 'card', 'transfer'
    status VARCHAR(20) DEFAULT 'completed', -- 'completed', 'cancelled', 'refunded'
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sale Items Table (Junction table with pricing snapshot)
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    UNIQUE(sale_id, product_id)
);

-- Categories Table (For grouping and management)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0
);

-- Sample Data
INSERT INTO categories (name) VALUES ('أطقم حلل'), ('أجهزة كهربائية'), ('رفايع'), ('أطقم سفره');

INSERT INTO products (name, barcode, category, price, stock_quantity) VALUES 
('طقم حلل جرانيت - 10 قطع', '1234567890123', 'أطقم حلل', 4500.00, 20),
('غلاية مياه كهربائية 1.7 لتر', '1234567890124', 'أجهزة كهربائية', 850.00, 15),
('طقم معالق ستانلس - 24 قطعة', '1234567890125', 'رفايع', 1200.00, 30);

-- Suppliers Table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders (طلبات الشراء)
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    total_cost DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'received', 'cancelled'
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    received_date TIMESTAMP WITH TIME ZONE
);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- Customers Table (إدارة العملاء والديون)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100),
    address TEXT,
    total_debt DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer Transactions (سجل الديون والمدفوعات)
CREATE TABLE customer_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'sale_debt' (دين جديد), 'payment' (سداد)
    amount DECIMAL(10, 2) NOT NULL,
    sale_id INTEGER REFERENCES sales(id), -- If linked to a specific invoice
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Sample Data for Customers
INSERT INTO customers (name, phone, total_debt) VALUES 
('أحمد محمد علي', '01012345678', 1200.00),
('سارة محمود حسن', '01298765432', 0.00),
('ياسين إبراهيم', '01155443322', 450.00);


-- Sales Returns (المرتجعات)
CREATE TABLE sales_returns (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id),
    total_refund DECIMAL(10, 2) NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT
);

-- Return Items
CREATE TABLE return_items (
    id SERIAL PRIMARY KEY,
    return_id INTEGER REFERENCES sales_returns(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL
);
