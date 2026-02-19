import React, { useState } from 'react';
import { ShoppingBag, Search, Plus, Trash2, Calendar, User, DollarSign, Package, CheckCircle2, X, Archive } from 'lucide-react';
import './Purchases.css';

const Purchases = ({ purchases = [], products = [], setPurchases, settings = {} }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPurchase, setSelectedPurchase] = useState(null);

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

    const filteredPurchases = purchases.filter(p =>
        (p.supplier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.id || '').toString().includes(searchTerm)
    );

    const handleDeletePurchase = (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا السجل؟ لن يتم حذف الكميات من المخزن تلقائيا.')) {
            setPurchases(prev => prev.filter(p => p.id !== id));
        }
    };

    return (
        <div className="purchases-container" dir="rtl">
            <header className="purchases-header">
                <div className="header-info">
                    <ShoppingBag size={28} className="title-icon" />
                    <div>
                        <h1>إدارة المشتريات والتوريدات</h1>
                        <p>سجل طلبات الشراء الواردة وحركة التوريد للمخزن</p>
                    </div>
                </div>
            </header>

            <div className="purchases-content">
                <div className="stats-grid-modern">
                    <div className="p-stat-card">
                        <div className="p-stat-icon blue"><Calendar /></div>
                        <div className="p-stat-data">
                            <span>إجمالي العمليات</span>
                            <h3>{purchases.length}</h3>
                        </div>
                    </div>
                    <div className="p-stat-card">
                        <div className="p-stat-icon green"><DollarSign /></div>
                        <div className="p-stat-data">
                            <span>إجمالي المشتريات</span>
                            <h3>{purchases.reduce((sum, p) => sum + (p.total || 0), 0).toLocaleString()} <small>ج.م</small></h3>
                        </div>
                    </div>
                </div>

                <div className="purchases-list-card">
                    <div className="card-header">
                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="بحث باسم المورد أو رقم الفاتورة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="purchases-table">
                            <thead>
                                <tr>
                                    <th>رقم الحركة</th>
                                    <th>التاريخ والوقت</th>
                                    <th>المورد / الشركة</th>
                                    <th>عدد الأصناف</th>
                                    <th>الإجمالي</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPurchases.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-row">لا توجد سجلات مشتريات حالياً</td>
                                    </tr>
                                ) : (
                                    filteredPurchases.map(p => (
                                        <tr
                                            key={p.id}
                                            onDoubleClick={() => setSelectedPurchase(p)}
                                            className="clickable-row"
                                            title="انقر مرتين لعرض التفاصيل"
                                        >
                                            <td className="bold-id">#{p.id.toString().slice(-6)}</td>
                                            <td>{formatDate(p.date)}</td>
                                            <td>
                                                <div className="supplier-cell">
                                                    <User size={14} />
                                                    {p.supplier || 'مورد عام'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="items-count-badge">
                                                    <Package size={14} />
                                                    {p.itemsCount} أصناف
                                                </div>
                                            </td>
                                            <td className="amount-cell">{p.total.toLocaleString()} ج.م</td>
                                            <td>
                                                <button className="delete-btn-mini" onClick={() => handleDeletePurchase(p.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {selectedPurchase && (
                <div className="modal-overlay">
                    <div className="modern-modal" style={{ maxWidth: '800px', width: '90%' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <ShoppingBag size={24} color="#4B2C20" />
                                <div>
                                    <h3>تفاصيل طلب الشراء #{selectedPurchase.id.toString().slice(-6)}</h3>
                                    <span className="modal-subtitle">{formatDate(selectedPurchase.date)} - {selectedPurchase.supplier || 'مورد عام'}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPurchase(null)} className="close-modal-btn">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px' }}>
                            {selectedPurchase.items && selectedPurchase.items.length > 0 ? (
                                <table className="details-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <tr>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>الصنف</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>الكمية</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>سعر التكلفة</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>سعر البيع</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPurchase.items.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <strong>{item.name}</strong>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.category}</div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{parseFloat(item.costPrice || 0).toLocaleString()} ج.م</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{parseFloat(item.salePrice || 0).toLocaleString()} ج.م</td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                                                    {(parseFloat(item.costPrice || 0) * parseInt(item.quantity || 0)).toLocaleString()} ج.م
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                                        <tr>
                                            <td colSpan="4" style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>إجمالي الفاتورة:</td>
                                            <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#2e7d32', fontSize: '1.1rem' }}>
                                                {selectedPurchase.total.toLocaleString()} ج.م
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <div className="empty-state-modal" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                    <Archive size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                    <p>لا توجد تفاصيل تفصيلية مسجلة لهذا الطلب (سجل قديم).</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ justifyContent: 'flex-end', borderTop: '1px solid #eee', padding: '15px' }}>
                            <button className="secondary-btn" onClick={() => setSelectedPurchase(null)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Purchases;
