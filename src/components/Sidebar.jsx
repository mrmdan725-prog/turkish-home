import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Settings, LogOut, Users, FileText, ShoppingBag, Brain, Store, Plus, Minus, Clock } from 'lucide-react';
import './Sidebar.css';
import Logo from './Common/Logo';

const Sidebar = ({ activeTab, setActiveTab, pendingCount = 0 }) => {
  const [isStoreExpanded, setIsStoreExpanded] = useState(false);

  const mainMenuItems = [
    { id: 'ai', label: 'مساعد البيت التركي الذكي', icon: Brain },
    {
      id: 'storefront',
      label: 'المتجر الإلكتروني',
      icon: Store,
      hasSubItems: true
    },
    { id: 'pos', label: 'المبيعات', icon: ShoppingCart },
    { id: 'invoices', label: 'الفواتير', icon: FileText },
    { id: 'purchases', label: 'المشتريات', icon: ShoppingBag },
    { id: 'inventory', label: 'المخزن', icon: Package },
    { id: 'customers', label: 'العملاء والديون', icon: Users },
    { id: 'reports', label: 'التقارير', icon: BarChart3 },
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  ];

  const storeSubItems = [
    { id: 'web_orders', label: 'طلبات المتجر أونلاين', icon: ShoppingBag },
    { id: 'web_history', label: 'سجل الطلبات المسلمة', icon: Clock },
    { id: 'web_customers', label: 'عملاء المتجر أونلاين', icon: Users },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Logo size={45} color="#4B2C20" />
      </div>

      <div className="sidebar-menu">
        {mainMenuItems.map((item) => (
          <React.Fragment key={item.id}>
            <div
              className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                if (item.hasSubItems) {
                  // Don't change tab immediately if clicking the main item, 
                  // or maybe do both? User said "when clicking +".
                  setActiveTab(item.id);
                } else {
                  setActiveTab(item.id);
                }
              }}
            >
              <div className="menu-item-content">
                <item.icon size={20} className="menu-icon" />
                <span className="menu-label">{item.label}</span>
              </div>

              {item.hasSubItems && (
                <button
                  className="expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStoreExpanded(!isStoreExpanded);
                  }}
                >
                  {isStoreExpanded ? <Minus size={16} /> : <Plus size={16} />}
                </button>
              )}
            </div>

            {item.hasSubItems && isStoreExpanded && (
              <div className="sub-menu-container">
                {storeSubItems.map(subItem => (
                  <div
                    key={subItem.id}
                    className={`menu-item sub-item ${activeTab === subItem.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(subItem.id)}
                  >
                    <div className="menu-item-content">
                      <subItem.icon size={16} className="menu-icon" />
                      <span className="menu-label">{subItem.label}</span>
                    </div>
                    {subItem.id === 'web_orders' && pendingCount > 0 && (
                      <span className="notify-badge">{pendingCount}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </React.Fragment>
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
