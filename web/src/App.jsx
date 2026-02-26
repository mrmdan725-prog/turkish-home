import React, { useState, useEffect } from 'react';
import {
    ShoppingBag, Search, Home, Phone, Star, Clock, ChevronRight, X, User, MapPin,
    Soup, Zap, Package, Sparkles, LayoutGrid, Plus, Eye, Heart, Instagram,
    Facebook, Minus, CheckCircle, Truck, FileText, PackageCheck, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';
import CustomerAuth from './components/CustomerAuth';
import CustomerDashboard from './components/CustomerDashboard';
import './index.css';

const Logo = ({ size = 45, color = '#4B2C20' }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 15L85 45V85H15V45L50 15Z" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M42 85V65C42 60.5817 45.5817 57 50 57C54.4183 57 58 60.5817 58 65V85" stroke={color} strokeWidth="2.5" />
        <path d="M25 75H35V82H25V75Z" fill={color} />
        <path d="M30 75V60" stroke={color} strokeWidth="1.5" />
        <circle cx="30" cy="58" r="2" fill={color} />
        <path d="M65 75H75V82H65V75Z" fill={color} />
        <path d="M70 75V60" stroke={color} strokeWidth="1.5" />
        <circle cx="70" cy="58" r="2" fill={color} />
        <path d="M50 35V50" stroke={color} strokeWidth="1.5" />
    </svg>
);

const App = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('الكل');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [activeModalImg, setActiveModalImg] = useState(null);
    const [checkoutStatus, setCheckoutStatus] = useState('browsing'); // browsing, checkout, success
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
    const [scrolled, setScrolled] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

    // Customer Auth & Dashboard
    const [customer, setCustomer] = useState(() => {
        try {
            const saved = localStorage.getItem('th_customer');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);

    const handleLoginSuccess = (customerData) => {
        setCustomer(customerData);
        // Auto-fill checkout info
        setCustomerInfo({
            name: customerData.name || '',
            phone: customerData.phone || '',
            address: customerData.address || ''
        });
    };

    const handleLogout = () => {
        setCustomer(null);
        localStorage.removeItem('th_customer');
        setIsDashboardOpen(false);
    };

    const handleAccountClick = () => {
        if (customer) {
            setIsDashboardOpen(true);
        } else {
            setIsAuthOpen(true);
        }
    };

    // Order Tracking
    const [isTrackingOpen, setIsTrackingOpen] = useState(false);
    const [trackingQuery, setTrackingQuery] = useState('');
    const [trackedOrder, setTrackedOrder] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [trackingError, setTrackingError] = useState('');

    const ORDER_STAGES = [
        { key: 'pending', label: 'تم استلام الطلب', icon: PackageCheck, desc: 'تم استلام طلبك وجاري مراجعته' },
        { key: 'invoiced', label: 'تم تأكيد الطلب', icon: FileText, desc: 'تم تأكيد طلبك وإصدار الفاتورة' },
        { key: 'delivering', label: 'قيد التوصيل', icon: Truck, desc: 'طلبك في الطريق إليك' },
        { key: 'delivered', label: 'تم التسليم', icon: CheckCircle, desc: 'تم تسليم طلبك بنجاح' },
    ];

    const getStageIndex = (status) => {
        const idx = ORDER_STAGES.findIndex(s => s.key === status);
        return idx >= 0 ? idx : 0;
    };

    const handleTrackOrder = async () => {
        if (!trackingQuery.trim()) return;
        setTrackingLoading(true);
        setTrackingError('');
        setTrackedOrder(null);
        try {
            // Search by order ID or phone
            let result = null;
            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .eq('source', 'online')
                .or(`id.eq.${trackingQuery.trim()},customer_phone.eq.${trackingQuery.trim()}`)
                .order('date', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (data && data.length > 0) {
                setTrackedOrder(data[0]);
            } else {
                setTrackingError('لم يتم العثور على طلب بهذا الرقم. تأكد من رقم الطلب أو رقم الهاتف.');
            }
        } catch (err) {
            setTrackingError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
        } finally {
            setTrackingLoading(false);
        }
    };

    // Website Settings
    const [storeSettings, setStoreSettings] = useState({
        storeName: 'البيت التركي',
        phone: '01012345678',
        facebook: '#',
        instagram: '#'
    });

    const [currentHeroIdx, setCurrentHeroIdx] = useState(0);

    // Hero Images Fallback
    const heroFallback = 'https://images.unsplash.com/photo-1616489953149-805e8bc8636e?auto=format&fit=crop&q=80&w=2000';
    const heroSlides = storeSettings.heroImages && storeSettings.heroImages.length > 0
        ? storeSettings.heroImages
        : (storeSettings.heroImage ? [storeSettings.heroImage] : [heroFallback]);

    useEffect(() => {
        if (heroSlides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentHeroIdx(prev => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [heroSlides.length]);

    // Wishlist / Likes
    const [wishlist, setWishlist] = useState(() => {
        const saved = localStorage.getItem('th_wishlist');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('th_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const toggleLike = (id) => {
        setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch data from Supabase
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Products
                const { data: prodData, error: prodErr } = await supabase
                    .from('products')
                    .select('*')
                    .eq('show_online', true);

                if (prodErr) throw prodErr;
                setProducts(prodData || []);

                // Fetch Settings
                const { data: setRes } = await supabase
                    .from('settings')
                    .select('data')
                    .eq('id', 'store_settings')
                    .single();

                if (setRes && setRes.data) {
                    setStoreSettings(prev => ({ ...prev, ...setRes.data }));
                }
            } catch (err) {
                console.error("Error fetching data:", err);
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
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = !query ||
            (String(p.name || '').toLowerCase().includes(query)) ||
            (String(p.category || '').toLowerCase().includes(query));

        // If searching, ignore category filter to search everywhere
        if (query) return matchesSearch;

        const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
        return matchesCategory;
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
            status: 'pending',
            customer_id: customer?.id || null
        };

        try {
            const { error } = await supabase.from('sales').insert([orderData]);
            if (!error) {
                setCheckoutStatus('success');
                setCart([]);
                // Save the order ID for tracking
                localStorage.setItem('th_last_order', orderData.id);
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
            <header className={`store-header ${scrolled ? 'scrolled' : ''}`}>
                <div className="container nav-content">
                    <div className="logo-container" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
                        <Logo />
                        <div className="brand-name">
                            <span className="brand-main">{storeSettings.storeName}</span>
                            <span className="brand-sub">للأدوات المنزلية والأنتيكات</span>
                        </div>
                    </div>

                    <div className="nav-actions">
                        <div className={`search-bar-wrapper ${isSearchOpen ? 'active' : ''}`}>
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="ابحث عن قطعة فنية..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchOpen(true)}
                                onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
                            />
                        </div>
                        <button onClick={handleAccountClick} className="track-btn desktop-only" title={customer ? 'حسابي' : 'تسجيل دخول'}>
                            {customer ? <User size={18} /> : <LogIn size={18} />}
                        </button>
                        <button onClick={() => setIsFavoritesOpen(true)} className="cart-icon-btn desktop-only" title="المفضلة">
                            <Heart size={20} />
                            {wishlist.length > 0 && <span className="cart-badge">{wishlist.length}</span>}
                        </button>
                        <button onClick={() => setIsCartOpen(true)} className="cart-icon-btn">
                            <ShoppingBag size={20} />
                            <span className="cart-badge">{cart.length}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Nav */}
            <nav className="mobile-bottom-nav">
                <button className="nav-item active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <Home size={22} />
                    <span>الرئيسية</span>
                </button>
                <button className="nav-item" onClick={() => {
                    setIsSearchOpen(!isSearchOpen);
                    if (!isSearchOpen) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setTimeout(() => document.querySelector('.search-bar-wrapper input')?.focus(), 300);
                    }
                }}>
                    <Search size={22} />
                    <span>البحث</span>
                </button>
                <button className="nav-item cart-nav-item" onClick={() => setIsCartOpen(true)}>
                    <div className="cart-icon-wrapper">
                        <ShoppingBag size={22} />
                        {cart.length > 0 && <span className="m-cart-badge">{cart.length}</span>}
                    </div>
                    <span>السلة</span>
                </button>
                <button className="nav-item" onClick={handleAccountClick}>
                    {customer ? <User size={22} /> : <LogIn size={22} />}
                    <span>{customer ? 'حسابي' : 'دخول'}</span>
                </button>
                <button className="nav-item" onClick={() => setIsFavoritesOpen(true)}>
                    <div className="cart-icon-wrapper">
                        <Heart size={22} />
                        {wishlist.length > 0 && <span className="m-cart-badge" style={{ backgroundColor: 'var(--store-gold)' }}>{wishlist.length}</span>}
                    </div>
                    <span>المفضلة</span>
                </button>
                <button className="nav-item" onClick={() => window.open(`https://wa.me/${storeSettings.phone.replace(/[^0-9]/g, '')}`, '_blank')}>
                    <Phone size={22} />
                    <span>واتساب</span>
                </button>
            </nav>

            <AnimatePresence mode="wait">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Hero Slider */}
                    <section className="hero">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={currentHeroIdx}
                                initial={{ opacity: 0, scale: 1.25 }}
                                animate={{ opacity: 1, scale: 1.05 }}
                                exit={{ opacity: 0, scale: 1 }}
                                transition={{
                                    opacity: { duration: 1.5, ease: "easeInOut" },
                                    scale: { duration: 10, ease: "linear" }
                                }}
                                className="hero-slide"
                                style={{ backgroundImage: `url(${heroSlides[currentHeroIdx]})` }}
                            />
                        </AnimatePresence>
                        <div className="hero-overlay"></div>
                        <div className="container hero-content">
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                <h1 style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>أناقتك تبدأ من تفاصيل منزلك</h1>
                                <p style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>اكتشف عالم الأناقة التركية في منزلك مع أرقى الأدوات المنزلية المختارة بعناية.</p>
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
                        <div className="section-header" style={{ marginBottom: '40px' }}>
                            <div>
                                <h2 style={{ fontSize: '2rem', color: 'var(--store-brown)', marginBottom: '10px' }}>
                                    {searchQuery ? `نتائج البحث عن: ${searchQuery}` : selectedCategory === 'الكل' ? 'تصفحي مجموعتنا' : selectedCategory}
                                </h2>
                                <p style={{ color: 'var(--store-gray)' }}>
                                    {searchQuery ? `وجدنا ${filteredProducts.length} منتج يطابق بحثك` : 'قطع مختارة بعناية لتناسب ذوقك الرفيع'}
                                </p>
                            </div>
                        </div>

                        {!searchQuery && (
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
                        )}

                        {filteredProducts.length > 0 ? (
                            <div className="product-grid">
                                {filteredProducts.map(p => (
                                    <ProductCard
                                        key={p.id}
                                        product={p}
                                        isLiked={wishlist.includes(p.id)}
                                        onLike={() => toggleLike(p.id)}
                                        onAdd={addToCart}
                                        onOpen={() => {
                                            setSelectedProduct(p);
                                            setActiveModalImg(null); // Reset for new product
                                        }}
                                        placeholder={placeholderImg}
                                        ensureValidUrl={ensureValidUrl}
                                    />
                                ))}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="no-results"
                                style={{ textAlign: 'center', padding: '100px 20px', background: 'var(--store-beige)', borderRadius: '30px' }}
                            >
                                <div className="no-results-content">
                                    <div className="no-results-icon" style={{ marginBottom: '20px', color: 'var(--store-gold)', opacity: 0.3 }}>
                                        <Search size={80} strokeWidth={1} />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', color: 'var(--store-brown)', marginBottom: '10px' }}>عذراً، لم نجد ما تبحث عنه</h3>
                                    <p style={{ color: 'var(--store-gray)', marginBottom: '25px' }}>جرب البحث بكلمات أخرى أو تصفح التصنيفات</p>
                                    <button className="btn-primary" onClick={() => setSearchQuery('')}>
                                        عرض كل المنتجات
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </main>

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
                                            <p style={{ color: '#64748b' }}>رقم الطلب: <strong style={{ color: '#4B2C20' }}>{localStorage.getItem('th_last_order')}</strong></p>
                                            <p>سنتواصل معك قريباً لتأكيد التوصيل.</p>
                                            <button className="btn-primary" style={{ marginTop: '15px' }} onClick={() => {
                                                setTrackingQuery(localStorage.getItem('th_last_order') || '');
                                                setCheckoutStatus('browsing');
                                                setIsCartOpen(false);
                                                setIsTrackingOpen(true);
                                                handleTrackOrder();
                                            }}>تتبع طلبك</button>
                                            <button className="btn-flat" style={{ marginTop: '10px', color: 'var(--store-gray)' }} onClick={() => { setCheckoutStatus('browsing'); setIsCartOpen(false); }}>حسناً</button>
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
                                                {customer && (
                                                    <div className="autofill-notice">
                                                        <CheckCircle size={14} /> تم تعبئة بياناتك تلقائياً
                                                    </div>
                                                )}
                                                <input placeholder="الاسم بالكامل" required value={customerInfo.name} onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} />
                                                <input placeholder="رقم الموبايل" required value={customerInfo.phone} onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })} />
                                                <textarea placeholder="العنوان بالتفصيل" required value={customerInfo.address} onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })} />
                                                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>تأكيد الطلب الآن</button>
                                                <button type="button" className="btn-flat" style={{ width: '100%', marginTop: '10px', color: 'var(--store-gray)' }} onClick={() => setCheckoutStatus('browsing')}>رجوع</button>
                                            </form>
                                        ) : (
                                            <div>
                                                {!customer && (
                                                    <button className="btn-login-checkout" onClick={() => setIsAuthOpen(true)}>
                                                        <LogIn size={16} /> سجّل دخولك لتعبئة بياناتك تلقائياً
                                                    </button>
                                                )}
                                                <button className="btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={() => {
                                                    if (customer) {
                                                        setCustomerInfo({ name: customer.name, phone: customer.phone, address: customer.address || '' });
                                                    }
                                                    setCheckoutStatus('checkout');
                                                }}>إتمام الشراء</button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Favorites Drawer */}
            <AnimatePresence>
                {isFavoritesOpen && (
                    <div className="drawer-overlay" onClick={() => setIsFavoritesOpen(false)}>
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            className="cart-drawer favorites-drawer" onClick={e => e.stopPropagation()}
                        >
                            <div className="drawer-header">
                                <Heart className="icon-gold" />
                                <h3>المنتجات المفضلة</h3>
                                <button className="close-btn" onClick={() => setIsFavoritesOpen(false)}><X /></button>
                            </div>

                            {wishlist.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center' }}>
                                    <Heart size={80} opacity="0.1" />
                                    <p>قائمة المفضلة فارغة حالياً</p>
                                    <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setIsFavoritesOpen(false)}>تصفح المنتجات</button>
                                </div>
                            ) : (
                                <div className="cart-items" style={{ padding: '20px', overflowY: 'auto' }}>
                                    {products.filter(p => wishlist.includes(p.id)).map(item => (
                                        <div key={item.id} className="cart-item">
                                            <img src={ensureValidUrl(item.image) || placeholderImg} alt={item.name} />
                                            <div className="item-details">
                                                <h4>{item.name}</h4>
                                                <div className="item-price">{(item.online_price || item.price).toLocaleString()} ج.م</div>
                                                <button
                                                    className="btn-primary"
                                                    style={{ marginTop: '10px', fontSize: '0.8rem', padding: '5px 10px' }}
                                                    onClick={() => { addToCart(item); setIsFavoritesOpen(false); }}
                                                >
                                                    إضافة للسلة
                                                </button>
                                            </div>
                                            <button className="remove-item" onClick={() => toggleLike(item.id)}><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
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
                                    <div className="main-modal-img">
                                        <img src={activeModalImg || ensureValidUrl(selectedProduct.image) || (selectedProduct.gallery && selectedProduct.gallery.length > 0 ? ensureValidUrl(selectedProduct.gallery[0]) : null) || placeholderImg} alt={selectedProduct.name} />
                                    </div>

                                    {(selectedProduct.gallery && selectedProduct.gallery.length > 0) && (
                                        <div className="modal-gallery-thumbs">
                                            {/* Primary Image Thumb */}
                                            <div
                                                className={`thumb-box ${(!activeModalImg || activeModalImg === ensureValidUrl(selectedProduct.image)) ? 'active' : ''}`}
                                                onClick={() => setActiveModalImg(ensureValidUrl(selectedProduct.image))}
                                            >
                                                <img src={ensureValidUrl(selectedProduct.image) || placeholderImg} alt="thumb-main" />
                                            </div>

                                            {/* Gallery Thumbs */}
                                            {selectedProduct.gallery.map((img, idx) => {
                                                const validImg = ensureValidUrl(img);
                                                if (!validImg) return null;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`thumb-box ${activeModalImg === validImg ? 'active' : ''}`}
                                                        onClick={() => setActiveModalImg(validImg)}
                                                    >
                                                        <img src={validImg} alt={`thumb-${idx}`} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
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
                                        <button
                                            className={`btn-wishlist ${wishlist.includes(selectedProduct.id) ? 'active' : ''}`}
                                            onClick={() => toggleLike(selectedProduct.id)}
                                        >
                                            <Heart size={20} fill={wishlist.includes(selectedProduct.id) ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Order Tracking Modal */}
            <AnimatePresence>
                {isTrackingOpen && (
                    <div className="modal-overlay" onClick={() => { setIsTrackingOpen(false); setTrackedOrder(null); setTrackingError(''); }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="tracking-modal" onClick={e => e.stopPropagation()}
                        >
                            <button className="modal-close-btn" onClick={() => { setIsTrackingOpen(false); setTrackedOrder(null); setTrackingError(''); }}><X /></button>

                            <div className="tracking-header">
                                <Truck size={32} className="tracking-icon" />
                                <h2>تتبع طلبك</h2>
                                <p>أدخل رقم الطلب أو رقم الهاتف</p>
                            </div>

                            <div className="tracking-search">
                                <input
                                    type="text"
                                    placeholder="مثال: WEB-123456 أو 01012345678"
                                    value={trackingQuery}
                                    onChange={(e) => setTrackingQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleTrackOrder()}
                                />
                                <button onClick={handleTrackOrder} disabled={trackingLoading}>
                                    {trackingLoading ? <div className="mini-loader"></div> : <Search size={18} />}
                                    <span>{trackingLoading ? 'جاري البحث...' : 'بحث'}</span>
                                </button>
                            </div>

                            {trackingError && (
                                <div className="tracking-error">{trackingError}</div>
                            )}

                            {trackedOrder && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tracking-result">
                                    <div className="tracking-order-info">
                                        <div className="tracking-order-id">
                                            <span>رقم الطلب</span>
                                            <strong>{trackedOrder.id}</strong>
                                        </div>
                                        <div className="tracking-order-date">
                                            <span>تاريخ الطلب</span>
                                            <strong>{new Date(trackedOrder.date).toLocaleDateString('ar-EG')}</strong>
                                        </div>
                                        <div className="tracking-order-total">
                                            <span>الإجمالي</span>
                                            <strong>{Number(trackedOrder.total).toLocaleString()} ج.م</strong>
                                        </div>
                                    </div>

                                    {/* Visual Progress Stepper */}
                                    <div className="tracking-stepper">
                                        {ORDER_STAGES.map((stage, idx) => {
                                            const currentIdx = getStageIndex(trackedOrder.status);
                                            const StageIcon = stage.icon;
                                            const isActive = idx === currentIdx;
                                            const isDone = idx < currentIdx;
                                            return (
                                                <React.Fragment key={stage.key}>
                                                    <div className={`track-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                                                        <div className="track-circle">
                                                            {isDone ? <CheckCircle size={20} /> : <StageIcon size={20} />}
                                                        </div>
                                                        <div className="track-info">
                                                            <span className="track-label">{stage.label}</span>
                                                            {(isDone || isActive) && <span className="track-desc">{stage.desc}</span>}
                                                        </div>
                                                    </div>
                                                    {idx < ORDER_STAGES.length - 1 && (
                                                        <div className={`track-connector ${idx < currentIdx ? 'done' : ''}`} />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>

                                    {trackedOrder.status === 'cancelled' && (
                                        <div className="tracking-cancelled">
                                            <X size={20} /> تم إلغاء هذا الطلب
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* Customer Auth Modal */}
            <AnimatePresence>
                {isAuthOpen && (
                    <CustomerAuth
                        isOpen={isAuthOpen}
                        onClose={() => setIsAuthOpen(false)}
                        onLoginSuccess={handleLoginSuccess}
                    />
                )}
            </AnimatePresence>

            {/* Customer Dashboard */}
            <AnimatePresence>
                {isDashboardOpen && customer && (
                    <CustomerDashboard
                        isOpen={isDashboardOpen}
                        onClose={() => setIsDashboardOpen(false)}
                        customer={customer}
                        onLogout={handleLogout}
                        onUpdateCustomer={(updated) => setCustomer(updated)}
                    />
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="store-footer">
                <div className="container footer-grid">
                    <div className="footer-brand">
                        <Logo size={60} color="#D4AF37" />
                        <p>وجهتكم الأولى للأناقة والجمال في كل ركن من أركان منزلك. نختار لكم بعناية أرقى الموديلات التركية.</p>
                        <div className="social-links">
                            {storeSettings.instagram && <a href={storeSettings.instagram} target="_blank" rel="noreferrer"><Instagram /></a>}
                            {storeSettings.facebook && <a href={storeSettings.facebook} target="_blank" rel="noreferrer"><Facebook /></a>}
                            <a href={`tel:${storeSettings.phone}`}><Phone /></a>
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
                        <p><Phone size={16} /> {storeSettings.phone}</p>
                        {storeSettings.address && (
                            <p><MapPin size={16} /> {storeSettings.address}</p>
                        )}
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} {storeSettings.storeName} - جميع الحقوق محفوظة</p>
                </div>
            </footer>
        </div>
    );
};

const ProductCard = ({ product, isLiked, onLike, onAdd, onOpen, placeholder, ensureValidUrl }) => {
    const imageUrl = ensureValidUrl(product.image) || (product.gallery && product.gallery.length > 0 ? ensureValidUrl(product.gallery[0]) : null) || placeholder;
    const displayPrice = product.online_price || product.price || 0;

    return (
        <div className="product-card">
            <div className="product-image-wrapper" onClick={onOpen} style={{ cursor: 'pointer' }}>
                <div className="card-actions">
                    <button className={`circle-btn ${isLiked ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onLike(); }}>
                        <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                    </button>
                    <button className="circle-btn" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                        <Eye size={18} />
                    </button>
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
            <div className="product-info" onClick={onOpen} style={{ cursor: 'pointer' }}>
                <span className="product-category-tag">{product.category || 'عام'}</span>
                <h3 className="product-name">{product.name}</h3>
                <div className="product-price">
                    {Number(displayPrice).toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: '400', opacity: 0.6 }}>ج.م</span>
                </div>
                <button
                    className="add-btn-minimal"
                    onClick={(e) => { e.stopPropagation(); onAdd(product); }}
                >
                    <Plus size={16} /> إضافة للسلة
                </button>
            </div>
        </div>
    );
};

export default App;
