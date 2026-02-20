import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Plus, Minus, Search, Clock, Home, CheckCircle, ChevronRight, Eye, Phone, MapPin, Instagram, Facebook, Star, LayoutGrid, Heart, Zap, Package, Sparkles, Soup } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';

const App = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('الكل');
    const [checkoutStatus, setCheckoutStatus] = useState('browsing'); // 'browsing', 'checkout', 'success'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null); // For Product Details Modal
    const [orderInfo, setOrderInfo] = useState({ name: '', phone: '', address: '' });

    // Fetch data from Supabase
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('show_online', true);

                if (error) throw error;
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

    const handleCheckout = async (e) => {
        e.preventDefault();
        const orderData = {
            id: `WEB-${Math.floor(Number(Date.now().toString().slice(-6)) + Math.random() * 1000)}`,
            date: new Date().toISOString(),
            customer_name: orderInfo.name,
            customer_phone: orderInfo.phone,
            customer_address: orderInfo.address,
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

    if (loading) return (
        <div className="loader-container">
            <div className="loader"></div>
            <p>جاري تحميل مجموعتنا الفاخرة...</p>
        </div>
    );

    return (
        <div className="store-wrapper" dir="rtl">
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

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-overlay"></div>
                <div className="container hero-content">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="hero-tag">تشكيلة 2024</span>
                        <h1>نسجنا لكِ الجمال في كل قطعة</h1>
                        <p>اكتشف عالم الأناقة التركية في منزلك مع أرقى الأدوات المنزلية المختارة بعناية لتناسب ذوقك الرفيع.</p>
                        <div className="hero-btns">
                            <button className="btn-primary" onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}>
                                تسوقي الآن <ChevronRight size={20} />
                            </button>
                            <button className="btn-secondary">
                                رؤية المجموعة <LayoutGrid size={18} />
                            </button>
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

            <main className="container main-content" id="shop">
                <div className="category-section">
                    <h2 className="section-title">تصفحي حسب الفئة</h2>
                    <div className="cat-circles-wrapper">
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

                {/* Products Grid */}
                <div className="product-grid">
                    <AnimatePresence>
                        {filteredProducts.map(p => (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="product-card"
                            >
                                <div className="product-image-wrapper">
                                    <div className="card-actions">
                                        <button className="circle-btn" onClick={() => addToCart(p)}><ShoppingBag size={18} /></button>
                                        <button className="circle-btn" onClick={() => setSelectedProduct(p)}><Eye size={18} /></button>
                                        <button className="circle-btn"><Heart size={18} /></button>
                                    </div>
                                    <img
                                        src={ensureValidUrl(p.image) || (p.gallery && p.gallery.length > 0 ? ensureValidUrl(p.gallery[0]) : null) || placeholderImg}
                                        className="product-image"
                                        alt={p.name}
                                        loading="lazy"
                                        onError={(e) => { e.target.onerror = null; e.target.src = placeholderImg; }}
                                    />
                                    {p.online_price && p.online_price < p.price && (
                                        <span className="sale-tag">خصم</span>
                                    )}
                                </div>
                                <div className="product-info">
                                    <span className="product-category-tag">{p.category || 'عام'}</span>
                                    <h3 className="product-name">{p.name}</h3>
                                    <div className="product-meta">
                                        <div className="product-price">
                                            {Number(p.online_price || p.price || 0).toLocaleString()} <span className="currency">ج.م</span>
                                            {p.online_price && p.online_price < p.price && (
                                                <span className="old-price">{Number(p.price).toLocaleString()} ج.م</span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="add-btn-minimal" onClick={() => addToCart(p)}>
                                        <Plus size={16} /> إضافة للسلة
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>

            {/* Testimonials */}
            <section className="testimonials">
                <div className="container">
                    <h2 className="section-title text-center">ماذا يقول عملاؤنا</h2>
                    <div className="testimonials-grid">
                        <div className="testimonial-card">
                            <div className="stars"><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /></div>
                            <p>"خامات فوق الممتازة ذوق عالي جداً وتعاملي معهم مستمر"</p>
                            <h5>سارة أحمد</h5>
                        </div>
                        <div className="testimonial-card">
                            <div className="stars"><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /></div>
                            <p>"التوصيل كان سريع جداً والمنتج وصل بحالة ممتازة"</p>
                            <h5>محمد علي</h5>
                        </div>
                        <div className="testimonial-card">
                            <div className="stars"><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /><Star size={16} fill="gold" color="gold" /></div>
                            <p>"أفضل متجر لتجهيز العرايس في مصر فعلاً ذوق تركي أصيل"</p>
                            <h5>ليلى مراد</h5>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="drawer-overlay" onClick={() => setIsCartOpen(false)}>
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="cart-drawer"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="drawer-header">
                                <ShoppingBag className="icon-gold" />
                                <h3>حقيبة التسوق</h3>
                                <button className="close-btn" onClick={() => setIsCartOpen(false)}><X /></button>
                            </div>

                            {cart.length === 0 ? (
                                <div className="empty-cart">
                                    <ShoppingBag size={80} strokeWidth={1} />
                                    <p>حقيبتك فارغة، ابدأي بالتسوق الآن</p>
                                    <button className="btn-primary" onClick={() => setIsCartOpen(false)}>تصفح المنتجات</button>
                                </div>
                            ) : checkoutStatus === 'success' ? (
                                <div className="success-message">
                                    <CheckCircle size={60} color="#2DCA73" />
                                    <h3>تم استلام طلبك!</h3>
                                    <p>سنتصل بكِ قريباً لتأكيد الموعد</p>
                                    <button className="btn-primary" onClick={() => { setCheckoutStatus('browsing'); setIsCartOpen(false); }}>حسناً</button>
                                </div>
                            ) : (
                                <>
                                    <div className="cart-items">
                                        {cart.map(item => (
                                            <div key={item.id} className="cart-item">
                                                <img src={item.image || placeholderImg} alt={item.name} />
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
                                        <div className="cart-summary">
                                            <div className="summary-row"><span>المجموع الفرعي:</span> <span>{cartTotal.toLocaleString()} ج.م</span></div>
                                            <div className="summary-row total"><span>الإجمالي:</span> <span>{cartTotal.toLocaleString()} ج.م</span></div>
                                        </div>

                                        {checkoutStatus === 'checkout' ? (
                                            <form onSubmit={handleCheckout} className="checkout-form">
                                                <input placeholder="الاسم بالكامل" required value={orderInfo.name} onChange={e => setOrderInfo({ ...orderInfo, name: e.target.value })} />
                                                <input placeholder="رقم الموبايل" required value={orderInfo.phone} onChange={e => setOrderInfo({ ...orderInfo, phone: e.target.value })} />
                                                <textarea placeholder="العنوان بالتفصيل" required value={orderInfo.address} onChange={e => setOrderInfo({ ...orderInfo, address: e.target.value })} />
                                                <button type="submit" className="btn-primary full-width">تأكيد الطلب الآن</button>
                                                <button type="button" className="btn-flat" onClick={() => setCheckoutStatus('browsing')}>رجوع</button>
                                            </form>
                                        ) : (
                                            <button onClick={() => setCheckoutStatus('checkout')} className="btn-primary full-width">إتمام الشراء</button>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Product Details Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="product-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="modal-close" onClick={() => setSelectedProduct(null)}><X /></button>
                            <div className="modal-content-grid">
                                <div className="modal-image-side">
                                    <img src={selectedProduct.image || placeholderImg} alt={selectedProduct.name} />
                                    {selectedProduct.gallery && selectedProduct.gallery.length > 0 && (
                                        <div className="gallery-thumbs">
                                            <img src={selectedProduct.image} className="active" alt="thumb" />
                                            {selectedProduct.gallery.slice(0, 3).map((img, i) => (
                                                <img key={i} src={img} alt={`thumb-${i}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="modal-info-side">
                                    <span className="brand-tag">أصلي 100%</span>
                                    <h2>{selectedProduct.name}</h2>
                                    <div className="modal-price">
                                        {(selectedProduct.online_price || selectedProduct.price).toLocaleString()} ج.م
                                    </div>
                                    <p className="product-desc">
                                        {selectedProduct.long_description || 'قطعة مختارة بعناية من البيت التركي، تضفي لمسة شرقية عصرية على منزلك. جودة عالية وتصميم فريد.'}
                                    </p>
                                    <div className="modal-actions">
                                        <button className="btn-primary" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}>إضافة للسلة</button>
                                        <button className="btn-wishlist"><Heart size={20} /></button>
                                    </div>
                                    <div className="meta-footer">
                                        <span>الفئة: {selectedProduct.category}</span>
                                        <span>الباركود: {selectedProduct.barcode}</span>
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
                            <li><a href="#">عن البيت التركي</a></li>
                            <li><a href="#">سياسة الاسترجاع</a></li>
                            <li><a href="#">فروعنا</a></li>
                            <li><a href="#">تواصل معنا</a></li>
                        </ul>
                    </div>
                    <div className="footer-contact">
                        <h4>تواصل معنا</h4>
                        <div className="contact-info">
                            <p><MapPin size={18} /> شارع التجارة، الفرع الرئيسي، القاهرة</p>
                            <p><Phone size={18} /> 01012345678</p>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2024 البيت التركي للأدوات المنزلية. جميع الحقوق محفوظة.</p>
                </div>
            </footer>
        </div>
    );
};

export default App;
