import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, User, Heart, X, Plus, Minus, CheckCircle, ChevronRight, ArrowLeft, ArrowRight, Home, LayoutGrid, Clock, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Storefront.css';

const Storefront = ({ products, settings, onSaveSale }) => {
    const [view, setView] = useState('home'); // home, products, cart, checkout, success
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('الكل');
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        address: '',
        city: 'الأسكندرية'
    });

    // Hero Slider Logic
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const heroImages = settings?.heroImages && settings.heroImages.length > 0
        ? settings.heroImages
        : (settings?.heroImage ? [settings.heroImage] : ["https://images.unsplash.com/photo-1616489953149-805e8bc8636e?auto=format&fit=crop&q=80&w=2000"]);

    useEffect(() => {
        if (heroImages.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentHeroIndex(prev => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroImages.length]);

    const categories = ['الكل', ...(settings?.categories || [])];

    // Only show products explicitely marked for online sale
    const onlineProducts = (products || []).filter(p => p.showOnline);

    const filteredProducts = selectedCategory === 'الكل'
        ? onlineProducts
        : onlineProducts.filter(p => p.category === selectedCategory);

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setIsCartOpen(true);
    };

    const updateQty = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handlePlaceOrder = () => {
        const orderData = {
            orderId: 'WEB-' + (Date.now()).toString().slice(-6),
            date: new Date().toISOString(),
            items: cart,
            total: cartTotal,
            paymentType: 'cash', // Default for web
            status: 'pending',
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            source: 'online'
        };

        if (onSaveSale) {
            onSaveSale(orderData);
        }

        setView('success');
        setCart([]);
    };

    const renderHeader = () => (
        <header className="store-header" dir="rtl">
            <div className="store-actions">
                <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
                    <ShoppingBag size={24} />
                    {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
                </button>
                <button><Search size={22} /></button>
                <button><User size={22} /></button>
            </div>

            <nav className="store-nav">
                <a href="#" className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>الرئيسية</a>
                <a href="#" className={view === 'products' ? 'active' : ''} onClick={() => setView('products')}>المتجر</a>
                <a href="#">نحن</a>
                <a href="#">اتصل بنا</a>
            </nav>

            <div className="store-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontWeight: '800', color: 'var(--store-brown)', fontSize: '1.5rem' }}>TURKISH HOME</h2>
            </div>
        </header>
    );

    const renderFooter = () => (
        <footer style={{ background: 'var(--store-brown)', color: 'white', padding: '60px 80px', marginTop: '100px' }} dir="rtl">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px' }}>
                <div>
                    <h3 style={{ marginBottom: '20px' }}>البيت التركي</h3>
                    <p style={{ opacity: '0.7', fontSize: '0.9rem' }}>نحن متخصصون في تجميل منزلك بأرقى الأدوات المنزلية والأنتيكات المختارة بعناية من تركيا والعالم.</p>
                </div>
                <div>
                    <h4 style={{ marginBottom: '20px' }}>روابط سريعة</h4>
                    <ul style={{ listStyle: 'none', padding: 0, opacity: '0.7', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <li>الرئيسية</li>
                        <li>كل المنتجات</li>
                        <li>المقالات</li>
                        <li>سياسة الاستبدال</li>
                    </ul>
                </div>
                <div>
                    <h4 style={{ marginBottom: '20px' }}>تواصل معنا</h4>
                    <p style={{ opacity: '0.7', fontSize: '0.9rem' }}>{settings?.phone || '01012345678'}</p>
                    <p style={{ opacity: '0.7', fontSize: '0.9rem' }}>{settings?.address || 'الفرع الرئيسي'}</p>
                </div>
                <div>
                    <h4 style={{ marginBottom: '20px' }}>النشرة البريدية</h4>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="email" placeholder="بريدك الإلكتروني" style={{ padding: '10px', borderRadius: '4px', border: 'none', flex: 1 }} />
                        <button style={{ background: 'var(--store-accent)', padding: '10px 20px', borderRadius: '4px', fontWeight: '700' }}>اشترك</button>
                    </div>
                </div>
            </div>
            <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.8rem', opacity: '0.5' }}>
                جميع الحقوق محفوظة © {new Date().getFullYear()} - البيت التركي
            </div>
        </footer>
    );

    return (
        <div className="store-container">
            {view !== 'success' && renderHeader()}

            <AnimatePresence mode="wait">
                {view === 'home' && (
                    <motion.div
                        key="home"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Hero */}
                        <section className="store-hero">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentHeroIndex}
                                    src={heroImages[currentHeroIndex]}
                                    className="hero-video-bg"
                                    alt="Hero"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.8 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1 }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://images.unsplash.com/photo-1616489953149-805e8bc8636e?auto=format&fit=crop&q=80&w=2000";
                                    }}
                                />
                            </AnimatePresence>
                            <div className="hero-content">
                                <h1>أناقتك تبدأ من تفاصيل منزلك</h1>
                                <p>اكتشف تشكيلة "البيت التركي" الجديدة لأدوات المائدة والديكورات العتيقة التي تضفي سحراً خاصاً على كل ركن.</p>
                                <button className="shop-now-btn" onClick={() => setView('products')}>تسوق الآن <ChevronRight size={20} /></button>
                            </div>
                        </section>

                        {/* Categories bar */}
                        <div className="store-categories">
                            {categories.slice(1, 5).map(cat => (
                                <div key={cat} className="cat-item" onClick={() => { setSelectedCategory(cat); setView('products'); }}>
                                    <div className="cat-icon-wrapper">
                                        <Home size={28} />
                                    </div>
                                    <span>{cat}</span>
                                </div>
                            ))}
                        </div>

                        {/* Featured Products */}
                        <section className="products-section">
                            <div className="section-header" dir="rtl">
                                <div className="section-title">
                                    <h2>منتجات مختارة لك</h2>
                                    <p>التشكيلة الأكثر مبيعاً هذا الأسبوع</p>
                                </div>
                                <button onClick={() => setView('products')} style={{ color: 'var(--store-brown)', fontWeight: '700' }}>رؤية الكل</button>
                            </div>

                            <div className="products-grid">
                                {onlineProducts.slice(0, 4).map(product => (
                                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
                                ))}
                            </div>
                        </section>
                    </motion.div>
                )}

                {view === 'products' && (
                    <motion.div
                        key="products"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="products-section"
                    >
                        <div className="category-filter-bar" dir="rtl" style={{ display: 'flex', gap: '15px', marginBottom: '40px', overflowX: 'auto', paddingBottom: '10px' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '30px',
                                        background: selectedCategory === cat ? 'var(--store-brown)' : 'white',
                                        color: selectedCategory === cat ? 'white' : 'var(--store-text)',
                                        border: '1px solid ' + (selectedCategory === cat ? 'var(--store-brown)' : '#eee'),
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="products-grid">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} onAdd={addToCart} />
                            ))}
                        </div>
                    </motion.div>
                )}

                {view === 'checkout' && (
                    <motion.div
                        key="checkout"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="checkout-view"
                    >
                        <div className="checkout-form-section">
                            <h3>بيانات الشحن</h3>
                            <div className="form-field">
                                <label>الإسم بالكامل</label>
                                <input type="text" placeholder="اكتب اسمك هنا..." value={customerInfo.name} onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} />
                            </div>
                            <div className="form-grid-2">
                                <div className="form-field">
                                    <label>رقم الهاتف</label>
                                    <input type="text" placeholder="رقم الموبايل..." value={customerInfo.phone} onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })} />
                                </div>
                                <div className="form-field">
                                    <label>المحافظة</label>
                                    <select style={{ padding: '14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                        <option>الأسكندرية</option>
                                        <option>القاهرة</option>
                                        <option>طنطا</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-field">
                                <label>العنوان بالتفصيل</label>
                                <textarea rows="3" placeholder="مبنى، رقم شقة، شارع..." value={customerInfo.address} onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })} />
                            </div>

                            <h3 style={{ marginTop: '40px' }}>طريقة الدفع</h3>
                            <div className="payment-method-options" style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1, padding: '20px', border: '2px solid var(--store-brown)', borderRadius: '12px', textAlign: 'center' }}>
                                    <CheckCircle size={24} color="var(--store-brown)" style={{ marginBottom: '10px' }} />
                                    <div style={{ fontWeight: '700' }}>الدفع عند الاستلام</div>
                                    <div style={{ fontSize: '0.8rem', opacity: '0.6' }}>ادفع كاش لمندوب الشحن</div>
                                </div>
                                <div style={{ flex: 1, padding: '20px', border: '1px solid #eee', borderRadius: '12px', textAlign: 'center', opacity: '0.5' }}>
                                    <LayoutGrid size={24} style={{ marginBottom: '10px' }} />
                                    <div style={{ fontWeight: '700' }}>أونلاين (قريباً)</div>
                                    <div style={{ fontSize: '0.8rem', opacity: '0.6' }}>فيزا، ماستركارد، فوري</div>
                                </div>
                            </div>
                        </div>

                        <div className="order-summary-card">
                            <h3>ملخص الطلب</h3>
                            <div className="order-items-mini">
                                {cart.map(item => (
                                    <div key={item.id} className="mini-item">
                                        <span>{item.name} (x{item.quantity})</span>
                                        <span>{(item.price * item.quantity).toLocaleString()} ج.م</span>
                                    </div>
                                ))}
                            </div>
                            <div className="summary-line">
                                <span>رسوم التوصيل</span>
                                <span>50 ج.م</span>
                            </div>
                            <div className="summary-line total">
                                <span>الإجمالي</span>
                                <span>{(cartTotal + 50).toLocaleString()} ج.م</span>
                            </div>
                            <button className="place-order-btn" onClick={handlePlaceOrder}>تأكيد الطلب وشحن الفاتورة</button>
                            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '15px' }}>بالضغط على تأكيد، أنت توافق على شروط وأحكام البيت التركي</p>
                        </div>
                    </motion.div>
                )}

                {view === 'success' && (
                    <motion.div
                        key="success"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="success-view"
                    >
                        <div className="success-icon">
                            <CheckCircle size={60} />
                        </div>
                        <h2>تم استلام طلبك بنجاح!</h2>
                        <p>سنقوم بالتواصل معك قريباً لتأكيد الموعد. رقم الطلب هو: WEB-{Date.now().toString().slice(-6)}</p>
                        <button className="shop-now-btn" onClick={() => setView('home')}>العودة للرئيسية</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {view !== 'success' && renderFooter()}

            {/* Cart Panel */}
            <div className={`cart-panel-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
                <div className="cart-panel" onClick={e => e.stopPropagation()}>
                    <div className="cart-panel-header" dir="rtl">
                        <h3>سلة التمشيق ({cart.length})</h3>
                        <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
                    </div>

                    <div className="cart-items-list" dir="rtl">
                        {cart.length === 0 ? (
                            <div className="empty-cart-msg">
                                <ShoppingBag size={64} opacity="0.1" />
                                <p>سلتك فارغة حالياً</p>
                                <button className="shop-now-btn" style={{ fontSize: '0.9rem' }} onClick={() => { setIsCartOpen(false); setView('products'); }}>ابدأ التسوق</button>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="cart-item-row">
                                    <img src={item.image || 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5'} className="cart-item-img" alt={item.name} />
                                    <div className="cart-item-details">
                                        <div className="cart-item-name">{item.name}</div>
                                        <div className="cart-item-price">{item.price.toLocaleString()} ج.م</div>
                                        <div className="qty-control">
                                            <button className="qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                                            <span>{item.quantity}</span>
                                            <button className="qty-btn" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    <button onClick={() => updateQty(item.id, -item.quantity)}><X size={16} color="var(--text-muted)" /></button>
                                </div>
                            ))
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="cart-panel-footer" dir="rtl">
                            <div className="cart-total-summary">
                                <span>الإجمالي:</span>
                                <span>{cartTotal.toLocaleString()} ج.م</span>
                            </div>
                            <button className="checkout-btn" onClick={() => { setIsCartOpen(false); setView('checkout'); }}>
                                إتمام الشراء <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProductCard = ({ product, onAdd }) => {
    // Helper to validate image URLs
    const getValidUrl = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return null;
        if (url.match(/^(http|https|data|blob):/i)) return url;
        return null; // Reject local paths or junk
    };

    const placeholder = 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=600';
    const validMain = getValidUrl(product.image);
    const validGallery = product.gallery && product.gallery.length > 0 ? getValidUrl(product.gallery[0]) : null;

    const [imgSrc, setImgSrc] = useState(validMain || validGallery || placeholder);

    useEffect(() => {
        setImgSrc(getValidUrl(product.image) || (product.gallery && product.gallery[0] ? getValidUrl(product.gallery[0]) : null) || placeholder);
    }, [product]);

    return (
        <div className="product-card">
            <div className="product-img-wrapper">
                <img
                    src={imgSrc}
                    alt={product.name}
                    onError={() => setImgSrc(placeholder)}
                />
                <div className="add-to-cart-overlay">
                    <button className="quick-add-btn" onClick={() => onAdd(product)}>
                        <ShoppingBag size={18} /> إضافة للسلة
                    </button>
                </div>
            </div>
            <div className="product-info">
                <div className="product-category">{product.category}</div>
                <div className="product-name">{product.name}</div>
                <div className="product-price">{(product.onlinePrice || product.price).toLocaleString()} ج.م</div>
            </div>
        </div>
    );
};

export default Storefront;
