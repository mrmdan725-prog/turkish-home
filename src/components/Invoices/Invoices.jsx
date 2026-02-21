import React, { useState } from 'react';
import { FileText, Search, Eye, Download, Printer, RefreshCcw, X, CheckCircle2 } from 'lucide-react';
import Barcode from 'react-barcode';
import './Invoices.css';

const Invoices = ({ sales, onReturn, settings }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnItems, setReturnItems] = useState([]);
    const [returnReason, setReturnReason] = useState('');

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

    const buildProfessionalInvoiceHTML = (invoice, isPDF = false) => {
        const title = isPDF ? `فاتورة ${invoice.orderId || invoice.id}` : `طباعة فاتورة ${invoice.orderId || invoice.id}`;
        const itemsList = invoice.items.map((item, idx) => `
            <tr style="${idx % 2 === 0 ? '' : 'background: #faf8f5;'}">
                <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 0.85rem;">${idx + 1}</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 0.85rem;">${item.name}</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 0.85rem;">${item.quantity}</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 0.85rem;">${item.price.toLocaleString()} ج.م</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 0.85rem;">${(item.price * item.quantity).toLocaleString()} ج.م</td>
            </tr>
        `).join('');

        return `<html dir='rtl'><head><title>${title}</title><style>
            @page { size: A4; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
            body { padding: 30px; color: #333; direction: rtl; }
            .inv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
            .inv-brand { display: flex; align-items: center; gap: 12px; }
            .inv-brand h2 { font-size: 1.4rem; color: #4B2C20; margin: 0; }
            .inv-brand span { font-size: 0.75rem; color: #888; display: block; }
            .inv-title { text-align: left; }
            .inv-title h1 { font-size: 2rem; color: #4B2C20; line-height: 1; margin: 0; }
            .inv-number { color: #D4AF37; font-weight: 800; font-size: 1rem; }
            .inv-divider { height: 3px; background: linear-gradient(to left, #4B2C20, #D4AF37); margin-bottom: 25px; border-radius: 2px; }
            .inv-meta { display: flex; justify-content: space-between; margin-bottom: 25px; }
            .inv-meta-block h4 { color: #4B2C20; margin-bottom: 8px; font-size: 0.9rem; }
            .inv-meta-block p { font-size: 0.85rem; margin-bottom: 4px; color: #555; }
            .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .inv-table th { background: #4B2C20; color: white; padding: 10px 14px; text-align: right; font-size: 0.85rem; }
            .inv-total-section { background: #4B2C20; color: white; border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; font-size: 1.3rem; font-weight: 800; }
            .grand-strong { color: #D4AF37; font-size: 1.5rem; }
            .inv-footer { text-align: center; padding-top: 25px; border-top: 2px dashed #ddd; margin-top: 10px; }
            @media print { body { padding: 15px; } }
        </style></head><body>
            <div class="inv-header">
                <div class="inv-brand">
                    ${LOGO_SVG}
                    <div><h2>البيت التركي</h2><span>للأدوات المنزلية والأنتيكات</span></div>
                </div>
                <div class="inv-title"><h1>فاتورة</h1><span class="inv-number">#${invoice.orderId || invoice.id}</span></div>
            </div>
            <div class="inv-divider"></div>
            <div class="inv-meta">
                <div><h4>تم إصدارها إلى:</h4><p>عميل نقدي / مبيعات معرض</p><p>تاريخ الفاتورة: ${formatDate(invoice.date)}</p></div>
                <div style="text-align:left;"><h4>تفاصيل الطلب:</h4><p>رقم العملية: ${invoice.id}</p><p>طريقة الدفع: ${invoice.paymentType === 'cash' ? 'نقدي' : 'فيزا / تحويل'}</p></div>
            </div>
            <table class="inv-table">
                <thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
                <tbody>${itemsList}</tbody>
            </table>
            <div class="inv-total-section"><span>الإجمالي الكلي</span><strong class="grand-strong">${invoice.total.toLocaleString()} ج.م</strong></div>
            <div class="inv-footer"><p>شكراً لتسوقكم من البيت التركي 🏠</p><span>هذه الفاتورة صادرة إلكترونياً ولا تحتاج إلى توقيع</span></div>
        </body></html>`;
    };

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

    const filteredSales = (sales || [])
        .filter(sale => sale.source !== 'online') // Hide raw web orders
        .filter(sale => {
            const orderIdStr = (sale.orderId || sale.id || '').toString();
            const dateStr = (sale.date || '').toString();
            return orderIdStr.includes(searchTerm) || dateStr.includes(searchTerm);
        });

    const openReturnModal = (sale) => {
        setSelectedInvoice(sale);
        setReturnItems(sale.items.map(item => ({ ...item, returnQty: 0 })));
        setShowReturnModal(true);
    };

    const updateReturnQty = (id, val) => {
        setReturnItems(prev => prev.map(item => {
            if (item.id === id) {
                const max = item.quantity;
                return { ...item, returnQty: Math.min(max, Math.max(0, parseInt(val) || 0)) };
            }
            return item;
        }));
    };

    const handleConfirmReturn = () => {
        const finalReturned = returnItems.filter(item => item.returnQty > 0);
        if (finalReturned.length === 0) {
            alert('برجاء تحديد الأصناف المراد إرجاعها');
            return;
        }

        if (onReturn) {
            onReturn(selectedInvoice.orderId, finalReturned.map(item => ({ id: item.id, quantity: item.returnQty })));
        }

        setShowReturnModal(false);
        setSelectedInvoice(null);
        alert('تمت عملية المرتجع وتحديث المخزن بنجاح');
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'refunded': return <span className="status-badge danger">مرتجع كامل</span>;
            case 'partially_refunded': return <span className="status-badge warning">مرتجع جزئي</span>;
            default: return <span className="status-badge success">مكتملة</span>;
        }
    };

    const getPaymentBadge = (type) => {
        if (type === 'credit') return <span className="payment-badge credit">آجل</span>;
        if (type === 'store') return <span className="payment-badge store">من المتجر</span>;
        return <span className="payment-badge cash">نقدي</span>;
    };

    return (
        <div className="invoices-container" dir="rtl">
            <header className="invoices-header">
                <div className="header-info">
                    <FileText size={28} className="title-icon" />
                    <div>
                        <h1>إدارة الفواتير</h1>
                        <p>سجل المبيعات وإصدار المرتجعات</p>
                    </div>
                </div>
            </header>

            <div className="invoices-content">
                <div className="invoices-list-section">
                    <div className="search-bar">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="بحث برقم الفاتورة أو التاريخ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="invoices-table-container">
                        <table className="invoices-table">
                            <thead>
                                <tr>
                                    <th>رقم الفاتورة</th>
                                    <th>التاريخ والوقت</th>
                                    <th>طريقة الدفع</th>
                                    <th>الحالة</th>
                                    <th>الإجمالي</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="empty-row">لا توجد فواتير مسجلة</td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale, index) => (
                                        <tr key={(sale.orderId || sale.id) || index}>
                                            <td>#{(sale.orderId || sale.id) || '---'}</td>
                                            <td>{formatDate(sale.date)}</td>
                                            <td>{getPaymentBadge(sale.paymentType)}</td>
                                            <td>{getStatusBadge(sale.status)}</td>
                                            <td className="amount-cell">{sale.total} ج.م</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="view-btn" onClick={() => setSelectedInvoice(sale)}>
                                                        <Eye size={16} />
                                                    </button>
                                                    {sale.status !== 'refunded' && (
                                                        <button className="return-btn-icon" onClick={() => openReturnModal(sale)} title="عمل مرتجع">
                                                            <RefreshCcw size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {selectedInvoice && !showReturnModal && (
                    <div className="invoice-detail-side">
                        <div className="detail-card">
                            <div className="detail-header">
                                <h3>تفاصيل الفاتورة #{(selectedInvoice.orderId || selectedInvoice.id)}</h3>
                                <button className="close-btn" onClick={() => setSelectedInvoice(null)}><X size={20} /></button>
                            </div>
                            <div className="detail-info">
                                <div className="info-row">
                                    <span>التاريخ:</span>
                                    <strong>{formatDate(selectedInvoice.date)}</strong>
                                </div>
                                <div className="info-row">
                                    <span>نوع الدفع:</span>
                                    <strong>{getPaymentBadge(selectedInvoice.paymentType)}</strong>
                                </div>
                                <div className="info-row">
                                    <span>الحالة:</span>
                                    <strong>{getStatusBadge(selectedInvoice.status)}</strong>
                                </div>
                            </div>

                            <div className="detail-items">
                                <h4>الأصناف المباعة</h4>
                                <div className="items-list">
                                    {selectedInvoice.items.map((item, idx) => (
                                        <div key={idx} className="invoice-item-row">
                                            <div className="item-main">
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-qty">الكمية: {item.quantity}</span>
                                            </div>
                                            <span className="item-subtotal">{item.price * item.quantity} ج.م</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="detail-footer">
                                <div className="total-line">
                                    <span>الإجمالي:</span>
                                    <strong>{selectedInvoice.total} ج.م</strong>
                                </div>
                                <div className="action-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', marginTop: '15px' }}>
                                    <button className="print-btn-standard" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '12px',
                                        background: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
                                    }} onClick={handlePrint}>
                                        <Printer size={18} /> طباعة عادية
                                    </button>
                                    <button className="print-btn-secondary" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        padding: '10px',
                                        background: '#1e293b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }} onClick={() => {
                                        const win = window.open('', '_blank');
                                        win.document.write(buildProfessionalInvoiceHTML(selectedInvoice, false));
                                        win.document.close();
                                        win.print();
                                    }}>
                                        <Printer size={16} /> طباعة احترافية
                                    </button>
                                    <button className="download-btn-pdf" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        padding: '10px',
                                        background: '#D4AF37',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }} onClick={() => {
                                        const win = window.open('', '_blank');
                                        win.document.write(buildProfessionalInvoiceHTML(selectedInvoice, true));
                                        win.document.close();
                                        setTimeout(() => win.print(), 300);
                                    }}>
                                        <Download size={16} /> تحميل PDF
                                    </button>
                                </div>
                                {selectedInvoice.status !== 'refunded' && (
                                    <button className="return-action-btn" onClick={() => openReturnModal(selectedInvoice)} style={{ width: '100%', marginTop: '10px', borderRadius: '10px', fontWeight: '700' }}>
                                        <RefreshCcw size={16} /> عمل مرتجع
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden Thermal Receipt for Printing from History */}
            {selectedInvoice && (
                <div className="thermal-receipt" id="thermal-print-area" style={{ display: 'none' }}>
                    <div className="receipt-header">
                        {settings.showLogo && settings.logo && (
                            <div className="receipt-logo-container">
                                <img src={settings.logo} alt="Logo" className="receipt-logo" />
                            </div>
                        )}
                        <h1 className="store-name">{settings.storeName}</h1>
                        <p className="store-desc">{settings.receiptHeader}</p>
                        <p className="store-address">العنوان: {settings.address}</p>
                        <p className="store-phone">ت: {settings.phone}</p>
                    </div>
                    <div className="divider">***************************</div>
                    <div className="receipt-info">
                        <p>رقم الفاتورة: #{(selectedInvoice.orderId || selectedInvoice.id)}</p>
                        <p>التاريخ: {formatDate(selectedInvoice.date)}</p>
                    </div>
                    <div className="divider">---------------------------</div>
                    <table className="receipt-table">
                        <thead>
                            <tr>
                                <th>الصنف</th>
                                <th>ق</th>
                                <th>سعر</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedInvoice.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.price * item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="divider">---------------------------</div>
                    <div className="receipt-total">
                        <span>إجمالي الفاتورة:</span>
                        <span>{selectedInvoice.total} ج.م</span>
                    </div>
                    <div className="divider">***************************</div>
                    <div className="receipt-footer">
                        <p>{settings.receiptFooter}</p>
                        <div className="receipt-barcode">
                            <Barcode value={`OR${selectedInvoice.orderId}`} width={1.2} height={30} fontSize={10} />
                        </div>
                        {settings.showQR && (
                            <div className="receipt-qr">
                                <p className="qr-label">{settings.qrType === 'whatsapp' ? 'راسلنا على واتساب' : 'امسح للتحقق'}</p>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                        settings.qrType === 'whatsapp'
                                            ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(settings.whatsappMsg.replace('{orderId}', selectedInvoice.orderId))}`
                                            : settings.qrType === 'website'
                                                ? 'https://turkish-home.com'
                                                : selectedInvoice.orderId.toString()
                                    )}`}
                                    alt="QR Code"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* Return Modal */}
            {showReturnModal && (
                <div className="modal-overlay">
                    <div className="return-modal">
                        <div className="modal-header">
                            <h3>إجراء مرتجع مبيعات - فاتورة #{selectedInvoice.orderId}</h3>
                            <button onClick={() => setShowReturnModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="hint-text">اختر الكمية المراد إرجاعها لكل صنف:</p>
                            <div className="return-items-list">
                                {returnItems.map(item => (
                                    <div key={item.id} className="return-item-row">
                                        <div className="item-info">
                                            <span className="name">{item.name}</span>
                                            <span className="max-qty">المباع: {item.quantity} قطعة</span>
                                        </div>
                                        <div className="qty-input-group">
                                            <label>كمية المرتجع:</label>
                                            <input
                                                type="number"
                                                value={item.returnQty}
                                                onChange={(e) => updateReturnQty(item.id, e.target.value)}
                                                min="0"
                                                max={item.quantity}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="reason-group">
                                <label>سبب المرتجع:</label>
                                <textarea
                                    placeholder="اكتب سبب المرتجع هنا..."
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowReturnModal(false)}>إلغاء</button>
                            <button className="confirm-return-btn" onClick={handleConfirmReturn}>
                                <CheckCircle2 size={18} />
                                تأكيد المرتجع وإرجاع للمخزن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #thermal-print-area, #thermal-print-area * {
                            visibility: visible;
                        }
                        #thermal-print-area {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 80mm;
                            padding: 5mm;
                            background: white;
                            display: block !important;
                        }
                        .receipt-logo-container {
                            text-align: center;
                            margin-bottom: 10px;
                        }
                        .receipt-logo {
                            max-width: 40mm;
                            max-height: 20mm;
                            object-fit: contain;
                            filter: grayscale(1);
                        }
                        .receipt-qr {
                            text-align: center;
                            margin-top: 10px;
                        }
                        .receipt-qr img {
                            width: 25mm;
                            height: 25mm;
                        }
                        .qr-label {
                            font-size: 8pt;
                            margin-bottom: 2px;
                        }
                    }

                `}
            </style>
        </div>
    );
};

export default Invoices;
