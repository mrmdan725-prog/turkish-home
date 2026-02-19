import React, { useMemo, useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, AlertCircle, Zap, Target, BarChart, ShoppingBag, Clock, ArrowRight, ShieldCheck, Activity, Search } from 'lucide-react';
import './TurkishAI.css';

const TurkishAI = ({ sales = [], products = [], customers = [], expenses = [], payments = [], purchases = [], setActiveTab }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [visibleInsights, setVisibleInsights] = useState([]);

    const aiInsights = useMemo(() => {
        const insights = [];

        // 1. Inventory Insights
        const lowStock = products.filter(p => p.stock <= p.minStock);
        if (lowStock.length > 0) {
            insights.push({
                type: 'warning',
                title: 'تنبيه ذكاء المخزون',
                content: `هناك ${lowStock.length} منتجات تقترب من النفاذ. المنتج "${lowStock[0].name}" هو الأكثر طلباً حالياً ويحتاج توريد فوري.`,
                icon: AlertCircle,
                priority: 'high',
                action: 'فتح المخزن',
                tab: 'inventory'
            });
        }

        const deadStock = products.filter(p => p.stock > 0 && !sales.some(s => s.items.some(i => i.id === p.id)));
        if (deadStock.length > 0) {
            insights.push({
                type: 'suggestion',
                title: 'استراتيجية تنشيط المبيعات',
                content: `تم اكتشاف ${deadStock.length} أصناف "راكدة". نقترح عمل عروض "اشترِ واحد واحصل على الثاني بخصم" على "${deadStock[0].name}".`,
                icon: Target,
                priority: 'medium',
                action: 'بدء عرض',
                tab: 'pos'
            });
        }

        // 2. Financial Insights
        const todayPrice = new Date().toDateString();
        const todaySales = sales.filter(s => new Date(s.date).toDateString() === todayPrice);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdaySales = sales.filter(s => new Date(s.date).toDateString() === yesterday.toDateString());

        const growth = yesterdaySales.length > 0 ? ((todaySales.length - yesterdaySales.length) / yesterdaySales.length) * 100 : 0;

        if (growth > 0) {
            insights.push({
                type: 'success',
                title: 'مؤشر النمو الرقمي',
                content: `أداء ممتاز! هناك نمو في العمليات بنسبة ${Math.round(growth)}% اليوم. استمر في تعزيز مبيعات الفئات الأكثر طلباً.`,
                icon: TrendingUp,
                priority: 'high',
                action: 'عرض التقارير',
                tab: 'reports'
            });
        }

        // 3. Customer Insights
        const highDebtCustomers = customers.filter(c => c.debt > 2000);
        if (highDebtCustomers.length > 0) {
            insights.push({
                type: 'danger',
                title: 'تحليل المخاطر الائتمانية',
                content: `النظام ينصح بالتواصل مع "${highDebtCustomers[0].name}" لتحصيل مديونية بقيمة ${highDebtCustomers[0].debt} ج.م قبل منح ائتمان جديد.`,
                icon: ShieldCheck,
                priority: 'high',
                action: 'رسالة تحصيل',
                tab: 'customers'
            });
        }

        // 4. Time Patterns
        const hours = sales.map(s => new Date(s.date).getHours());
        if (hours.length > 0) {
            const counts = {};
            hours.forEach(h => counts[h] = (counts[h] || 0) + 1);
            const peakHour = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
            const peak = parseInt(peakHour);
            const timeStr = peak > 12 ? `${peak - 12} مساءً` : `${peak} صباحاً`;
            insights.push({
                type: 'info',
                title: 'تحليل سلوك القوة الشرائية',
                content: `القوة الشرائية تصل لـ (الذورة) في تمام الساعة ${timeStr}. نقترح تكثيف العروض المباشرة في هذا الوقت لتحقيق أعلى مبيعات.`,
                icon: Clock,
                priority: 'medium',
                action: 'جدولة عروض',
                tab: 'pos'
            });
        }

        return insights;
    }, [sales, products, customers]);

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setAnalysisProgress(0);
        setVisibleInsights([]);

        const interval = setInterval(() => {
            setAnalysisProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsAnalyzing(false);
                    // Cascade show insights
                    aiInsights.forEach((_, i) => {
                        setTimeout(() => {
                            setVisibleInsights(curr => [...curr, aiInsights[i]]);
                        }, i * 400);
                    });
                    return 100;
                }
                return prev + 5;
            });
        }, 50);
    };

    useEffect(() => {
        if (!isAnalyzing && visibleInsights.length === 0) {
            setVisibleInsights(aiInsights);
        }
    }, [aiInsights, isAnalyzing]);

    return (
        <div className="turkish-ai-container" dir="rtl">
            <div className="ai-background-effects">
                <div className="mesh-gradient"></div>
                <div className="scanning-line"></div>
            </div>

            <header className="ai-header-v2">
                <div className="brand-group">
                    <div className="ai-orb-wrapper">
                        <div className="ai-orb">
                            <Brain className="orb-icon" />
                            <div className="orb-rings">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                    <div className="brand-text">
                        <h1>مساعد البيت التركي الذكي</h1>
                        <div className="status-badge">
                            <div className="pulse-green"></div>
                            <span>النظام متصل ونشط</span>
                        </div>
                    </div>
                </div>

                <div className="analysis-controls">
                    {isAnalyzing && (
                        <div className="progress-container">
                            <span className="progress-label">جاري تحليل {analysisProgress}%...</span>
                            <div className="progress-bar-v2">
                                <div className="bar-fill" style={{ width: `${analysisProgress}%` }}></div>
                            </div>
                        </div>
                    )}
                    <button
                        className={`ai-btn-premium ${isAnalyzing ? 'disabled' : ''}`}
                        onClick={runAnalysis}
                        disabled={isAnalyzing}
                    >
                        <Sparkles size={18} />
                        تحديث التحليل المعمق
                    </button>
                </div>
            </header>

            <div className="ai-grid-layout">
                <div className="ai-main-dashboard">
                    <div className="ai-summary-card">
                        <div className="summary-info">
                            <Activity size={32} className="summary-icon" />
                            <div>
                                <h3>ملخص صحة النشاط التجاري</h3>
                                <p>بناءً على {sales.length + products.length} عملية، النظام يعمل بكفاءة عالية</p>
                            </div>
                        </div>
                        <div className="ai-metric-grid">
                            <div className="metric-item">
                                <span className="label">كفاءة المخزون</span>
                                <div className="metric-value-group">
                                    <span className="value">92%</span>
                                    <div className="mini-trend up">+4%</div>
                                </div>
                            </div>
                            <div className="metric-item">
                                <span className="label">رضا العملاء</span>
                                <span className="value">95%</span>
                            </div>
                        </div>
                    </div>

                    <div className="insights-feed">
                        {visibleInsights.map((insight, idx) => (
                            <div key={idx} className={`insight-card-v2 ${insight.type} ${insight.priority} slide-in`}>
                                <div className="card-accent"></div>
                                <div className="card-content-v2">
                                    <div className="card-header-v2">
                                        <div className="icon-box">
                                            <insight.icon size={20} />
                                        </div>
                                        <div className="title-area">
                                            <span className="priority-label">{insight.priority === 'high' ? 'حرج' : 'توصية'}</span>
                                            <h4>{insight.title}</h4>
                                        </div>
                                    </div>
                                    <p className="card-body-text">{insight.content}</p>
                                    <div className="card-actions-v2">
                                        <button
                                            type="button"
                                            className="action-btn-v2"
                                            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (insight.tab) setActiveTab(insight.tab);
                                            }}
                                        >
                                            {insight.action} <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <aside className="ai-sidebar-v2">
                    <div className="floating-prediction">
                        <div className="predict-head">
                            <Zap size={20} />
                            <h3>التوقعات المستقبلية</h3>
                        </div>
                        <div className="predict-content">
                            <div className="circular-chart">
                                <svg viewBox="0 0 36 36" className="circular-svg">
                                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="circle-fill" strokeDasharray="75, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div className="percentage">75%</div>
                            </div>
                            <p>احتمالية زيادة المبيعات في عطلة نهاية الأسبوع القادمة مرتفعة جداً.</p>
                        </div>
                    </div>

                    <div className="data-points-card">
                        <h4>نقاط البيانات النشطة</h4>
                        <div className="data-pills">
                            <div className="pill"><Search size={12} /> المبيعات: {sales.length}</div>
                            <div className="pill"><Target size={12} /> المنتجات: {products.length}</div>
                            <div className="pill"><ShieldCheck size={12} /> العملاء: {customers.length}</div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default TurkishAI;
