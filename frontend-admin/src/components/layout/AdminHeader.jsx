import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Palette,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const getPageTitleInfo = (pathname) => {
  if (pathname.startsWith('/users/')) {
    return {
      title: 'Chi tiết Người dùng',
      subtitle: 'LemoGuide Admin Console / Quản lý Người dùng / Chi tiết hồ sơ',
    };
  }
  if (pathname === '/users') {
    return {
      title: 'Quản lý Người dùng',
      subtitle: 'LemoGuide Admin Console / Quản lý Người dùng',
    };
  }
  if (pathname.startsWith('/admins')) {
    return {
      title: 'Quản lý Quản trị viên',
      subtitle: 'LemoGuide Admin Console / Quản lý Quản trị viên',
    };
  }
  if (pathname.startsWith('/roles')) {
    return {
      title: 'Quản lý Vai trò & Phân quyền',
      subtitle: 'LemoGuide Admin Console / Quản lý Vai trò',
    };
  }
  if (pathname.startsWith('/master-data/majors')) {
    return {
      title: 'Danh mục Chuyên ngành',
      subtitle: 'LemoGuide Admin Console / Danh mục dữ liệu / Chuyên ngành',
    };
  }
  if (pathname.startsWith('/master-data/technologies')) {
    return {
      title: 'Danh mục Công nghệ',
      subtitle: 'LemoGuide Admin Console / Danh mục dữ liệu / Công nghệ',
    };
  }
  if (pathname.startsWith('/master-data/skills')) {
    return {
      title: 'Danh mục Kỹ năng',
      subtitle: 'LemoGuide Admin Console / Danh mục dữ liệu / Kỹ năng',
    };
  }
  if (pathname.startsWith('/cv-management')) {
    return {
      title: 'Quản lý CV',
      subtitle: 'LemoGuide Admin Console / Quản lý CV',
    };
  }
  if (pathname.startsWith('/reports')) {
    return {
      title: 'Thống kê & Báo cáo',
      subtitle: 'LemoGuide Admin Console / Thống kê & Báo cáo',
    };
  }
  if (pathname.startsWith('/settings')) {
    return {
      title: 'Cài đặt hệ thống',
      subtitle: 'LemoGuide Admin Console / Cài đặt hệ thống',
    };
  }
  if (pathname.startsWith('/network')) {
    return {
      title: 'Quản lý LemoNetwork',
      subtitle: 'LemoGuide Admin Console / Cộng đồng LemoNetwork',
    };
  }
  if (pathname.startsWith('/ai-management')) {
    return {
      title: 'Quản lý AI',
      subtitle: 'LemoGuide Admin Console / Quản lý AI',
    };
  }
  return {
    title: 'Tổng quan Hệ thống',
    subtitle: 'LemoGuide Admin Console / Dashboard',
  };
};

const sidebarOptions = [
  {
    id: 'light',
    name: 'Trắng thanh lịch',
    desc: 'Nền trắng sạch, điểm nhấn xanh lá',
    color: '#ffffff',
    borderColor: '#e2e8f0',
  },
  {
    id: 'green',
    name: 'Xanh Lemo đậm chất',
    desc: 'Dải màu xanh rừng đặc trưng LemoGuide',
    color: '#15803d',
    borderColor: '#166534',
  },
  {
    id: 'dark',
    name: 'Đen Slate hiện đại',
    desc: 'Tông màu đen huyền bí, bảo vệ mắt',
    color: '#0f172a',
    borderColor: '#334155',
  },
  {
    id: 'floating',
    name: 'Thẻ nổi sang trọng',
    desc: 'Sidebar bo góc tròn tách rời khỏi mép',
    color: '#f0fdf4',
    borderColor: '#86efac',
  },
];

