import React, { useMemo } from 'react';
import {
    LayoutDashboard,
    TrendingUp,
    ShoppingBag,
    Users,
    AlertTriangle,
    ArrowUpRight,
    PlusCircle,
    ShoppingCart,
    UserPlus,
    Receipt
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ sales = [], products = [], customers = [], expenses = [], setActiveTab }) => {
    // 1. Today's Calculations
    const today = new Date().toDateString();

    const todayStats = useMemo(() => {
        const todaySales = (sales || []).filter(s => {
            if (!s?.date) return false;
            const d = s.date.includes(',') ? s.date.split(',')[0].trim() : s.date;
            try {
                return new Date(d).toDateString() === today && s.status !== 'refunded';
            } catch (e) {
                return false;
            }
        });

        const revenue = todaySales.reduce((sum, s) => sum + s.total, 0);

        let todayProfit = 0;
        todaySales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.id);
                todayProfit += (item.price - (product?.costPrice || 0)) * item.quantity;
            });
        });

        const todayExpenses = expenses.filter(e => new Date(e.date).toDateString() === today)
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        return {
            revenue,
            profit: todayProfit - todayExpenses,
            orders: todaySales.length,
            customers: customers.length
        };
    }, [sales, products, expenses, customers, today]);

    // 2. Alerts (Low Stock)
    const lowStockAlerts = useMemo(() => {
        return products.filter(p => p.stock <= p.minStock).slice(0, 4);
    }, [products]);

    // 3. Quick Actions
    const quickActions = [
        { label: 'عملية بيع جديدة', icon: ShoppingCart, tab: 'pos', color: '#7c4dff' },
        { label: 'إضافة عميل', icon: UserPlus, tab: 'customers', color: '#00bfa5' },
        { label: 'تسجيل مصروف', icon: PlusCircle, tab: 'reports', color: '#f43f5e' },
        { label: 'سجل الفواتير', icon: Receipt, tab: 'invoices', color: '#1e293b' },
    ];

    return (
        <div className="dashboard-container" dir="rtl">
            <header className="dashboard-header">
                <div className="header-title">
                    <LayoutDashboard size={28} className="title-icon" />
                    <div>
                        <h1>لوحة التحكم الاستراتيجية</h1>
                        <p>نظرة عامة على أداء محلك لهذا اليوم: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                {/* 1. Statistics Row */}
                <div className="dash-stats-grid">
                    <div className="d-stat-card revenue">
                        <div className="d-stat-icon"><ShoppingBag /></div>
                        <div className="d-stat-body">
                            <span>مبيعات اليوم</span>
                            <h3>{todayStats.revenue.toLocaleString()} <small>ج.م</small></h3>
                        </div>
                        <div className="d-stat-badge">+{todayStats.orders} طلب</div>
                    </div>

                    <div className="d-stat-card profit">
                        <div className="d-stat-icon"><TrendingUp /></div>
                        <div className="d-stat-body">
                            <span>صافي أرباح اليوم</span>
                            <h3>{todayStats.profit.toLocaleString()} <small>ج.م</small></h3>
                        </div>
                        <div className="d-stat-badge green">تشغيل</div>
                    </div>

                    <div className="d-stat-card customers">
                        <div className="d-stat-icon"><Users /></div>
                        <div className="d-stat-body">
                            <span>قاعدة العملاء</span>
                            <h3>{todayStats.customers} <small>عميل</small></h3>
                        </div>
                        <div className="d-stat-badge blue">نشط</div>
                    </div>
                </div>

                <div className="dash-main-grid">
                    {/* 2. Quick Actions Section */}
                    <div className="dash-section actions-section">
                        <div className="section-header">
                            <h3>الوصول السريع</h3>
                        </div>
                        <div className="actions-grid">
                            {quickActions.map((action, i) => (
                                <button
                                    key={i}
                                    className="action-btn"
                                    onClick={() => setActiveTab(action.tab)}
                                    style={{ '--accent': action.color }}
                                >
                                    <div className="action-icon"><action.icon size={24} /></div>
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 3. Alerts Section */}
                    <div className="dash-section alerts-section">
                        <div className="section-header">
                            <h3>تنبيهات الأصناف (نواقص)</h3>
                            <button className="text-btn" onClick={() => setActiveTab('inventory')}>عرض الكل</button>
                        </div>
                        <div className="alerts-list">
                            {lowStockAlerts.map(p => (
                                <div key={p.id} className="alert-item">
                                    <div className="alert-p-info">
                                        <strong>{p.name}</strong>
                                        <span>المتبقي: {p.stock} قطعة</span>
                                    </div>
                                    <div className="alert-badge red">
                                        <AlertTriangle size={14} /> خطير
                                    </div>
                                </div>
                            ))}
                            {lowStockAlerts.length === 0 && (
                                <div className="empty-alerts">
                                    <TrendingUp size={48} className="success-icon" />
                                    <p>المخزون ممتاز! لا توجد نواقص حالياً</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. Recent Transactions Table */}
                <div className="dash-section table-section">
                    <div className="section-header">
                        <h3>آخر 5 عمليات بيع</h3>
                        <button className="text-btn" onClick={() => setActiveTab('invoices')}>سجل الفواتير</button>
                    </div>
                    <div className="mini-table-container">
                        <table className="mini-dash-table">
                            <thead>
                                <tr>
                                    <th>رقم الفاتورة</th>
                                    <th>العميل</th>
                                    <th>الوقت</th>
                                    <th>الإجمالي</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.slice(0, 5).map(sale => (
                                    <tr key={sale.orderId}>
                                        <td>#{sale.orderId}</td>
                                        <td>{sale.customerName || 'عميل نقدي'}</td>
                                        <td>{new Date(sale.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="bold">{sale.total.toLocaleString()} ج.م</td>
                                        <td><span className={`mini-badge ${sale.status || 'success'}`}>{sale.status === 'refunded' ? 'مرتجع' : 'مكتمل'}</span></td>
                                    </tr>
                                ))}
                                {sales.length === 0 && <tr><td colSpan="5" className="text-center">لا توجد عمليات بيع مسجلة</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
