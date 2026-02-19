import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Settings, LogOut, Users, FileText, ShoppingBag, Brain, Store } from 'lucide-react';
import './Sidebar.css';
import Logo from './Common/Logo';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'ai', label: 'مساعد البيت التركي الذكي', icon: Brain },
    { id: 'storefront', label: 'المتجر الإلكتروني', icon: Store },
    { id: 'pos', label: 'المبيعات', icon: ShoppingCart },
    { id: 'invoices', label: 'الفواتير', icon: FileText },
    { id: 'purchases', label: 'المشتريات', icon: ShoppingBag },
    { id: 'inventory', label: 'المخزن', icon: Package },
    { id: 'customers', label: 'العملاء والديون', icon: Users },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Logo size={45} color="#4B2C20" />
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={20} className="menu-icon" />
            <span className="menu-label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div
          className={`menu-item settings ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} className="menu-icon" />
          <span className="menu-label">الإعدادات</span>
        </div>
        <div className="menu-item logout">
          <LogOut size={20} className="menu-icon" />
          <span className="menu-label">خروج</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