const AdminHeader = ({ collapsed, setCollapsed, onMenuClick }) => {
  const { darkMode, toggleDarkMode, sidebarStyle, setSidebarStyle } = useTheme();
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const pageInfo = getPageTitleInfo(location.pathname);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStyleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="ui-header"
      style={{
        height: 'var(--ui-header-h)',
        backgroundColor: 'var(--ui-surface)',
        borderBottom: '1px solid var(--ui-border)',
        padding: '0 var(--ui-page-pad)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: darkMode ? '0 1px 3px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
        transition: 'background-color 0.25s, border-color 0.25s',
      }}
    >
      {/* Left side: 3-lines Menu Button & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          type="button"
          onClick={onMenuClick || (() => setCollapsed(!collapsed))}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'transparent',
            border: 'none',
            color: darkMode ? '#34d399' : '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease-in-out',
            outline: 'none',
            padding: 0,
          }}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#dcfce7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Menu size={24} strokeWidth={2.4} color={darkMode ? '#34d399' : '#15803d'} />
        </button>

        <div className="ui-header-title" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: darkMode ? '#f8fafc' : '#0f172a',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {pageInfo.title}
          </h2>
          <span className="ui-header-sub" style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>
            {pageInfo.subtitle}
          </span>
        </div>
      </div>

      {/* Right side: Theme Toggle, Sidebar Styles, Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

        {/* 1. CẤU HÌNH GIAO DIỆN SÁNG / TỐI (Theme Toggle) */}
        <button
          type="button"
          onClick={toggleDarkMode}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            borderRadius: '9999px',
            backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            color: darkMode ? '#fbbf24' : '#15803d',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title={darkMode ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#dcfce7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = darkMode ? '#0f172a' : '#f8fafc';
          }}
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          <span className="ui-hide-sm" style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>
            {darkMode ? 'Giao diện Tối' : 'Giao diện Sáng'}
          </span>
        </button>

        {/* 2. CẤU HÌNH CÁC KIỂU SIDEBAR (Sidebar Style Selector Dropdown) */}
        <div className="ui-hide-sm" style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 14px',
              borderRadius: '9999px',
              backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
              border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              color: darkMode ? '#34d399' : '#15803d',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Tùy chỉnh kiểu dáng thanh Sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#dcfce7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = darkMode ? '#0f172a' : '#f8fafc';
            }}
          >
            <Palette size={17} />
            <span style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}>Kiểu Sidebar</span>
            <ChevronDown size={14} style={{ color: '#94a3b8' }} />
          </button>

          {/* Style Options Menu Popup */}
          {showStyleMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '270px',
                backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                borderRadius: '16px',
                boxShadow: darkMode
                  ? '0 10px 25px rgba(0, 0, 0, 0.5)'
                  : '0 10px 25px rgba(0, 0, 0, 0.1)',
                padding: '12px',
                zIndex: 100,
                animation: 'fadeIn 0.2s ease-out forwards',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '4px 8px 8px 8px',
                  borderBottom: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
                  marginBottom: '8px',
                }}
              >
                Chọn giao diện Sidebar
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sidebarOptions.map((opt) => {
                  const isSelected = sidebarStyle === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSidebarStyle(opt.id);
                        setShowStyleMenu(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: isSelected
                          ? '1.5px solid #15803d'
                          : `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
                        backgroundColor: isSelected
                          ? darkMode
                            ? '#0f172a'
                            : '#ecfdf5'
                          : darkMode
                          ? '#1e293b'
                          : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = darkMode ? '#1e293b' : '#ffffff';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            backgroundColor: opt.color,
                            border: `1px solid ${opt.borderColor}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: isSelected ? '700' : '600',
                              color: isSelected ? '#15803d' : darkMode ? '#f8fafc' : '#0f172a',
                            }}
                          >
                            {opt.name}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{opt.desc}</span>
                        </div>
                      </div>

                      {isSelected && <Check size={16} color="#15803d" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          type="button"
          style={{
            position: 'relative',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
            border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            color: darkMode ? '#94a3b8' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          title="Thông báo hệ thống"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#15803d';
            e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f0fdf4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = darkMode ? '#94a3b8' : '#64748b';
            e.currentTarget.style.backgroundColor = darkMode ? '#0f172a' : '#ffffff';
          }}
        >
          <Bell size={18} />
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
            }}
          />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
