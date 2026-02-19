import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Users, Search, Plus, Phone, CreditCard, History, ArrowUpRight, ArrowDownLeft, Save, X, UserPlus, FileText, Printer, MessageCircle, ArrowRight, RotateCcw, Link as LinkIcon, MoreVertical, Edit, Trash2 } from 'lucide-react';
import './Customers.css';

const Customers = ({ settings, sales = [], setSales, customers = [], setCustomers, payments = [], setPayments, onReturn }) => {
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [activeMenuId, setActiveMenuId] = useState(null); // Track open menu

    // Derive the selected customer from the prop based on ID
    const selectedCustomer = useMemo(() =>
        customers.find(c => c.id === selectedCustomerId),
        [customers, selectedCustomerId]);

    // New Customer Form State
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        initialDebt: '0'
    });

    // Editing Customer Form State
    const [editingCustomer, setEditingCustomer] = useState(null);
    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (event.target.closest('.customer-menu-wrapper')) {
                return;
            }
            setActiveMenuId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // Merge real sales and real payments for the selected customer
    const customerTransactions = useMemo(() => {
        if (!selectedCustomer) return [];

        const realSales = sales
            .filter(sale => sale.customerId === selectedCustomer.id || sale.customerName === selectedCustomer.name)
            .map(sale => ({
                id: sale.orderId,
                date: sale.date,
                type: sale.status === 'refunded' ? 'return' : 'sale',
                amount: sale.total,
                notes: `فاتورة رقم ${sale.orderId}${sale.paymentType === 'credit' ? ' (آجل)' : ''}`,
                raw: sale
            }));

        const customerPayments = payments
            .filter(p => p.customerId === selectedCustomer.id)
            .map(p => ({
                id: p.id,
                date: p.date,
                type: 'payment',
                amount: p.amount,
                notes: p.notes || 'تحصيل نقدي'
            }));

        return [...realSales, ...customerPayments].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
    }, [selectedCustomer, sales, payments]);

    // Unlinked sales (those not assigned to any customer)
    const unlinkedSales = useMemo(() => {
        return sales.filter(s => !s.customerId && (!invoiceSearch || s.orderId.toString().includes(invoiceSearch)));
    }, [sales, invoiceSearch]);

    // Calculate real stats
    const stats = useMemo(() => {
        if (!selectedCustomer) return { totalPurchases: 0, lastDate: '-' };

        const total = customerTransactions
            .filter(t => t.type === 'sale')
            .reduce((sum, t) => sum + t.amount, 0);

        const lastDate = customerTransactions.length > 0 ? customerTransactions[0].date : selectedCustomer.lastTransaction;

        return {
            totalPurchases: total,
            lastDate
        };
    }, [selectedCustomer, customerTransactions]);

    const handlePayment = () => {
        if (!paymentAmount || !selectedCustomer) return;
        const amount = parseFloat(paymentAmount);

        const newPayment = {
            id: Date.now(),
            customerId: selectedCustomer.id,
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            notes: 'تحصيل نقدي'
        };
        setPayments(prev => [...prev, newPayment]);

        setCustomers(prev => prev.map(c => {
            if (c.id === selectedCustomer.id) {
                return {
                    ...c,
                    debt: Math.max(0, c.debt - amount),
                    lastTransaction: newPayment.date
                };
            }
            return c;
        }));

        setShowPaymentModal(false);
        setPaymentAmount('');
    };

    const handleLinkInvoice = (sale) => {
        if (!selectedCustomer) return;

        // 1. Update the sale record
        setSales(prev => prev.map(s => {
            if (s.orderId === sale.orderId) {
                return {
                    ...s,
                    customerId: selectedCustomer.id,
                    customerName: selectedCustomer.name,
                    paymentType: 'credit' // Convert to credit sale when linked
                };
            }
            return s;
        }));

        // 2. Update customer debt
        setCustomers(prev => prev.map(c => {
            if (c.id === selectedCustomer.id) {
                return {
                    ...c,
                    debt: c.debt + sale.total,
                    lastTransaction: new Date().toISOString().split('T')[0]
                };
            }
            return c;
        }));

        setShowLinkModal(false);
        setInvoiceSearch('');
    };

    const handleAddCustomer = (e) => {
        e.preventDefault();
        if (!newCustomer.name || !newCustomer.phone) return;

        const customerToAdd = {
            id: Date.now(),
            name: newCustomer.name,
            phone: newCustomer.phone,
            debt: parseFloat(newCustomer.initialDebt) || 0,
            lastTransaction: new Date().toISOString()
        };

        setCustomers([customerToAdd, ...customers]);
        setShowAddModal(false);
        setNewCustomer({ name: '', phone: '', initialDebt: '0' });
    };

    const handleDeleteCustomer = (id, e) => {
        e.stopPropagation();
        if (window.confirm('هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.')) {
            setCustomers(prev => prev.filter(c => c.id !== id));
            if (selectedCustomerId === id) setSelectedCustomerId(null);
            setActiveMenuId(null);
        }
    };

    const openEditModal = (customer, e) => {
        e.stopPropagation();
        setEditingCustomer({ ...customer });
        setShowEditModal(true);
        setActiveMenuId(null);
    };

    const handleUpdateCustomer = (e) => {
        e.preventDefault();
        setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? editingCustomer : c));
        setShowEditModal(false);
        setEditingCustomer(null);
    };

    const handleWhatsAppStatement = () => {
        if (!selectedCustomer) return;
        const msg = `مرحباً ${selectedCustomer.name}،\nكشف حسابكم من ${settings?.storeName || 'Turkish Home'}:\nالمديونية الحالية: ${selectedCustomer.debt.toLocaleString()} ج.م\nشكراً لتعاملكم معنا.`;
        const url = `https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const handleExportStatement = () => {
        if (!selectedCustomer) return;
        const printWindow = window.open('', '_blank');
        const content = `
            <html dir="rtl">
            <head>
                <title>كشف حساب - ${selectedCustomer.name}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #7c4dff; padding-bottom: 20px; }
                    .store-info h1 { color: #7c4dff; margin: 0 0 5px 0; }
                    .store-info p { margin: 2px 0; color: #666; font-size: 0.9rem; }
                    .statement-title { text-align: center; margin-bottom: 30px; }
                    .statement-title h2 { background: #f8fafc; display: inline-block; padding: 10px 30px; border-radius: 10px; margin: 0; }
                    .customer-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; background: #f1f5f9; padding: 20px; border-radius: 12px; }
                    .summary-item { display: flex; flex-direction: column; }
                    .summary-label { font-size: 0.85rem; color: #64748b; margin-bottom: 4px; }
                    .summary-value { font-weight: bold; font-size: 1.1rem; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f8fafc; color: #64748b; text-align: right; padding: 12px; border-bottom: 2px solid #e2e8f0; }
                    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                    .amount-sale { color: #ef4444; font-weight: 600; }
                    .amount-payment { color: #10b981; font-weight: 600; }
                    .footer { margin-top: 50px; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="store-info">
                        <h1>${settings?.storeName || 'Turkish Home'}</h1>
                        <p>${settings?.address || ''}</p>
                        <p>هاتف: ${settings?.phone || ''}</p>
                    </div>
                </div>
                <div class="statement-title"><h2>كشف حساب عميل</h2></div>
                <div class="customer-summary">
                    <div class="summary-item"><span class="summary-label">اسم العميل</span><span class="summary-value">${selectedCustomer.name}</span></div>
                    <div class="summary-item"><span class="summary-label">رقم الهاتف</span><span class="summary-value">${selectedCustomer.phone}</span></div>
                    <div class="summary-item"><span class="summary-label">إجمالي المديونية الحالية</span><span class="summary-value" style="color: #ef4444">${selectedCustomer.debt.toLocaleString()} ج.م</span></div>
                </div>
                <table>
                    <thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th></tr></thead>
                    <tbody>
                        ${customerTransactions.map(t => `
                            <tr>
                                <td>${formatDate(t.date)}</td>
                                <td>${t.notes}</td>
                                <td class="${t.type === 'sale' ? 'amount-sale' : 'amount-payment'}">
                                    ${t.type === 'sale' ? '+' : '-'}${t.amount.toLocaleString()} ج.م
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
    };

    const filteredCustomers = customers.filter(c =>
        c.name.includes(searchQuery) || c.phone.includes(searchQuery)
    );

    return (
        <div className="customers-container" dir="rtl">
            <header className="customers-header">
                <div className="header-info">
                    <Users size={28} className="title-icon" />
                    <div>
                        <h1>إدارة العملاء والديون</h1>
                        <p>متابعة حسابات العملاء والمدفوعات الآجلة</p>
                    </div>
                </div>
                <button className="add-customer-btn" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    عميل جديد
                </button>
            </header>

            <div className="customers-content">
                <div className={`customers-list-section ${selectedCustomerId ? 'hide-on-mobile' : ''}`}>
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="بحث باسم العميل أو رقم الهاتف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="customers-grid">
                        {filteredCustomers.map(customer => (
                            <div
                                key={customer.id}
                                className={`customer-card ${selectedCustomerId === customer.id ? 'active' : ''}`}
                                onClick={() => setSelectedCustomerId(customer.id)}
                            >
                                <div className="customer-card-header">
                                    <div className="customer-avatar">{customer.name[0]}</div>
                                    <div className="customer-info">
                                        <h3>{customer.name}</h3>
                                        <div className="info-item"><Phone size={14} /><span>{customer.phone}</span></div>
                                    </div>
                                    <div className="customer-menu-wrapper">
                                        <button
                                            className="menu-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === customer.id ? null : customer.id);
                                            }}
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {activeMenuId === customer.id && (
                                            <div className="dropdown-menu">
                                                <button onClick={(e) => openEditModal(customer, e)}>
                                                    <Edit size={14} /> تعديل
                                                </button>
                                                <button className="delete-option" onClick={(e) => handleDeleteCustomer(customer.id, e)}>
                                                    <Trash2 size={14} /> حذف
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="customer-debt-info">
                                    <span className="debt-label">المديونية</span>
                                    <span className={`debt-value ${customer.debt > 0 ? 'has-debt' : ''}`}>
                                        {customer.debt.toLocaleString()} ج.م
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`customer-details-section ${selectedCustomerId ? 'show' : ''}`}>
                    {selectedCustomer ? (
                        <div className="details-card">
                            <div className="details-header">
                                <div className="header-title-group">
                                    <button className="back-btn" onClick={() => setSelectedCustomerId(null)}><ArrowRight size={20} /></button>
                                    <h2>{selectedCustomer.name}</h2>
                                </div>
                                <div className="header-actions">
                                    <button className="link-inv-btn" onClick={() => setShowLinkModal(true)}>
                                        <LinkIcon size={18} />
                                        ربط فاتورة
                                    </button>
                                    <button className="pay-btn" onClick={() => setShowPaymentModal(true)}>
                                        <CreditCard size={18} />
                                        تسجيل دفعة
                                    </button>
                                    <button className="whatsapp-btn" onClick={handleWhatsAppStatement}>
                                        <MessageCircle size={18} />
                                    </button>
                                    <button className="export-btn" onClick={handleExportStatement}>
                                        <FileText size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="stats-row">
                                <div className="mini-stat"><span>إجمالي المشتريات</span><h4>{stats.totalPurchases.toLocaleString()} ج.م</h4></div>
                                <div className="mini-stat warning"><span>الرصيد المتبقي</span><h4>{selectedCustomer.debt.toLocaleString()} ج.م</h4></div>
                                <div className="mini-stat"><span>آخر حركة</span><h4>{formatDate(stats.lastDate)}</h4></div>
                            </div>

                            <div className="transactions-section">
                                <h3><History size={18} /> سجل الحركات</h3>
                                <div className="transactions-list">
                                    {customerTransactions.map(t => (
                                        <div key={t.id} className="transaction-item">
                                            <div className={`t-icon ${t.type === 'sale' ? 'out' : t.type === 'payment' ? 'in' : 'return'}`}>
                                                {t.type === 'sale' ? <ArrowUpRight size={16} /> : t.type === 'payment' ? <ArrowDownLeft size={16} /> : <RotateCcw size={16} />}
                                            </div>
                                            <div className="t-info">
                                                <span className="t-notes">
                                                    {t.notes}
                                                    {t.type === 'sale' && onReturn && (
                                                        <button className="inline-return-btn" onClick={(e) => { e.stopPropagation(); if (window.confirm('هل تريد عمل مرتجع لهذه الفاتورة؟')) onReturn(t.raw.orderId, t.raw.items); }}>عمل مرتجع</button>
                                                    )}
                                                </span>
                                                <span className="t-date">{formatDate(t.date)}</span>
                                            </div>
                                            <div className={`t-amount ${t.type === 'sale' ? 'red' : t.type === 'payment' ? 'green' : 'gray'}`}>{t.type === 'sale' ? '+' : '-'}{t.amount.toLocaleString()} ج.م</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-details"><Users size={64} /><p>اختر عميلاً من القائمة لعرض التفاصيل</p></div>
                    )}
                </div>
            </div>

            {/* Link Invoice Modal */}
            {showLinkModal && (
                <div className="modal-overlay">
                    <div className="modal-content link-invoice-modal">
                        <div className="modal-header">
                            <h3>ربط فاتورة بالعميل: {selectedCustomer.name}</h3>
                            <button onClick={() => setShowLinkModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="invoice-search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="بحث برقم الفاتورة..."
                                    value={invoiceSearch}
                                    onChange={(e) => setInvoiceSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="unlinked-invoices-list">
                                {unlinkedSales.map(sale => (
                                    <div key={sale.orderId} className="unlinked-sale-item">
                                        <div className="sale-brief">
                                            <strong>فاتورة #{sale.orderId}</strong>
                                            <span>{sale.date}</span>
                                        </div>
                                        <div className="sale-total">{sale.total.toLocaleString()} ج.م</div>
                                        <button className="link-action-btn" onClick={() => handleLinkInvoice(sale)}>
                                            <Plus size={14} /> ربط الآن
                                        </button>
                                    </div>
                                ))}
                                {unlinkedSales.length === 0 && <div className="no-results">لا توجد فواتير غير مربوطة</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedCustomer && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>تسجيل مبلغ مدفوع</h3>
                            <button onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p>إدخال مبلغ التحصيل للعميل: <strong>{selectedCustomer.name}</strong></p>
                            <div className="input-group">
                                <label>المبلغ المدفوع (ج.م)</label>
                                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" autoFocus />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowPaymentModal(false)}>إلغاء</button>
                            <button className="confirm-btn" onClick={handlePayment}>تأكيد السداد</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header"><h3>إضافة عميل جديد</h3><button onClick={() => setShowAddModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleAddCustomer}>
                            <div className="modal-body">
                                <div className="input-group"><label>اسم العميل</label><input type="text" required value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} /></div>
                                <div className="input-group"><label>رقم الهاتف</label><input type="text" required value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></div>
                                <div className="input-group"><label>مديونية افتتاحية</label><input type="number" value={newCustomer.initialDebt} onChange={(e) => setNewCustomer({ ...newCustomer, initialDebt: e.target.value })} /></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>إلغاء</button><button type="submit" className="confirm-btn">حفظ</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Customer Modal */}
            {showEditModal && editingCustomer && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header"><h3>تعديل بيانات العميل</h3><button onClick={() => setShowEditModal(false)}><X size={20} /></button></div>
                        <form onSubmit={handleUpdateCustomer}>
                            <div className="modal-body">
                                <div className="input-group"><label>اسم العميل</label><input type="text" required value={editingCustomer.name} onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })} /></div>
                                <div className="input-group"><label>رقم الهاتف</label><input type="text" value={editingCustomer.phone} onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })} /></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>إلغاء</button><button type="submit" className="confirm-btn">حفظ التعديلات</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
