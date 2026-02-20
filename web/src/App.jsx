import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Plus, Minus, Search, Clock, Home, CheckCircle, ChevronRight, Eye, Phone, MapPin, Instagram, Facebook, Star, LayoutGrid, Heart, Zap, Package, Sparkles, Soup } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';
import './index.css';

const App = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('الكل');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [checkoutStatus, setCheckoutStatus] = useState('browsing'); // browsing, checkout, success
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });

    // Fetch data from Supabase
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('show_online', true);

                if (error) throw error;
                // Map database fields (snake_case) to app fields (camelCase) if needed
                // But web/src/App.jsx uses p.image, p.price, p.online_price
                setProducts(data || []);
            } catch (err) {
                console.error("Error fetching products:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const categories = ['الكل', ...new Set(products.map(p => p.category))];

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

    const filteredProducts = products.filter(p => {
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

    const cartTotal = cart.reduce((sum, item) => sum + ((item.online_price || item.price || 0) * item.quantity), 0);

    const placeholderImg = 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=1200';

    const ensureValidUrl = (url) => {
        if (!url || typeof url !== 'string' || url.trim() === '') return null;
        if (url.startsWith('http') || url.startsWith('https') || url.startsWith('/')) {
            if (url.includes(':\\')) return null;
            return url;
        }
        return null;
    };

    const handlePlaceOrder = async (e) => {
        if (e) e.preventDefault();
        const orderData = {
            id: 'WEB-' + (Date.now()).toString().slice(-6),
            date: new Date().toISOString(),
            customer_name: customerInfo.name,
            customer_phone: customerInfo.phone,
            customer_address: customerInfo.address,
            total: cartTotal,
            items: cart,
            source: 'online',
            status: 'pending'
        };

        try {
            const { error } = await supabase.from('sales').insert([orderData]);
            if (!error) {
                setCheckoutStatus('success');
                setCart([]);
            } else {
                throw error;
            }
        } catch (err) {
            alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
        }
    };

    if (loading) return (
        <div className="loader-container">
            <div className="loader"></div>
            <p>جاري تحميل مجموعتنا الفاخرة...</p>
        </div>
    );

    return (
        <div className="store-container" dir="rtl">
            {/* Header */}
            <header className="store-header">
                <div className="container nav-content">
                    <div className="logo-container">
                        <img src="/logo.png" alt="Logo" className="logo-img" onError={(e) => e.target.style.display = 'none'} />
                        <div className="brand-name">
                            <span className="brand-main">البيت التركي</span>
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Hero */}
                    <section className="hero">
                        <div className="hero-overlay"></div>
                        <div className="container hero-content">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                <span className="hero-tag">تشكيلة 2024</span>
                                <h1>أناقتك تبدأ من تفاصيل منزلك</h1>
                                <p>اكتشف عالم الأناقة التركية في منزلك مع أرقى الأدوات المنزلية المختارة بعناية.</p>
                                <div className="hero-btns">
                                    <button className="btn-primary" onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}>
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

                    {/* Shop Content */}
                    <main className="container main-content" id="shop" style={{ padding: '60px 0' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: 'var(--store-brown)' }}>تصفحي مجموعتنا</h2>

                        <div className="cat-circles-wrapper" style={{ marginBottom: '40px' }}>
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

                        <div className="product-grid">
                            {filteredProducts.map(p => (
                                <ProductCard key={p.id} product={p} onAdd={addToCart} onOpen={() => setSelectedProduct(p)} placeholder={placeholderImg} ensureValidUrl={ensureValidUrl} />
                            ))}
                        </div>
                    </main>

                    {/* Testimonials */}
                    <section className="testimonials" style={{ background: 'var(--store-beige)', padding: '80px 0' }}>
                        <div className="container">
                            <h2 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--store-brown)' }}>ماذا يقول عملاؤنا</h2>
                            <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                                <div className="testimonial-card" style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>{[...Array(5)].map((_, i) => <Star key={i} size={16} fill="var(--store-gold)" color="var(--store-gold)" />)}</div>
                                    <p>"خامات فوق الممتازة ذوق عالي جداً وتعاملي معهم مستمر"</p>
                                    <h5 style={{ marginTop: '15px', color: 'var(--store-brown)' }}>سارة أحمد</h5>
                                </div>
                                <div className="testimonial-card" style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>{[...Array(5)].map((_, i) => <Star key={i} size={16} fill="var(--store-gold)" color="var(--store-gold)" />)}</div>
                                    <p>"التوصيل كان سريع جداً والمنتج وصل بحالة ممتازة"</p>
                                    <h5 style={{ marginTop: '15px', color: 'var(--store-brown)' }}>محمد علي</h5>
                                </div>
                                <div className="testimonial-card" style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>{[...Array(5)].map((_, i) => <Star key={i} size={16} fill="var(--store-gold)" color="var(--store-gold)" />)}</div>
                                    <p>"أفضل متجر لتجهيز العرايس في مصر فعلاً ذوق تركي أصيل"</p>
                                    <h5 style={{ marginTop: '15px', color: 'var(--store-brown)' }}>ليلى مراد</h5>
                                </div>
                            </div>
                        </div>
                    </section>
                </motion.div>
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
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center' }}>
                                    {checkoutStatus === 'success' ? (
                                        <>
                                            <CheckCircle size={60} color="#2DCA73" />
                                            <h3 style={{ marginTop: '20px' }}>تم استلام طلبك!</h3>
                                            <p>سنتواصل معك قريباً لتأكيد التوصيل.</p>
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
                                                <img src={ensureValidUrl(item.image) || placeholderImg} alt={item.name} />
                                                <div className="item-details">
                                                    <h4>{item.name}</h4>
                                                    <div className="item-price">{(item.online_price || item.price).toLocaleString()} ج.م</div>
                                                    <div className="qty-controls">
                                                        <button onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                                                        <span>{item.quantity}</span>
                                                        <button onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                                                    </div>
                                                </div>
                                                <button className="remove-item" onClick={() => updateQty(item.id, -item.quantity)}><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="drawer-footer">
                                        <div className="summary-row total">
                                            <span>الإجمالي:</span>
                                            <span>{cartTotal.toLocaleString()} ج.م</span>
                                        </div>

                                        {checkoutStatus === 'checkout' ? (
                                            <form className="checkout-form" style={{ marginTop: '20px' }} onSubmit={handlePlaceOrder}>
                                                <input placeholder="الاسم بالكامل" required value={customerInfo.name} onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} />
                                                <input placeholder="رقم الموبايل" required value={customerInfo.phone} onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })} />
                                                <textarea placeholder="العنوان بالتفصيل" required value={customerInfo.address} onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })} />
                                                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>تأكيد الطلب الآن</button>
                                                <button type="button" className="btn-flat" style={{ width: '100%', marginTop: '10px', color: 'var(--store-gray)' }} onClick={() => setCheckoutStatus('browsing')}>رجوع</button>
                                            </form>
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
                            <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}><X /></button>
                            <div className="modal-content-grid">
                                <div className="modal-image-side">
                                    <img src={ensureValidUrl(selectedProduct.image) || (selectedProduct.gallery && selectedProduct.gallery.length > 0 ? ensureValidUrl(selectedProduct.gallery[0]) : null) || placeholderImg} alt={selectedProduct.name} />
                                </div>
                                <div className="modal-info-side">
                                    <span className="brand-badge-small">أصلي 100%</span>
                                    <h2>{selectedProduct.name}</h2>
                                    <div className="modal-price">
                                        {(selectedProduct.online_price || selectedProduct.price).toLocaleString()} ج.م
                                    </div>
                                    <p className="product-desc">
                                        {selectedProduct.long_description || 'قطعة مختارة بعناية من البيت التركي، تضفي لمسة فنية فريدة على منزلك. جودة عالية وتصاميم تركية أصلية.'}
                                    </p>
                                    <div className="modal-actions">
                                        <button className="btn-primary" style={{ flex: 1 }} onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>إضافة للسلة</button>
                                        <button className="btn-wishlist"><Heart size={20} /></button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="store-footer">
                <div className="container footer-grid">
                    <div className="footer-brand">
                        <img src="/logo.png" alt="Logo" className="footer-logo" />
                        <p>وجهتكم الأولى للأناقة والجمال في كل ركن من أركان منزلك. نختار لكم بعناية أرقى الموديلات التركية.</p>
                        <div className="social-links">
                            <a href="#"><Instagram /></a>
                            <a href="#"><Facebook /></a>
                            <a href="#"><Phone /></a>
                        </div>
                    </div>
                    <div className="footer-links">
                        <h4>روابط هامة</h4>
                        <ul>
                            <li>عن البيت التركي</li>
                            <li>سياسة الاسترجاع</li>
                            <li>تواصل معنا</li>
                        </ul>
                    </div>
                    <div className="footer-contact">
                        <h4>تواصل معنا</h4>
                        <p><Phone size={16} /> 01012345678</p>
                        <p><MapPin size={16} /> القاهرة، الفرع الرئيسي</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2024 البيت التركي - جميع الحقوق محفوظة</p>
                </div>
            </footer>
        </div>
    );
};

const ProductCard = ({ product, onAdd, onOpen, placeholder, ensureValidUrl }) => {
    const imageUrl = ensureValidUrl(product.image) || (product.gallery && product.gallery.length > 0 ? ensureValidUrl(product.gallery[0]) : null) || placeholder;
    const displayPrice = product.online_price || product.price || 0;

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

export default App;
