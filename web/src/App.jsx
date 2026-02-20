import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Plus, Minus, Search, Clock, Home, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';

const App = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('الكل');
    const [checkoutStatus, setCheckoutStatus] = useState('browsing'); // 'browsing', 'checkout', 'success'

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
    const filteredProducts = selectedCategory === 'الكل'
        ? products
        : products.filter(p => p.category === selectedCategory);

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setIsCartOpen(true);
    };

    const cartTotal = cart.reduce((sum, item) => sum + ((item.online_price || item.price) * item.quantity), 0);

    const handleCheckout = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const orderData = {
            id: `WEB-${Math.floor(Math.random() * 1000000)}`,
            customer_name: formData.get('name'),
            customer_phone: formData.get('phone'),
            customer_address: formData.get('address'),
            total: cartTotal,
            items: cart,
            source: 'online',
            status: 'pending'
        };

        const { error } = await supabase.from('sales').insert([orderData]);
        if (!error) {
            setCheckoutStatus('success');
            setCart([]);
        } else {
            alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
        }
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جاري التحميل...</div>;

    if (checkoutStatus === 'success') {
        return (
            <div className="container success-view" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ background: '#E8F7EE', color: '#2DCA73', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
                    <CheckCircle size={50} />
                </div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>شكراً لطلبك!</h1>
                <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '40px' }}>لقد استلمنا طلبك وسنتواصل معك قريباً لتأكيد الموعد.</p>
                <button
                    onClick={() => setCheckoutStatus('browsing')}
                    style={{ background: '#4B2C20', color: 'white', padding: '15px 40px', borderRadius: '50px', fontWeight: 'bold' }}
                >
                    العودة للمتجر
                </button>
            </div>
        );
    }

    return (
        <div dir="rtl">
            <header className="store-header">
                <div className="container nav-content">
                    <div className="logo-container">
                        <img src="/logo.png" alt="Logo" className="logo-img" />
                        <h2 style={{ fontSize: '1.4rem', color: '#4B2C20' }}>البيت التركي</h2>
                    </div>
                    <div className="nav-links">
                        <button onClick={() => setIsCartOpen(true)} className="cart-icon-btn">
                            <ShoppingBag size={20} />
                            <span>{cart.length} أصناف</span>
                        </button>
                    </div>
                </div>
            </header>

            <section className="hero">
                <div className="container">
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        نسجنا لكِ الجمال في كل قطعة
                    </motion.h1>
                    <p style={{ fontSize: '1.2rem', color: '#666' }}>تشكيلة فاخرة من أرقى الأدوات المنزلية المختارة بعناية</p>
                </div>
            </section>

            <main className="container">
                <div className="category-filter">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="product-grid">
                    {filteredProducts.map(p => (
                        <motion.div
                            key={p.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="product-card"
                        >
                            <div className="product-image-container" style={{ height: '250px', overflow: 'hidden', position: 'relative' }}>
                                <img
                                    src={p.image || (p.gallery && p.gallery.length > 0 ? p.gallery[0] : 'https://images.unsplash.com/photo-1584990333910-efef038b725c?q=80&w=400')}
                                    className="product-image"
                                    alt={p.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=600';
                                    }}
                                />
                            </div>
                            <div className="product-info">
                                <span style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: '0.8rem' }}>{p.category}</span>
                                <h3 style={{ fontSize: '1.2rem', margin: '5px 0' }}>{p.name}</h3>
                                <div className="product-price">{(p.online_price || p.price).toLocaleString()} ج.م</div>
                                <button className="add-btn" onClick={() => addToCart(p)}>
                                    <Plus size={18} /> إضافة للسلة
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            <AnimatePresence>
                {isCartOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="cart-overlay"
                        onClick={() => setIsCartOpen(false)}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            className="cart-drawer"
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                <h3 className="cart-title">سلة التسوق</h3>
                                <button onClick={() => setIsCartOpen(false)}><X /></button>
                            </div>

                            {cart.length === 0 ? (
                                <div style={{ textAlign: 'center', marginTop: '100px', color: '#999' }}>السلة فارغة حالياً</div>
                            ) : (
                                <>
                                    <div style={{ flex: 1, overflowY: 'auto' }}>
                                        {cart.map(item => (
                                            <div key={item.id} style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                                <img src={item.image} style={{ width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' }} />
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: '0.9rem' }}>{item.name}</h4>
                                                    <div style={{ color: '#4B2C20', fontWeight: 'bold' }}>{(item.online_price || item.price).toLocaleString()} ج.م</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                                                        <button onClick={() => setCart(cart.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}><Minus size={16} /></button>
                                                        <span>{item.quantity}</span>
                                                        <button onClick={() => setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))}><Plus size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ padding: '20px 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px' }}>
                                            <span>الإجمالي:</span>
                                            <span>{cartTotal.toLocaleString()} ج.م</span>
                                        </div>

                                        {checkoutStatus === 'checkout' ? (
                                            <form onSubmit={handleCheckout}>
                                                <input name="name" placeholder="الاسم بالكامل" required style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #eee', marginBottom: '10px' }} />
                                                <input name="phone" placeholder="رقم الموبايل" required style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #eee', marginBottom: '10px' }} />
                                                <textarea name="address" placeholder="العنوان بالتفصيل" required style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #eee', marginBottom: '20px' }} />
                                                <button type="submit" className="checkout-btn">إتمام الطلب الآن</button>
                                                <button type="button" onClick={() => setCheckoutStatus('browsing')} style={{ width: '100%', marginTop: '10px', color: '#666' }}>رجوع للسلة</button>
                                            </form>
                                        ) : (
                                            <button onClick={() => setCheckoutStatus('checkout')} className="checkout-btn">الذهاب للدفع</button>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <footer style={{ background: '#fff', padding: '60px 0', borderTop: '1px solid #eee', marginTop: '100px', textAlign: 'center' }}>
                <div className="container">
                    <img src="/logo.png" alt="Logo" style={{ height: '60px', marginBottom: '20px' }} />
                    <p style={{ color: '#666' }}>© 2024 البيت التركي للأدوات المنزلية. جميع الحقوق محفوظة.</p>
                </div>
            </footer>
        </div>
    );
};

export default App;
