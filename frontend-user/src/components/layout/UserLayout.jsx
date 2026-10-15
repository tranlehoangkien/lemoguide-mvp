import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import UserSidebar from './UserSidebar';
import UserHeader from './UserHeader';
import { useTheme } from '@/context/ThemeContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const UserLayout = ({ children, fullBleed = false }) => {
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
        height: '100dvh',
        overflow: 'hidden',
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
      <UserSidebar collapsed={isMobile ? false : collapsed} mobileOpen={mobileNavOpen} onNavigate={() => setOpenedAt(null)} />

      {/* Main Right Content Section */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100dvh',
          overflow: 'hidden',
          backgroundColor: 'var(--ui-bg)',
          transition: 'background-color 0.25s',
        }}
      >
        <UserHeader collapsed={collapsed} setCollapsed={setCollapsed} onMenuClick={handleMenuClick} />

        {/* Page Body */}
        <main
          style={{
            flex: 1,
            padding: fullBleed ? '0' : 'var(--ui-page-pad)',
            overflowY: fullBleed ? 'hidden' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
