import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useTheme } from '@/context/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const AdminLayout = ({ children, fullWidth = false }) => {
  const { collapsed, setCollapsed } = useTheme();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { pathname } = useLocation();
  // The drawer is "open for" the page it was opened on, so navigating closes it.
  const [openedAt, setOpenedAt] = useState(null);
  const mobileNavOpen = isMobile && openedAt === pathname;

  const handleMenuClick = () => {
    if (isMobile) setOpenedAt(mobileNavOpen ? null : pathname);
    else setCollapsed(!collapsed);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--ui-bg)',
        color: 'var(--ui-text)',
        fontFamily: 'var(--font-family-base)',
        transition: 'background-color 0.25s, color 0.25s',
      }}
    >
      <div
        className="ui-nav-backdrop"
        data-open={mobileNavOpen}
        onClick={() => setOpenedAt(null)}
        aria-hidden="true"
      />

      {/* Sidebar: fixed column on desktop, slide-in drawer on mobile */}
      <AdminSidebar collapsed={isMobile ? false : collapsed} mobileOpen={mobileNavOpen} />

      {/* Main Right Content Section */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          backgroundColor: 'var(--ui-bg)',
          transition: 'background-color 0.25s',
        }}
      >
        <AdminHeader collapsed={collapsed} setCollapsed={setCollapsed} onMenuClick={handleMenuClick} />

        {/* Scrollable Page Body */}
        <main
          style={{
            flex: 1,
            padding: 'var(--ui-page-pad)',
            overflowY: 'auto',
          }}
        >
          <div
            style={
              fullWidth
                ? { width: '100%' }
                : {
                    maxWidth: '1280px',
                    margin: '0 auto',
                    width: '100%',
                    boxSizing: 'border-box',
                  }
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
