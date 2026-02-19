import React, { useState, useEffect, useRef } from 'react';
import { Search, Barcode as BarcodeIcon, Grid, List, Plus, Minus, Trash2, ShoppingCart, CheckCircle2, Printer, X, User, CreditCard, Wallet } from 'lucide-react';
import Logo from '../Common/Logo';
import Barcode from 'react-barcode';
import './POSDashboard.css';

const POSDashboard = ({ onSaveSale, products, settings, customers, sales = [] }) => {
    // Date formatter helper
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === '-') return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [scannerBuffer, setScannerBuffer] = useState('');
    const [lastScan, setLastScan] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [paymentType, setPaymentType] = useState('cash');
    const [custSearch, setCustSearch] = useState('');

    const categories = [
        { id: 'all', label: 'الكل' },
        ...(settings.categories || []).map(cat => ({ id: cat, label: cat }))
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                if (scannerBuffer.length > 5) {
                    handleBarcodeScan(scannerBuffer);
                    setScannerBuffer('');
                }
            } else {
                if (e.key.length === 1) {
                    setScannerBuffer((prev) => prev + e.key);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [scannerBuffer]);

    const handleBarcodeScan = (barcode) => {
        const product = products.find(p => p.barcode === barcode);
        if (product) {
            addToCart(product);
            setLastScan(product.name);
            setTimeout(() => setLastScan(''), 3000);
        }
    };

    const addToCart = (product) => {
        if (product.stock <= 0) {
            alert('عذراً، هذا المنتج نفذ من المخزن!');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    alert('عذراً، لا توجد كمية كافية في المخزن!');
                    return prev;
                }
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const product = products.find(p => p.id === id);
                const newQty = Math.max(1, item.quantity + delta);
                if (delta > 0 && newQty > product.stock) {
                    alert('عذراً، لا توجد كمية كافية في المخزن!');
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = () => {
        // Calculate next sequential ID
        const maxId = sales.length > 0
            ? Math.max(...sales.map(s => parseInt(s.orderId) || 0))
            : 1000;
        const nextId = maxId + 1;

        const data = {
            items: [...cart],
            total: totalPrice,
            date: new Date().toISOString(),
            orderId: nextId,
            status: 'completed',
            paymentType: paymentType,
            customerId: selectedCustomer?.id,
            customerName: selectedCustomer?.name
        };
        setReceiptData(data);
        setShowReceipt(true);
        if (onSaveSale) onSaveSale(data);
    };

    const handlePrintReceipt = () => {
        window.print();
        resetOrder();
    };

    const resetOrder = () => {
        setCart([]);
        setShowReceipt(false);
        setReceiptData(null);
        setSelectedCustomer(null);
        setPaymentType('cash');
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.includes(searchTerm) || p.barcode.includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="pos-container" dir="rtl">
            <header className="pos-header">
                <div className="search-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="ابحث بالاسم أو الباركود..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="scanner-indicator">
                        <BarcodeIcon size={18} />
                        <span>الماسح جاهز</span>
                    </div>
                </div>
                <div className="category-tabs">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`cat-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="pos-content">
                <div className="products-section">
                    <div className="products-grid">
                        {filteredProducts.map(product => (
                            <div key={product.id} className={`product-card ${product.stock <= 0 ? 'out-of-stock' : ''}`} onClick={() => addToCart(product)}>
                                <div className="card-body">
                                    <h3 className="product-name">{product.name}</h3>
                                    <div className="barcode-display">{product.barcode}</div>
                                </div>
                                <div className="card-footer">
                                    <span className="price-tag">{product.price} ج.م</span>
                                    <span className={`stock-badge ${product.stock <= 5 ? 'low' : ''}`}>
                                        {product.stock}
                                    </span>
                                </div>
                                {product.stock <= 0 && (
                                    <div className="out-of-stock-overlay">
                                        <span>نفذ</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <aside className="cart-sidebar">
                    <div className="cart-header">
                        <ShoppingCart size={20} />
                        <h2>قائمة الطلب</h2>
                        <span className="items-count">{cart.length} أصناف</span>
                    </div>

                    <div className="payment-selection-top">
                        <div className="payment-toggle-group">
                            <button
                                className={`pay-toggle-btn ${paymentType === 'cash' ? 'active cash' : ''}`}
                                onClick={() => {
                                    setPaymentType('cash');
                                    setSelectedCustomer(null);
                                }}
                            >
                                <Wallet size={16} /> نقدي
                            </button>
                            <button
                                className={`pay-toggle-btn ${paymentType === 'credit' ? 'active credit' : ''}`}
                                onClick={() => setPaymentType('credit')}
                            >
                                <CreditCard size={16} /> آجل
                            </button>
                        </div>
                    </div>

                    <div className="cart-items">
                        {cart.length === 0 ? (
                            <div className="empty-cart">
                                <ShoppingCart size={48} className="empty-icon" />
                                <p>السلة فارغة</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="cart-item">
                                    <div className="item-details">
                                        <h4>{item.name}</h4>
                                        <span className="item-price-unit">{item.price} ج.م</span>
                                    </div>
                                    <div className="item-actions">
                                        <div className="qty-controls">
                                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}><Plus size={16} /></button>
                                            <span>{item.quantity}</span>
                                            <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}><Minus size={16} /></button>
                                        </div>
                                        <button className="delete-btn" onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cart-footer">
                        {paymentType === 'credit' && (
                            <div className="customer-selection-box">
                                <label><User size={14} /> عميل البيع الآجل:</label>

                                {!selectedCustomer ? (
                                    <div className="cust-search-container bottom-search">
                                        <div className="cust-search-input">
                                            <Search size={14} />
                                            <input
                                                type="text"
                                                placeholder="ابحث باسم العميل أو رقم الهاتف..."
                                                value={custSearch}
                                                onChange={(e) => setCustSearch(e.target.value)}
                                            />
                                        </div>
                                        {custSearch && (
                                            <div className="cust-results-dropdown up">
                                                {customers
                                                    .filter(c => c.name.includes(custSearch) || c.phone?.includes(custSearch))
                                                    .map(c => (
                                                        <div
                                                            key={c.id}
                                                            className="cust-res-item"
                                                            onClick={() => {
                                                                setSelectedCustomer(c);
                                                                setCustSearch('');
                                                            }}
                                                        >
                                                            <span className="res-name">{c.name}</span>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="selected-cust-badge bottom-badge">
                                        <div className="cust-mini-info">
                                            <span className="name">{selectedCustomer.name}</span>
                                            <span className="debt">المديونية: {selectedCustomer.debt} ج.م</span>
                                        </div>
                                        <button onClick={() => setSelectedCustomer(null)}><X size={14} /></button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="total-row">
                            <span>الإجمالي:</span>
                            <span className="total-amount">{totalPrice} ج.م</span>
                        </div>
                        <button
                            className={`pay-button ${paymentType === 'credit' ? 'credit-mode' : ''}`}
                            disabled={cart.length === 0 || (paymentType === 'credit' && !selectedCustomer)}
                            onClick={handleCheckout}
                        >
                            <CheckCircle2 size={20} />
                            إتمام عملية البيع
                        </button>
                    </div>
                </aside>
            </div>

            {showReceipt && receiptData && (
                <div className="modal-overlay">
                    <div className="receipt-modal">
                        <div className="receipt-modal-header">
                            <h3>معاينة الفاتورة</h3>
                            <button onClick={() => setShowReceipt(false)}><X size={20} /></button>
                        </div>
                        <div className="receipt-scroll-area">
                            <div className="thermal-receipt" id="thermal-print-area">
                                <div className="receipt-header">
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                                        <Logo size={60} showText={false} color="#000" />
                                    </div>
                                    <h1 className="store-name">{settings.storeName}</h1>
                                    <p className="store-desc">{settings.receiptHeader}</p>
                                    <p className="store-address">العنوان: {settings.address}</p>
                                    <p className="store-phone">ت: {settings.phone}</p>
                                </div>
                                <div className="divider">***************************</div>
                                <div className="receipt-info">
                                    <p>رقم الفاتورة: #{receiptData.orderId}</p>
                                    <p>التاريخ: {formatDate(receiptData.date)}</p>
                                </div>
                                <div className="divider">---------------------------</div>
                                <table className="receipt-table">
                                    <thead>
                                        <tr>
                                            <th>الصنف</th>
                                            <th>ق</th>
                                            <th>سعر</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receiptData.items.map(item => (
                                            <tr key={item.id}>
                                                <td className="item-name-cell">{item.name}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.price}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="divider">---------------------------</div>
                                <div className="receipt-total">
                                    <span className="total-label">إجمالي الفاتورة:</span>
                                    <span className="total-value">{receiptData.total} ج.م</span>
                                </div>
                                <div className="divider">***************************</div>
                                <div className="receipt-footer">
                                    <p className="footer-memo">{settings.receiptFooter}</p>
                                    {settings.showQR && (
                                        <div className="receipt-qr">
                                            <p className="qr-label">راسلنا على واتساب</p>
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                                    `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(settings.whatsappMsg.replace('{orderId}', receiptData.orderId))}`
                                                )}`}
                                                alt="QR Code"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="receipt-modal-footer">
                            <button className="confirm-btn print-action-btn" onClick={handlePrintReceipt}>
                                <Printer size={18} />
                                تأكيد وطباعة الفاتورة
                            </button>
                            <button className="new-order-btn" onClick={resetOrder}>
                                <Plus size={18} />
                                طلب جديد بدون طباعة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {lastScan && (
                <div className="scan-notification">
                    <CheckCircle2 size={18} />
                    تمت إضافة: {lastScan}
                </div>
            )}

            <style>
                {`
@media print {
    body * { visibility: hidden; }
    #thermal-print-area, #thermal-print-area * { visibility: visible; }
    #thermal-print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 80mm;
        padding: 5mm;
        background: white;
        box-shadow: none;
    }
}
`}
            </style>
        </div>
    );
};

export default POSDashboard;
