import React, { Suspense, lazy, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import { supabase } from './supabaseClient';
import './App.css';

const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const Storefront = lazy(() => import('./components/Storefront/Storefront'));
const POSDashboard = lazy(() => import('./components/POS/POSDashboard'));
const Invoices = lazy(() => import('./components/Invoices/Invoices'));
const Inventory = lazy(() => import('./components/Inventory/Inventory'));
const Customers = lazy(() => import('./components/Customers/Customers'));
const Reports = lazy(() => import('./components/Reports/Reports'));
const Settings = lazy(() => import('./components/Settings/Settings'));
const Purchases = lazy(() => import('./components/Purchases/Purchases'));
const TurkishAI = lazy(() => import('./components/TurkishAI/TurkishAI'));
const WebManager = lazy(() => import('./components/WebManager/WebManager'));

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('turkish_home_sales');
    return saved ? JSON.parse(saved) : [];
  });
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('turkish_home_products');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'طقم حلل جرانيت - 10 قطع', price: 4500, costPrice: 3200, category: 'أطقم حلل', barcode: '1234567890123', image: 'https://images.unsplash.com/photo-1584990333910-efef038b725c?auto=format&fit=crop&q=80&w=200', stock: 20, minStock: 5 },
      { id: 2, name: 'غلاية مياه كهربائية 1.7 لتر', price: 850, costPrice: 500, category: 'أجهزة كهربائية', barcode: '1234567890124', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=200', stock: 15, minStock: 5 },
      { id: 3, name: 'طقم معالق ستانلس - 24 قطعة', price: 1200, costPrice: 800, category: 'رفايع', barcode: '1234567890125', image: 'https://images.unsplash.com/photo-1594913785162-e67899b8004f?auto=format&fit=crop&q=80&w=200', stock: 30, minStock: 10 },
    ];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('turkish_home_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('turkish_home_customers');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'أحمد محمد علي', phone: '01012345678', debt: 1200, lastTransaction: '2024-02-15' },
      { id: 2, name: 'سارة محمود حسن', phone: '01298765432', debt: 0, lastTransaction: '2024-02-10' },
      { id: 3, name: 'ياسين إبراهيم', phone: '01155443322', debt: 450, lastTransaction: '2024-02-18' },
    ];
  });

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem('turkish_home_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem('turkish_home_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [pendingWebOrdersCount, setPendingWebOrdersCount] = useState(0);

  const fetchPendingCount = async () => {
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'online')
      .eq('status', 'pending');

    setPendingWebOrdersCount(count || 0);
  };

  useEffect(() => {
    fetchPendingCount();

    const sub = supabase.channel('pending_web').on('postgres_changes',
      { event: '*', schema: 'public', table: 'sales', filter: 'source=eq.online' },
      fetchPendingCount
    ).subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const [settings, setSettings] = useState({
    storeName: 'TURKISH HOME',
    address: 'شارع التجارة، الفرع الرئيسي',
    phone: '01012345678',
    taxId: '123-456-789',
    receiptHeader: 'أهلاً بكم في Turkish Home',
    receiptFooter: 'البضاعة المباعة لا ترد ولا تستبدل بدون فاتورة',
    printerName: 'XP-80 Hot Printer',
    autoPrint: true,
    showLogo: true,
    logo: null,
    whatsapp: '201012345678',
    whatsappMsg: 'استفسار بخصوص الفاتورة رقم {orderId}',
    showQR: true,
    qrType: 'whatsapp',
    categories: ['أطقم حلل', 'أجهزة كهربائية', 'رفايع', 'منظفات'],
    expenseCategories: ['عام', 'رواتب', 'إيجار', 'فواتير', 'هالك'],
    backupFrequency: 'daily',
    lowStockAlert: true,
    lowStockThreshold: 5,
    enableSounds: true,
    adminPassword: '',
    lockSettings: false
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('turkish_home_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('turkish_home_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('turkish_home_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('turkish_home_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('turkish_home_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('turkish_home_purchases', JSON.stringify(purchases));
  }, [purchases]);

  // Supabase Sync Logic
  const isCloudEnabled = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL';

  useEffect(() => {
    const fetchCloudData = async () => {
      if (!isCloudEnabled) return;

      try {
        console.log('Syncing with Supabase...');
        const { data: cloudProducts } = await supabase.from('products').select('*');
        if (cloudProducts && cloudProducts.length > 0) {
          // Merge logic: For now, cloud wins for online-specific fields
          // Merge logic: For now, cloud wins for online-specific fields
          setProducts(prev => {
            const merged = [...prev];
            cloudProducts.forEach(cp => {
              const mapped = {
                id: cp.id,
                name: cp.name,
                price: Number(cp.price),
                costPrice: Number(cp.cost_price || 0),
                stock: cp.stock || 0,
                minStock: cp.min_stock || 5,
                barcode: cp.barcode || '',
                category: cp.category || 'عام',
                image: cp.image || '',
                gallery: cp.gallery || [],
                showOnline: !!cp.show_online, // Force boolean
                onlinePrice: cp.online_price ? Number(cp.online_price) : null,
                longDescription: cp.long_description || ''
              };
              const idx = merged.findIndex(p => p.id === mapped.id);
              if (idx > -1) merged[idx] = { ...merged[idx], ...mapped };
              else merged.push(mapped);
            });
            return merged;
          });
        }

        const { data: cloudSales } = await supabase.from('sales').select('*').order('date', { ascending: false });
        if (cloudSales) {
          setSales(cloudSales.map(s => ({
            orderId: s.id,
            date: s.date,
            total: Number(s.total),
            items: s.items,
            paymentType: s.payment_type || 'cash',
            customerName: s.customer_name || '',
            customerPhone: s.customer_phone || '',
            customerAddress: s.customer_address || '',
            source: s.source || 'pos',
            status: s.status || 'completed'
          })));
        }

        const { data: cloudCustomers } = await supabase.from('customers').select('*');
        if (cloudCustomers) {
          setCustomers(cloudCustomers.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            debt: Number(c.debt || 0),
            lastTransaction: c.last_transaction || null
          })));
        }
      } catch (error) {
        console.error('Supabase sync error:', error);
      }
    };

    fetchCloudData();
  }, [isCloudEnabled]);

  useEffect(() => {
    const savedSettings = localStorage.getItem('turkish_home_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('turkish_home_settings', JSON.stringify(newSettings));
  };

  const handleBackup = () => {
    const data = { products, sales, settings, customers, payments, version: '1.0.0', timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `turkish_home_backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (importedData) => {
    if (importedData.products) setProducts(importedData.products);
    if (importedData.sales) setSales(importedData.sales);
    if (importedData.settings) setSettings(importedData.settings);
    if (importedData.customers) setCustomers(importedData.customers);
    if (importedData.payments) setPayments(importedData.payments);
  };

  const saveSale = (saleData) => {
    // 1. Save Sale
    setSales(prev => [saleData, ...prev]);

    // 2. Subtract from stock
    setProducts(prevProducts => prevProducts.map(p => {
      const soldItem = saleData.items.find(item => item.id === p.id);
      if (soldItem) {
        return { ...p, stock: p.stock - soldItem.quantity };
      }
      return p;
    }));

    // 3. Update Customer Debt if Credit Sale
    if (saleData.paymentType === 'credit' && saleData.customerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === saleData.customerId) {
          return { ...c, debt: c.debt + saleData.total, lastTransaction: new Date().toISOString() };
        }
        return c;
      }));
    }

    // 4. Cloud Sync
    if (isCloudEnabled) {
      const syncData = {
        id: saleData.id,
        date: saleData.date,
        total: saleData.total,
        items: saleData.items,
        payment_type: saleData.paymentType || 'cash',
        customer_name: saleData.customerName || '',
        customer_phone: saleData.customerPhone || '',
        customer_address: saleData.customerAddress || '',
        source: saleData.source || 'pos',
        status: saleData.status || 'completed'
      };
      supabase.from('sales').upsert(syncData).then();

      // Update individual products stock on cloud
      saleData.items.forEach(item => {
        const p = products.find(prod => prod.id === item.id);
        if (p) {
          supabase.from('products').update({ stock: p.stock - item.quantity }).eq('id', p.id).then();
        }
      });
    }
  };

  const handleReturn = (orderId, returnedItems) => {
    setSales(prevSales => prevSales.map(sale => {
      if (sale.orderId === orderId) {
        const isFullReturn = returnedItems.length === sale.items.length;
        return { ...sale, status: isFullReturn ? 'refunded' : 'partially_refunded' };
      }
      return sale;
    }));

    setProducts(prevProducts => prevProducts.map(p => {
      const returnedItem = returnedItems.find(item => item.id === p.id);
      if (returnedItem) {
        return { ...p, stock: p.stock + returnedItem.quantity };
      }
      return p;
    }));
  };

  const resetData = () => {
    if (window.confirm('هل أنت متأكد من حذف جميع البيانات (المبيعات، العملاء، المصروفات، التوريدات) والإبقاء فقط على المنتجات؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setSales([]);
      setCustomers([]);
      setExpenses([]);
      setPayments([]);
      setPurchases([]);
      alert('تم حذف البيانات بنجاح.');
    }
  };

  const syncLocalToCloud = async (manualSettings = null) => {
    const currentSettings = manualSettings || settings;
    if (!isCloudEnabled) {
      alert('الربط غير مفعل. يرجى التأكد من المفاتيح في ملف .env وإعادة تشغيل البرنامج.');
      return;
    }

    try {
      const confirm = window.confirm('سيتم الآن مزامنة كافة البيانات الحالية مع السحابة. قد يستغرق هذا بضع ثوانٍ. هل تريد المتابعة؟');
      if (!confirm) return;

      console.log('Mapping data for sync...');

      // 1. Map Products
      const mappedProducts = products.map(p => ({
        id: Math.floor(Number(p.id)),
        name: p.name,
        price: p.price,
        cost_price: p.costPrice || 0,
        stock: p.stock || 0,
        min_stock: p.minStock || 5,
        barcode: p.barcode || '',
        category: p.category || 'عام',
        image: p.image || '',
        gallery: p.gallery || [],
        show_online: !!p.showOnline,
        online_price: p.onlinePrice || null,
        long_description: p.longDescription || ''
      }));

      // 2. Map Sales
      const mappedSales = sales.map(s => ({
        id: s.orderId,
        date: s.date,
        total: s.total,
        items: s.items,
        payment_type: s.paymentType || 'cash',
        customer_name: s.customerName || '',
        customer_phone: s.customerPhone || '',
        customer_address: s.customerAddress || '',
        source: s.source || 'pos',
        status: s.status || 'completed'
      }));

      // 3. Map Customers
      const mappedCustomers = customers.map(c => ({
        id: Math.floor(Number(c.id)),
        name: c.name,
        phone: c.phone || '',
        debt: c.debt || 0,
        last_transaction: c.lastTransaction || null
      }));

      console.log('Pushing to Supabase...');

      if (mappedProducts.length > 0) {
        // Deduplicate by ID
        const uniqueProducts = Array.from(new Map(mappedProducts.map(p => [p.id, p])).values());
        const { error: pErr } = await supabase.from('products').upsert(uniqueProducts);
        if (pErr) throw pErr;
      }

      if (mappedCustomers.length > 0) {
        // Deduplicate by ID
        const uniqueCustomers = Array.from(new Map(mappedCustomers.map(c => [c.id, c])).values());
        const { error: cErr } = await supabase.from('customers').upsert(uniqueCustomers);
        if (cErr) throw cErr;
      }

      if (mappedSales.length > 0) {
        // Deduplicate by ID
        const uniqueSales = Array.from(new Map(mappedSales.map(s => [s.id, s])).values());
        const { error: sErr } = await supabase.from('sales').upsert(uniqueSales);
        if (sErr) throw sErr;
      }

      // Sync Settings
      const { error: setErr } = await supabase.from('settings').upsert({
        id: 'store_settings',
        data: currentSettings
      });
      if (setErr) console.warn("Settings sync failed (table might not exist):", setErr);

      alert('تمت مزامنة البيانات بالكامل مع السحاب بنجاح! جميع منتجاتك معروضة الآن أونلاين.');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('فشلت المزامنة: ' + (error.message || 'خطأ في الربط بقاعدة البيانات'));
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'storefront':
        return <Storefront products={products} settings={settings} onSaveSale={saveSale} />;
      case 'web_orders':
        return <WebManager activeSubTab="orders" onInvoice={saveSale} onRefreshPending={fetchPendingCount} />;
      case 'web_customers':
        return <WebManager activeSubTab="customers" onInvoice={saveSale} />;
      case 'web_history':
        return <WebManager activeSubTab="history" onInvoice={saveSale} onRefreshPending={fetchPendingCount} />;
      case 'dashboard':
        return (
          <Dashboard
            sales={sales}
            products={products}
            customers={customers}
            expenses={expenses}
            setActiveTab={setActiveTab}
          />
        );
      case 'pos':
        return (
          <POSDashboard
            onSaveSale={saveSale}
            products={products}
            settings={settings}
            customers={customers}
            sales={sales}
          />
        );
      case 'invoices':
        return <Invoices sales={sales} onReturn={handleReturn} settings={settings} />;
      case 'inventory':
        return <Inventory products={products} setProducts={setProducts} settings={settings} purchases={purchases} setPurchases={setPurchases} />;
      case 'customers':
        return (
          <Customers
            settings={settings}
            sales={sales}
            setSales={setSales}
            customers={customers}
            setCustomers={setCustomers}
            payments={payments}
            setPayments={setPayments}
            onReturn={handleReturn}
          />
        );
      case 'reports':
        return <Reports sales={sales} products={products} expenses={expenses} setExpenses={setExpenses} settings={settings} payments={payments} purchases={purchases} />;
      case 'purchases':
        return <Purchases purchases={purchases} setPurchases={setPurchases} products={products} settings={settings} />;
      case 'ai':
        return <TurkishAI sales={sales} products={products} customers={customers} expenses={expenses} payments={payments} purchases={purchases} setActiveTab={setActiveTab} />;
      case 'settings':
        return (
          <Settings
            settings={settings}
            onSaveSettings={saveSettings}
            onBackup={handleBackup}
            onRestore={handleRestore}
            onResetData={resetData}
            onCloudSync={syncLocalToCloud}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(id) => {
          setActiveTab(id);
          setIsSidebarOpen(false);
        }}
        pendingCount={pendingWebOrdersCount}
      />
      <main className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(true)}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </button>
          <span className="mobile-brand">TURKISH HOME</span>
        </div>
        <Suspense
          fallback={
            <div className="tab-loading-state">
              <div className="tab-loading-spinner"></div>
              <p>جاري تحميل الصفحة...</p>
            </div>
          }
        >
          {renderActiveTab()}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
