import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  LayoutDashboard,
  ClipboardList,
  FileText,
  User,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Settings,
  LogOut,
  Folder,
  Briefcase,
  Globe,
  Search,
  Map,
  GraduationCap,
  Users,
  Newspaper,
  MessageSquare,
  Sparkles,
  Compass,
  TrendingUp,
} from 'lucide-react';
import logoImg from '@/assets/lemoguide-png.png';
import defaultAvatarImg from '@/assets/default-avatar.jpg';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';
import { ROUTES } from '@/constants/routes';
import { getFullAvatarUrl } from '@/services/apiClient';
import SettingsModal from '@/components/settings/SettingsModal';
import { useNetworkSummary, badgeText } from '@/services/networkSummary';

// Cấu trúc danh mục điều hướng LemoGuide User
const navigationGroups = [
  { id: 'overview', title: 'Tổng quan', icon: LayoutDashboard, isDirect: true, path: ROUTES.DASHBOARD },
  { id: 'applications', title: 'Theo dõi ứng tuyển', icon: ClipboardList, isDirect: true, path: ROUTES.APPLICATIONS },
  {
    id: 'ai_coach',
    title: 'AI Coach',
    icon: Bot,
    isDirect: true,
    path: ROUTES.COACH,
  },
  {
    id: 'my_profile',
    title: 'Hồ sơ của tôi',
    icon: Folder,
    children: [
      {
        id: 'cv_management',
        label: 'Quản lý CV',
        icon: FileText,
        path: ROUTES.MY_CV,
        desc: 'Quản lý danh sách CV cá nhân',
      },
      {
        id: 'dynamic_profile',
        label: 'Dynamic Profile',
        icon: User,
        path: ROUTES.PROFILE,
        desc: 'Hồ sơ năng lực cá nhân hóa',
      },
      {
        id: 'progress',
        label: 'Tiến bộ',
        icon: TrendingUp,
        path: ROUTES.PROGRESS,
        desc: 'Theo dõi tiến độ lộ trình và kỹ năng',
      },
    ],
  },
  {
    id: 'self_discovery',
    title: 'Khám phá bản thân',
    icon: Compass,
    isDirect: true,
    path: ROUTES.SELF_DISCOVERY,
    desc: 'Khám phá tiềm năng, tính cách và định hướng bản thân',
  },
  {
    id: 'career_roadmap',
    title: 'Lộ trình phát triển',
    icon: Map,
    isDirect: true,
    path: ROUTES.CAREER_ROADMAP,
    desc: 'Roadmap cá nhân hóa',
  },
  {
    id: 'lemonetwork',
    title: 'LemoNetwork',
    icon: Globe,
    children: [
      {
        path: ROUTES.NETWORK,
        id: 'network_feed',
        label: 'Cộng đồng',
        icon: Newspaper,
        desc: 'Chia sẻ kiến thức và học từ cộng đồng',
      },
      {
        path: ROUTES.NETWORK_CONNECTIONS,
        id: 'network_connections',
        label: 'Kết nối',
        icon: Users,
        desc: 'Người đã kết nối và lời mời',
      },
      {
        path: ROUTES.NETWORK_MESSAGES,
        id: 'network_messages',
        label: 'Tin nhắn',
        icon: MessageSquare,
        desc: 'Nhắn tin trực tiếp',
      },
      {
        id: 'matching_jobs',
        label: 'Việc làm',
        icon: Briefcase,
        path: ROUTES.JOB_MATCHING,
        desc: 'Job matching theo profile',
      },
      {
        id: 'suggested_courses',
        label: 'Khóa học',
        icon: GraduationCap,
        path: ROUTES.COURSES,
        desc: 'Khám phá khóa học và phát triển kỹ năng',
      },
    ],
  },
];

/** Which LemoNetwork entry a network path belongs to (both active-item resolvers use this). */
const networkItemFor = (p) => {
  if (p.startsWith('/network/messages')) return 'network_messages';
  if (p.startsWith('/network/connections') || p.startsWith('/network/discover') || p.startsWith('/u/')) return 'network_connections';
  return 'network_feed';
};

