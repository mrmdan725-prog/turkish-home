import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Printer, ShoppingCart, ArrowDownToLine, Filter, Tag, CheckCircle2, MoreVertical, Edit2, Trash2, History, TrendingUp, AlertTriangle, Layers, X, Save, DollarSign, Brain, Sparkles } from 'lucide-react';
import Barcode from 'react-barcode';
import './Inventory.css';

const Inventory = ({ products, setProducts, settings, setPurchases }) => {
    const [view, setView] = useState('stock'); // 'stock', 'po', 'history'
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('الكل');

    const [printBarcode, setPrintBarcode] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [menuOpenFor, setMenuOpenFor] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.more-menu-container')) {
                setMenuOpenFor(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Statistics
    const lowStockItems = products.filter(p => p.stock <= p.minStock);
    const totalItems = products.length;
    const totalInventoryValue = products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
    const totalRetailValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    const categoriesList = ['الكل', ...(settings?.categories || [])];

    // Purchase Order state
    const [poItems, setPoItems] = useState([]);
    const [supplier, setSupplier] = useState('');
    const [tempItem, setTempItem] = useState({ name: '', quantity: 1, costPrice: 0, salePrice: 0, category: settings.categories[0] });

    const addToPo = () => {
        if (!tempItem.name || tempItem.quantity <= 0) return;
        setPoItems([...poItems, { ...tempItem, id: Date.now() }]);
        setTempItem({ name: '', quantity: 1, costPrice: 0, salePrice: 0, category: settings.categories[0] });
    };

    const removeFromPo = (id) => {
        setPoItems(poItems.filter(item => item.id !== id));
    };

    const confirmPurchaseOrder = () => {
        const newProducts = [...products];
        let totalOrderCost = 0;

        poItems.forEach(item => {
            const cost = parseFloat(item.costPrice || 0);
            const qty = parseInt(item.quantity || 0);
            totalOrderCost += (cost * qty);

            const existingIdx = newProducts.findIndex(p => p.name.toLowerCase() === item.name.toLowerCase());
            if (existingIdx > -1) {
                newProducts[existingIdx].stock += qty;
                newProducts[existingIdx].price = parseFloat(item.salePrice) || newProducts[existingIdx].price;
                newProducts[existingIdx].costPrice = cost || newProducts[existingIdx].costPrice;
            } else {
                newProducts.push({
                    id: Math.floor(Date.now() + Math.random()),
                    name: item.name,
                    price: parseFloat(item.salePrice) || 0,
                    costPrice: cost,
                    stock: qty,
                    minStock: 5,
                    barcode: (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString(),
                    category: item.category || 'عام'
                });
            }
        });

        // Record the Purchase (Toreedat)
        const purchaseRecord = {
            id: Date.now(),
            date: new Date().toISOString(),
            total: totalOrderCost,
            supplier: supplier || 'مورد عام',
            itemsCount: poItems.length
        };

        if (setPurchases) {
            setPurchases(prev => [purchaseRecord, ...prev]);
        }

        setProducts(newProducts);
        setPoItems([]);
        setSupplier('');
        setView('stock');
    };

    const handleAiScan = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);

        // Simulate AI Processing (OCR)
        setTimeout(() => {
            const extractedItems = [
                { id: Date.now() + 1, name: "بطاريات بروتيك", quantity: 45, costPrice: 1250, salePrice: 0, category: "بطاريات" },
                { id: Date.now() + 2, name: "الواح رصاص", quantity: 36, costPrice: 200, salePrice: 0, category: "معادن" },
                { id: Date.now() + 3, name: "الواح نحاس احمر", quantity: 15, costPrice: 240, salePrice: 0, category: "معادن" },
                { id: Date.now() + 4, name: "مواسير نحاس اصفر", quantity: 23, costPrice: 136, salePrice: 0, category: "معادن" },
                { id: Date.now() + 5, name: "انبوب نحاس مطلي بالبلاستيك", quantity: 23, costPrice: 58, salePrice: 0, category: "معادن" }
            ];

            setSupplier("ميار للحبوب والصناعات الغذائية");
            setPoItems(prev => [...prev, ...extractedItems]);
            setIsScanning(false);
            alert('تم استخراج البيانات بنجاح! يرجى مراجعة الكميات وتحديد أسعار البيع.');
        }, 3000);
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        const updatedProducts = products.map(p =>
            p.id === editingProduct.id ? editingProduct : p
        );
        setProducts(updatedProducts);

        // Supabase Sync
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
            const { supabase } = await import('../../supabaseClient');
            const poductData = { ...editingProduct };
            delete poductData._edit_tab; // Clean temp internal state
            await supabase.from('products').upsert(poductData);
        }

        setEditingProduct(null);
    };

    const handleDeleteProduct = (productId) => {
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        setShowDeleteConfirm(null);
        setMenuOpenFor(null);
    };

    const copyBarcode = (code) => {
        navigator.clipboard.writeText(code);
        setMenuOpenFor(null);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode.includes(searchQuery);
        const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
        const matchesLowStock = !filterLowStock || p.stock <= p.minStock;
        return matchesSearch && matchesCategory && matchesLowStock;
    });

    return (
        <div className="inventory-container" dir="rtl">
            <header className="inventory-header">
                <div className="header-title">
                    <div className="title-icon-wrapper">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1>إدارة المخزن</h1>
                        <p>تتبع المنتجات والمخزون وحركة التوريد</p>
                    </div>
                </div>

                <div className="header-navigation">
                    <button className={`nav-tab ${view === 'stock' ? 'active' : ''}`} onClick={() => setView('stock')}>
                        <Package size={18} /> جرد المخزن
                    </button>
                    <button className={`nav-tab ${view === 'po' ? 'active' : ''}`} onClick={() => setView('po')}>
                        <Plus size={18} /> طلب توريد جديد
                    </button>
                    {/* <button className={`nav-tab ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>
                        <History size={18} /> سجل الحركة
                    </button> */}
                </div>
            </header>

            <div className="inventory-main-content">
                {view === 'stock' && (
                    <div className="stock-view-layout">
                        {/* Summary Section */}
                        <div className="inventory-dashboard">
                            <div className="stat-card blue">
                                <div className="stat-icon"><Package size={24} /></div>
                                <div className="stat-value">
                                    <h3>{totalItems}</h3>
                                    <span>إجمالي الأصناف</span>
                                </div>
                            </div>
                            <div className="stat-card red" onClick={() => setFilterLowStock(!filterLowStock)}>
                                <div className="stat-icon"><AlertTriangle size={24} /></div>
                                <div className="stat-value">
                                    <h3>{lowStockItems.length}</h3>
                                    <span>نواقص المخزن</span>
                                </div>
                                {lowStockItems.length > 0 && <div className="pulse-dot"></div>}
                            </div>
                            <div className="stat-card green">
                                <div className="stat-icon"><TrendingUp size={24} /></div>
                                <div className="stat-value">
                                    <h3>{totalInventoryValue.toLocaleString()} <small>ج.م</small></h3>
                                    <span>قيمة البضاعة (جملة)</span>
                                </div>
                            </div>
                            <div className="stat-card gold">
                                <div className="stat-icon"><DollarSign size={24} /></div>
                                <div className="stat-value">
                                    <h3>{totalRetailValue.toLocaleString()} <small>ج.م</small></h3>
                                    <span>القيمة البيعية (قطاعي)</span>
                                </div>
                            </div>
                        </div>

                        {/* Controls Bar */}
                        <div className="inventory-controls">
                            <div className="search-group">
                                <Search size={20} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="ابحث بالاسم أو الباركود..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="filter-group">
                                <div className="category-chips">
                                    {categoriesList.map(cat => (
                                        <button
                                            key={cat}
                                            className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                                            onClick={() => setSelectedCategory(cat)}
                                        >
                                            {selectedCategory === cat && <CheckCircle2 size={14} />}
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className={`filter-btn ${filterLowStock ? 'active' : ''}`}
                                    onClick={() => setFilterLowStock(!filterLowStock)}
                                    title="تصفية النواقص فقط"
                                >
                                    <Filter size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="inventory-table-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>المنتج</th>
                                        <th>الفئة</th>
                                        <th>الباركود</th>
                                        <th>الكمية</th>
                                        <th>سعر الجملة</th>
                                        <th>سعر البيع</th>
                                        <th style={{ textAlign: 'center' }}>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className={product.stock <= product.minStock ? 'row-warning' : ''}>
                                            <td>
                                                <div className="item-info-cell">
                                                    <div className="item-img-placeholder">{product.name[0]}</div>
                                                    <div className="item-text">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="name">{product.name}</span>
                                                            {product.showOnline && <RefreshCw size={12} color="#3b82f6" title="معروض أونلاين" />}
                                                        </div>
                                                        <span className="id">رقم: #{product.id.toString().slice(-4)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="cat-badge">{product.category || 'عام'}</span></td>
                                            <td><span className="barcode-span" title="انقر لطباعة الباركود" onClick={() => setPrintBarcode(product)}>{product.barcode}</span></td>
                                            <td>
                                                <div className="stock-indicator">
                                                    <strong>{product.stock}</strong>
                                                    <div className="stock-bar">
                                                        <div className="bar-fill" style={{ width: `${Math.min((product.stock / 20) * 100, 100)}%`, backgroundColor: product.stock <= product.minStock ? '#ef4444' : '#10b981' }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="price-tag cost">{(product.costPrice || 0).toLocaleString()} ج.م</span></td>
                                            <td><span className="price-tag retail">{product.price.toLocaleString()} ج.م</span></td>
                                            <td className="actions-cell">
                                                <div className="action-buttons">
                                                    <button className="icon-action edit" onClick={() => setEditingProduct(product)} title="تعديل">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="icon-action print" onClick={() => setPrintBarcode(product)} title="طباعة باركود">
                                                        <Printer size={16} />
                                                    </button>
                                                    <div className="more-menu-container">
                                                        <button
                                                            className={`icon-action more ${menuOpenFor === product.id ? 'active' : ''}`}
                                                            onClick={() => setMenuOpenFor(menuOpenFor === product.id ? null : product.id)}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        {menuOpenFor === product.id && (
                                                            <div className="more-dropdown">
                                                                <button onClick={() => { setEditingProduct(product); setMenuOpenFor(null); }}>
                                                                    <Edit2 size={14} /> تعديل المنتج
                                                                </button>
                                                                <button onClick={() => copyBarcode(product.barcode)}>
                                                                    <Tag size={14} /> نسخ الباركود
                                                                </button>
                                                                <button onClick={() => { setPrintBarcode(product); setMenuOpenFor(null); }}>
                                                                    <Printer size={14} /> طباعة الباركود
                                                                </button>
                                                                <div className="divider"></div>
                                                                <button className="delete-action" onClick={() => setShowDeleteConfirm(product)}>
                                                                    <Trash2 size={14} /> حذف الصنف
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="empty-state">
                                                <Layers size={48} />
                                                <p>لا توجد نتائج مطابقة للبحث</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {view === 'po' && (
                    <div className="po-view-layout">
                        <div className="po-container">
                            <div className="po-header-section">
                                <div className="title-group-v2">
                                    <h2><Plus size={24} /> طلب توريد بضاعة</h2>
                                    <div className="ai-import-action">
                                        <label className="ai-scan-label">
                                            <input type="file" accept="image/*" onChange={handleAiScan} style={{ display: 'none' }} />
                                            <div className="ai-scan-btn-modern">
                                                <Brain size={18} />
                                                <span>مسح الفاتورة بالذكاء الاصطناعي</span>
                                                <Sparkles size={14} className="sparkle" />
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div className="supplier-input">
                                    <label>اسم المورد / الشركة</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: شركة النور للاستيراد"
                                        value={supplier}
                                        onChange={(e) => setSupplier(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="po-input-grid">
                                <div className="input-field main">
                                    <label>اسم الصنف</label>
                                    <input
                                        type="text"
                                        placeholder="ابحث أو أضف اسم جديد..."
                                        value={tempItem.name}
                                        onChange={(e) => setTempItem({ ...tempItem, name: e.target.value })}
                                    />
                                </div>
                                <div className="input-field small">
                                    <label>الكمية</label>
                                    <input
                                        type="number"
                                        value={tempItem.quantity}
                                        onChange={(e) => setTempItem({ ...tempItem, quantity: e.target.value })}
                                    />
                                </div>
                                <div className="input-field small">
                                    <label>سعر التكلفة</label>
                                    <input
                                        type="number"
                                        value={tempItem.costPrice}
                                        onChange={(e) => setTempItem({ ...tempItem, costPrice: e.target.value })}
                                    />
                                </div>
                                <div className="input-field small">
                                    <label>سعر البيع</label>
                                    <input
                                        type="number"
                                        value={tempItem.salePrice}
                                        onChange={(e) => setTempItem({ ...tempItem, salePrice: e.target.value })}
                                    />
                                </div>
                                <div className="input-field small">
                                    <label>الفئة</label>
                                    <select
                                        value={tempItem.category}
                                        onChange={(e) => setTempItem({ ...tempItem, category: e.target.value })}
                                        style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 8px' }}
                                    >
                                        {(settings?.categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <button className="add-to-po-list" onClick={addToPo}>
                                    <Plus size={20} /> إضافة القائمة
                                </button>
                            </div>

                            <div className="po-list-section">
                                <h3>قائمة التوريد الحالية ({poItems.length} أصناف)</h3>
                                <table className="po-table">
                                    <thead>
                                        <tr>
                                            <th>الصنف</th>
                                            <th>الفئة</th>
                                            <th>الكمية</th>
                                            <th>سعر التكلفة</th>
                                            <th>سعر البيع</th>
                                            <th>الإجمالي</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {poItems.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td>
                                                    <select
                                                        className="inner-table-input select"
                                                        value={item.category || settings.categories[0]}
                                                        onChange={(e) => setPoItems(prev => prev.map(i => i.id === item.id ? { ...i, category: e.target.value } : i))}
                                                    >
                                                        {(settings?.categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                    </select>
                                                </td>
                                                <td>{item.quantity}</td>
                                                <td>{item.costPrice} ج.م</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="inner-table-input"
                                                        value={item.salePrice}
                                                        onChange={(e) => setPoItems(prev => prev.map(i => i.id === item.id ? { ...i, salePrice: e.target.value } : i))}
                                                        placeholder="حدد السعر..."
                                                    />
                                                </td>
                                                <td>{(item.costPrice * item.quantity).toLocaleString()} ج.م</td>
                                                <td>
                                                    <button className="remove-item" onClick={() => removeFromPo(item.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {poItems.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="empty-po">أضف بعض الأصناف أعلاه للبدء...</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="po-summary-footer">
                                <div className="po-totals">
                                    <span>إجمالي الفاتورة:</span>
                                    <strong>{poItems.reduce((s, i) => s + (i.costPrice * i.quantity), 0).toLocaleString()} ج.م</strong>
                                </div>
                                <button className="confirm-po-btn" onClick={confirmPurchaseOrder} disabled={poItems.length === 0}>
                                    <ArrowDownToLine size={20} /> تأكيد استلام البضاعة
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {view === 'history' && (
                    <div className="online-orders-placeholder" style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <History size={48} color="#4B2C20" style={{ marginBottom: '20px' }} />
                            <h2>قريباً: إدارة طلبات الموقع</h2>
                            <p>سيتم عرض الطلبات القادمة من المتجر الإلكتروني هنا للمراجعة والقبول.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="modal-overlay">
                    <div className="modern-modal">
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Edit2 size={20} />
                                <h3>تعديل بيانات المنتج</h3>
                            </div>
                            <div className="modal-tab-group" style={{ display: 'flex', gap: '10px', background: '#F4F7FE', padding: '5px', borderRadius: '10px' }}>
                                <button type="button" onClick={() => setEditingProduct({ ...editingProduct, _edit_tab: 'main' })} style={{ padding: '8px 15px', borderRadius: '8px', background: (!editingProduct._edit_tab || editingProduct._edit_tab === 'main') ? 'white' : 'transparent', boxShadow: (!editingProduct._edit_tab || editingProduct._edit_tab === 'main') ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>البيانات الأساسية</button>
                                <button type="button" onClick={() => setEditingProduct({ ...editingProduct, _edit_tab: 'online' })} style={{ padding: '8px 15px', borderRadius: '8px', background: editingProduct._edit_tab === 'online' ? 'white' : 'transparent', boxShadow: editingProduct._edit_tab === 'online' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>المتجر أونلاين</button>
                            </div>
                            <button onClick={() => setEditingProduct(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateProduct}>
                            <div className="modal-body">
                                {(!editingProduct._edit_tab || editingProduct._edit_tab === 'main') ? (
                                    <>
                                        <div className="form-group-modern">
                                            <label>اسم المنتج</label>
                                            <input
                                                type="text"
                                                value={editingProduct.name}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-grid-2">
                                            <div className="form-group-modern">
                                                <label>سعر التكلفة (جملة)</label>
                                                <input
                                                    type="number"
                                                    value={editingProduct.costPrice || 0}
                                                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                            <div className="form-group-modern">
                                                <label>سعر البيع (قطاعي)</label>
                                                <input
                                                    type="number"
                                                    value={editingProduct.price}
                                                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-grid-2">
                                            <div className="form-group-modern">
                                                <label>الكمية الحالية</label>
                                                <input
                                                    type="number"
                                                    value={editingProduct.stock}
                                                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div className="form-group-modern">
                                                <label>الباركود</label>
                                                <input
                                                    type="text"
                                                    value={editingProduct.barcode}
                                                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group-modern">
                                            <label>الفئة</label>
                                            <select
                                                value={editingProduct.category}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                                style={{ width: '100%', height: '48px', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '0 16px', background: 'var(--bg-body)' }}
                                            >
                                                {(settings?.categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group-modern" style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#e8f5e9', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ margin: 0, fontWeight: '700' }}>عرض المنتج في المتجر أونلاين</label>
                                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>إذا تم التفعيل، سيظهر هذا المنتج للجمهور على الموقع.</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={editingProduct.showOnline}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, showOnline: e.target.checked })}
                                                style={{ width: '25px', height: '25px', accentColor: '#2e7d32' }}
                                            />
                                        </div>

                                        <div className="form-group-modern">
                                            <label>رابط صورة المنتج (High Quality)</label>
                                            <input
                                                type="text"
                                                placeholder="https://example.com/image.jpg"
                                                value={editingProduct.image || ''}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                                            />
                                            <p style={{ fontSize: '0.75rem', marginTop: '5px', color: '#666' }}>يفضل استخدام صور احترافية لزيادة المبيعات أونلاين.</p>
                                        </div>

                                        <div className="form-group-modern">
                                            <label>سعر البيع أونلاين (اختياري)</label>
                                            <input
                                                type="number"
                                                placeholder="اتركه فارغاً ليستخدم نفس سعر المحل"
                                                value={editingProduct.onlinePrice || ''}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, onlinePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            />
                                        </div>

                                        <div className="form-group-modern">
                                            <label>وصف المنتج التفصيلي (للويب)</label>
                                            <textarea
                                                rows="4"
                                                style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '12px', background: 'var(--bg-body)', fontFamily: 'inherit' }}
                                                placeholder="اكتب مواصفات المنتج، الخامة، المقاسات..."
                                                value={editingProduct.longDescription || ''}
                                                onChange={(e) => setEditingProduct({ ...editingProduct, longDescription: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setEditingProduct(null)}>إلغاء</button>
                                <button type="submit" className="save-btn"><Save size={18} /> حفظ التعديلات</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Barcode Print Modal */}
            {printBarcode && (
                <div className="modal-overlay">
                    <div className="print-modal-v2">
                        <div className="modal-header">
                            <h3><Printer size={20} /> معاينة طباعة الباركود</h3>
                            <button onClick={() => setPrintBarcode(null)}><X size={20} /></button>
                        </div>
                        <div className="print-preview-container">
                            <div className="barcode-tag" id="barcode-paper">
                                <div className="tag-header">{settings.storeName}</div>
                                <div className="tag-name">{printBarcode.name}</div>
                                <Barcode
                                    value={printBarcode.barcode}
                                    width={1.2}
                                    height={40}
                                    fontSize={10}
                                    background="transparent"
                                />
                                <div className="tag-price">{printBarcode.price.toLocaleString()} ج.م</div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="full-print-btn" onClick={() => window.print()}>
                                <Printer size={20} /> طباعة الملصق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modern-modal delete-modal">
                        <div className="modal-body text-center">
                            <div className="warning-icon-large">
                                <AlertTriangle size={48} />
                            </div>
                            <h3>هل أنت متأكد من حذف هذا الصنف؟</h3>
                            <p>سيتم حذف "{showDeleteConfirm.name}" نهائياً من المخزن. لا يمكن التراجع عن هذا الإجراء.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowDeleteConfirm(null)}>إلغاء</button>
                            <button className="delete-btn-final" onClick={() => handleDeleteProduct(showDeleteConfirm.id)}>تأكيد الحذف</button>
                        </div>
                    </div>
                </div>
            )}

            {isScanning && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="ai-scanning-loader">
                        <div className="scanner-brain">
                            <Brain size={60} />
                            <div className="scan-bar"></div>
                        </div>
                        <h3>جاري قراءة الفاتورة ذكياً...</h3>
                        <p>يتم الآن استخراج المنتجات والكميات والأسعار آلياً</p>
                    </div>
                </div>
            )}

            <style>
                {`
                    .title-group-v2 { display: flex; align-items: center; gap: 24px; }
                    .ai-import-action { margin-right: 10px; }
                    .ai-scan-btn-modern {
                        background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);
                        color: white;
                        padding: 10px 20px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        cursor: pointer;
                        font-weight: 700;
                        transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);
                        position: relative;
                        overflow: hidden;
                    }
                    .ai-scan-btn-modern:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 210, 255, 0.4); }
                    .sparkle { animation: rotate-sparkle 2s infinite linear; }
                    @keyframes rotate-sparkle { from { transform: rotate(0); } to { transform: rotate(360deg); } }
                    
                    .ai-scanning-loader { text-align: center; color: white; background: rgba(7, 11, 20, 0.9); padding: 40px; border-radius: 30px; border: 1px solid #00d2ff; }
                    .scanner-brain { position: relative; margin: 0 auto 20px; color: #00d2ff; }
                    .scan-bar {
                        position: absolute;
                        top: 0; left: 0; right: 0; height: 2px;
                        background: #3a7bd5; box-shadow: 0 0 10px #00d2ff;
                        animation: scan-move 1.5s infinite ease-in-out;
                    }
                    @keyframes scan-move { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
                    
                    .inner-table-input {
                        width: 100px;
                        padding: 6px;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        outline: none;
                        font-size: 0.9rem;
                    }
                    .inner-table-input.select {
                        width: 120px;
                        background: white;
                    }
                    .inner-table-input:focus { border-color: #3a7bd5; }
                `}
            </style>
        </div>
    );
};

export default Inventory;
