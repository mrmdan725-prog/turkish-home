import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Printer, ShoppingCart, ArrowDownToLine, Filter, Tag, CheckCircle2, MoreVertical, Edit2, Trash2, History, TrendingUp, AlertTriangle, Layers, X, Save, DollarSign, Brain, Sparkles, Image as ImageIcon, RefreshCw } from 'lucide-react';
import Barcode from 'react-barcode';
import './Inventory.css';

const Inventory = ({ products, setProducts, settings, purchases = [], setPurchases }) => {
    const [view, setView] = useState('stock'); // 'stock', 'po', 'history'
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('الكل');

    const [printBarcode, setPrintBarcode] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [menuOpenFor, setMenuOpenFor] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    // AI Image Gen State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [generatedPreviews, setGeneratedPreviews] = useState([]);
    const [selectedPreview, setSelectedPreview] = useState(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.more-menu-container')) {
                setMenuOpenFor(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Statistics
    const lowStockItems = products.filter(p => p.stock <= p.minStock);
    const totalItems = products.length;
    const totalInventoryValue = products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);
    const totalRetailValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    const categoriesList = ['الكل', ...(settings?.categories || [])];

    // Purchase Order state
    const [poItems, setPoItems] = useState([]);
    const [supplier, setSupplier] = useState('');
    const [tempItem, setTempItem] = useState({ name: '', quantity: 1, costPrice: 0, salePrice: 0, category: settings.categories[0] });

    const addToPo = () => {
        if (!tempItem.name || tempItem.quantity <= 0) return;
        setPoItems([...poItems, { ...tempItem, id: Date.now() }]);
        setTempItem({ name: '', quantity: 1, costPrice: 0, salePrice: 0, category: settings.categories[0] });
    };

    const removeFromPo = (id) => {
        setPoItems(poItems.filter(item => item.id !== id));
    };

    const confirmPurchaseOrder = () => {
        const newProducts = [...products];
        let totalOrderCost = 0;

        poItems.forEach(item => {
            const cost = parseFloat(item.costPrice || 0);
            const qty = parseInt(item.quantity || 0);
            totalOrderCost += (cost * qty);

            const existingIdx = newProducts.findIndex(p => p.name.toLowerCase() === item.name.toLowerCase());
            if (existingIdx > -1) {
                newProducts[existingIdx].stock += qty;
                newProducts[existingIdx].price = parseFloat(item.salePrice) || newProducts[existingIdx].price;
                newProducts[existingIdx].costPrice = cost || newProducts[existingIdx].costPrice;
            } else {
                newProducts.push({
                    id: Math.floor(Date.now() + Math.random()),
                    name: item.name,
                    price: parseFloat(item.salePrice) || 0,
                    costPrice: cost,
                    stock: qty,
                    minStock: 5,
                    barcode: (Math.floor(Math.random() * 9000000000000) + 1000000000000).toString(),
                    category: item.category || 'عام',
                    showOnline: true // Default to true
                });
            }
        });

        // Generate Sequential ID
        const existingSerials = purchases
            .map(p => p.id)
            .filter(id => typeof id === 'number' && id < 1000000000); // Filter out timestamps

        const nextId = existingSerials.length > 0 ? Math.max(...existingSerials) + 1 : 1;

        // Record the Purchase (Toreedat)
        const purchaseRecord = {
            id: nextId,
            date: new Date().toISOString(),
            total: totalOrderCost,
            supplier: supplier || 'مورد عام',
            itemsCount: poItems.length,
            items: poItems // Save the items details
        };

        if (setPurchases) {
            setPurchases(prev => [purchaseRecord, ...prev]);
        }

        // 4. Supabase Sync Logic added here
        const isCloudEnabled = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL';
        if (isCloudEnabled) {
            const syncToCloud = async () => {
                try {
                    const { supabase } = await import('../../supabaseClient');
                    // Upsert products that were added or updated
                    const syncPromises = poItems.map(item => {
                        const product = newProducts.find(p => p.name.toLowerCase() === item.name.toLowerCase());
                        if (!product) return null;

                        return supabase.from('products').upsert({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            cost_price: product.costPrice || 0,
                            stock: product.stock || 0,
                            min_stock: product.minStock || 5,
                            barcode: product.barcode || '',
                            category: product.category || 'عام',
                            image: product.image || '',
                            show_online: !!product.showOnline
                        });
                    });
                    await Promise.all(syncPromises.filter(Boolean));
                    console.log("PO products synced to cloud");
                } catch (err) {
                    console.error("Cloud sync failed for PO:", err);
                }
            };
            syncToCloud();
        }

        setProducts(newProducts);
        setPoItems([]);
        setSupplier('');
        setView('stock');
    };

    const handleAiScan = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);

        // Simulate AI Processing (OCR)
        setTimeout(() => {
            const extractedItems = [
                { id: Date.now() + 1, name: "بطاريات بروتيك", quantity: 45, costPrice: 1250, salePrice: 0, category: "بطاريات" },
                { id: Date.now() + 2, name: "الواح رصاص", quantity: 36, costPrice: 200, salePrice: 0, category: "معادن" },
                { id: Date.now() + 3, name: "الواح نحاس احمر", quantity: 15, costPrice: 240, salePrice: 0, category: "معادن" },
                { id: Date.now() + 4, name: "مواسير نحاس اصفر", quantity: 23, costPrice: 136, salePrice: 0, category: "معادن" },
                { id: Date.now() + 5, name: "انبوب نحاس مطلي بالبلاستيك", quantity: 23, costPrice: 58, salePrice: 0, category: "معادن" }
            ];

            setSupplier("ميار للحبوب والصناعات الغذائية");
            setPoItems(prev => [...prev, ...extractedItems]);
            setIsScanning(false);
            alert('تم استخراج البيانات بنجاح! يرجى مراجعة الكميات وتحديد أسعار البيع.');
        }, 3000);
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        const updatedProducts = products.map(p =>
            p.id === editingProduct.id ? editingProduct : p
        );
        setProducts(updatedProducts);

        // Supabase Sync
        if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
            try {
                const { supabase } = await import('../../supabaseClient');
                const productData = {
                    id: editingProduct.id,
                    name: editingProduct.name,
                    price: editingProduct.price,
                    cost_price: editingProduct.costPrice || 0,
                    stock: editingProduct.stock || 0,
                    min_stock: editingProduct.minStock || 5,
                    barcode: editingProduct.barcode || '',
                    category: editingProduct.category || 'عام',
                    image: editingProduct.image || '',
                    gallery: editingProduct.gallery || [], // Support for multiple images
                    show_online: !!editingProduct.showOnline, // Consistent with App.jsx
                    online_price: editingProduct.onlinePrice || null,
                    long_description: editingProduct.longDescription || ''
                };
                const { error } = await supabase.from('products').upsert(productData);
                if (error) throw error;
            } catch (err) {
                console.error("Supabase update failed:", err);
                alert('فشل تحديث البيانات في السحاب. يرجى التأكد من تنفيذ أكواد SQL المطلوبة في Supabase (عمود gallery).');
            }
        }

        setEditingProduct(null);
    };

    const handleUploadImage = async (file) => {
        if (!file) return null;
        try {
            const { supabase } = await import('../../supabaseClient');

            // Increased limit to 20MB for better compatibility with high-res phone photos
            if (file.size > 20 * 1024 * 1024) {
                console.error("File exceeds 20MB limit:", file.name);
                alert(`الملف "${file.name}" كبير جداً. الحد الأقصى 20 ميجابايت.`);
                return null;
            }

            const fileExt = file.name.split('.').pop().toLowerCase() || 'jpg';
            const randomString = Math.random().toString(36).substring(2, 7);
            const sanitizedName = file.name.replace(/[^a-z0-9]/gi, '_').substring(0, 15);
            const fileName = `${Date.now()}-${randomString}-${sanitizedName}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Supabase upload error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err) {
            console.error('Upload error for', file.name, ':', err);
            alert(`خطأ أثناء رفع "${file.name}": ${err.message || 'فشل الاتصال'}`);
            return null;
        }
    };

    const [imageSource, setImageSource] = useState('search'); // 'search' or 'ai'
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(''); // "Uploading 1/3..."

    const handleAiGenerate = async () => {
        if (!aiPrompt) return;
        setIsAiGenerating(true);
        setGeneratedPreviews([]); // Reset
        setSelectedPreview(null);

        if (imageSource === 'search') {
            try {
                const query = encodeURIComponent(aiPrompt);
                let urls = [];
                const timestamp = Date.now();

                // Try Lexica API first
                try {
                    const lexRes = await fetch(`https://lexica.art/api/v1/search?q=${query}`);
                    if (lexRes.ok) {
                        const lexData = await lexRes.json();
                        if (lexData.images && lexData.images.length > 0) {
                            lexData.images.slice(0, 15).forEach((img, i) => {
                                if (img.src && img.src.startsWith('http')) {
                                    urls.push({
                                        id: `lex-${timestamp}-${i}`,
                                        url: `https://corsproxy.io/?${encodeURIComponent(img.src)}`,
                                        originalUrl: img.src,
                                        file: null,
                                        isBlob: false
                                    });
                                }
                            });
                        }
                    }
                } catch (le) { console.warn("Lexica search failed", le); }

                // Fallback to Bing
                if (urls.length < 5) {
                    const url = `https://www.bing.com/images/search?q=${query}&first=1&count=20&qft=+filterui:imagesize-large`;
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                    const response = await fetch(proxyUrl);
                    if (response.ok) {
                        const data = await response.json();
                        const html = data.contents;
                        const patterns = [
                            /murl&quot;:&quot;(.*?)&quot;/g,
                            /&quot;murl&quot;:&quot;(.*?)&quot;/g,
                            /"murl":"(.*?)"/g
                        ];
                        patterns.forEach(regex => {
                            let match;
                            while ((match = regex.exec(html)) !== null && urls.length < 40) {
                                let imgUrl = match[1];
                                if (imgUrl && imgUrl.startsWith('http') && !urls.some(u => u.originalUrl === imgUrl)) {
                                    urls.push({
                                        id: `bing-${timestamp}-${urls.length}`,
                                        url: `https://corsproxy.io/?${encodeURIComponent(imgUrl)}`,
                                        originalUrl: imgUrl,
                                        file: null,
                                        isBlob: false
                                    });
                                }
                            }
                        });
                    }
                }

                if (urls.length > 0) {
                    setGeneratedPreviews(urls);
                    setSelectedPreview(urls[0]);
                } else {
                    throw new Error("No images found");
                }
            } catch (err) {
                console.error("Search Error:", err);
                alert('فشل البحث التقني التلقائي.');
            } finally {
                setIsAiGenerating(false);
            }
            return;
        }

        try {
            let finalPrompt = aiPrompt;
            const isArabic = /[\u0600-\u06FF]/.test(aiPrompt);
            if (isArabic) {
                try {
                    const translationUrl = `https://text.pollinations.ai/Translate this to English: ${encodeURIComponent(aiPrompt)}`;
                    const transRes = await fetch(translationUrl);
                    if (transRes.ok) {
                        const text = await transRes.text();
                        if (text && text.length > 2) finalPrompt = text;
                    }
                } catch (e) { console.warn("Translation skipped:", e); }
            }

            const safePrompt = finalPrompt.length > 300 ? finalPrompt.substring(0, 300) : finalPrompt;
            const enhancedPrompt = `professional product photography of ${safePrompt}, commercial catalog shot, studio lighting, 8k resolution, white background`;
            const paddedPrompt = encodeURIComponent(enhancedPrompt);
            const seeds = Array.from({ length: 4 }, () => Math.floor(Math.random() * 1000000));
            const delay = ms => new Promise(res => setTimeout(res, ms));

            const promises = seeds.map(async (seed, i) => {
                const cacheBust = Date.now();
                const imageUrl = `https://image.pollinations.ai/prompt/${paddedPrompt}?seed=${seed}&nologo=true&model=turbo&t=${cacheBust}`;
                let attempts = 0;
                while (attempts < 3) {
                    try {
                        await delay(500 + (seed % 500));
                        const res = await fetch(imageUrl);
                        if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
                        const blob = await res.blob();
                        const file = new File([blob], `ai-gen-${seed}.jpg`, { type: "image/jpeg" });
                        const objectUrl = URL.createObjectURL(blob);
                        return { id: `ai-${seed}-${i}`, url: objectUrl, originalUrl: imageUrl, file, isBlob: true };
                    } catch (e) {
                        attempts++;
                        if (attempts >= 3) return { id: `ai-${seed}-${i}`, url: imageUrl, originalUrl: imageUrl, file: null, isBlob: false };
                        await delay(1500);
                    }
                }
            });

            const results = await Promise.allSettled(promises);
            const successfulPreviews = results.filter(r => r.status === 'fulfilled').map(r => r.value);
            if (successfulPreviews.length > 0) {
                setGeneratedPreviews(successfulPreviews);
                setSelectedPreview(successfulPreviews[0]);
            } else throw new Error("All image generations failed.");
        } catch (err) {
            console.error("AI Gen Error:", err);
            alert('حدث خطأ أثناء التوليد.');
        } finally {
            setIsAiGenerating(false);
        }
    };

    const saveAiImage = async () => {
        if (!selectedPreview) return;
        setIsAiGenerating(true);
        let finalImageUrl = selectedPreview.originalUrl || selectedPreview.url;
        let fileToUpload = selectedPreview.file;

        if (!fileToUpload && !selectedPreview.isBlob && finalImageUrl.startsWith('http')) {
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(finalImageUrl)}`;
                const imgRes = await fetch(proxyUrl);
                if (imgRes.ok) {
                    const blob = await imgRes.blob();
                    fileToUpload = new File([blob], `product-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
                }
            } catch (e) { console.warn("Failed to proxy image for upload:", e); }
        }

        if (fileToUpload) {
            const uploadedUrl = await handleUploadImage(fileToUpload);
            if (uploadedUrl) finalImageUrl = uploadedUrl;
        }

        if (finalImageUrl) {
            const currentGallery = Array.isArray(editingProduct.gallery) ? [...editingProduct.gallery] : [];
            if (!editingProduct.image) setEditingProduct({ ...editingProduct, image: finalImageUrl });
            else setEditingProduct({ ...editingProduct, gallery: [...currentGallery, finalImageUrl] });
            setShowAiModal(false);
            setGeneratedPreviews([]);
            setSelectedPreview(null);
            setAiPrompt('');
        }
        setIsAiGenerating(false);
    };

    const handleDeleteProduct = (productId) => {
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        setShowDeleteConfirm(null);
        setMenuOpenFor(null);
    };

    const copyBarcode = (code) => {
        navigator.clipboard.writeText(code);
        setMenuOpenFor(null);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
        const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
        const matchesLowStock = !filterLowStock || p.stock <= p.minStock;
        return matchesSearch && matchesCategory && matchesLowStock;
    });

    return (
        <div className="inventory-container" dir="rtl">
            <header className="inventory-header">
                <div className="header-title">
                    <div className="title-icon-wrapper"><Package size={24} /></div>
                    <div>
                        <h1>إدارة المخزن</h1>
                        <p>تتبع المنتجات والمخزون وحركة التوريد</p>
                    </div>
                </div>
                <div className="header-navigation">
                    <button className={`nav-tab ${view === 'stock' ? 'active' : ''}`} onClick={() => setView('stock')}><Package size={18} /> جرد المخزن</button>
                    <button className={`nav-tab ${view === 'po' ? 'active' : ''}`} onClick={() => setView('po')}><Plus size={18} /> طلب توريد جديد</button>
                </div>
            </header>

            <div className="inventory-main-content">
                {view === 'stock' && (
                    <div className="stock-view-layout">
                        <div className="inventory-dashboard">
                            <div className="stat-card blue"><div className="stat-icon"><Package size={24} /></div><div className="stat-value"><h3>{totalItems}</h3><span>إجمالي الأصناف</span></div></div>
                            <div className="stat-card red" onClick={() => setFilterLowStock(!filterLowStock)}><div className="stat-icon"><AlertTriangle size={24} /></div><div className="stat-value"><h3>{lowStockItems.length}</h3><span>نواقص المخزن</span></div>{lowStockItems.length > 0 && <div className="pulse-dot"></div>}</div>
                            <div className="stat-card green"><div className="stat-icon"><TrendingUp size={24} /></div><div className="stat-value"><h3>{totalInventoryValue.toLocaleString()} <small>ج.م</small></h3><span>قيمة البضاعة (جملة)</span></div></div>
                            <div className="stat-card gold"><div className="stat-icon"><DollarSign size={24} /></div><div className="stat-value"><h3>{totalRetailValue.toLocaleString()} <small>ج.م</small></h3><span>القيمة البيعية (قطاعي)</span></div></div>
                        </div>

                        <div className="inventory-controls">
                            <div className="search-group">
                                <Search size={20} className="search-icon" />
                                <input type="text" placeholder="ابحث بالاسم أو الباركود..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="filter-group">
                                <div className="category-chips">
                                    {categoriesList.map(cat => (
                                        <button key={cat} className={`chip ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>
                                            {selectedCategory === cat && <CheckCircle2 size={14} />}
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <button className={`filter-btn ${filterLowStock ? 'active' : ''}`} onClick={() => setFilterLowStock(!filterLowStock)}><Filter size={20} /></button>
                            </div>
                        </div>

                        <div className="inventory-table-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>المنتج</th><th>الفئة</th><th>الباركود</th><th>الكمية</th><th>سعر الجملة</th><th>سعر البيع</th><th style={{ textAlign: 'center' }}>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(product => (
                                        <tr key={product.id} className={product.stock <= product.minStock ? 'row-warning' : ''}>
                                            <td>
                                                <div className="item-info-cell">
                                                    {product.image ? (
                                                        <img src={product.image} alt={product.name} className="item-img-thumb" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', background: '#f5f5f5' }} />
                                                    ) : (
                                                        <div className="item-img-placeholder">{product.name[0]}</div>
                                                    )}
                                                    <div className="item-text">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="name">{product.name}</span>
                                                            {product.showOnline && <RefreshCw size={12} color="#3b82f6" title="معروض أونلاين" />}
                                                        </div>
                                                        <span className="id">رقم: #{product.id.toString().slice(-4)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="cat-badge">{product.category || 'عام'}</span></td>
                                            <td><span className="barcode-span" title="انقر لطباعة الباركود" onClick={() => setPrintBarcode(product)}>{product.barcode}</span></td>
                                            <td>
                                                <div className="stock-indicator">
                                                    <strong>{product.stock}</strong>
                                                    <div className="stock-bar"><div className="bar-fill" style={{ width: `${Math.min((product.stock / 20) * 100, 100)}%`, backgroundColor: product.stock <= product.minStock ? '#ef4444' : '#10b981' }}></div></div>
                                                </div>
                                            </td>
                                            <td><span className="price-tag cost">{(product.costPrice || 0).toLocaleString()} ج.م</span></td>
                                            <td><span className="price-tag retail">{product.price.toLocaleString()} ج.م</span></td>
                                            <td className="actions-cell">
                                                <div className="action-buttons">
                                                    <button className="icon-action edit" onClick={() => setEditingProduct(product)}><Edit2 size={16} /></button>
                                                    <button className="icon-action print" onClick={() => setPrintBarcode(product)}><Printer size={16} /></button>
                                                    <div className="more-menu-container">
                                                        <button className={`icon-action more ${menuOpenFor === product.id ? 'active' : ''}`} onClick={() => setMenuOpenFor(menuOpenFor === product.id ? null : product.id)}><MoreVertical size={16} /></button>
                                                        {menuOpenFor === product.id && (
                                                            <div className="more-dropdown">
                                                                <button onClick={() => { setEditingProduct(product); setMenuOpenFor(null); }}><Edit2 size={14} /> تعديل المنتج</button>
                                                                <button onClick={() => copyBarcode(product.barcode)}><Tag size={14} /> نسخ الباركود</button>
                                                                <button onClick={() => { setPrintBarcode(product); setMenuOpenFor(null); }}><Printer size={14} /> طباعة الباركود</button>
                                                                <div className="divider"></div>
                                                                <button className="delete-action" onClick={() => setShowDeleteConfirm(product)}><Trash2 size={14} /> حذف الصنف</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {view === 'po' && (
                    <div className="po-view-layout">
                        <div className="po-container">
                            <div className="po-header-section">
                                <div className="title-group-v2">
                                    <h2><Plus size={24} /> طلب توريد بضاعة</h2>
                                    <div className="ai-import-action"><label className="ai-scan-label"><input type="file" accept="image/*" onChange={handleAiScan} style={{ display: 'none' }} /><div className="ai-scan-btn-modern"><Brain size={18} /><span>مسح الفاتورة بالذكاء الاصطناعي</span><Sparkles size={14} className="sparkle" /></div></label></div>
                                </div>
                                <div className="supplier-input"><label>اسم المورد / الشركة</label><input type="text" placeholder="مثال: شركة النور للاستيراد" value={supplier} onChange={(e) => setSupplier(e.target.value)} /></div>
                            </div>
                            <div className="po-input-grid">
                                <div className="input-field main"><label>اسم الصنف</label><input type="text" placeholder="ابحث أو أضف اسم جديد..." value={tempItem.name} onChange={(e) => setTempItem({ ...tempItem, name: e.target.value })} /></div>
                                <div className="input-field small"><label>الكمية</label><input type="number" value={tempItem.quantity} onChange={(e) => setTempItem({ ...tempItem, quantity: e.target.value })} /></div>
                                <div className="input-field small"><label>سعر التكلفة</label><input type="number" value={tempItem.costPrice} onChange={(e) => setTempItem({ ...tempItem, costPrice: e.target.value })} /></div>
                                <div className="input-field small"><label>سعر البيع</label><input type="number" value={tempItem.salePrice} onChange={(e) => setTempItem({ ...tempItem, salePrice: e.target.value })} /></div>
                                <div className="input-field small"><label>الفئة</label><select value={tempItem.category} onChange={(e) => setTempItem({ ...tempItem, category: e.target.value })} style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0 8px' }}>{(settings?.categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                                <button className="add-to-po-list" onClick={addToPo}><Plus size={20} /> إضافة القائمة</button>
                            </div>
                            <div className="po-list-section">
                                <h3>قائمة التوريد الحالية ({poItems.length} أصناف)</h3>
                                <table className="po-table">
                                    <thead><tr><th>الصنف</th><th>الفئة</th><th>الكمية</th><th>سعر التكلفة</th><th>سعر البيع</th><th>الإجمالي</th><th></th></tr></thead>
                                    <tbody>
                                        {poItems.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td><select className="inner-table-input select" value={item.category || settings.categories[0]} onChange={(e) => setPoItems(prev => prev.map(i => i.id === item.id ? { ...i, category: e.target.value } : i))}>{(settings?.categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></td>
                                                <td>{item.quantity}</td><td>{item.costPrice} ج.م</td>
                                                <td><input type="number" className="inner-table-input" value={item.salePrice} onChange={(e) => setPoItems(prev => prev.map(i => i.id === item.id ? { ...i, salePrice: e.target.value } : i))} /></td>
                                                <td>
                                                    <div className="po-total-cell">
                                                        <span className="amount">{(item.costPrice * item.quantity).toLocaleString()}</span>
                                                        <small className="currency">ج.م</small>
                                                    </div>
                                                </td>
                                                <td><button className="remove-item" onClick={() => removeFromPo(item.id)}><Trash2 size={16} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="po-summary-footer"><div className="po-totals"><span>إجمالي الفاتورة:</span><strong>{poItems.reduce((s, i) => s + (i.costPrice * i.quantity), 0).toLocaleString()} ج.م</strong></div><button className="confirm-po-btn" onClick={confirmPurchaseOrder} disabled={poItems.length === 0}><ArrowDownToLine size={20} /> تأكيد استلام البضاعة</button></div>
                        </div>
                    </div>
                )}
            </div>

            {editingProduct && (
                <div className="modal-overlay">
                    <div className="modern-modal">
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><Edit2 size={20} /><h3>تعديل بيانات المنتج</h3></div>
                            <div className="modal-tab-group" style={{ display: 'flex', gap: '10px', background: '#F4F7FE', padding: '5px', borderRadius: '10px' }}>
                                <button type="button" onClick={() => setEditingProduct({ ...editingProduct, _edit_tab: 'main' })} style={{ padding: '8px 15px', borderRadius: '8px', background: (!editingProduct._edit_tab || editingProduct._edit_tab === 'main') ? 'white' : 'transparent' }}>البيانات الأساسية</button>
                                <button type="button" onClick={() => setEditingProduct({ ...editingProduct, _edit_tab: 'online' })} style={{ padding: '8px 15px', borderRadius: '8px', background: editingProduct._edit_tab === 'online' ? 'white' : 'transparent' }}>المتجر أونلاين</button>
                            </div>
                            <button onClick={() => setEditingProduct(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateProduct}>
                            <div className="modal-body">
                                {(!editingProduct._edit_tab || editingProduct._edit_tab === 'main') ? (
                                    <>
                                        <div className="form-group-modern"><label>اسم المنتج</label><input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} /></div>
                                        <div className="form-grid-2">
                                            <div className="form-group-modern"><label>سعر التكلفة</label><input type="number" value={editingProduct.costPrice || 0} onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) })} /></div>
                                            <div className="form-group-modern"><label>سعر البيع</label><input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })} /></div>
                                        </div>
                                        <div className="form-grid-2">
                                            <div className="form-group-modern"><label>الكمية</label><input type="number" value={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })} /></div>
                                            <div className="form-group-modern"><label>الباركود</label><input type="text" value={editingProduct.barcode} onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })} /></div>
                                        </div>
                                        <div className="form-group-modern"><label>الفئة</label><select value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} style={{ width: '100%', height: '48px', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '0 16px' }}>{(settings?.categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group-modern" style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#e8f5e9', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
                                            <div style={{ flex: 1 }}><label style={{ margin: 0, fontWeight: '700' }}>عرض المنتج في المتجر أونلاين</label></div>
                                            <input type="checkbox" checked={editingProduct.showOnline !== false} onChange={(e) => setEditingProduct({ ...editingProduct, showOnline: e.target.checked })} style={{ width: '25px', height: '25px' }} />
                                        </div>
                                        <div className="form-group-modern">
                                            <label>معرض صور المنتج</label>
                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                                <button
                                                    type="button"
                                                    disabled={isUploadingGallery}
                                                    className="upload-btn-secondary"
                                                    onClick={() => document.getElementById('multi-upload-input').click()}
                                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px dashed #ccc', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: isUploadingGallery ? 0.7 : 1, minHeight: '48px' }}
                                                >
                                                    {isUploadingGallery ? <><div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#8b5cf6' }}>{uploadStatus}</div></> : <><ImageIcon size={18} /> <span>رفع صور من الجهاز</span></>}
                                                </button>
                                                <input
                                                    type="file" multiple id="multi-upload-input" accept="image/*" style={{ display: 'none' }}
                                                    onChange={async (e) => {
                                                        const files = Array.from(e.target.files);
                                                        if (files.length === 0) return;

                                                        setIsUploadingGallery(true);
                                                        setUploadStatus(`جاري معالجة ${files.length} صور...`);

                                                        try {
                                                            const urls = [];
                                                            for (const file of files) {
                                                                setUploadStatus(`رفع: ${file.name}...`);
                                                                const url = await handleUploadImage(file);
                                                                if (url) urls.push(url);
                                                            }

                                                            if (urls.length > 0) {
                                                                setEditingProduct(prev => {
                                                                    const prevState = { ...prev };
                                                                    let newMain = prevState.image;
                                                                    const newGallery = Array.isArray(prevState.gallery) ? [...prevState.gallery] : [];

                                                                    urls.forEach(url => {
                                                                        if (!newMain) {
                                                                            newMain = url;
                                                                        } else if (newMain !== url && !newGallery.includes(url)) {
                                                                            newGallery.push(url);
                                                                        }
                                                                    });

                                                                    return {
                                                                        ...prevState,
                                                                        image: newMain,
                                                                        gallery: newGallery
                                                                    };
                                                                });
                                                            }
                                                        } catch (err) {
                                                            console.error("Multi-upload failed:", err);
                                                        } finally {
                                                            setIsUploadingGallery(false);
                                                            setUploadStatus('');
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                />
                                                <button type="button" className="ai-gen-btn" onClick={() => { setAiPrompt(editingProduct.name); setShowAiModal(true); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}><Sparkles size={18} /> ذكاء اصطناعي</button>
                                            </div>
                                            <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                                                {editingProduct.image && (
                                                    <div className="gallery-item main" style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '2px solid #3b82f6' }}>
                                                        <span style={{ position: 'absolute', top: 0, right: 0, background: '#3b82f6', color: 'white', fontSize: '10px', padding: '2px 6px' }}>الرئيسية</span>
                                                        <img src={editingProduct.image} alt="Main" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                                        <button type="button" onClick={() => setEditingProduct({ ...editingProduct, image: '' })} style={{ position: 'absolute', bottom: '5px', left: '5px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '4px' }}><Trash2 size={12} /></button>
                                                    </div>
                                                )}
                                                {(editingProduct.gallery || []).map((img, idx) => (
                                                    <div key={idx} className="gallery-item" style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #eee' }}>
                                                        <img src={img} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                                                        <div style={{ position: 'absolute', bottom: '0', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '5px', background: 'rgba(0,0,0,0.3)' }}>
                                                            <button type="button" onClick={() => { const oldMain = editingProduct.image; const newGal = editingProduct.gallery.filter((_, i) => i !== idx); if (oldMain) newGal.push(oldMain); setEditingProduct({ ...editingProduct, image: img, gallery: newGal }); }} style={{ background: 'none', border: 'none', color: 'white' }}><CheckCircle2 size={14} /></button>
                                                            <button type="button" onClick={() => { const newGal = editingProduct.gallery.filter((_, i) => i !== idx); setEditingProduct({ ...editingProduct, gallery: newGal }); }} style={{ background: 'none', border: 'none', color: '#ff4d4d' }}><Trash2 size={14} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="form-group-modern"><label>سعر الأونلاين (اختياري)</label><input type="number" value={editingProduct.onlinePrice || ''} onChange={(e) => setEditingProduct({ ...editingProduct, onlinePrice: e.target.value ? parseFloat(e.target.value) : undefined })} /></div>
                                        <div className="form-group-modern"><label>وصف المنتج</label><textarea rows="4" value={editingProduct.longDescription || ''} onChange={(e) => setEditingProduct({ ...editingProduct, longDescription: e.target.value })} style={{ width: '100%', borderRadius: '12px', padding: '12px' }} /></div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="cancel-btn" onClick={() => setEditingProduct(null)}>إلغاء</button>
                                <button type="submit" className="save-btn"><Save size={18} /> حفظ التعديلات</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {printBarcode && (
                <div className="modal-overlay">
                    <div className="print-modal-v2">
                        <div className="modal-header"><h3><Printer size={20} /> معاينة الباركود</h3><button onClick={() => setPrintBarcode(null)}><X size={20} /></button></div>
                        <div className="print-preview-container">
                            <div className="barcode-tag" id="barcode-paper">
                                <div className="tag-header">{settings.storeName}</div>
                                <div className="tag-name">{printBarcode.name}</div>
                                <Barcode value={printBarcode.barcode} width={1.2} height={40} fontSize={10} background="transparent" />
                                <div className="tag-price">{printBarcode.price.toLocaleString()} ج.م</div>
                            </div>
                        </div>
                        <div className="modal-footer"><button className="full-print-btn" onClick={() => window.print()}><Printer size={20} /> طباعة</button></div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modern-modal delete-modal">
                        <div className="modal-body text-center">
                            <div className="warning-icon-large"><AlertTriangle size={48} /></div>
                            <h3>هل أنت متأكد من الحذف؟</h3>
                            <p>سيتم حذف "{showDeleteConfirm.name}" نهائياً.</p>
                        </div>
                        <div className="modal-footer"><button className="cancel-btn" onClick={() => setShowDeleteConfirm(null)}>إلغاء</button><button className="delete-btn-final" onClick={() => handleDeleteProduct(showDeleteConfirm.id)}>تأكيد الحذف</button></div>
                    </div>
                </div>
            )}

            {showAiModal && (
                <div className="modal-overlay" style={{ zIndex: 3100 }}>
                    <div className="modern-modal" style={{ maxWidth: '650px', width: '95%' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ImageIcon size={22} color="#8b5cf6" /><h3>بحث واجهة المنتج</h3></div>
                            <button className="close-btn" onClick={() => setShowAiModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#f1f5f9', padding: '5px', borderRadius: '12px' }}>
                                <button onClick={() => setImageSource('search')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: imageSource === 'search' ? 'white' : 'transparent' }}>بحث إنترنت</button>
                                <button onClick={() => setImageSource('ai')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: imageSource === 'ai' ? 'white' : 'transparent' }}>ذكاء اصطناعي</button>
                            </div>
                            <div className="form-group-modern">
                                <label>وصف المنتج</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '10px' }} onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()} />
                                    <button className="ai-gen-btn" onClick={handleAiGenerate} disabled={isAiGenerating} style={{ padding: '0 20px', borderRadius: '10px', background: '#8b5cf6', color: 'white' }}>{isAiGenerating ? '...' : <Search size={20} />}</button>
                                </div>
                            </div>
                            {generatedPreviews.length > 0 && (
                                <div className="generated-preview-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                    {generatedPreviews.map((p) => (
                                        <div key={p.id} onClick={() => setSelectedPreview(selectedPreview?.id === p.id ? null : p)} style={{ cursor: 'pointer', border: selectedPreview?.id === p.id ? '3px solid #8b5cf6' : '3px solid transparent', borderRadius: '12px', overflow: 'hidden' }}>
                                            <img src={p.url} alt="preview" style={{ width: '100%', height: '150px', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowAiModal(false)}>إغلاق</button>
                            <button onClick={saveAiImage} disabled={!selectedPreview || isAiGenerating} style={{ background: '#10b981', color: 'white', padding: '8px 20px', borderRadius: '8px' }}>{isAiGenerating ? 'حفظ...' : 'اعتماد الصورة'}</button>
                        </div>
                    </div>
                </div>
            )}

            {isScanning && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="ai-scanning-loader"><div className="scanner-brain"><Brain size={60} /><div className="scan-bar"></div></div><h3>جاري قراءة الفاتورة...</h3></div>
                </div>
            )}

            <style>{`
                .stock-bar { height: 6px; background: #eee; border-radius: 3px; overflow: hidden; margin-top: 4px; }
                .bar-fill { height: 100%; transition: width 0.3s; }
                .action-buttons { display: flex; gap: 8px; justify-content: center; }
                .icon-action { width: 32px; height: 32px; border-radius: 8px; border: 1px solid #eee; background: white; cursor: pointer; display: flex; alignItems: center; justifyContent: center; color: #64748b; }
                .icon-action:hover { background: #f8fafc; color: #3b82f6; }
                .price-tag { font-weight: bold; }
                .price-tag.cost { color: #64748b; }
                .price-tag.retail { color: #10b981; }
                .item-info-cell { display: flex; align-items: center; gap: 12px; }
                .item-img-placeholder { width: 36px; height: 36px; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #64748b; }
                @keyframes scan-move { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
            `}</style>
        </div>
    );
};

export default Inventory;