const UserSidebar = ({ collapsed, mobileOpen = false, onNavigate }) => {
  const networkSummary = useNetworkSummary();
  // Live counts on the LemoNetwork entries; the group itself carries the total for the collapsed rail.
  const navGroups = navigationGroups.map((group) => {
    if (group.id !== 'lemonetwork' || !networkSummary) return group;
    const counts = { network_feed: networkSummary.mentoring, network_connections: networkSummary.requests, network_messages: networkSummary.messages };
    return {
      ...group,
      badge: badgeText((networkSummary.requests || 0) + (networkSummary.messages || 0) + (networkSummary.mentoring || 0)),
      children: group.children.map((child) => (child.id in counts ? { ...child, badge: badgeText(counts[child.id]) } : child)),
    };
  });
  const { user, logout } = useAuth();
  const { darkMode, sidebarStyle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { startNewChat, conversations, activeChatId, selectChat } = useChat();
  const [openingChatId, setOpeningChatId] = useState(null);
  const recentChats = [...conversations]
    .sort((a, b) => {
      const time = (chat) => Date.parse(chat.lastMessageAt || chat.createdAt) || 0;
      return time(b) - time(a) || Number(b.id) - Number(a.id);
    })
    .slice(0, 5);

  const openRecentChat = async (id) => {
    setOpeningChatId(id);
    const opened = await selectChat(id);
    setOpeningChatId(null);
    if (opened) {
      setActiveItem('ai_coach');
      navigate(ROUTES.COACH);
      onNavigate?.();
    } else {
      setToastMessage('Không thể tải cuộc trò chuyện. Vui lòng thử lại.');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatarUrl]);

  // Phím tắt Ctrl+K để bắt đầu New Chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'n')) {
        e.preventDefault();
        startNewChat?.();
        navigate(ROUTES.COACH || '/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startNewChat, navigate]);

  // Xác định active item theo đường dẫn URL hiện tại
  const getInitialActive = () => {
    const p = location.pathname;
    if (p === ROUTES.DASHBOARD) return { item: 'overview', group: null };
    if (p === ROUTES.APPLICATIONS) return { item: 'applications', group: null };
    if (
      p === ROUTES.MY_CV ||
      p.startsWith('/my-cv') ||
      p === ROUTES.CV_BUILDER ||
      p.startsWith('/cv-builder') ||
      p === ROUTES.CV_EDITOR ||
      p.startsWith('/cv-editor') ||
      p === ROUTES.CV_PREVIEW ||
      p.startsWith('/cv-preview')
    ) {
      return { item: 'cv_management', group: 'my_profile' };
    }
    if (p.startsWith('/network') || p.startsWith('/u/')) return { item: networkItemFor(p), group: 'lemonetwork' };
    if (p === ROUTES.PROGRESS) return { item: 'progress', group: 'my_profile' };
    if (p === ROUTES.PROFILE || p.startsWith('/profile')) {
      return { item: 'dynamic_profile', group: 'my_profile' };
    }
    if (p === ROUTES.COURSES || p.startsWith(`${ROUTES.COURSES}/`)) {
      return { item: 'suggested_courses', group: 'lemonetwork' };
    }
    if (p.startsWith('/job-matching')) {
      return { item: 'matching_jobs', group: 'lemonetwork' };
    }
    if (p === ROUTES.SELF_DISCOVERY || p.startsWith(`${ROUTES.SELF_DISCOVERY}/`)) {
      return { item: 'self_discovery', group: null };
    }
    if (p === ROUTES.CAREER_ROADMAP || p.startsWith(`${ROUTES.CAREER_ROADMAP}/`)) {
      return { item: 'career_roadmap', group: null };
    }
    if (p === ROUTES.COACH || p === ROUTES.HOME || p === '/') {
      return { item: 'ai_coach', group: null };
    }
    return { item: null, group: null };
  };

  const initial = getInitialActive();
  // State nhóm menu đang mở (chỉ mở 1 mục tại một thời điểm, đóng các mục còn lại tương tự AdminSidebar)
  const [openGroup, setOpenGroup] = useState(initial.group);
  const [activeItem, setActiveItem] = useState(initial.item);
  const [flyoutGroup, setFlyoutGroup] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(120);
  const [toastMessage, setToastMessage] = useState(null);

  // Settings popup và SettingsModal
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const settingsPopupRef = useRef(null);
  const settingsBtnRef = useRef(null);

  // Đóng settings popup khi click ra ngoài
  useEffect(() => {
    if (!showSettingsPopup) return;
    const handleClickOutside = (e) => {
      if (
        settingsPopupRef.current &&
        !settingsPopupRef.current.contains(e.target) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(e.target)
      ) {
        setShowSettingsPopup(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsPopup]);

  // Đóng flyout khi nhấp ra ngoài
  useEffect(() => {
    if (!collapsed || !flyoutGroup) return;
    const handleClickOutside = () => {
      setFlyoutGroup(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [collapsed, flyoutGroup]);

  // Tự động đồng bộ menu active khi route thay đổi
  useEffect(() => {
    const p = location.pathname;
    if (
      p === ROUTES.MY_CV ||
      p.startsWith('/my-cv') ||
      p === ROUTES.CV_BUILDER ||
      p.startsWith('/cv-builder') ||
      p === ROUTES.CV_EDITOR ||
      p.startsWith('/cv-editor') ||
      p === ROUTES.CV_PREVIEW ||
      p.startsWith('/cv-preview')
    ) {
      setActiveItem('cv_management');
      if (!collapsed) setOpenGroup('my_profile');
    } else if (p.startsWith('/network') || p.startsWith('/u/')) {
      setActiveItem(networkItemFor(p));
      if (!collapsed) setOpenGroup('lemonetwork');
    } else if (p === ROUTES.PROGRESS) {
      setActiveItem('progress');
      if (!collapsed) setOpenGroup('my_profile');
    } else if (p === ROUTES.PROFILE || p.startsWith('/profile')) {
      setActiveItem('dynamic_profile');
      if (!collapsed) setOpenGroup('my_profile');
    } else if (p === ROUTES.COURSES || p.startsWith(`${ROUTES.COURSES}/`)) {
      setActiveItem('suggested_courses');
      if (!collapsed) setOpenGroup('lemonetwork');
    } else if (p.startsWith('/job-matching')) {
      setActiveItem('matching_jobs');
      if (!collapsed) setOpenGroup('lemonetwork');
    } else if (p === ROUTES.SELF_DISCOVERY || p.startsWith(`${ROUTES.SELF_DISCOVERY}/`)) {
      setActiveItem('self_discovery');
    } else if (p === ROUTES.CAREER_ROADMAP || p.startsWith(`${ROUTES.CAREER_ROADMAP}/`)) {
      setActiveItem('career_roadmap');
    } else if (p === ROUTES.DASHBOARD) {
      setActiveItem('overview');
      setOpenGroup(null);
    } else if (p === ROUTES.APPLICATIONS) {
      setActiveItem('applications');
      setOpenGroup(null);
    } else if (p === ROUTES.COACH || p === ROUTES.HOME || p === '/') {
      setActiveItem('ai_coach');
    } else {
      setActiveItem(null);
    }
  }, [location.pathname, collapsed]);

  const toggleGroup = (groupId) => {
    // Mở mục được click và tự động đóng các mục khác; bấm lại mục đang mở thì thu gọn lại
    setOpenGroup((prev) => (prev === groupId ? null : groupId));
  };

  const handleItemClick = (child, groupId) => {
    setActiveItem(child.id);
    if (!collapsed && groupId) setOpenGroup(groupId);
    onNavigate?.();
    if (child.path) {
      navigate(child.path);
    } else {
      setToastMessage(`Tính năng "${child.label}" đang được phát triển!`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Hệ màu chuẩn đồng bộ tuyệt đối với AdminSidebar
  const isGreen = sidebarStyle === 'green';
  const isDark = sidebarStyle === 'dark' || (darkMode && sidebarStyle === 'light');
  const isFloating = sidebarStyle === 'floating';

  let bg = 'var(--ui-surface)';
  let borderColor = 'var(--ui-border)';
  let textColor = 'var(--ui-text-2)';
  let textActiveColor = 'var(--ui-accent-text)';
  let bgActive = 'var(--ui-accent-soft)';
  let brandTitleColor = 'var(--ui-accent-text)';

  if (isGreen) {
    bg = 'linear-gradient(180deg, #15803d 0%, #166534 100%)';
    borderColor = '#15803d';
    textColor = 'rgba(255, 255, 255, 0.85)';
    textActiveColor = '#15803d';
    bgActive = '#ffffff';
    brandTitleColor = '#ffffff';
  } else if (isDark) {
    bg = '#0f172a';
    borderColor = '#1e293b';
    textColor = '#94a3b8';
    textActiveColor = '#34d399';
    bgActive = '#1e293b';
    brandTitleColor = '#34d399';
  } else if (isFloating) {
    bg = darkMode ? '#1e293b' : '#ffffff';
    borderColor = darkMode ? '#334155' : '#bbf7d0';
    textColor = darkMode ? '#94a3b8' : '#475569';
    textActiveColor = '#15803d';
    bgActive = darkMode ? '#0f172a' : '#dcfce7';
    brandTitleColor = '#15803d';
  }

  const avatarSrc = user?.avatarUrl ? getFullAvatarUrl(user.avatarUrl) : defaultAvatarImg;

  return (
    <aside
      className="ui-sidebar"
      data-open={mobileOpen}
      style={{
        width: collapsed ? '80px' : '295px',
        minWidth: collapsed ? '80px' : '295px',
        height: isFloating ? 'calc(100vh - 28px)' : '100vh',
        margin: isFloating ? '14px 0 14px 14px' : '0',
        borderRadius: isFloating ? '24px' : '0',
        background: bg,
        borderRight: isFloating ? 'none' : `1px solid ${borderColor}`,
        border: isFloating ? `1.5px solid ${borderColor}` : undefined,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'sticky',
        top: isFloating ? '14px' : '0',
        zIndex: 40,
        boxShadow: isFloating
          ? '0 12px 30px rgba(0, 0, 0, 0.12)'
          : isDark
            ? '2px 0 10px rgba(0, 0, 0, 0.4)'
            : '2px 0 8px rgba(0, 0, 0, 0.03)',
        userSelect: 'none',
      }}
    >
      {/* 1. Phần trên: Header thương hiệu + Nhóm danh mục điều hướng */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header Thương hiệu */}
        <div
          style={{
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: `1px solid ${isGreen ? 'rgba(255, 255, 255, 0.15)' : isDark ? '#1e293b' : '#f1f5f9'}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src={logoImg}
              alt="LemoGuide"
              style={{
                width: '36px',
                height: '36px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />

            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: brandTitleColor,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                    whiteSpace: 'nowrap',
                  }}
                >
                  LemoGuide
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: isGreen
                      ? 'rgba(255, 255, 255, 0.75)'
                      : isDark
                        ? '#94a3b8'
                        : '#64748b',
                    letterSpacing: '0.04em',
                    lineHeight: 1.2,
                    marginTop: '1px',
                  }}
                >
                  User
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Danh sách các nhóm điều hướng có thể cuộn */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            const isDirect = group.isDirect;
            const isExpanded = openGroup === group.id;
            const isGroupActive =
              activeItem === group.id ||
              (group.children && group.children.some((c) => c.id === activeItem));

            if (isDirect) {
              const isAiCoach = group.id === 'ai_coach';
              const isActive = activeItem === group.id;

              return (
                <React.Fragment key={group.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveItem(group.id);
                    setOpenGroup(null);
                    onNavigate?.();
                    if (group.path) {
                      navigate(group.path);
                    } else {
                      setToastMessage(`Tính năng "${group.title}" đang được phát triển!`);
                      setTimeout(() => setToastMessage(null), 2500);
                    }
                  }}
                  style={
                    isAiCoach
                      ? {
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: collapsed ? '12px 0' : '11px 14px',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #6366f1 50%, #a855f7 100%)',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '15px',
                          cursor: 'pointer',
                          boxShadow: isActive
                            ? '0 4px 16px rgba(99, 102, 241, 0.45)'
                            : '0 2px 10px rgba(99, 102, 241, 0.25)',
                          transition: 'all 0.2s ease',
                          transform: isActive ? 'scale(1.01)' : 'none',
                          outline: isActive ? '2px solid rgba(255, 255, 255, 0.5)' : 'none',
                          outlineOffset: '2px',
                        }
                      : {
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: collapsed ? '12px 0' : '11px 14px',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: isActive ? bgActive : 'transparent',
                          color: isActive ? textActiveColor : textColor,
                          fontWeight: isActive ? '700' : '500',
                          fontSize: '15px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive && isGreen ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        }
                  }
                  title={collapsed ? group.title : undefined}
                  onMouseEnter={(e) => {
                    if (isAiCoach) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.45)';
                      e.currentTarget.style.filter = 'brightness(1.08)';
                    } else if (!isActive) {
                      e.currentTarget.style.backgroundColor = isGreen
                        ? 'rgba(255, 255, 255, 0.14)'
                        : isDark
                          ? '#1e293b'
                          : '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isAiCoach) {
                      e.currentTarget.style.transform = isActive ? 'scale(1.01)' : 'none';
                      e.currentTarget.style.boxShadow = isActive
                        ? '0 4px 16px rgba(99, 102, 241, 0.45)'
                        : '0 2px 10px rgba(99, 102, 241, 0.25)';
                      e.currentTarget.style.filter = 'brightness(1)';
                    } else if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <GroupIcon
                    size={20}
                    style={{
                      color: isAiCoach ? '#ffffff' : isActive ? textActiveColor : isGreen ? '#ffffff' : textColor,
                      flexShrink: 0,
                    }}
                  />
                  {!collapsed && <span style={{ color: isAiCoach ? '#ffffff' : undefined }}>{group.title}</span>}
                </button>
                {isAiCoach && !collapsed && recentChats.length > 0 && (
                  <nav className="ui-chat-history" aria-label="Cuộc trò chuyện gần đây"
                    style={{ '--history-text': textColor, '--history-active': textActiveColor, '--history-bg': bgActive }}>
                    <span className="ui-chat-history__label">Trò chuyện gần đây</span>
                    {recentChats.map((chat) => (
                      <button key={chat.id} type="button" className="ui-chat-history__item"
                        title={chat.title || 'Cuộc trò chuyện mới'}
                        aria-current={activeItem === 'ai_coach' && activeChatId === chat.id ? 'page' : undefined}
                        aria-busy={openingChatId === chat.id}
                        disabled={openingChatId !== null}
                        onClick={() => openRecentChat(chat.id)}>
                        <span>{openingChatId === chat.id ? 'Đang tải...' : chat.title || 'Cuộc trò chuyện mới'}</span>
                      </button>
                    ))}
                  </nav>
                )}
                </React.Fragment>
              );
            }

            return (
              <div key={group.id} style={{ position: 'relative' }}>
                {/* Nút Nhóm cha (Group Parent) */}
                <button
                  type="button"
                  onClick={(e) => {
                    if (collapsed) {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setFlyoutTop(Math.max(10, Math.min(window.innerHeight - 260, rect.top)));
                      setFlyoutGroup(flyoutGroup === group.id ? null : group.id);
                    } else {
                      toggleGroup(group.id);
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    padding: collapsed ? '12px 0' : '10px 13px',
                    borderRadius: '10px',
                    border: 'none',
                    borderLeft: !collapsed && isGroupActive
                      ? `3.5px solid ${isGreen ? '#ffffff' : textActiveColor}`
                      : '3.5px solid transparent',
                    backgroundColor: isGroupActive
                      ? !collapsed && !isExpanded
                        ? bgActive
                        : isGreen
                          ? 'rgba(255, 255, 255, 0.08)'
                          : darkMode
                            ? 'rgba(30, 41, 59, 0.7)'
                            : '#f0fdf4'
                      : 'transparent',
                    color: isGroupActive ? textActiveColor : textColor,
                    fontSize: '14.5px',
                    fontWeight: isGroupActive ? '700' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={collapsed ? group.title : undefined}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isGreen
                      ? 'rgba(255, 255, 255, 0.14)'
                      : isDark
                        ? '#1e293b'
                        : '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isGroupActive
                      ? !collapsed && !isExpanded
                        ? bgActive
                        : isGreen
                          ? 'rgba(255, 255, 255, 0.08)'
                          : darkMode
                            ? 'rgba(30, 41, 59, 0.7)'
                            : '#f0fdf4'
                      : 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <GroupIcon
                      size={19}
                      style={{
                        color: isGroupActive ? textActiveColor : isGreen ? '#ffffff' : textColor,
                        flexShrink: 0,
                        transition: 'color 0.15s ease',
                      }}
                    />
                    {!collapsed && (
                      <span
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textAlign: 'left',
                          color: isGroupActive ? textActiveColor : 'inherit',
                        }}
                      >
                        {group.title}
                      </span>
                    )}
                  </div>

                  {!collapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {group.badge && !isExpanded && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: '800',
                            padding: '1.5px 5.5px',
                            borderRadius: '4px',
                            backgroundColor: isGreen ? '#ffffff' : '#15803d',
                            color: isGreen ? '#15803d' : '#ffffff',
                          }}
                        >
                          {group.badge}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronDown size={16} style={{ color: isGroupActive ? textActiveColor : 'inherit', opacity: 0.85 }} />
                      ) : (
                        <ChevronRight size={16} style={{ color: isGroupActive ? textActiveColor : 'inherit', opacity: 0.85 }} />
                      )}
                    </div>
                  )}
                </button>

                {/* Các mục con khi mở rộng (Expanded) */}
                {!collapsed && isExpanded && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      paddingLeft: '18px',
                      marginTop: '4px',
                      borderLeft: `2px solid ${
                        isGroupActive
                          ? textActiveColor
                          : isGreen
                            ? 'rgba(255, 255, 255, 0.2)'
                            : isDark
                              ? '#334155'
                              : '#e2e8f0'
                      }`,
                      marginLeft: '18px',
                    }}
                  >
                    {group.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = activeItem === child.id;

                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleItemClick(child, group.id)}
                          title={child.desc || child.label}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: isChildActive ? bgActive : 'transparent',
                            color: isChildActive ? textActiveColor : textColor,
                            fontSize: '13.5px',
                            fontWeight: isChildActive ? '700' : '500',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isChildActive) {
                              e.currentTarget.style.backgroundColor = isGreen
                                ? 'rgba(255, 255, 255, 0.1)'
                                : isDark
                                  ? '#1e293b'
                                  : '#f8fafc';
                              e.currentTarget.style.color = textActiveColor;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isChildActive) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = textColor;
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ChildIcon
                              size={16}
                              style={{
                                color: isChildActive
                                  ? textActiveColor
                                  : isGreen
                                    ? 'rgba(255, 255, 255, 0.75)'
                                    : isDark
                                      ? '#94a3b8'
                                      : '#64748b',
                                flexShrink: 0,
                                transition: 'color 0.15s ease',
                              }}
                            />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {child.label}
                            </span>
                          </div>

                          {child.badge && (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: '800',
                                padding: '1.5px 5.5px',
                                borderRadius: '4px',
                                backgroundColor: isGreen ? '#ffffff' : '#15803d',
                                color: isGreen ? '#15803d' : '#ffffff',
                              }}
                            >
                              {child.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Menu Flyout Popover khi Sidebar ở chế độ thu nhỏ (Collapsed) */}
                {collapsed && flyoutGroup === group.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'fixed',
                      left: '85px',
                      top: `${flyoutTop}px`,
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                      borderRadius: '14px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.18)',
                      padding: '10px',
                      width: '240px',
                      maxHeight: '80vh',
                      overflowY: 'auto',
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: '700',
                        color: textActiveColor,
                        padding: '4px 8px 8px',
                        borderBottom: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
                        marginBottom: '6px',
                      }}
                    >
                      {group.title}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {group.children.map((child) => {
                        const SubIcon = child.icon;
                        const isChildActive = activeItem === child.id;

                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFlyoutGroup(null);
                              handleItemClick(child, group.id);
                            }}
                            title={child.desc || child.label}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: isChildActive ? bgActive : 'transparent',
                              color: isChildActive ? textActiveColor : textColor,
                              fontSize: '13px',
                              fontWeight: isChildActive ? '700' : '500',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <SubIcon size={15} />
                              <span>{child.label}</span>
                            </div>
                            {child.badge && (
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: '800',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: '#15803d',
                                  color: '#ffffff',
                                }}
                              >
                                {child.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Phần dưới: Profile Card & Cài đặt (Đồng bộ chuẩn AdminSidebar) */}
      <div
        style={{
          padding: '14px 12px',
          borderTop: `1px solid ${isGreen ? 'rgba(255, 255, 255, 0.15)' : isDark ? '#1e293b' : '#f1f5f9'}`,
          backgroundColor: isGreen
            ? 'rgba(0, 0, 0, 0.08)'
            : isDark
              ? '#090d16'
              : '#fafafa',
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <div
            style={{
              backgroundColor: isGreen
                ? 'rgba(255, 255, 255, 0.12)'
                : isDark
                  ? '#1e293b'
                  : '#ffffff',
              borderRadius: '12px',
              border: `1px solid ${isGreen ? 'rgba(255, 255, 255, 0.2)' : isDark ? '#334155' : '#e2e8f0'}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '46px',
              margin: '0 auto',
              padding: '8px 0',
              gap: '8px',
              position: 'relative',
            }}
          >
            {/* Avatar thu nhỏ */}
            <div
              onClick={() => navigate(ROUTES.PROFILE || '/profile')}
              title="Xem thông tin hồ sơ"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: isGreen ? '#ffffff' : '#15803d',
                color: isGreen ? '#15803d' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '13px',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                border: isGreen ? '2px solid rgba(255, 255, 255, 0.4)' : '2px solid #e2e8f0',
              }}
            >
              {user?.avatarUrl && !avatarLoadError ? (
                <img
                  src={avatarSrc}
                  alt={user?.displayName || 'User'}
                  onError={() => setAvatarLoadError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                user?.displayName?.slice(0, 2)?.toUpperCase() || 'US'
              )}
            </div>

            {/* Nút Cài đặt bên dưới Avatar */}
            <button
              ref={settingsBtnRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSettingsPopup((prev) => !prev);
              }}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: showSettingsPopup
                  ? (isGreen ? 'rgba(255, 255, 255, 0.25)' : darkMode ? '#334155' : '#dcfce7')
                  : 'transparent',
                color: showSettingsPopup
                  ? (isGreen ? '#ffffff' : '#15803d')
                  : (isGreen ? 'rgba(255, 255, 255, 0.85)' : darkMode ? '#cbd5e1' : '#64748b'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Cài đặt tài khoản"
              onMouseEnter={(e) => {
                if (!showSettingsPopup) e.currentTarget.style.backgroundColor = isGreen ? 'rgba(255, 255, 255, 0.15)' : darkMode ? '#334155' : '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                if (!showSettingsPopup) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Settings size={18} />
            </button>

            {/* Flyout popup sang bên phải khi thu nhỏ */}
            {showSettingsPopup && (
              <div
                ref={settingsPopupRef}
                style={{
                  position: 'fixed',
                  left: isFloating ? '96px' : '82px',
                  bottom: isFloating ? '24px' : '14px',
                  width: '210px',
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18)',
                  padding: '6px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                <div
                  style={{
                    padding: '8px 10px',
                    borderBottom: `1px solid ${darkMode ? '#334155' : '#f1f5f9'}`,
                    marginBottom: '4px',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: darkMode ? '#f8fafc' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.displayName || 'Người dùng'}
                  </p>
                  <span style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                    {user?.email}
                  </span>
                </div>


                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsPopup(false);
                    setIsSettingsModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: darkMode ? '#cbd5e1' : '#334155',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Settings size={16} color="#2563eb" />
                  <span>Cài đặt</span>
                </button>

                <div style={{ height: '1px', backgroundColor: darkMode ? '#334155' : '#f1f5f9', margin: '2px 0' }} />

                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsPopup(false);
                    logout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(220, 38, 38, 0.15)' : '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <LogOut size={16} color="#dc2626" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: isGreen
                ? 'rgba(255, 255, 255, 0.12)'
                : isDark
                  ? '#1e293b'
                  : '#ffffff',
              borderRadius: '12px',
              border: `1px solid ${isGreen ? 'rgba(255, 255, 255, 0.2)' : isDark ? '#334155' : '#e2e8f0'}`,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              position: 'relative',
            }}
          >
            {/* Popup lên trên khi mở rộng */}
            {showSettingsPopup && (
              <div
                ref={settingsPopupRef}
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.18)',
                  padding: '6px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  animation: 'fadeIn 0.15s ease',
                }}
              >

                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsPopup(false);
                    setIsSettingsModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: darkMode ? '#cbd5e1' : '#334155',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Settings size={16} color="#2563eb" />
                  <span>Cài đặt</span>
                </button>

                <div style={{ height: '1px', backgroundColor: darkMode ? '#334155' : '#f1f5f9', margin: '2px 0' }} />

                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsPopup(false);
                    logout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#dc2626',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = darkMode ? 'rgba(220, 38, 38, 0.15)' : '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <LogOut size={16} color="#dc2626" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}

            {/* Thông tin tài khoản: Avatar + Tên/Role + Icon Cài đặt */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
              }}
            >
              {/* Avatar */}
              <div
                onClick={() => navigate(ROUTES.PROFILE || '/profile')}
                title="Nhấp để xem chi tiết hồ sơ"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: isGreen ? '#ffffff' : '#15803d',
                  color: isGreen ? '#15803d' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '14px',
                  flexShrink: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
                  border: isGreen ? '2px solid rgba(255, 255, 255, 0.4)' : '2px solid #e2e8f0',
                }}
              >
                {user?.avatarUrl && !avatarLoadError ? (
                  <img
                    src={avatarSrc}
                    alt={user?.displayName || 'User'}
                    onError={() => setAvatarLoadError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  user?.displayName?.slice(0, 2)?.toUpperCase() || 'US'
                )}
              </div>

              {/* Tên & Role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '13.5px',
                    fontWeight: '600',
                    color: isGreen ? '#ffffff' : isDark ? '#f8fafc' : '#1e293b',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={user?.displayName || user?.email || 'Người dùng'}
                >
                  {user?.displayName || user?.email || 'Người dùng'}
                </p>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    color: isGreen ? 'rgba(255, 255, 255, 0.9)' : '#15803d',
                    fontWeight: '600',
                  }}
                >
                  <UserCheck size={13} />
                  <span>Người dùng (User)</span>
                </span>
              </div>

              {/* Icon Cài đặt bên phải */}
              <button
                ref={settingsBtnRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettingsPopup((prev) => !prev);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: showSettingsPopup
                    ? (isGreen ? 'rgba(255, 255, 255, 0.25)' : darkMode ? '#334155' : '#dcfce7')
                    : 'transparent',
                  color: showSettingsPopup
                    ? (isGreen ? '#ffffff' : '#15803d')
                    : (isGreen ? 'rgba(255, 255, 255, 0.85)' : darkMode ? '#cbd5e1' : '#64748b'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
                title="Cài đặt tài khoản"
                onMouseEnter={(e) => {
                  if (!showSettingsPopup) e.currentTarget.style.backgroundColor = isGreen ? 'rgba(255, 255, 255, 0.15)' : darkMode ? '#334155' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  if (!showSettingsPopup) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        initialTab="usage"
      />

      {/* Toast thông báo tính năng đang phát triển */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: darkMode ? '#1e293b' : '#0f172a',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            fontSize: '13.5px',
            fontWeight: '600',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Sparkles size={16} color="#eab308" />
          <span>{toastMessage}</span>
        </div>
      )}
    </aside>
  );
};

export default UserSidebar;
