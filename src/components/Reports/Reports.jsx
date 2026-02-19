import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, DollarSign, Wallet, Users, Calendar, Download, Plus, X, Trash2, ArrowUpRight, ArrowDownRight, Activity, Filter, Receipt, FileSpreadsheet } from 'lucide-react';
import './Reports.css';

const Reports = ({ sales = [], products = [], expenses = [], setExpenses, settings = {}, payments = [], purchases = [] }) => {
    const [period, setPeriod] = useState('month'); // 'day', 'week', 'month', 'year'
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'عام' });

    // Date formatter helper
    const formatDate = (dateStr) => {
        if (!dateStr || dateStr === '-') return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            // For reports, we might prefer just the date or compact date/time
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

    // 1. Time range filtering with status check
    const filteredSales = useMemo(() => {
        const now = new Date();
        return sales.filter(sale => {
            if (sale.status === 'refunded') return false;

            const probeStr = sale.date.includes(',') ? sale.date.split(',')[0].trim() : sale.date;
            const saleDate = new Date(probeStr);

            if (isNaN(saleDate.getTime())) return false;

            if (period === 'day') return saleDate.toDateString() === now.toDateString();
            if (period === 'week') {
                const diff = (now - saleDate) / (1000 * 60 * 60 * 24);
                return diff <= 7;
            }
            if (period === 'month') return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
            if (period === 'year') return saleDate.getFullYear() === now.getFullYear();
            return true;
        });
    }, [sales, period]);

    const filteredExpenses = useMemo(() => {
        const now = new Date();
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            if (period === 'day') return expDate.toDateString() === now.toDateString();
            if (period === 'week') {
                const diff = (now - expDate) / (1000 * 60 * 60 * 24);
                return diff <= 7;
            }
            if (period === 'month') return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            if (period === 'year') return expDate.getFullYear() === now.getFullYear();
            return true;
        });
    }, [expenses, period]);

    const filteredPayments = useMemo(() => {
        const now = new Date();
        return payments.filter(p => {
            const pDate = new Date(p.date);
            if (period === 'day') return pDate.toDateString() === now.toDateString();
            if (period === 'week') {
                const diff = (now - pDate) / (1000 * 60 * 60 * 24);
                return diff <= 7;
            }
            if (period === 'month') return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
            if (period === 'year') return pDate.getFullYear() === now.getFullYear();
            return true;
        });
    }, [payments, period]);

    const filteredPurchases = useMemo(() => {
        const now = new Date();
        return purchases.filter(p => {
            const pDate = new Date(p.date);
            if (period === 'day') return pDate.toDateString() === now.toDateString();
            if (period === 'week') {
                const diff = (now - pDate) / (1000 * 60 * 60 * 24);
                return diff <= 7;
            }
            if (period === 'month') return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
            if (period === 'year') return pDate.getFullYear() === now.getFullYear();
            return true;
        });
    }, [purchases, period]);

    // 2. Core Stats Calculation
    const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);

    // Calculate REALIZED revenue (Cash sales + Payments collected)
    // We exclude credit sales until they are paid
    const cashSalesRevenue = filteredSales.reduce((sum, s) => {
        return s.paymentType !== 'credit' ? sum + s.total : sum;
    }, 0);

    // Total Payments collected from customers during this period
    const totalCollections = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

    // Total Supplies (Toreedat) - Total amount spent on restocking
    const totalSupplies = filteredPurchases.reduce((sum, p) => sum + p.total, 0);

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // Cash-Basis Profit Calculation:
    // Net Profit = (Cash Sales + Collections) - (Total Supplies + Total Expenses)
    const profit = (cashSalesRevenue + totalCollections) - totalSupplies - totalExpenses;

    // 3. Chart Data Preparation
    const chartData = useMemo(() => {
        const grouped = {};
        filteredSales.forEach(s => {
            let d;
            try {
                // Try to extract YYYY-MM-DD from ISO or parseable string
                const dateObj = new Date(s.date);
                if (!isNaN(dateObj.getTime())) {
                    d = dateObj.toISOString().split('T')[0];
                } else {
                    // Fallback for old/localized formats
                    d = s.date.split(',')[0].trim();
                }
            } catch (e) {
                d = s.date; // Fallback
            }

            if (!grouped[d]) grouped[d] = { date: d, sales: 0, profit: 0 };
            grouped[d].sales += s.total;

            let saleProfit = 0;
            s.items.forEach(item => {
                const product = products.find(p => p.id === item.id);
                saleProfit += (item.price - (product?.costPrice || 0)) * item.quantity;
            });
            grouped[d].profit += saleProfit;
        });

        return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [filteredSales, products]);

    const categoryStats = useMemo(() => {
        const cats = {};
        filteredSales.forEach(s => {
            s.items.forEach(item => {
                const cat = item.category || 'عام';
                cats[cat] = (cats[cat] || 0) + (item.price * item.quantity);
            });
        });
        return Object.entries(cats).map(([name, value]) => ({ name, value }));
    }, [filteredSales]);

    const topProducts = useMemo(() => {
        const items = {};
        filteredSales.forEach(s => {
            s.items.forEach(item => {
                if (!items[item.id]) items[item.id] = { ...item, sold: 0, revenue: 0 };
                items[item.id].sold += item.quantity;
                items[item.id].revenue += item.price * item.quantity;
            });
        });
        return Object.values(items).sort((a, b) => b.sold - a.sold).slice(0, 5);
    }, [filteredSales]);

    const handleAddExpense = (e) => {
        e.preventDefault();
        if (!newExpense.title || !newExpense.amount) return;
        setExpenses([
            { ...newExpense, id: Date.now() },
            ...expenses
        ]);
        setNewExpense({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'عام' });
        setShowExpenseModal(false);
    };

    const handleDeleteExpense = (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
            setExpenses(expenses.filter(e => e.id !== id));
        }
    };

    // Export to Excel (CSV) logic
    const exportToExcel = () => {
        // Headers
        const headers = ["رقم الفاتورة", "التاريخ", "العميل", "طريقة الدفع", "الإجمالي"];

        // Data rows
        const rows = filteredSales.map(sale => [
            sale.orderId,
            sale.date,
            sale.customerName || 'عميل عام',
            sale.paymentType === 'credit' ? 'آجل' : 'نقدًا',
            sale.total
        ]);

        // Financial Summary
        const summaryRows = [
            [],
            ["ملخص الفترة", period],
            ["إجمالي المبيعات", revenue],
            ["إجمالي المصروفات", totalExpenses],
            ["صافي الأرباح", profit]
        ];

        // Combine
        const csvContent = [headers, ...rows, ...summaryRows]
            .map(e => e.join(","))
            .join("\n");

        // Use UTF-8 BOM for Arabic characters in Excel
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `تقرير_مبيعات_${period}_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const COLORS = ['#7C4DFF', '#00BFA5', '#FF9800', '#F43F5E', '#10B981', '#3B82F6'];

    return (
        <div className="reports-container" dir="rtl">
            <header className="reports-header">
                <div className="header-info">
                    <h1>ملخص {settings.storeName || 'البيت التركي'}</h1>
                    <p>التقارير المالية والتحليلية</p>
                </div>

                <div className="header-actions">
                    <div className="period-tabs">
                        <button className={period === 'day' ? 'active' : ''} onClick={() => setPeriod('day')}>اليوم</button>
                        <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>أسبوع</button>
                        <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>شهر</button>
                        <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>سنة</button>
                    </div>

                    <button className="add-expense-btn" onClick={() => setShowExpenseModal(true)}>
                        <Plus size={18} />
                        مصروفات
                    </button>

                    <button className="export-btn" onClick={exportToExcel}>
                        <FileSpreadsheet size={18} />
                        تصدير اكسيل
                    </button>
                </div>
            </header>

            <div className="reports-content">
                <div className="stats-grid">
                    <div className="premium-stat-card blue">
                        <div className="glass-icon"><DollarSign size={28} /></div>
                        <div className="stat-info">
                            <span className="label">إجمالي المبيعات</span>
                            <div className="val-group">
                                <h3>{revenue.toLocaleString()}</h3>
                                <small>ج.م</small>
                            </div>
                        </div>
                        <div className="p-accent"></div>
                    </div>

                    <div className="premium-stat-card orange">
                        <div className="glass-icon"><Wallet size={28} /></div>
                        <div className="stat-info">
                            <span className="label">إجمالي التوريدات</span>
                            <div className="val-group">
                                <h3>{totalSupplies.toLocaleString()}</h3>
                                <small>ج.م</small>
                            </div>
                        </div>
                        <div className="p-accent"></div>
                    </div>

                    <div className="premium-stat-card red">
                        <div className="glass-icon"><ArrowUpRight size={28} /></div>
                        <div className="stat-info">
                            <span className="label">إجمالي المصروفات</span>
                            <div className="val-group">
                                <h3>{totalExpenses.toLocaleString()}</h3>
                                <small>ج.م</small>
                            </div>
                        </div>
                        <div className="p-accent"></div>
                    </div>

                    <div className="premium-stat-card green">
                        <div className="glass-icon"><TrendingUp size={28} /></div>
                        <div className="stat-info">
                            <span className="label">صافي الأرباح</span>
                            <div className="val-group">
                                <h3 className={profit < 0 ? 'text-red' : ''}>{profit.toLocaleString()}</h3>
                                <small>ج.م</small>
                            </div>
                        </div>
                        <div className="p-accent"></div>
                    </div>

                    <div className="premium-stat-card purple">
                        <div className="glass-icon"><Receipt size={28} /></div>
                        <div className="stat-info">
                            <span className="label">عدد الفواتير</span>
                            <div className="val-group">
                                <h3>{filteredSales.length}</h3>
                                <small>فاتورة</small>
                            </div>
                        </div>
                        <div className="p-accent"></div>
                    </div>
                </div>

                <div className="charts-row">
                    <div className="chart-card main-chart">
                        <div className="chart-header">
                            <div className="c-title">
                                <Activity size={20} />
                                <h3>مخطط البيع والربح</h3>
                            </div>
                        </div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={340}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="pSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="pProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00BFA5" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#00BFA5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#7C4DFF" strokeWidth={4} fill="url(#pSales)" />
                                    <Area type="monotone" dataKey="profit" name="الأرباح" stroke="#00BFA5" strokeWidth={4} fill="url(#pProfit)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-card side-chart">
                        <div className="chart-header">
                            <div className="c-title">
                                <Filter size={20} />
                                <h3>توزيع مبيعات الأقسام</h3>
                            </div>
                        </div>
                        <div className="chart-wrapper pie-container">
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={categoryStats} innerRadius={65} outerRadius={85} paddingAngle={6} dataKey="value">
                                        {categoryStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pie-legend-grid">
                                {categoryStats.map((item, index) => (
                                    <div key={index} className="legend-p-item">
                                        <div className="dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="label">{item.name}</span>
                                        <span className="perc">{((item.value / revenue) * 100 || 0).toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="info-grid">
                    <div className="info-card">
                        <div className="card-header"><h3>الأكثر طلباً</h3></div>
                        <div className="top-p-list">
                            {topProducts.map((p, i) => (
                                <div key={i} className="top-p-item">
                                    <div className="p-rank">{i + 1}</div>
                                    <div className="p-details">
                                        <strong>{p.name}</strong>
                                        <span>تم بيع {p.sold} وحدة</span>
                                    </div>
                                    <div className="p-income">{p.revenue.toLocaleString()} ج.م</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="info-card">
                        <div className="card-header"><h3>آخر المصروفات</h3></div>
                        <div className="exp-mini-list">
                            {filteredExpenses.slice(0, 6).map(e => (
                                <div key={e.id} className="exp-mini-item">
                                    <div className="exp-meta">
                                        <strong>{e.title}</strong>
                                        <small>{formatDate(e.date)}</small>
                                    </div>
                                    <div className="exp-amount">
                                        <span>-{parseFloat(e.amount).toLocaleString()} ج.م</span>
                                        <button onClick={() => handleDeleteExpense(e.id)} className="del-mini"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                            {filteredExpenses.length === 0 && <div className="empty-msg">لا توجد مصروفات</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="modal-overlay">
                    <div className="glass-modal">
                        <div className="modal-header">
                            <h3>تسجيل مصروف</h3>
                            <button onClick={() => setShowExpenseModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddExpense}>
                            <div className="modal-body">
                                <div className="f-group">
                                    <label>البيان</label>
                                    <input
                                        list="expense-suggestions"
                                        type="text"
                                        required
                                        value={newExpense.title}
                                        onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                                        autoFocus
                                    />
                                    <datalist id="expense-suggestions">
                                        {(settings.expenseCategories || ['عام', 'رواتب', 'إيجار', 'فواتير', 'هالك']).map((cat, idx) => (
                                            <option key={idx} value={cat} />
                                        ))}
                                    </datalist>
                                </div>
                                <div className="f-grid">
                                    <div className="f-group">
                                        <label>المبلغ (ج.م)</label>
                                        <input type="number" required value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                                    </div>
                                    <div className="f-group">
                                        <label>التاريخ</label>
                                        <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="f-group">
                                    <label>التصنيف</label>
                                    <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
                                        {(settings.expenseCategories || ['عام', 'رواتب', 'إيجار', 'فواتير', 'هالك']).map((cat, idx) => (
                                            <option key={idx} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="c-btn" onClick={() => setShowExpenseModal(false)}>إلغاء</button>
                                <button type="submit" className="s-btn">حفظ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
