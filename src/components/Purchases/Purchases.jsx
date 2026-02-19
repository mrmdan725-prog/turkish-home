import React, { useState } from 'react';
import { ShoppingBag, Search, Plus, Trash2, Calendar, User, DollarSign, Package, CheckCircle2 } from 'lucide-react';
import './Purchases.css';

const Purchases = ({ purchases = [], products = [], setPurchases, settings = {} }) => {
    const [searchTerm, setSearchTerm] = useState('');

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
                                        <tr key={p.id}>
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
        </div>
    );
};

export default Purchases;
