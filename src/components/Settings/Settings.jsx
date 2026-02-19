import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Store, Printer, Database, Bell, Shield, Save, RefreshCw, Image as ImageIcon, Upload, X as XIcon, MessageCircle, QrCode, CheckCircle2, Layers, Plus, Trash2, Lock, Unlock, Volume2 } from 'lucide-react';
import './Settings.css';
import Logo from '../Common/Logo';
import { supabase } from '../../supabaseClient';

const Settings = ({ settings, onSaveSettings, onBackup, onRestore, onResetData, onCloudSync }) => {
    // Local state for editing before final save
    const [localSettings, setLocalSettings] = useState({ ...settings });
    const [activeTab, setActiveTab] = useState('general');
    const [saved, setSaved] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [newExpenseCategory, setNewExpenseCategory] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const logoInputRef = useRef(null);
    const heroInputRef = useRef(null);
    const restoreInputRef = useRef(null);

    const handleSave = () => {
        if (onSaveSettings) {
            onSaveSettings(localSettings);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings({ ...localSettings, logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setLocalSettings({ ...localSettings, logo: null });
    };

    const addCategory = () => {
        const categories = localSettings.categories || [];
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            setLocalSettings({
                ...localSettings,
                categories: [...categories, newCategory.trim()]
            });
            setNewCategory('');
        }
    };

    const removeCategory = (cat) => {
        const categories = localSettings.categories || [];
        setLocalSettings({
            ...localSettings,
            categories: categories.filter(c => c !== cat)
        });
    };

    const addExpenseCategory = () => {
        const categories = localSettings.expenseCategories || [];
        if (newExpenseCategory.trim() && !categories.includes(newExpenseCategory.trim())) {
            setLocalSettings({
                ...localSettings,
                expenseCategories: [...categories, newExpenseCategory.trim()]
            });
            setNewExpenseCategory('');
        }
    };

    const removeExpenseCategory = (cat) => {
        const categories = localSettings.expenseCategories || [];
        setLocalSettings({
            ...localSettings,
            expenseCategories: categories.filter(c => c !== cat)
        });
    };

    const handleHeroUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        const newImages = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(filePath);

                newImages.push(publicUrl);
            }

            const currentImages = localSettings.heroImages || (localSettings.heroImage ? [localSettings.heroImage] : []);
            setLocalSettings({ ...localSettings, heroImages: [...currentImages, ...newImages] });

        } catch (error) {
            console.error('Error uploading hero images:', error);
            alert('فشل رفع الصور. يرجى التأكد من الاتصال بالإنترنت.');
        } finally {
            setIsUploading(false);
            // Reset input
            if (heroInputRef.current) heroInputRef.current.value = '';
        }
    };

    const removeHeroImage = (indexToRemove) => {
        const currentImages = localSettings.heroImages || [];
        setLocalSettings({
            ...localSettings,
            heroImages: currentImages.filter((_, index) => index !== indexToRemove)
        });
    };

    return (
        <div className="settings-container" dir="rtl">
            <header className="settings-header">
                <div className="header-title">
                    <SettingsIcon size={28} className="title-icon" />
                    <div>
                        <h1>إعدادات النظام</h1>
                        <p>تخصيص بيانات المتجر والطباعة والنسخ الاحتياطي</p>
                    </div>
                </div>
                <button className="save-settings-btn" onClick={handleSave}>
                    <Save size={18} />
                    حفظ التغييرات
                </button>
            </header>

            <div className="settings-content">
                <aside className="settings-nav">
                    <button className={`nav-item ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                        <Store size={20} /> بيانات المتجر
                    </button>
                    <button className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
                        <Layers size={20} /> التصنيفات
                    </button>
                    <button className={`nav-item ${activeTab === 'printer' ? 'active' : ''}`} onClick={() => setActiveTab('printer')}>
                        <Printer size={20} /> إعدادات الطابعة
                    </button>
                    <button className={`nav-item ${activeTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveTab('backup')}>
                        <Database size={20} /> النسخ الاحتياطي
                    </button>
                    <button className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                        <Bell size={20} /> التنبيهات
                    </button>
                    <button className={`nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <Shield size={20} /> الأمان والصلاحيات
                    </button>
                    <button className={`nav-item ${activeTab === 'online_store' ? 'active' : ''}`} onClick={() => setActiveTab('online_store')}>
                        <RefreshCw size={20} /> المتجر الإلكتروني
                    </button>
                </aside>

                <main className="settings-panel">
                    {activeTab === 'general' && (
                        <div className="settings-section">
                            <h3>البيانات الأساسية</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>اسم المتجر</label>
                                    <input type="text" value={localSettings.storeName} onChange={(e) => setLocalSettings({ ...localSettings, storeName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>رقم الهاتف</label>
                                    <input type="text" value={localSettings.phone} onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })} />
                                </div>
                                <div className="form-group full-width">
                                    <label>العنوان بالكامل</label>
                                    <input type="text" value={localSettings.address} onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>الرقم الضريبي (اختياري)</label>
                                    <input type="text" value={localSettings.taxId} onChange={(e) => setLocalSettings({ ...localSettings, taxId: e.target.value })} />
                                </div>
                                <div className="form-group logo-upload-group">
                                    <label>شعار المتجر (Logo)</label>
                                    <div className="logo-upload-container">
                                        {localSettings.logo ? (
                                            <div className="logo-preview-wrapper">
                                                <img src={localSettings.logo} alt="Store Logo" className="logo-preview" />
                                                <button className="remove-logo-btn" onClick={removeLogo}><XIcon size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="logo-preview-wrapper" style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', border: '1px dashed var(--border-color)', position: 'relative' }} onClick={() => logoInputRef.current.click()}>
                                                <Logo size={80} showText={false} color="#4B2C20" />
                                                <input type="file" ref={logoInputRef} accept="image/*" onChange={handleLogoUpload} hidden />
                                                <div style={{ position: 'absolute', bottom: '-20px', fontSize: '0.7rem', color: 'var(--text-muted)', width: '100%', textAlign: 'center' }}>انقر لتغيير الشعار</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <h3 className="mt-4">تخصيص الفاتورة</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>نص أعلى الفاتورة (Header)</label>
                                    <input type="text" value={localSettings.receiptHeader} onChange={(e) => setLocalSettings({ ...localSettings, receiptHeader: e.target.value })} />
                                </div>
                                <div className="form-group full-width">
                                    <label>نص أسفل الفاتورة (Footer)</label>
                                    <textarea value={localSettings.receiptFooter} onChange={(e) => setLocalSettings({ ...localSettings, receiptFooter: e.target.value })} />
                                </div>
                            </div>

                            <h3 className="mt-4">الباركود (QR Code) والتواصل</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>رقم الواتساب (للفاتورة)</label>
                                    <input type="text" placeholder="201012345678" value={localSettings.whatsapp} onChange={(e) => setLocalSettings({ ...localSettings, whatsapp: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>نوع الـ QR في الفاتورة</label>
                                    <select value={localSettings.qrType} onChange={(e) => setLocalSettings({ ...localSettings, qrType: e.target.value })}>
                                        <option value="whatsapp">رابط واتساب مباشر</option>
                                        <option value="order">رقم الفاتورة فقط</option>
                                        <option value="website">موقعي الإلكتروني</option>
                                    </select>
                                </div>
                                <div className="form-group full-width">
                                    <label>نص رسالة الواتساب التلقائية</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: استفسار عن فاتورة رقم {orderId}"
                                        value={localSettings.whatsappMsg}
                                        onChange={(e) => setLocalSettings({ ...localSettings, whatsappMsg: e.target.value })}
                                    />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>استخدم {'{orderId}'} ليتم استبداله برقم الفاتورة الحقيقي تلقائياً</span>
                                </div>

                                <div className="form-group toggle-group">
                                    <label>إظهار الـ QR في الفاتورة</label>
                                    <input type="checkbox" checked={localSettings.showQR} onChange={(e) => setLocalSettings({ ...localSettings, showQR: e.target.checked })} />
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div className="settings-section">
                            <h3>التصنيفات والفئات</h3>
                            <p className="section-desc">إدارة فئات المنتجات وبنود المصروفات.</p>

                            <div className="category-manager-section">
                                <h4>فئات المنتجات</h4>
                                <div className="category-manager">
                                    <div className="add-category-box">
                                        <input
                                            type="text"
                                            placeholder="اسم الفئة الجديدة... (مثل: منظفات)"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                                        />
                                        <button className="add-cat-btn" onClick={addCategory}>
                                            <Plus size={18} /> إضافة
                                        </button>
                                    </div>

                                    <div className="categories-list-grid">
                                        {(localSettings.categories || []).map((cat, index) => (
                                            <div key={index} className="category-item-card">
                                                <span>{cat}</span>
                                                <button className="delete-cat-btn" onClick={() => removeCategory(cat)}>
                                                    <XIcon size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="category-manager-section mt-6" style={{ marginTop: '32px', borderTop: '1px solid #eee', paddingTop: '24px' }}>
                                <h4>بنود المصروفات</h4>
                                <div className="category-manager">
                                    <div className="add-category-box">
                                        <input
                                            type="text"
                                            placeholder="بند مصروف جديد... (مثل: صيانة)"
                                            value={newExpenseCategory}
                                            onChange={(e) => setNewExpenseCategory(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addExpenseCategory()}
                                        />
                                        <button className="add-cat-btn" onClick={addExpenseCategory}>
                                            <Plus size={18} /> إضافة
                                        </button>
                                    </div>

                                    <div className="categories-list-grid">
                                        {(localSettings.expenseCategories || []).map((cat, index) => (
                                            <div key={index} className="category-item-card orange">
                                                <span>{cat}</span>
                                                <button className="delete-cat-btn" onClick={() => removeExpenseCategory(cat)}>
                                                    <XIcon size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'printer' && (
                        <div className="settings-section">
                            <h3>إعدادات طابعة الفواتير</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>الطابعة المتصلة</label>
                                    <select value={localSettings.printerName} onChange={(e) => setLocalSettings({ ...localSettings, printerName: e.target.value })}>
                                        <option value="XP-80">XP-80 Thermal Printer</option>
                                        <option value="PDF">حفظ كـ PDF</option>
                                    </select>
                                </div>
                                <div className="form-group toggle-group">
                                    <label>طباعة تلقائية بعد البيع</label>
                                    <input type="checkbox" checked={localSettings.autoPrint} onChange={(e) => setLocalSettings({ ...localSettings, autoPrint: e.target.checked })} />
                                </div>
                                <div className="form-group toggle-group">
                                    <label>إظهار اللوجو في الفاتورة</label>
                                    <input type="checkbox" checked={localSettings.showLogo} onChange={(e) => setLocalSettings({ ...localSettings, showLogo: e.target.checked })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="settings-section">
                            <h3>قواعد البيانات والنسخ الاحتياطي</h3>
                            <div className="backup-actions">
                                <div className="action-card" onClick={onBackup}>
                                    <Database size={32} />
                                    <h4>نسخة احتياطية الآن</h4>
                                    <p>حفظ نسخة من كافة البيانات (أصناف، عملاء، فواتير) في ملف خارجي.</p>
                                    <button className="backup-btn">بدء النسخ</button>
                                </div>
                                <div className="action-card warning" onClick={() => restoreInputRef.current.click()}>
                                    <RefreshCw size={32} />
                                    <h4>استعادة البيانات</h4>
                                    <input
                                        type="file"
                                        ref={restoreInputRef}
                                        onChange={handleFileRestore}
                                        accept=".json"
                                        hidden
                                    />
                                    <p>تحذير: هذا الإجراء سيقوم باستبدال البيانات الحالية بالملف المختار.</p>
                                    <button className="restore-btn">رفع ملف النسخة</button>
                                </div>
                                <div className="action-card danger" onClick={onResetData} style={{ borderColor: '#ef4444', backgroundColor: '#fef2f2' }}>
                                    <Trash2 size={32} color="#ef4444" />
                                    <h4 style={{ color: '#ef4444' }}>تهيئة البيانات (Test Mode)</h4>
                                    <p style={{ color: '#b91c1c' }}>حذف جميع المبيعات والعملاء والمصروفات مع <strong>الإبقاء على المنتجات</strong>.</p>
                                    <button className="reset-btn" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', marginTop: 'auto', cursor: 'pointer' }}>حذف البيانات</button>
                                </div>
                            </div>

                            <h3 className="mt-4">الجدولة التلقائية</h3>
                            <div className="form-group">
                                <label>تذكير بالنسخ الاحتياطي</label>
                                <select value={localSettings.backupFrequency} onChange={(e) => setLocalSettings({ ...localSettings, backupFrequency: e.target.value })}>
                                    <option value="daily">يومياً عند الإغلاق</option>
                                    <option value="weekly">أسبوعياً</option>
                                    <option value="manual">يدوياً فقط</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="settings-section">
                            <h3>نظام التنبيهات الذكي</h3>
                            <div className="form-grid">
                                <div className="form-group toggle-group">
                                    <label>تنبيهات نواقص المخزن</label>
                                    <input
                                        type="checkbox"
                                        checked={localSettings.lowStockAlert}
                                        onChange={(e) => setLocalSettings({ ...localSettings, lowStockAlert: e.target.checked })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>حد التنبيه الأدنى (الكمية)</label>
                                    <input
                                        type="number"
                                        value={localSettings.lowStockThreshold}
                                        onChange={(e) => setLocalSettings({ ...localSettings, lowStockThreshold: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group toggle-group">
                                    <label>تفعيل الأصوات في النظام</label>
                                    <input
                                        type="checkbox"
                                        checked={localSettings.enableSounds}
                                        onChange={(e) => setLocalSettings({ ...localSettings, enableSounds: e.target.checked })}
                                    />
                                </div>
                            </div>
                            <div className="info-box mt-4">
                                <Bell size={18} />
                                <span>ستظهر تنبيهات نواقص المخزن بشكل تلقائي في لوحة التحكم عند وصول أي صنف للحد المحدد.</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <h3>الأمان والصلاحيات</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>كلمة مرور المسؤول (Admin Password)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="اتركها فارغة لإلغاء القفل"
                                            value={localSettings.adminPassword}
                                            onChange={(e) => setLocalSettings({ ...localSettings, adminPassword: e.target.value })}
                                        />
                                        <button
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b' }}
                                        >
                                            {showPassword ? <Unlock size={16} /> : <Lock size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group toggle-group">
                                    <label>قفل الإعدادات بكلمة مرور</label>
                                    <input
                                        type="checkbox"
                                        checked={localSettings.lockSettings}
                                        onChange={(e) => setLocalSettings({ ...localSettings, lockSettings: e.target.checked })}
                                    />
                                </div>
                            </div>
                            <div className="danger-zone mt-4">
                                <h4>منطقة الخطر</h4>
                                <p>مسح كافة بيانات النظام والبدء من جديد (لا يمكن التراجع)</p>
                                <button className="clear-data-btn">مسح كافة البيانات</button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'online_store' && (
                        <div className="settings-section">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                <RefreshCw size={24} color="#4B2C20" />
                                <h3>إعدادات المتجر الإلكتروني (Cloud)</h3>
                            </div>
                            <p className="section-desc">إدارة ظهور منتجاتك للجمهور على الإنترنت وربطها بالسحابة.</p>

                            <div className="info-box" style={{ background: '#E3F2FD', border: '1px solid #2196F3', color: '#0D47A1', marginBottom: '30px' }}>
                                <Database size={20} />
                                <span>هذه الإعدادات تتحكم في الموقع الذي يراه الجمهور. يتم مزامنة البيانات تلقائياً مع سيرفرات الويب.</span>
                            </div>

                            <div className="form-grid">
                                <div className="form-group toggle-group" style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <label style={{ margin: 0 }}>الحالة المباشرة للموقع</label>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>إغلاق/فتح الموقع للجمهور مؤقتاً</p>
                                    </div>
                                    <input type="checkbox" checked={localSettings.isOnlineOpen} onChange={(e) => setLocalSettings({ ...localSettings, isOnlineOpen: e.target.checked })} />
                                </div>

                                <div className="form-group full-width">
                                    <label>صور العرض الرئيسية (Slider Images)</label>

                                    <div className="hero-images-manager" style={{ marginTop: '10px' }}>
                                        <div className="hero-images-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                                            {(localSettings.heroImages || (localSettings.heroImage ? [localSettings.heroImage] : [])).map((img, idx) => (
                                                <div key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '100px', border: '1px solid #eee' }}>
                                                    <img src={img} alt={`Hero ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button
                                                        onClick={() => removeHeroImage(idx)}
                                                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    >
                                                        <XIcon size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            <div
                                                onClick={() => heroInputRef.current.click()}
                                                style={{
                                                    height: '100px',
                                                    border: '2px dashed #cbd5e1',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    color: '#64748b',
                                                    backgroundColor: '#f8fafc'
                                                }}
                                            >
                                                {isUploading ? (
                                                    <RefreshCw size={24} className="spin" />
                                                ) : (
                                                    <>
                                                        <Plus size={24} />
                                                        <span style={{ fontSize: '0.8rem', marginTop: '5px' }}>إضافة صورة</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            ref={heroInputRef}
                                            onChange={handleHeroUpload}
                                            hidden
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', marginTop: '5px', color: '#64748b' }}>يمكنك رفع صور متعددة لتظهر بشكل متحرك (Slider) في واجهة المتجر.</p>
                                </div>

                                <div className="form-group">
                                    <label>تكلفة التوصيل الافتراضية</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" value={localSettings.shippingFee || 50} onChange={(e) => setLocalSettings({ ...localSettings, shippingFee: parseInt(e.target.value) })} />
                                        <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>ج.م</span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>توصيل مجاني عند شراء أكثر من</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" value={localSettings.freeShippingThreshold || 1000} onChange={(e) => setLocalSettings({ ...localSettings, freeShippingThreshold: parseInt(e.target.value) })} />
                                        <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>ج.م</span>
                                    </div>
                                </div>

                                <div className="form-group full-width" style={{ marginTop: '20px' }}>
                                    <label>رابط قاعدة البيانات السحابية (Vercel/Supabase)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            disabled
                                            placeholder="سيتم الربط تلقائياً عند تفعيل خطة الويب..."
                                            style={{ backgroundColor: '#f1f5f9', color: '#94a3b8' }}
                                        />
                                        <Lock size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', marginTop: '5px', color: '#64748b' }}>هذا الربط يضمن وصول العملاء لمنتجاتك من أي مكان في العالم.</p>
                                </div>
                            </div>

                            <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '15px', background: 'white' }}>
                                <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><RefreshCw size={18} /> مزامنة يدوية</h4>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>إذا قمت بتغيير بيانات كبيرة وتريد التأكد من تحديث الموقع فوراً، يمكنك الضغط على زر المزامنة.</p>
                                <button
                                    className="save-settings-btn"
                                    style={{ width: '100%', background: '#3b82f6', color: 'white' }}
                                    onClick={onCloudSync}
                                >
                                    <Upload size={18} /> رفع البيانات الحالية للسحاب
                                </button>
                            </div>

                            <div style={{ marginTop: '20px', padding: '20px', borderRadius: '15px', background: 'linear-gradient(135deg, #4B2C20 0%, #6d4130 100%)', color: 'white' }}>
                                <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><Shield size={20} /> حماية الخصوصية</h4>
                                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>إعدادات المتجر أونلاين والأسعار الخاصة بالويب لا تظهر إلا لك هنا في لوحة التحكم. لا يمكن للجمهور الوصول لهذه الصفحة.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {saved && (
                <div className="saved-notification">
                    <CheckCircle2 size={18} />
                    تم حفظ الإعدادات بنجاح
                </div>
            )}
        </div>
    );
};

export default Settings;
