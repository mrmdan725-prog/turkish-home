import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Lock, User, MapPin, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../supabase';

// Simple hash function for passwords (SHA-256)
const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const CustomerAuth = ({ isOpen, onClose, onLoginSuccess }) => {
    const [mode, setMode] = useState('login'); // login | register
    const [formData, setFormData] = useState({ name: '', phone: '', password: '', address: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleLogin = async () => {
        if (!formData.phone || !formData.password) {
            setError('يرجى إدخال رقم الهاتف وكلمة السر');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const hashedPass = await hashPassword(formData.password);
            const { data, error: dbError } = await supabase
                .from('web_customers')
                .select('*')
                .eq('phone', formData.phone.trim())
                .eq('password_hash', hashedPass)
                .single();

            if (dbError || !data) {
                setError('رقم الهاتف أو كلمة السر غير صحيحة');
                return;
            }

            // Save session
            localStorage.setItem('th_customer', JSON.stringify(data));
            onLoginSuccess(data);
            onClose();
        } catch (err) {
            setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!formData.name || !formData.phone || !formData.password) {
            setError('يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        if (formData.password.length < 4) {
            setError('كلمة السر يجب أن تكون 4 أحرف على الأقل');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Check if phone already exists
            const { data: existing } = await supabase
                .from('web_customers')
                .select('id')
                .eq('phone', formData.phone.trim())
                .single();

            if (existing) {
                setError('رقم الهاتف مسجل بالفعل. يرجى تسجيل الدخول.');
                return;
            }

            const hashedPass = await hashPassword(formData.password);
            const { data, error: dbError } = await supabase
                .from('web_customers')
                .insert([{
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    password_hash: hashedPass,
                    address: formData.address.trim()
                }])
                .select()
                .single();

            if (dbError) throw dbError;

            // Save session
            localStorage.setItem('th_customer', JSON.stringify(data));
            onLoginSuccess(data);
            onClose();
        } catch (err) {
            setError('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (mode === 'login') handleLogin();
        else handleRegister();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="auth-modal"
                onClick={e => e.stopPropagation()}
            >
                <button className="modal-close-btn" onClick={onClose}><X /></button>

                {/* Logo & Title */}
                <div className="auth-header">
                    <div className="auth-avatar">
                        {mode === 'login' ? <LogIn size={28} /> : <UserPlus size={28} />}
                    </div>
                    <h2>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
                    <p>{mode === 'login' ? 'سجّل دخولك لتتابع طلباتك وتطلع على فواتيرك' : 'أنشئ حسابك واستمتع بتجربة تسوق مميزة'}</p>
                </div>

                {/* Mode Switcher */}
                <div className="auth-tabs">
                    <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>
                        <LogIn size={16} /> تسجيل دخول
                    </button>
                    <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>
                        <UserPlus size={16} /> حساب جديد
                    </button>
                </div>

                {/* Form */}
                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="auth-field">
                            <User size={18} />
                            <input
                                type="text"
                                placeholder="الاسم بالكامل *"
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <Phone size={18} />
                        <input
                            type="tel"
                            placeholder="رقم الهاتف *"
                            value={formData.phone}
                            onChange={e => handleChange('phone', e.target.value)}
                            dir="ltr"
                            style={{ textAlign: 'right' }}
                        />
                    </div>

                    <div className="auth-field">
                        <Lock size={18} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="كلمة السر *"
                            value={formData.password}
                            onChange={e => handleChange('password', e.target.value)}
                        />
                        <button type="button" className="toggle-pass" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {mode === 'register' && (
                        <div className="auth-field">
                            <MapPin size={18} />
                            <input
                                type="text"
                                placeholder="العنوان (اختياري)"
                                value={formData.address}
                                onChange={e => handleChange('address', e.target.value)}
                            />
                        </div>
                    )}

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? (
                            <div className="mini-loader"></div>
                        ) : (
                            <>
                                {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                                <span>{mode === 'login' ? 'دخول' : 'إنشاء حساب'}</span>
                            </>
                        )}
                    </button>
                </form>

                {mode === 'login' && (
                    <p className="auth-hint">
                        ليس لديك حساب؟{' '}
                        <button onClick={() => { setMode('register'); setError(''); }}>أنشئ حساب الآن</button>
                    </p>
                )}
                {mode === 'register' && (
                    <p className="auth-hint">
                        لديك حساب بالفعل؟{' '}
                        <button onClick={() => { setMode('login'); setError(''); }}>سجّل دخولك</button>
                    </p>
                )}
            </motion.div>
        </div>
    );
};

export default CustomerAuth;
