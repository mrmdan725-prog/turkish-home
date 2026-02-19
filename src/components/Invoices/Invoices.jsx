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

    const filteredSales = (sales || []).filter(sale => {
        const orderIdStr = (sale.orderId || '').toString();
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
                                        <tr key={sale.orderId || index}>
                                            <td>#{sale.orderId || '---'}</td>
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
                                <h3>تفاصيل الفاتورة #{selectedInvoice.orderId}</h3>
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
                                <div className="action-row">
                                    <button className="print-btn-secondary" onClick={handlePrint}><Printer size={16} /> طباعة</button>
                                    {selectedInvoice.status !== 'refunded' && (
                                        <button className="return-action-btn" onClick={() => openReturnModal(selectedInvoice)}>
                                            <RefreshCcw size={16} /> مرتجع
                                        </button>
                                    )}
                                </div>
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
                        <p>رقم الفاتورة: #{selectedInvoice.orderId}</p>
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
