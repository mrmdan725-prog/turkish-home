import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Package, FileText, User, LogOut, Clock, CheckCircle, Truck,
    PackageCheck, Phone, MapPin, Edit3, Save, Eye, ChevronLeft, ShoppingBag,
    Printer, Download, Trash2
} from 'lucide-react';
import { supabase } from '../supabase';

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

const CustomerDashboard = ({ isOpen, onClose, customer, onLogout, onUpdateCustomer }) => {
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Profile editing
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({
        name: customer?.name || '',
        address: customer?.address || ''
    });
    const [savingProfile, setSavingProfile] = useState(false);

    // Build HTML for PDF/Print
    const buildInvoicePDF = (order) => {
        const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
        const itemsHTML = items.map((item, i) => {
            const qty = item.quantity || item.qty || 1;
            const price = item.onlinePrice || item.online_price || item.price || 0;
            return `<tr>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:0.85rem;">${i + 1}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:0.85rem;">${item.name || item.productName}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:0.85rem;">${qty}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:0.85rem;">${Number(price).toLocaleString()} \u062c.\u0645</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:0.85rem;">${Number(qty * price).toLocaleString()} \u062c.\u0645</td>
            </tr>`;
        }).join('');

        const invDate = order.invoice_date ? new Date(order.invoice_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
        const orderDate = new Date(order.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

        return `<html dir="rtl"><head><title>\u0641\u0627\u062a\u0648\u0631\u0629 ${order.invoice_number || order.id}</title>
        <style>
            @page { size: A4; margin: 15mm; }
            * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',Tahoma,sans-serif; }
            body { padding:30px; color:#333; direction:rtl; }
            @media print { body { padding: 15px; } }
        </style></head><body>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:25px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 15L85 45V85H15V45L50 15Z" stroke="#4B2C20" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 85V65C42 60.5817 45.5817 57 50 57C54.4183 57 58 60.5817 58 65V85" stroke="#4B2C20" stroke-width="2.5"/><path d="M25 75H35V82H25V75Z" fill="#4B2C20"/><path d="M30 75V60" stroke="#4B2C20" stroke-width="1.5"/><circle cx="30" cy="58" r="2" fill="#4B2C20"/><path d="M27 65C27 65 24 63 24 60" stroke="#4B2C20" stroke-width="1"/><path d="M33 68C33 68 36 66 36 63" stroke="#4B2C20" stroke-width="1"/><path d="M65 75H75V82H65V75Z" fill="#4B2C20"/><path d="M70 75V60" stroke="#4B2C20" stroke-width="1.5"/><circle cx="70" cy="58" r="2" fill="#4B2C20"/><path d="M67 65C67 65 64 63 64 60" stroke="#4B2C20" stroke-width="1"/><path d="M73 68C73 68 76 66 76 63" stroke="#4B2C20" stroke-width="1"/><path d="M50 35V50" stroke="#4B2C20" stroke-width="1.5"/><path d="M47 40Q40 38 42 35" stroke="#4B2C20" stroke-width="1"/><path d="M53 42Q60 40 58 37" stroke="#4B2C20" stroke-width="1"/></svg>
                    <div><h2 style="font-size:1.4rem;color:#4B2C20;margin:0;">\u0627\u0644\u0628\u064a\u062a \u0627\u0644\u062a\u0631\u0643\u064a</h2><span style="font-size:0.75rem;color:#888;">\u0644\u0644\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0645\u0646\u0632\u0644\u064a\u0629 \u0648\u0627\u0644\u0623\u0646\u062a\u064a\u0643\u0627\u062a</span></div>
                </div>
                <div style="text-align:left;"><h1 style="font-size:2rem;color:#4B2C20;line-height:1;margin:0;">\u0641\u0627\u062a\u0648\u0631\u0629</h1><span style="color:#D4AF37;font-weight:800;font-size:1rem;">#${order.invoice_number}</span></div>
            </div>
            <div style="height:3px;background:linear-gradient(to left,#4B2C20,#D4AF37);margin-bottom:25px;border-radius:2px;-webkit-print-color-adjust:exact;print-color-adjust:exact;"></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:25px;">
                <div>
                    <h4 style="color:#4B2C20;margin-bottom:10px;font-size:0.9rem;">\u0641\u0627\u062a\u0648\u0631\u0629 \u0625\u0644\u0649:</h4>
                    <p style="font-weight:800;font-size:1.05rem;color:#4B2C20;margin-bottom:5px;">${order.customer_name}</p>
                    <p style="font-size:0.85rem;color:#555;margin-bottom:4px;">\ud83d\udcf1 ${order.customer_phone}</p>
                    <p style="font-size:0.85rem;color:#555;">\ud83d\udccd ${order.customer_address || '\u2014'}</p>
                </div>
                <div style="text-align:left;">
                    <p style="font-size:0.85rem;margin-bottom:6px;"><span style="color:#888;">\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628:</span> <strong>${order.id}</strong></p>
                    ${invDate ? `<p style="font-size:0.85rem;margin-bottom:6px;"><span style="color:#888;">\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629:</span> <strong>${invDate}</strong></p>` : ''}
                    <p style="font-size:0.85rem;margin-bottom:6px;"><span style="color:#888;">\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0637\u0644\u0628:</span> <strong>${orderDate}</strong></p>
                </div>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                <thead><tr>
                    <th style="background:#4B2C20;color:white;padding:10px 14px;text-align:right;font-size:0.85rem;-webkit-print-color-adjust:exact;print-color-adjust:exact;">#</th>
                    <th style="background:#4B2C20;color:white;padding:10px 14px;text-align:right;font-size:0.85rem;-webkit-print-color-adjust:exact;print-color-adjust:exact;">\u0627\u0644\u0645\u0646\u062a\u062c</th>
                    <th style="background:#4B2C20;color:white;padding:10px 14px;text-align:right;font-size:0.85rem;-webkit-print-color-adjust:exact;print-color-adjust:exact;">\u0627\u0644\u0643\u0645\u064a\u0629</th>
                    <th style="background:#4B2C20;color:white;padding:10px 14px;text-align:right;font-size:0.85rem;-webkit-print-color-adjust:exact;print-color-adjust:exact;">\u0627\u0644\u0633\u0639\u0631</th>
                    <th style="background:#4B2C20;color:white;padding:10px 14px;text-align:right;font-size:0.85rem;-webkit-print-color-adjust:exact;print-color-adjust:exact;">\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a</th>
                </tr></thead>
                <tbody>${itemsHTML}</tbody>
            </table>
            <div style="background:#4B2C20;color:white;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;font-size:1.3rem;font-weight:800;margin-bottom:25px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
                <span>\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0643\u0644\u064a</span>
                <strong style="color:#D4AF37;font-size:1.5rem;">${Number(order.total).toLocaleString()} \u062c.\u0645</strong>
            </div>
            <div style="text-align:center;padding-top:25px;border-top:2px dashed #ddd;">
                <p style="font-weight:700;color:#4B2C20;margin-bottom:5px;font-size:1rem;">\u0634\u0643\u0631\u0627\u064b \u0644\u062a\u0633\u0648\u0642\u0643\u0645 \u0645\u0646 \u0627\u0644\u0628\u064a\u062a \u0627\u0644\u062a\u0631\u0643\u064a \ud83c\udfe0</p>
                <span style="font-size:0.75rem;color:#999;">\u0647\u0630\u0647 \u0627\u0644\u0641\u0627\u062a\u0648\u0631\u0629 \u0635\u0627\u062f\u0631\u0629 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u064b \u0648\u0644\u0627 \u062a\u062d\u062a\u0627\u062c \u0625\u0644\u0649 \u062a\u0648\u0642\u064a\u0639</span>
            </div>
        </body></html>`;
    };

    useEffect(() => {
        if (isOpen && customer) {
            fetchOrders();
            setProfileData({ name: customer.name || '', address: customer.address || '' });
        }
    }, [isOpen, customer]);

    const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .eq('source', 'online')
                .eq('customer_phone', customer.phone)
                .order('date', { ascending: false });

            if (!error) setOrders(data || []);
        } catch (err) {
            console.error("Error fetching orders:", err);
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!profileData.name.trim()) return;
        setSavingProfile(true);
        try {
            const { error } = await supabase
                .from('web_customers')
                .update({
                    name: profileData.name.trim(),
                    address: profileData.address.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', customer.id);

            if (!error) {
                const updated = { ...customer, name: profileData.name.trim(), address: profileData.address.trim() };
                localStorage.setItem('th_customer', JSON.stringify(updated));
                onUpdateCustomer(updated);
                setEditMode(false);
            }
        } catch (err) {
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟')) return;

        try {
            const { error } = await supabase
                .from('sales')
                .update({ status: 'cancelled' })
                .eq('id', orderId)
                .eq('status', 'pending'); // Safety check: only cancel if still pending

            if (error) throw error;

            // Refresh orders local state
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: 'cancelled' }));
            }
            alert('تم إلغاء الطلب بنجاح');
        } catch (err) {
            console.error("Error cancelling order:", err);
            alert('عذراً، لا يمكن إلغاء الطلب في هذه المرحلة. يرجى التواصل مع الدعم.');
        }
    };

    const getStatusLabel = (status) => {
        const stage = ORDER_STAGES.find(s => s.key === status);
        if (stage) return stage.label;
        if (status === 'cancelled') return 'ملغي';
        return status;
    };

    const getStatusClass = (status) => {
        if (status === 'pending') return 'status-pending';
        if (status === 'invoiced') return 'status-invoiced';
        if (status === 'delivering') return 'status-delivering';
        if (status === 'delivered') return 'status-delivered';
        if (status === 'cancelled') return 'status-cancelled';
        return '';
    };

    if (!isOpen || !customer) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="dashboard-panel"
                onClick={e => e.stopPropagation()}
            >
                {/* Dashboard Header */}
                <div className="dash-header">
                    <button className="dash-close" onClick={onClose}><X size={20} /></button>
                    <div className="dash-user-info">
                        <div className="dash-avatar">
                            <User size={24} />
                        </div>
                        <div>
                            <h3>{customer.name}</h3>
                            <span>{customer.phone}</span>
                        </div>
                    </div>
                    <button className="dash-logout" onClick={onLogout}>
                        <LogOut size={16} /> تسجيل خروج
                    </button>
                </div>

                {/* Tabs */}
                <div className="dash-tabs">
                    <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}>
                        <Package size={16} /> طلباتي
                        {orders.length > 0 && <span className="tab-count">{orders.length}</span>}
                    </button>
                    <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setActiveTab('profile'); setSelectedOrder(null); }}>
                        <User size={16} /> بياناتي
                    </button>
                </div>

                {/* Content */}
                <div className="dash-content">
                    {/* ===== ORDERS TAB ===== */}
                    {activeTab === 'orders' && !selectedOrder && (
                        <div className="dash-orders">
                            {loadingOrders ? (
                                <div className="dash-loading">
                                    <div className="loader"></div>
                                    <p>جاري تحميل الطلبات...</p>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="dash-empty">
                                    <ShoppingBag size={48} />
                                    <h3>لا توجد طلبات بعد</h3>
                                    <p>ابدأ التسوق واطلب منتجاتك المفضلة</p>
                                    <button className="btn-primary" onClick={onClose}>تسوق الآن</button>
                                </div>
                            ) : (
                                orders.map(order => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="dash-order-card"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <div className="order-card-top">
                                            <div>
                                                <span className="order-num">{order.id}</span>
                                                <span className="order-time">
                                                    <Clock size={12} />
                                                    {new Date(order.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <span className={`order-status-chip ${getStatusClass(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>

                                        <div className="order-card-items">
                                            {(Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')).slice(0, 3).map((item, i) => (
                                                <span key={i} className="item-pill">{item.name || item.productName} × {item.quantity || item.qty}</span>
                                            ))}
                                            {(Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')).length > 3 && (
                                                <span className="item-pill more">+{(Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')).length - 3} أخرى</span>
                                            )}
                                        </div>

                                        <div className="order-card-bottom">
                                            <strong>{Number(order.total).toLocaleString()} ج.م</strong>
                                            <span className="view-order-link"><Eye size={14} /> تفاصيل الطلب <ChevronLeft size={14} /></span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ===== ORDER DETAIL (INVOICE VIEW) ===== */}
                    {activeTab === 'orders' && selectedOrder && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dash-order-detail">
                            <button className="back-btn" onClick={() => setSelectedOrder(null)}>
                                <ChevronLeft size={18} /> العودة للطلبات
                            </button>

                            {selectedOrder.invoice_number ? (
                                /* ===== PROPER INVOICE ===== */
                                <div className="customer-invoice">
                                    {/* Invoice Header */}
                                    <div className="cinv-header">
                                        <div className="cinv-brand">
                                            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 15L85 45V85H15V45L50 15Z" stroke="#4B2C20" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><path d="M42 85V65C42 60.5817 45.5817 57 50 57C54.4183 57 58 60.5817 58 65V85" stroke="#4B2C20" strokeWidth="2.5" /><path d="M25 75H35V82H25V75Z" fill="#4B2C20" /><path d="M30 75V60" stroke="#4B2C20" strokeWidth="1.5" /><circle cx="30" cy="58" r="2" fill="#4B2C20" /><path d="M27 65C27 65 24 63 24 60" stroke="#4B2C20" strokeWidth="1" /><path d="M33 68C33 68 36 66 36 63" stroke="#4B2C20" strokeWidth="1" /><path d="M65 75H75V82H65V75Z" fill="#4B2C20" /><path d="M70 75V60" stroke="#4B2C20" strokeWidth="1.5" /><circle cx="70" cy="58" r="2" fill="#4B2C20" /><path d="M67 65C67 65 64 63 64 60" stroke="#4B2C20" strokeWidth="1" /><path d="M73 68C73 68 76 66 76 63" stroke="#4B2C20" strokeWidth="1" /><path d="M50 35V50" stroke="#4B2C20" strokeWidth="1.5" /><path d="M47 40Q40 38 42 35" stroke="#4B2C20" strokeWidth="1" /><path d="M53 42Q60 40 58 37" stroke="#4B2C20" strokeWidth="1" /></svg>
                                            <div>
                                                <h2>البيت التركي</h2>
                                                <span>للأدوات المنزلية والأنتيكات</span>
                                            </div>
                                        </div>
                                        <div className="cinv-title-area">
                                            <h3>فاتورة</h3>
                                            <span className="cinv-number">#{selectedOrder.invoice_number}</span>
                                        </div>
                                    </div>

                                    <div className="cinv-divider"></div>

                                    {/* Invoice Meta */}
                                    <div className="cinv-meta">
                                        <div className="cinv-meta-block">
                                            <h4>فاتورة إلى:</h4>
                                            <p className="cinv-name">{selectedOrder.customer_name}</p>
                                            <p><Phone size={12} /> {selectedOrder.customer_phone}</p>
                                            <p><MapPin size={12} /> {selectedOrder.customer_address || '—'}</p>
                                        </div>
                                        <div className="cinv-meta-block cinv-meta-dates">
                                            <div className="cinv-date-row">
                                                <span>رقم الطلب:</span>
                                                <strong>{selectedOrder.id}</strong>
                                            </div>
                                            {selectedOrder.invoice_date && (
                                                <div className="cinv-date-row">
                                                    <span>تاريخ الفاتورة:</span>
                                                    <strong>{new Date(selectedOrder.invoice_date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                                </div>
                                            )}
                                            <div className="cinv-date-row">
                                                <span>تاريخ الطلب:</span>
                                                <strong>{new Date(selectedOrder.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="cinv-items">
                                        <div className="cinv-items-header">
                                            <span>#</span>
                                            <span>المنتج</span>
                                            <span>الكمية</span>
                                            <span>السعر</span>
                                            <span>الإجمالي</span>
                                        </div>
                                        {(Array.isArray(selectedOrder.items) ? selectedOrder.items : JSON.parse(selectedOrder.items || '[]')).map((item, i) => {
                                            const qty = item.quantity || item.qty || 1;
                                            const price = item.onlinePrice || item.online_price || item.price || 0;
                                            return (
                                                <div key={i} className="cinv-item-row">
                                                    <span>{i + 1}</span>
                                                    <span>{item.name || item.productName}</span>
                                                    <span>{qty}</span>
                                                    <span>{Number(price).toLocaleString()} ج.م</span>
                                                    <span>{Number(qty * price).toLocaleString()} ج.م</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="cinv-total">
                                        <span>الإجمالي الكلي</span>
                                        <strong>{Number(selectedOrder.total).toLocaleString()} ج.م</strong>
                                    </div>

                                    <div className="cinv-footer">
                                        <p>شكراً لتسوقكم من البيت التركي 🏠</p>
                                        <span>هذه الفاتورة صادرة إلكترونياً ولا تحتاج إلى توقيع</span>
                                    </div>

                                    {/* Download/Print Buttons */}
                                    <div className="cinv-actions">
                                        <button className="cinv-download-btn" onClick={() => {
                                            const win = window.open('', '_blank');
                                            win.document.write(buildInvoicePDF(selectedOrder));
                                            win.document.close();
                                            setTimeout(() => win.print(), 300);
                                        }}>
                                            <Download size={16} /> تحميل PDF
                                        </button>
                                        <button className="cinv-print-btn" onClick={() => {
                                            const win = window.open('', '_blank');
                                            win.document.write(buildInvoicePDF(selectedOrder));
                                            win.document.close();
                                            win.print();
                                        }}>
                                            <Printer size={16} /> طباعة
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ===== SIMPLE ORDER VIEW (no invoice yet) ===== */
                                <div className="invoice-card">
                                    <div className="invoice-header">
                                        <div className="invoice-title">
                                            <FileText size={24} />
                                            <div>
                                                <h3>تفاصيل الطلب</h3>
                                                <span className="invoice-id">{selectedOrder.id}</span>
                                            </div>
                                        </div>
                                        <span className={`order-status-chip ${getStatusClass(selectedOrder.status)}`}>
                                            {getStatusLabel(selectedOrder.status)}
                                        </span>
                                    </div>

                                    <div className="invoice-meta">
                                        <div>
                                            <span>التاريخ</span>
                                            <strong>{new Date(selectedOrder.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                        </div>
                                        <div>
                                            <span>العنوان</span>
                                            <strong>{selectedOrder.customer_address || '—'}</strong>
                                        </div>
                                    </div>

                                    <div className="invoice-items">
                                        <div className="invoice-items-header">
                                            <span>المنتج</span>
                                            <span>الكمية</span>
                                            <span>السعر</span>
                                            <span>الإجمالي</span>
                                        </div>
                                        {(Array.isArray(selectedOrder.items) ? selectedOrder.items : JSON.parse(selectedOrder.items || '[]')).map((item, i) => {
                                            const qty = item.quantity || item.qty || 1;
                                            const price = item.onlinePrice || item.online_price || item.price || 0;
                                            return (
                                                <div key={i} className="invoice-item-row">
                                                    <span>{item.name || item.productName}</span>
                                                    <span>{qty}</span>
                                                    <span>{Number(price).toLocaleString()} ج.م</span>
                                                    <span>{(qty * price).toLocaleString()} ج.م</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="invoice-total">
                                        <span>الإجمالي الكلي</span>
                                        <strong>{Number(selectedOrder.total).toLocaleString()} ج.م</strong>
                                    </div>
                                </div>
                            )}

                            {/* Order Tracking Stepper */}
                            {selectedOrder.status !== 'cancelled' && (
                                <div className="detail-tracking">
                                    <h4>حالة الطلب</h4>
                                    <div className="tracking-stepper">
                                        {ORDER_STAGES.map((stage, idx) => {
                                            const currentIdx = getStageIndex(selectedOrder.status);
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
                                </div>
                            )}

                            {selectedOrder.status === 'cancelled' && (
                                <div className="tracking-cancelled">
                                    <X size={20} /> تم إلغاء هذا الطلب
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ===== PROFILE TAB ===== */}
                    {activeTab === 'profile' && (
                        <div className="dash-profile">
                            <div className="profile-card">
                                <div className="profile-avatar-big">
                                    <User size={40} />
                                </div>
                                <h3>{customer.name}</h3>
                                <span className="member-since">
                                    عضو منذ {new Date(customer.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}
                                </span>
                            </div>

                            <div className="profile-stats">
                                <div className="stat-card">
                                    <Package size={20} />
                                    <strong>{orders.length}</strong>
                                    <span>طلب</span>
                                </div>
                                <div className="stat-card">
                                    <CheckCircle size={20} />
                                    <strong>{orders.filter(o => o.status === 'delivered').length}</strong>
                                    <span>تم التسليم</span>
                                </div>
                                <div className="stat-card">
                                    <ShoppingBag size={20} />
                                    <strong>{orders.reduce((sum, o) => sum + Number(o.total || 0), 0).toLocaleString()}</strong>
                                    <span>إجمالي المشتريات</span>
                                </div>
                            </div>

                            <div className="profile-fields">
                                <h4><Edit3 size={16} /> معلوماتي الشخصية</h4>

                                <div className="profile-field">
                                    <label><User size={14} /> الاسم</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))}
                                        />
                                    ) : (
                                        <p>{customer.name}</p>
                                    )}
                                </div>

                                <div className="profile-field">
                                    <label><Phone size={14} /> رقم الهاتف</label>
                                    <p dir="ltr" style={{ textAlign: 'right' }}>{customer.phone}</p>
                                </div>

                                <div className="profile-field">
                                    <label><MapPin size={14} /> العنوان</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={profileData.address}
                                            onChange={e => setProfileData(p => ({ ...p, address: e.target.value }))}
                                        />
                                    ) : (
                                        <p>{customer.address || 'لم يتم إضافة عنوان'}</p>
                                    )}
                                </div>

                                {editMode ? (
                                    <div className="profile-actions">
                                        <button className="btn-save" onClick={handleSaveProfile} disabled={savingProfile}>
                                            {savingProfile ? <div className="mini-loader"></div> : <><Save size={16} /> حفظ التغييرات</>}
                                        </button>
                                        <button className="btn-cancel-edit" onClick={() => { setEditMode(false); setProfileData({ name: customer.name, address: customer.address }); }}>إلغاء</button>
                                    </div>
                                ) : (
                                    <button className="btn-edit" onClick={() => setEditMode(true)}>
                                        <Edit3 size={16} /> تعديل البيانات
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CustomerDashboard;
