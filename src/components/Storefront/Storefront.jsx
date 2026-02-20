import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Plus, Minus, Search, Clock, Home, CheckCircle, ChevronRight, Eye, Phone, MapPin, Instagram, Facebook, Star, LayoutGrid, Heart, Zap, Package, Sparkles, Soup } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Storefront.css';

const Storefront = ({ products, settings, onSaveSale }) => {
    const [view, setView] = useState('home'); // home, products, success
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('الكل');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [checkoutStatus, setCheckoutStatus] = useState('browsing'); // browsing, checkout
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });

    // Only show products marked for online sale
    const onlineProducts = (products || []).filter(p => p.showOnline);
    const categories = ['الكل', ...(settings?.categories || [])];

    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'أطقم حلل': return <Soup size={28} />;
            case 'أجهزة كهربائية': return <Zap size={28} />;
            case 'رفايع': return <Package size={28} />;
            case 'منظفات': return <Sparkles size={28} />;
            case 'الكل': return <LayoutGrid size={28} />;
            default: return <Home size={28} />;
        }
    };

    const filteredProducts = onlineProducts.filter(p => {
        const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

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
                if (newQty === 0) return null;
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    const cartTotal = cart.reduce((sum, item) => sum + ((item.onlinePrice || item.price || 0) * item.quantity), 0);

    const placeholderImg = 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=1200';

    const ensureValidUrl = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return null;
        if (url.startsWith('http') || url.startsWith('https') || url.startsWith('/')) {
            // Avoid local paths like C:\
            if (url.includes(':\\')) return null;
            return url;
        }
        return null;
    };

    const handlePlaceOrder = () => {
        const orderData = {
            orderId: 'WEB-' + (Date.now()).toString().slice(-6),
            date: new Date().toISOString(),
            items: cart,
            total: cartTotal,
            paymentType: 'cash',
            status: 'pending',
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            customerAddress: customerInfo.address,
            source: 'online'
        };

        if (onSaveSale) {
            onSaveSale(orderData);
        }

        setCheckoutStatus('success');
        setCart([]);
    };

    return (
        <div className="store-container" dir="rtl">
            {/* Header */}
            <header className="store-header">
                <div className="container nav-content">
                    <div className="logo-container">
                        <img src="/logo.png" alt="Logo" className="logo-img" onError={(e) => e.target.style.display = 'none'} />
                        <div className="brand-name">
                            <span className="brand-main">{settings?.storeName || 'البيت التركي'}</span>
                            <span className="brand-sub">TURKISH HOME ART</span>
                        </div>
                    </div>

                    <div className="nav-actions">
                        <div className="search-bar-wrapper">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="ابحث عن قطعة فنية..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button onClick={() => setIsCartOpen(true)} className="cart-icon-btn">
                            <ShoppingBag size={20} />
                            <span className="cart-badge">{cart.length}</span>
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {view === 'home' && (
                    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Hero */}
                        <section className="hero">
                            <div className="hero-overlay"></div>
                            <div className="container hero-content">
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                    <span className="hero-tag">تشكيلة 2024</span>
                                    <h1>أناقتك تبدأ من تفاصيل منزلك</h1>
                                    <p>اكتشف عالم الأناقة التركية في منزلك مع أرقى الأدوات المنزلية المختارة بعناية.</p>
                                    <div className="hero-btns">
                                        <button className="btn-primary" onClick={() => setView('products')}>
                                            تسوقي الآن <ChevronRight size={20} />
                                        </button>
                                        <button className="btn-secondary">عن البيت التركي</button>
                                    </div>
                                </motion.div>
                            </div>
                        </section>

                        {/* Features Bar */}
                        <section className="features-bar">
                            <div className="container features-grid">
                                <div className="feature-item">
                                    <Clock size={24} />
                                    <div>
                                        <h4>توصيل سريع</h4>
                                        <p>لكافة محافظات الجمهورية</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <Star size={24} />
                                    <div>
                                        <h4>جودة مضمونة</h4>
                                        <p>خامات تركية أصلية</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <Phone size={24} />
                                    <div>
                                        <h4>دعم 24/7</h4>
                                        <p>متواجدون دائماً لخدمتك</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Featured Categories */}
                        <section className="container" style={{ padding: '60px 0' }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: 'var(--store-brown)' }}>تصفحي حسب الفئة</h2>
                            <div className="cat-circles-wrapper">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => { setSelectedCategory(cat); setView('products'); }}
                                        className={`cat-circle-btn ${selectedCategory === cat ? 'active' : ''}`}
                                    >
                                        <div className="icon-wrapper">
                                            {getCategoryIcon(cat)}
                                        </div>
                                        <span>{cat}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Best Sellers Preview */}
                        <section className="container" style={{ paddingBottom: '100px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2 style={{ fontSize: '2rem', color: 'var(--store-brown)' }}>الأكثر مبيعاً</h2>
                                <button className="btn-flat" onClick={() => setView('products')} style={{ color: 'var(--store-gold)', fontWeight: '700' }}>رؤية الكل</button>
                            </div>
                            <div className="product-grid">
                                {onlineProducts.slice(0, 4).map(p => (
                                    <ProductCard key={p.id} product={p} onAdd={addToCart} onOpen={() => setSelectedProduct(p)} />
                                ))}
                            </div>
                        </section>
                    </motion.div>
                )}

                {view === 'products' && (
                    <motion.div key="products" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="container">
                            <div className="category-section" style={{ paddingTop: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                                    <button onClick={() => setView('home')} style={{ background: 'var(--store-beige)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} /></button>
                                    <h2 className="section-title" style={{ margin: 0 }}>المتجر الإلكتروني</h2>
                                </div>
                                <div className="category-filter cat-circles-wrapper" style={{ marginBottom: '40px' }}>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            className={`cat-circle-btn ${selectedCategory === cat ? 'active' : ''}`}
                                            onClick={() => setSelectedCategory(cat)}
                                        >
                                            <div className="icon-wrapper">
                                                {getCategoryIcon(cat)}
                                            </div>
                                            <span>{cat}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="product-grid">
                                {filteredProducts.map(p => (
                                    <ProductCard key={p.id} product={p} onAdd={addToCart} onOpen={() => setSelectedProduct(p)} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="drawer-overlay" onClick={() => setIsCartOpen(false)}>
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            className="cart-drawer" onClick={e => e.stopPropagation()}
                        >
                            <div className="drawer-header">
                                <ShoppingBag className="icon-gold" />
                                <h3>حقيبة التسوق</h3>
                                <button className="close-btn" onClick={() => setIsCartOpen(false)}><X /></button>
                            </div>

                            {cart.length === 0 ? (
                                <div className="success-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    {checkoutStatus === 'success' ? (
                                        <>
                                            <CheckCircle size={60} color="#2DCA73" />
                                            <h3 style={{ marginTop: '20px' }}>تم استلام طلبك!</h3>
                                            <p>سيظهر الطلب الآن في لوحة التحكم.</p>
                                            <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => { setCheckoutStatus('browsing'); setIsCartOpen(false); }}>حسناً</button>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingBag size={80} opacity="0.1" />
                                            <p>السلة فارغة حالياً</p>
                                            <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setIsCartOpen(false)}>تصفح المنتجات</button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="cart-items">
                                        {cart.map(item => (
                                            <div key={item.id} className="cart-item">
                                                <img src={item.image || placeholderImg} alt={item.name} />
                                                <div className="item-details">
                                                    <h4>{item.name}</h4>
                                                    <div className="item-price">{(item.onlinePrice || item.price).toLocaleString()} ج.م</div>
                                                    <div className="qty-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--store-beige)', padding: '5px 12px', borderRadius: '20px', width: 'fit-content', marginTop: '10px' }}>
                                                        <button onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                                                        <span style={{ fontWeight: '700' }}>{item.quantity}</span>
                                                        <button onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                                                    </div>
                                                </div>
                                                <button className="remove-item" style={{ position: 'absolute', top: 0, left: 0, color: '#ff4d4d' }} onClick={() => updateQty(item.id, -item.quantity)}><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="drawer-footer">
                                        <div className="summary-row total">
                                            <span>الإجمالي:</span>
                                            <span>{cartTotal.toLocaleString()} ج.م</span>
                                        </div>

                                        {checkoutStatus === 'checkout' ? (
                                            <div className="checkout-form" style={{ marginTop: '20px' }}>
                                                <input placeholder="الاسم بالكامل" value={customerInfo.name} onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} />
                                                <input placeholder="رقم الموبايل" value={customerInfo.phone} onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })} />
                                                <textarea placeholder="العنوان بالتفصيل" value={customerInfo.address} onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })} />
                                                <button className="btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={handlePlaceOrder}>تأكيد الطلب الآن</button>
                                                <button className="btn-flat" style={{ width: '100%', marginTop: '10px', color: 'var(--store-gray)' }} onClick={() => setCheckoutStatus('browsing')}>رجوع</button>
                                            </div>
                                        ) : (
                                            <button className="btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setCheckoutStatus('checkout')}>إتمام الشراء</button>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="product-modal" onClick={e => e.stopPropagation()}
                        >
                            <button style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, background: 'var(--store-beige)', width: '40px', height: '40px', borderRadius: '50%' }} onClick={() => setSelectedProduct(null)}><X /></button>
                            <div className="modal-content-grid">
                                <div className="modal-image-side" style={{ background: '#f9f9f9' }}>
                                    <img src={selectedProduct.image || placeholderImg} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div className="modal-info-side">
                                    <span style={{ color: 'var(--store-gold)', fontWeight: '800', fontSize: '0.8rem' }}>أصلي 100%</span>
                                    <h2 style={{ fontSize: '2.5rem', margin: '10px 0' }}>{selectedProduct.name}</h2>
                                    <div className="modal-price" style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--store-brown)', marginBottom: '20px' }}>
                                        {(selectedProduct.onlinePrice || selectedProduct.price).toLocaleString()} ج.م
                                    </div>
                                    <p className="product-desc">
                                        {selectedProduct.longDescription || 'قطعة مختارة بعناية من البيت التركي، تضفي لمسة فنية فريدة على منزلك. جودة عالية وتصاميم تركية أصلية.'}
                                    </p>
                                    <div style={{ marginTop: 'auto', display: 'flex', gap: '15px' }}>
                                        <button className="btn-primary" style={{ flex: 1 }} onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>إضافة للسلة</button>
                                        <button style={{ width: '50px', background: 'var(--store-beige)', borderRadius: '10px' }}><Heart size={20} /></button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="store-footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <img src="/logo.png" alt="Logo" className="footer-logo" />
                            <p>وجهتكم الأولى للأناقة والجمال في كل ركن من أركان منزلك. نختار لكم بعناية أرقى الموديلات التركية.</p>
                        </div>
                        <div className="footer-links">
                            <h4>روابط هامة</h4>
                            <ul style={{ padding: 0, opacity: 0.7 }}>
                                <li style={{ marginBottom: '10px' }}>عن البيت التركي</li>
                                <li style={{ marginBottom: '10px' }}>سياسة الاسترجاع</li>
                                <li style={{ marginBottom: '10px' }}>تواصل معنا</li>
                            </ul>
                        </div>
                        <div className="footer-contact">
                            <h4>تواصل معنا</h4>
                            <p style={{ opacity: 0.7, marginBottom: '10px' }}><Phone size={16} /> {settings?.phone || '01012345678'}</p>
                            <p style={{ opacity: 0.7 }}><MapPin size={16} /> {settings?.address || 'الفرع الرئيسي'}</p>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2024 البيت التركي - جميع الحقوق محفوظة</p>
                </div>
            </footer>
        </div>
    );
};

const ProductCard = ({ product, onAdd, onOpen }) => {
    const placeholder = 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=1200';

    // Safely get the image URL using the same logic (since it's a sub-component, we'll define a local version or use the one from props if we refactored)
    const ensureValidUrl = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return null;
        if (url.startsWith('http') || url.startsWith('https') || url.startsWith('/')) {
            if (url.includes(':\\')) return null;
            return url;
        }
        return null;
    };

    const imageUrl = ensureValidUrl(product.image) || (product.gallery && product.gallery.length > 0 ? ensureValidUrl(product.gallery[0]) : null) || placeholder;
    const displayPrice = product.onlinePrice || product.price || 0;

    return (
        <div className="product-card">
            <div className="product-image-wrapper">
                <div className="card-actions">
                    <button className="circle-btn" onClick={() => onAdd(product)}><ShoppingBag size={18} /></button>
                    <button className="circle-btn" onClick={onOpen}><Eye size={18} /></button>
                </div>
                <img
                    src={imageUrl}
                    className="product-image"
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = placeholder;
                    }}
                />
            </div>
            <div className="product-info">
                <span className="product-category-tag">{product.category || 'عام'}</span>
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">
                    {Number(displayPrice).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: '400', opacity: 0.6 }}>ج.م</span>
                </div>
                <button className="add-btn-minimal" onClick={() => onAdd(product)}>
                    <Plus size={16} /> إضافة للسلة
                </button>
            </div>
        </div>
    );
};

export default Storefront;
