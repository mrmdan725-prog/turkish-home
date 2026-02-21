import React, { useState, useEffect } from 'react';
import { ShoppingBag, Users, Clock, CheckCircle, X, Search, Phone, MapPin, Eye, ShoppingCart, TrendingUp, FileText, Truck, PackageCheck, ArrowLeft, Printer, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import Logo from '../Common/Logo';
import './WebManager.css';

const WebManager = ({ activeSubTab, onInvoice, onRefreshPending }) => {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showInvoice, setShowInvoice] = useState(false);

    // Build a complete HTML document for printing / PDF download
    const LOGO_SVG = `<svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 15L85 45V85H15V45L50 15Z" stroke="#4B2C20" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M42 85V65C42 60.5817 45.5817 57 50 57C54.4183 57 58 60.5817 58 65V85" stroke="#4B2C20" stroke-width="2.5"/>
        <path d="M25 75H35V82H25V75Z" fill="#4B2C20"/><path d="M30 75V60" stroke="#4B2C20" stroke-width="1.5"/>
        <circle cx="30" cy="58" r="2" fill="#4B2C20"/><path d="M27 65C27 65 24 63 24 60" stroke="#4B2C20" stroke-width="1"/>
        <path d="M33 68C33 68 36 66 36 63" stroke="#4B2C20" stroke-width="1"/>
        <path d="M65 75H75V82H65V75Z" fill="#4B2C20"/><path d="M70 75V60" stroke="#4B2C20" stroke-width="1.5"/>
        <circle cx="70" cy="58" r="2" fill="#4B2C20"/><path d="M67 65C67 65 64 63 64 60" stroke="#4B2C20" stroke-width="1"/>
        <path d="M73 68C73 68 76 66 76 63" stroke="#4B2C20" stroke-width="1"/>
        <path d="M50 35V50" stroke="#4B2C20" stroke-width="1.5"/>
        <path d="M47 40Q40 38 42 35" stroke="#4B2C20" stroke-width="1"/>
        <path d="M53 42Q60 40 58 37" stroke="#4B2C20" stroke-width="1"/>
    </svg>`;

    const buildInvoiceHTML = (bodyContent, order, isPDF = false) => {
        const title = isPDF
            ? `فاتورة ${order.invoice_number || order.id}`
            : `طباعة فاتورة ${order.invoice_number || order.id}`;
        // Replace emoji/Logo placeholder with actual SVG in print output
        const processedBody = bodyContent
            .replace(/<div class="inv-logo-placeholder">.*?<\/div>/g, LOGO_SVG);
        return `<html dir='rtl'><head><title>${title}</title><style>
            @page { size: A4; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
            body { padding: 30px; color: #333; direction: rtl; }
            .inv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
            .inv-brand { display: flex; align-items: center; gap: 12px; }
            .inv-brand h2 { font-size: 1.4rem; color: #4B2C20; }
            .inv-brand span { font-size: 0.75rem; color: #888; display: block; }
            .inv-logo-placeholder { font-size: 2.2rem; }
            .inv-title { text-align: left; }
            .inv-title h1 { font-size: 2rem; color: #4B2C20; line-height: 1; }
            .inv-number { color: #D4AF37; font-weight: 800; font-size: 1rem; }
            .inv-divider { height: 3px; background: linear-gradient(to left, #4B2C20, #D4AF37); margin-bottom: 25px; border-radius: 2px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .inv-meta { display: flex; justify-content: space-between; margin-bottom: 25px; }
            .inv-meta-block h4 { color: #4B2C20; margin-bottom: 10px; font-size: 0.9rem; }
            .inv-meta-block p { font-size: 0.85rem; display: flex; align-items: center; gap: 6px; margin-bottom: 5px; color: #555; }
            .inv-customer-name { font-weight: 800; font-size: 1.05rem !important; color: #4B2C20 !important; }
            .inv-meta-right { text-align: left; }
            .inv-meta-row { display: flex; gap: 10px; margin-bottom: 8px; font-size: 0.85rem; justify-content: flex-end; }
            .inv-meta-row span { color: #888; }
            .inv-meta-row strong { color: #333; }
            .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .inv-table th { background: #4B2C20; color: white; padding: 10px 14px; text-align: right; font-size: 0.85rem; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .inv-table th:first-child { border-radius: 0 8px 0 0; }
            .inv-table th:last-child { border-radius: 8px 0 0 0; }
            .inv-table td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 0.85rem; color: #333; }
            .inv-table tbody tr:nth-child(even) { background: #faf8f5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .inv-total-section { margin-bottom: 25px; }
            .inv-total-row { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 0.9rem; }
            .inv-total-row.grand { background: #4B2C20; color: white; border-radius: 10px; padding: 16px 20px; font-size: 1.3rem; font-weight: 800; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .inv-total-row.grand strong { color: #D4AF37; font-size: 1.5rem; }
            .inv-footer { text-align: center; padding-top: 25px; border-top: 2px dashed #ddd; margin-top: 10px; }
            .inv-footer p { font-weight: 700; color: #4B2C20; margin-bottom: 5px; font-size: 1rem; }
            .inv-footer span { font-size: 0.75rem; color: #999; }
            @media print { body { padding: 15px; } }
        </style></head><body>${processedBody}</body></html>`;
    };


    useEffect(() => {
        fetchData();

        // Real-time subscription for new orders
        const subscription = supabase
            .channel('web_orders_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: "source=eq.online" }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Web Orders
            const { data: orderData, error: orderErr } = await supabase
                .from('sales')
                .select('*')
                .eq('source', 'online')
                .order('date', { ascending: false });

            if (orderErr) throw orderErr;
            setOrders(orderData || []);

            // Extract unique customers from orders
            const customerMap = new Map();
            (orderData || []).forEach(order => {
                if (order.customer_phone) {
                    if (!customerMap.has(order.customer_phone)) {
                        customerMap.set(order.customer_phone, {
                            name: order.customer_name,
                            phone: order.customer_phone,
                            address: order.customer_address,
                            orderCount: 1,
                            totalSpent: order.total,
                            lastOrder: order.date
                        });
                    } else {
                        const existing = customerMap.get(order.customer_phone);
                        existing.orderCount += 1;
                        existing.totalSpent += order.total;
                        if (new Date(order.date) > new Date(existing.lastOrder)) {
                            existing.lastOrder = order.date;
                        }
                    }
                }
            });
            setCustomers(Array.from(customerMap.values()));

            // Update global notify count for Sidebar
            const pendingCount = (orderData || []).filter(o => o.status === 'pending').length;
            if (onInvoice && typeof onInvoice === 'function') {
                // We'll use this mechanism to pass the count back if needed, 
                // but let's assume a dedicated prop is better.
            }

        } catch (err) {
            console.error("Error fetching web data:", err);
        } finally {
            setLoading(false);
        }
    };

    // Order status stages
    const ORDER_STAGES = [
        { key: 'pending', label: 'استلام الطلب', icon: PackageCheck },
        { key: 'invoiced', label: 'تم الفوترة', icon: FileText },
        { key: 'delivering', label: 'قيد التوصيل', icon: Truck },
        { key: 'delivered', label: 'تم التسليم', icon: CheckCircle },
    ];

    const getStageIndex = (status) => {
        const idx = ORDER_STAGES.findIndex(s => s.key === status);
        return idx >= 0 ? idx : 0;
    };

    const handleAdvanceStatus = async (order) => {
        const currentIdx = getStageIndex(order.status);

        // If at 'pending', we need to generate invoice first
        if (order.status === 'pending') {
            if (!onInvoice) return;
            const confirmed = window.confirm("هل تريد إنشاء فاتورة لهذا الطلب والانتقال للمرحلة التالية؟");
            if (!confirmed) return;

            try {
                const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
                const invoiceDate = new Date().toISOString();
                const invoiceId = 'INV-' + order.id;
                const invoiceData = {
                    ...order,
                    id: invoiceId,
                    orderId: order.id,
                    paymentType: 'store',
                    customerName: order.customer_name || order.customerName,
                    customerPhone: order.customer_phone || order.customerPhone,
                    customerAddress: order.customer_address || order.customerAddress,
                    source: 'erp-web-processed',
                    status: 'invoiced'
                };
                await onInvoice(invoiceData);

                // Save invoice data on the original order
                await supabase
                    .from('sales')
                    .update({ status: 'invoiced', invoice_number: invoiceNumber, invoice_date: invoiceDate })
                    .eq('id', order.id);

                setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'invoiced', invoice_number: invoiceNumber, invoice_date: invoiceDate } : o));
                if (selectedOrder?.id === order.id) {
                    setSelectedOrder(prev => ({ ...prev, status: 'invoiced', invoice_number: invoiceNumber, invoice_date: invoiceDate }));
                }
                if (onRefreshPending) onRefreshPending();
                setShowInvoice(true);
                alert("تم إنشاء الفاتورة بنجاح ✅");
            } catch (err) {
                console.error("Error generating invoice:", err);
                alert("حدث خطأ أثناء إنشاء الفاتورة");
            }
            return;
        }

        // For other stages, just advance to next
        if (currentIdx < ORDER_STAGES.length - 1) {
            const nextStatus = ORDER_STAGES[currentIdx + 1].key;
            const nextLabel = ORDER_STAGES[currentIdx + 1].label;
            const confirmed = window.confirm(`هل تريد تغيير الحالة إلى "${nextLabel}"؟`);
            if (!confirmed) return;
            await updateOrderStatus(order.id, nextStatus);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from('sales')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }
            if (onRefreshPending) onRefreshPending();
        } catch (err) {
            alert("فشل تحديث حالة الطلب");
        }
    };

    // Active orders (not yet delivered)
    const filteredOrders = orders.filter(o => {
        if (o.status === 'delivered') return false;
        const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
        const matchesSearch = (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.id || '').toString().toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Delivered orders for history view
    const filteredHistory = orders.filter(o => {
        if (o.status !== 'delivered') return false;
        const matchesSearch = (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.id || '').toString().toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );

    if (loading && orders.length === 0) {
        return <div className="web-manager-loading">جاري تحميل بيانات المتجر أونلاين...</div>;
    }

    return (
        <div className="web-manager" dir="rtl">
            <header className="web-manager-header">
                <div className="header-info">
                    {activeSubTab === 'orders' && (
                        <>
                            <ShoppingBag className="header-icon" />
                            <div>
                                <h1>طلبات المتجر أونلاين</h1>
                                <p>إدارة ومتابعة الطلبات الجديدة الواردة من الموقع</p>
                            </div>
                        </>
                    )}
                    {activeSubTab === 'history' && (
                        <>
                            <Clock className="header-icon" />
                            <div>
                                <h1>سجل الطلبات المسلمة</h1>
                                <p>أرشيف الطلبات التي تم توصيلها وتسليمها للعملاء</p>
                            </div>
                        </>
                    )}
                    {activeSubTab === 'customers' && (
                        <>
                            <Users className="header-icon" />
                            <div>
                                <h1>عملاء المتجر أونلاين</h1>
                                <p>قائمة العملاء الذين قاموا بالشراء من الموقع</p>
                            </div>
                        </>
                    )}
                </div>

                <div className="header-actions">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="بحث..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {activeSubTab === 'orders' && (
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">كل الحالات</option>
                            <option value="pending">استلام الطلب</option>
                            <option value="invoiced">تم الفوترة</option>
                            <option value="delivering">قيد التوصيل</option>
                            <option value="cancelled">ملغي</option>
                        </select>
                    )}
                </div>
            </header>

            <div className="web-manager-content">
                {activeSubTab === 'orders' && (
                    <div className="orders-grid">
                        {filteredOrders.length === 0 ? (
                            <div className="empty-state">لا يوجد طلبات جديدة حالياً 🎉</div>
                        ) : (
                            filteredOrders.map(order => (
                                <div key={order.id} className={`order-card status-${order.status}`} onClick={() => setSelectedOrder(order)}>
                                    <div className="order-card-header">
                                        <span className="order-id">{order.id}</span>
                                        <span className={`order-status-badge ${order.status}`}>
                                            {ORDER_STAGES.find(s => s.key === order.status)?.label || order.status}
                                        </span>
                                    </div>
                                    <div className="order-card-body">
                                        <h3>{order.customer_name}</h3>
                                        <p><Phone size={14} /> {order.customer_phone}</p>
                                        <p><MapPin size={14} /> {order.customer_address}</p>
                                        <div className="order-total">
                                            <span>إجمالي الطلب:</span>
                                            <strong>{Number(order.total).toLocaleString()} ج.م</strong>
                                        </div>
                                    </div>
                                    <div className="order-card-footer">
                                        <span className="order-date"><Clock size={14} /> {new Date(order.date).toLocaleDateString('ar-EG')}</span>
                                        <button className="view-details-btn"><Eye size={16} /> التفاصيل</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeSubTab === 'history' && (
                    <div className="orders-grid">
                        {filteredHistory.length === 0 ? (
                            <div className="empty-state">لا يوجد طلبات مسلمة بعد</div>
                        ) : (
                            filteredHistory.map(order => (
                                <div key={order.id} className={`order-card status-completed`} onClick={() => setSelectedOrder(order)}>
                                    <div className="order-card-header">
                                        <span className="order-id">{order.id}</span>
                                        <span className="order-status-badge completed">تم التسليم ✓</span>
                                    </div>
                                    <div className="order-card-body">
                                        <h3>{order.customer_name}</h3>
                                        <p><Phone size={14} /> {order.customer_phone}</p>
                                        <p><MapPin size={14} /> {order.customer_address}</p>
                                        <div className="order-total">
                                            <span>إجمالي الطلب:</span>
                                            <strong>{Number(order.total).toLocaleString()} ج.م</strong>
                                        </div>
                                    </div>
                                    <div className="order-card-footer">
                                        <span className="order-date"><Clock size={14} /> {new Date(order.date).toLocaleDateString('ar-EG')}</span>
                                        <button className="view-details-btn"><Eye size={16} /> التفاصيل</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeSubTab === 'customers' && (
                    <div className="customers-table-container">
                        <table className="web-customers-table">
                            <thead>
                                <tr>
                                    <th>اسم العميل</th>
                                    <th>رقم الهاتف</th>
                                    <th>العنوان</th>
                                    <th>عدد الطلبات</th>
                                    <th>إجمالي المشتريات</th>
                                    <th>آخر طلب</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{customer.name}</strong></td>
                                        <td>{customer.phone}</td>
                                        <td>{customer.address}</td>
                                        <td>{customer.orderCount}</td>
                                        <td>{Number(customer.totalSpent).toLocaleString()} ج.م</td>
                                        <td>{new Date(customer.lastOrder).toLocaleDateString('ar-EG')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredCustomers.length === 0 && <div className="empty-state">لا يوجد عملاء أونلاين بعد</div>}
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="web-modal-overlay"
                        onClick={() => { setSelectedOrder(null); setShowInvoice(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="web-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <header className="modal-header">
                                <h2>{showInvoice ? 'فاتورة الطلب' : 'تفاصيل الطلب'} {selectedOrder.id}</h2>
                                <div className="modal-header-actions">
                                    {selectedOrder.invoice_number && (
                                        <button className="invoice-toggle-btn" onClick={() => setShowInvoice(!showInvoice)}>
                                            {showInvoice ? <Eye size={16} /> : <FileText size={16} />}
                                            {showInvoice ? 'التفاصيل' : 'الفاتورة'}
                                        </button>
                                    )}
                                    <button className="close-modal" onClick={() => { setSelectedOrder(null); setShowInvoice(false); }}><X /></button>
                                </div>
                            </header>

                            {!showInvoice ? (
                                /* ===== ORDER DETAILS VIEW ===== */
                                <>
                                    <div className="modal-body">
                                        <div className="details-section">
                                            <h3>بيانات العميل</h3>
                                            <div className="info-grid">
                                                <div className="info-item"><span>الاسم:</span> <strong>{selectedOrder.customer_name}</strong></div>
                                                <div className="info-item"><span>الهاتف:</span> <strong>{selectedOrder.customer_phone}</strong></div>
                                                <div className="info-item"><span>العنوان:</span> <strong>{selectedOrder.customer_address}</strong></div>
                                                <div className="info-item"><span>التاريخ:</span> <strong>{new Date(selectedOrder.date).toLocaleString('ar-EG')}</strong></div>
                                            </div>
                                        </div>

                                        <div className="items-section">
                                            <h3>المنتجات المطلوبة</h3>
                                            <table className="modal-items-table">
                                                <thead>
                                                    <tr>
                                                        <th>المنتج</th>
                                                        <th>الكمية</th>
                                                        <th>السعر</th>
                                                        <th>الإجمالي</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(Array.isArray(selectedOrder.items) ? selectedOrder.items : JSON.parse(selectedOrder.items || '[]')).map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td>{item.name || item.productName}</td>
                                                            <td>{item.quantity || item.qty}</td>
                                                            <td>{Number(item.onlinePrice || item.online_price || item.price).toLocaleString()} ج.م</td>
                                                            <td>{Number((item.onlinePrice || item.online_price || item.price) * (item.quantity || item.qty)).toLocaleString()} ج.م</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <div className="modal-order-summary">
                                                <div className="summary-row">
                                                    <span>الإجمالي النهائي:</span>
                                                    <strong>{Number(selectedOrder.total).toLocaleString()} ج.م</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <footer className="modal-footer">
                                        <div className="footer-actions-wrapper">
                                            <div className="order-stepper">
                                                {ORDER_STAGES.map((stage, idx) => {
                                                    const currentIdx = getStageIndex(selectedOrder.status);
                                                    const StageIcon = stage.icon;
                                                    const isActive = idx === currentIdx;
                                                    const isDone = idx < currentIdx;
                                                    return (
                                                        <React.Fragment key={stage.key}>
                                                            <div className={`stepper-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                                                                <div className="stepper-circle">
                                                                    {isDone ? <CheckCircle size={18} /> : <StageIcon size={18} />}
                                                                </div>
                                                                <span className="stepper-label">{stage.label}</span>
                                                            </div>
                                                            {idx < ORDER_STAGES.length - 1 && (
                                                                <div className={`stepper-line ${idx < currentIdx ? 'done' : ''}`} />
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                            <div className="stepper-actions">
                                                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                                                    <button className="advance-btn" onClick={() => handleAdvanceStatus(selectedOrder)}>
                                                        <ArrowLeft size={20} />
                                                        <span>
                                                            {selectedOrder.status === 'pending' ? 'إنشاء فاتورة والانتقال للمرحلة التالية' :
                                                                selectedOrder.status === 'invoiced' ? 'تحويل لقيد التوصيل' :
                                                                    selectedOrder.status === 'delivering' ? 'تأكيد التسليم للعميل' : ''}
                                                        </span>
                                                    </button>
                                                )}
                                                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                                                    <button className="cancel-order-btn" onClick={() => {
                                                        if (window.confirm('هل تريد إلغاء هذا الطلب؟')) updateOrderStatus(selectedOrder.id, 'cancelled');
                                                    }}>
                                                        <X size={18} /> إلغاء الطلب
                                                    </button>
                                                )}
                                                {selectedOrder.status === 'delivered' && (
                                                    <div className="delivered-badge"><CheckCircle size={22} /> تم تسليم الطلب بنجاح</div>
                                                )}
                                            </div>
                                        </div>
                                    </footer>
                                </>
                            ) : (
                                /* ===== INVOICE VIEW ===== */
                                <div className="modal-body invoice-view">
                                    <div className="invoice-print-area" id="invoicePrintArea">
                                        {/* Invoice Header */}
                                        <div className="inv-header">
                                            <div className="inv-brand">
                                                <Logo size={45} showText={false} />
                                                <div>
                                                    <h2>البيت التركي</h2>
                                                    <span>للأدوات المنزلية والأنتيكات</span>
                                                </div>
                                            </div>
                                            <div className="inv-title">
                                                <h1>فاتورة</h1>
                                                <span className="inv-number">#{selectedOrder.invoice_number}</span>
                                            </div>
                                        </div>

                                        <div className="inv-divider"></div>

                                        {/* Invoice Meta */}
                                        <div className="inv-meta">
                                            <div className="inv-meta-block">
                                                <h4>فاتورة إلى:</h4>
                                                <p className="inv-customer-name">{selectedOrder.customer_name}</p>
                                                <p><Phone size={12} /> {selectedOrder.customer_phone}</p>
                                                <p><MapPin size={12} /> {selectedOrder.customer_address || '—'}</p>
                                            </div>
                                            <div className="inv-meta-block inv-meta-right">
                                                <div className="inv-meta-row">
                                                    <span>رقم الطلب:</span>
                                                    <strong>{selectedOrder.id}</strong>
                                                </div>
                                                <div className="inv-meta-row">
                                                    <span>تاريخ الفاتورة:</span>
                                                    <strong>{new Date(selectedOrder.invoice_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                                </div>
                                                <div className="inv-meta-row">
                                                    <span>تاريخ الطلب:</span>
                                                    <strong>{new Date(selectedOrder.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items Table */}
                                        <table className="inv-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>المنتج</th>
                                                    <th>الكمية</th>
                                                    <th>سعر الوحدة</th>
                                                    <th>الإجمالي</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(Array.isArray(selectedOrder.items) ? selectedOrder.items : JSON.parse(selectedOrder.items || '[]')).map((item, idx) => {
                                                    const price = item.onlinePrice || item.online_price || item.price || 0;
                                                    const qty = item.quantity || item.qty || 1;
                                                    return (
                                                        <tr key={idx}>
                                                            <td>{idx + 1}</td>
                                                            <td>{item.name || item.productName}</td>
                                                            <td>{qty}</td>
                                                            <td>{Number(price).toLocaleString()} ج.م</td>
                                                            <td>{Number(price * qty).toLocaleString()} ج.م</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {/* Total */}
                                        <div className="inv-total-section">
                                            <div className="inv-total-row grand">
                                                <span>الإجمالي الكلي</span>
                                                <strong>{Number(selectedOrder.total).toLocaleString()} ج.م</strong>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="inv-footer">
                                            <p>شكراً لتسوقكم من البيت التركي 🏠</p>
                                            <span>هذه الفاتورة صادرة إلكترونياً ولا تحتاج إلى توقيع</span>
                                        </div>
                                    </div>

                                    {/* Print & Download Buttons */}
                                    <div className="invoice-actions-row">
                                        <button className="print-invoice-btn" onClick={() => {
                                            const el = document.getElementById('invoicePrintArea');
                                            const win = window.open('', '_blank');
                                            win.document.write(buildInvoiceHTML(el.innerHTML, selectedOrder, false));
                                            win.document.close();
                                            win.print();
                                        }}>
                                            <Printer size={18} /> طباعة الفاتورة
                                        </button>
                                        <button className="download-invoice-btn" onClick={() => {
                                            const el = document.getElementById('invoicePrintArea');
                                            const win = window.open('', '_blank');
                                            win.document.write(buildInvoiceHTML(el.innerHTML, selectedOrder, true));
                                            win.document.close();
                                            setTimeout(() => win.print(), 300);
                                        }}>
                                            <Download size={18} /> تحميل PDF
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WebManager;
