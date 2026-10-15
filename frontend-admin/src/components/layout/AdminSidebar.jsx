import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Contact2,
  FileText,
  Eye,
  Database,
  GraduationCap,
  Cpu,
  Sparkles,
  TrendingUp,
  Star,
  PieChart,
  Settings,
  Shield,
  Sliders,
  History,
  ChevronDown,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Trophy,
  Globe,
  Newspaper,
  UsersRound,
  Camera,
  Loader2,
  User,
  BarChart3,
  ClipboardList,
  LayoutTemplate,
  Bot,
  Key,
  MessageSquareCode,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import logoImg from '@/assets/lemoguide-png.png';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ROUTES } from '@/constants/routes';
import { useAdminPermissions } from '@/services/adminPermissions';
import { getFullAvatarUrl } from '@/services/apiClient';
import ProfileModal from '@/components/profile/ProfileModal';

const NETWORK_PATHS = [
  [ROUTES.NETWORK_OVERVIEW, 'network_overview'],
  [ROUTES.NETWORK_MEMBERS, 'network_members'],
  [ROUTES.NETWORK_POSTS, 'network_posts'],
  [ROUTES.NETWORK_REPORTS, 'network_reports'],
  [ROUTES.NETWORK_COHORTS, 'network_cohorts'],
  [ROUTES.NETWORK_MENTORING, 'network_mentoring'],
  [ROUTES.NETWORK_CHALLENGES, 'network_challenges'],
];

/** Sidebar item for a LemoNetwork admin path (every page lives directly under /network/). */
/** Reports and system settings pages -> sidebar item + group (both resolvers below use it). */
const CONSOLE_PATHS = [
  [ROUTES.REPORT_TECHNOLOGIES, 'top_tech', 'reports'],
  [ROUTES.REPORT_SKILLS, 'top_skill', 'reports'],
  [ROUTES.REPORT_TARGET_MODES, 'target_mode_ratio', 'reports'],
  [ROUTES.REPORT_PUBLIC_CVS, 'top_public_cv', 'reports'],
  [ROUTES.SETTINGS_PERMISSIONS, 'roles_permissions', 'settings'],
  [ROUTES.SETTINGS_PUBLISH_MODE, 'publish_mode_config', 'settings'],
  [ROUTES.SETTINGS_ACTIVITY_LOG, 'activity_log', 'settings'],
];
const consoleItemFor = (p) => CONSOLE_PATHS.find(([path]) => p === path || p.startsWith(`${path}/`)) || null;

const networkItemFor = (p) => {
  const match = NETWORK_PATHS.find(([path]) => p === path || p.startsWith(`${path}/`));
  return match ? match[1] : null;
};

// Cấu trúc Sidebar chuẩn theo Schema V1__create_tables.sql (Dynamic CV System)
const navigationGroups = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    isDirect: true,
    path: ROUTES.DASHBOARD,
  },
  {
    id: 'user_management',
    title: 'Quản lý Người dùng',
    icon: Users,
    children: [
      { id: 'users', label: 'Quản lý Người dùng', icon: Users, path: ROUTES.USERS, desc: 'account & user_information' },
      { id: 'admins', label: 'Quản lý Quản trị viên', icon: ShieldCheck, path: ROUTES.ADMINS, desc: 'Ban quản trị hệ thống' },
      { id: 'roles', label: 'Quản lý Vai trò', icon: Shield, path: ROUTES.ROLES, desc: 'Phân quyền & vai trò' },
    ],
  },
  {
    id: 'lemonetwork',
    title: 'Quản lý LemoNetwork',
    icon: Globe,
    children: [
      { id: 'network_overview', label: 'Tổng quan cộng đồng', icon: BarChart3, path: ROUTES.NETWORK_OVERVIEW, desc: 'Số liệu hoạt động LemoNetwork' },
      { id: 'network_members', label: 'Thành viên', icon: Users, path: ROUTES.NETWORK_MEMBERS, desc: 'network_profile' },
      { id: 'network_posts', label: 'Bài viết & bình luận', icon: Newspaper, path: ROUTES.NETWORK_POSTS, desc: 'network_post & network_comment' },
      { id: 'network_reports', label: 'Báo cáo vi phạm', icon: ShieldCheck, path: ROUTES.NETWORK_REPORTS, desc: 'network_report' },
      { id: 'network_cohorts', label: 'Nhóm học', icon: UsersRound, path: ROUTES.NETWORK_COHORTS, desc: 'network_cohort' },
      { id: 'network_mentoring', label: 'Mentor', icon: GraduationCap, path: ROUTES.NETWORK_MENTORING, desc: 'network_mentor_request' },
      { id: 'network_challenges', label: 'Thử thách tuần', icon: Trophy, path: ROUTES.NETWORK_CHALLENGES, desc: 'network_challenge' },
    ],
  },
  {
    id: 'cv_management',
    title: 'Quản lý CV',
    icon: FileText,
    children: [
      {
        id: 'cv_overview',
        label: 'Tổng quan & Thống kê',
        icon: BarChart3,
        path: ROUTES.CV_OVERVIEW,
        desc: 'Tổng quan & Thống kê CV',
      },
      {
        id: 'cv_user_list',
        label: 'Danh sách CV người dùng',
        icon: ClipboardList,
        path: ROUTES.CV_USER_LIST,
        desc: 'Danh sách CV người dùng',
      },
      {
        id: 'cv_templates',
        label: 'Template CV',
        icon: LayoutTemplate,
        path: ROUTES.CV_TEMPLATES,
        desc: 'Template CV',
      },
    ],
  },
  {
    id: 'ai_management',
    title: 'Quản lý AI',
    icon: Bot,
    children: [
      {
        id: 'ai_model_key',
        label: 'Model & API Key',
        icon: Key,
        path: ROUTES.AI_MODELS,
        desc: 'Model & API Key',
      },
      {
        id: 'ai_prompt_templates',
        label: 'Prompt Templates',
        icon: MessageSquareCode,
        path: ROUTES.AI_PROMPT_TEMPLATES,
        desc: 'Prompt Templates AI',
      },
      {
        id: 'ai_usage_logs',
        label: 'Nhật ký sử dụng (Usage Logs)',
        icon: BarChart3,
        path: ROUTES.AI_USAGE_LOGS,
        desc: 'Nhật ký sử dụng AI',
      },
      {
        id: 'ai_credits_plans',
        label: 'Gói & Giới hạn (Credits/Plans)',
        icon: CreditCard,
        path: ROUTES.AI_PLANS,
        desc: 'Gói & Giới hạn (Credits/Plans)',
      },
    ],
  },
  {
    id: 'career_management',
    title: 'Việc làm và Khóa học',
    icon: Briefcase,
    children: [
      { id: 'job_postings', label: 'Việc làm', icon: Briefcase, path: ROUTES.JOB_POSTINGS, desc: 'job_posting' },
      { id: 'courses', label: 'Khóa học', icon: GraduationCap, path: ROUTES.COURSES, desc: 'course' },
    ],
  },
  {
    id: 'master_data',
    title: 'Danh mục dữ liệu',
    icon: Database,
    badge: 'CORE',
    children: [
      { id: 'major', label: 'Chuyên ngành', icon: GraduationCap, path: ROUTES.MAJORS, desc: 'major' },
      { id: 'technology', label: 'Công nghệ', icon: Cpu, path: ROUTES.TECHNOLOGIES, desc: 'technology & categories' },
      { id: 'skill', label: 'Kỹ năng', icon: Sparkles, path: ROUTES.SKILLS, desc: 'skill (hard/soft/lang)' },
    ],
  },
  {
    id: 'reports',
    title: 'Thống kê & Báo cáo',
    icon: TrendingUp,
    children: [
      { id: 'top_tech', label: 'Top công nghệ phổ biến', icon: Cpu, path: ROUTES.REPORT_TECHNOLOGIES, desc: 'experience & project tech' },
      { id: 'top_skill', label: 'Top kỹ năng được dùng', icon: Star, path: ROUTES.REPORT_SKILLS, desc: 'user_skill' },
      { id: 'target_mode_ratio', label: 'Tỷ lệ Target Mode', icon: PieChart, path: ROUTES.REPORT_TARGET_MODES, desc: 'Frontend / Backend / Fullstack' },
      { id: 'top_public_cv', label: 'CV Public xem nhiều nhất', icon: Eye, path: ROUTES.REPORT_PUBLIC_CVS, desc: 'Xếp hạng theo view_count' },
    ],
  },
  {
    id: 'settings',
    title: 'Cài đặt hệ thống',
    icon: Settings,
    children: [
      { id: 'roles_permissions', label: 'Quản lý Vai trò & Phân quyền', icon: Shield, path: ROUTES.SETTINGS_PERMISSIONS, desc: 'Quyền theo phân hệ' },
      { id: 'publish_mode_config', label: 'Cấu hình publish_mode', icon: Sliders, path: ROUTES.SETTINGS_PUBLISH_MODE, desc: 'Mặc định hệ thống' },
      { id: 'activity_log', label: 'Nhật ký hoạt động', icon: History, path: ROUTES.SETTINGS_ACTIVITY_LOG, desc: 'Audit log' },
    ],
  },
];

const AdminSidebar = ({ collapsed, mobileOpen = false }) => {
  const { user, logout, uploadMyAvatar } = useAuth();
  // Hide modules this admin was not granted: children without access, then groups left empty.
  const permissions = useAdminPermissions();
  const visibleGroups = navigationGroups
    .map((group) => (group.children ? { ...group, children: group.children.filter((c) => !c.path || permissions.canOpen(c.path)) } : group))
    .filter((group) => (group.children ? group.children.some((c) => c.path) : !group.path || permissions.canOpen(group.path)));
  const { darkMode, sidebarStyle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const avatarFileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatarUrl]);

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    avatarFileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 5MB!');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      if (typeof uploadMyAvatar === 'function') {
        await uploadMyAvatar(file);
      }
    } catch (err) {
      console.error('Lỗi khi tải ảnh đại diện:', err);
      alert(err.message || 'Không thể tải ảnh đại diện, vui lòng thử lại!');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }
    }
  };

  // Xác định active item và open group theo đường dẫn URL hiện tại
  const getInitialActive = () => {
    const p = location.pathname;
    if (networkItemFor(p)) return { item: networkItemFor(p), group: 'lemonetwork' };
    if (consoleItemFor(p)) return { item: consoleItemFor(p)[1], group: consoleItemFor(p)[2] };
    if (p === ROUTES.USERS || p.startsWith('/users')) return { item: 'users', group: 'user_management' };
    if (p === ROUTES.ADMINS || p.startsWith('/admins')) return { item: 'admins', group: 'user_management' };
    if (p === ROUTES.ROLES || p.startsWith('/roles')) return { item: 'roles', group: 'user_management' };
    if (p === ROUTES.JOB_POSTINGS || p.startsWith('/career-management/job-postings')) return { item: 'job_postings', group: 'career_management' };
    if (p === ROUTES.COURSES || p.startsWith('/career-management/courses')) return { item: 'courses', group: 'career_management' };
    if (p === ROUTES.MAJORS || p.startsWith('/master-data/majors')) return { item: 'major', group: 'master_data' };
    if (p === ROUTES.TECHNOLOGIES || p.startsWith('/master-data/technologies')) return { item: 'technology', group: 'master_data' };
    if (p === ROUTES.SKILLS || p.startsWith('/master-data/skills')) return { item: 'skill', group: 'master_data' };
    if (p === ROUTES.CV_OVERVIEW || p.startsWith('/cv-management/overview')) return { item: 'cv_overview', group: 'cv_management' };
    if (p === ROUTES.CV_USER_LIST || p.startsWith('/cv-management/user-cvs')) return { item: 'cv_user_list', group: 'cv_management' };
    if (p === ROUTES.CV_TEMPLATES || p.startsWith('/cv-management/templates')) return { item: 'cv_templates', group: 'cv_management' };
    if (p.startsWith('/cv-management')) return { item: 'cv_overview', group: 'cv_management' };
    if (p === ROUTES.AI_PROMPT_TEMPLATES || p.startsWith('/ai-management/prompt-templates')) return { item: 'ai_prompt_templates', group: 'ai_management' };
    if (p === ROUTES.AI_USAGE_LOGS || p.startsWith('/ai-management/usage-logs')) return { item: 'ai_usage_logs', group: 'ai_management' };
    if (p.startsWith('/ai-management')) return { item: 'ai_model_key', group: 'ai_management' };
    if (p === ROUTES.DASHBOARD || p === ROUTES.HOME) return { item: 'dashboard', group: null };
    return { item: 'dashboard', group: null };
  };

  const initial = getInitialActive();
  // State nhóm menu đang mở (chỉ mở 1 mục tại một thời điểm, đóng các mục còn lại)
  const [openGroup, setOpenGroup] = useState(initial.group);
  // State mục đang chọn
  const [activeItem, setActiveItem] = useState(initial.item);
  const [flyoutGroup, setFlyoutGroup] = useState(null);
  const [flyoutTop, setFlyoutTop] = useState(120);
  const [openSubMenus, setOpenSubMenus] = useState({});

  const toggleSubMenu = (e, itemId) => {
    e.stopPropagation();
    setOpenSubMenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // State Cài đặt popup và Profile Modal
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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

  useEffect(() => {
    const p = location.pathname;
    if (consoleItemFor(p)) {
      setActiveItem(consoleItemFor(p)[1]);
      if (!collapsed) setOpenGroup(consoleItemFor(p)[2]);
    } else if (networkItemFor(p)) {
      setActiveItem(networkItemFor(p));
      if (!collapsed) setOpenGroup('lemonetwork');
    } else if (p === ROUTES.USERS || p.startsWith('/users')) {
      setActiveItem('users');
      if (!collapsed) setOpenGroup('user_management');
    } else if (p === ROUTES.ADMINS || p.startsWith('/admins')) {
      setActiveItem('admins');
      if (!collapsed) setOpenGroup('user_management');
    } else if (p === ROUTES.ROLES || p.startsWith('/roles')) {
      setActiveItem('roles');
      if (!collapsed) setOpenGroup('user_management');
    } else if (p === ROUTES.JOB_POSTINGS || p.startsWith('/career-management/job-postings')) {
      setActiveItem('job_postings');
      if (!collapsed) setOpenGroup('career_management');
    } else if (p === ROUTES.COURSES || p.startsWith('/career-management/courses')) {
      setActiveItem('courses');
      if (!collapsed) setOpenGroup('career_management');
    } else if (p === ROUTES.MAJORS || p.startsWith('/master-data/majors')) {
      setActiveItem('major');
      if (!collapsed) setOpenGroup('master_data');
    } else if (p === ROUTES.TECHNOLOGIES || p.startsWith('/master-data/technologies')) {
      setActiveItem('technology');
      if (!collapsed) setOpenGroup('master_data');
    } else if (p === ROUTES.SKILLS || p.startsWith('/master-data/skills')) {
      setActiveItem('skill');
      if (!collapsed) setOpenGroup('master_data');
    } else if (p === ROUTES.CV_OVERVIEW || p.startsWith('/cv-management/overview')) {
      setActiveItem('cv_overview');
      if (!collapsed) setOpenGroup('cv_management');
    } else if (p === ROUTES.CV_USER_LIST || p.startsWith('/cv-management/user-cvs')) {
      setActiveItem('cv_user_list');
      if (!collapsed) setOpenGroup('cv_management');
    } else if (p === ROUTES.CV_TEMPLATES || p.startsWith('/cv-management/templates')) {
      setActiveItem('cv_templates');
      if (!collapsed) setOpenGroup('cv_management');
    } else if (p.startsWith('/cv-management')) {
      setActiveItem('cv_overview');
      if (!collapsed) setOpenGroup('cv_management');
    } else if (p === ROUTES.AI_PROMPT_TEMPLATES || p.startsWith('/ai-management/prompt-templates')) {
      setActiveItem('ai_prompt_templates');
      if (!collapsed) setOpenGroup('ai_management');
    } else if (p === ROUTES.AI_USAGE_LOGS || p.startsWith('/ai-management/usage-logs')) {
      setActiveItem('ai_usage_logs');
      if (!collapsed) setOpenGroup('ai_management');
    } else if (p.startsWith('/ai-management')) {
      setActiveItem('ai_model_key');
      if (!collapsed) setOpenGroup('ai_management');
    } else if (p === ROUTES.DASHBOARD || p === ROUTES.HOME) {
      setActiveItem('dashboard');
    }
  }, [location.pathname, collapsed]);

  const toggleGroup = (groupId) => {
    // Mở mục được click và tự động đóng các mục khác; bấm lại mục đang mở thì thu gọn lại
    setOpenGroup((prev) => (prev === groupId ? null : groupId));
  };

  // Color schemes based on sidebarStyle
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
      {/* Top Header / Brand */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                  Admin
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Groups */}
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
          {visibleGroups.map((group) => {
            const GroupIcon = group.icon;
            const isDirect = group.isDirect;
            const isExpanded = openGroup === group.id;
            const isGroupActive =
              activeItem === group.id ||
              (group.children &&
                group.children.some(
                  (c) =>
                    c.id === activeItem ||
                    (c.subItems && c.subItems.some((sub) => sub.id === activeItem))
                ));

            if (isDirect) {
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    setActiveItem(group.id);
                    setOpenGroup(null);
                    if (group.path) navigate(group.path);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: collapsed ? '12px 0' : '11px 14px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: activeItem === group.id ? bgActive : 'transparent',
                    color: activeItem === group.id ? textActiveColor : textColor,
                    fontWeight: activeItem === group.id ? '700' : '500',
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: activeItem === group.id && isGreen ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  }}
                  title={collapsed ? group.title : undefined}
                >
                  <GroupIcon
                    size={20}
                    style={{
                      color: activeItem === group.id ? textActiveColor : isGreen ? '#ffffff' : textColor,
                      flexShrink: 0,
                    }}
                  />
                  {!collapsed && <span>{group.title}</span>}
                </button>
              );
            }

            return (
              <div key={group.id} style={{ position: 'relative' }}>
                {/* Group Parent Item */}
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
                      {group.badge && (
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

                {/* Sub-items (When Expanded) */}
                {!collapsed && isExpanded && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      paddingLeft: '18px',
                      marginTop: '4px',
                      borderLeft: `2px solid ${isGroupActive
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
                      const hasSubItems = Boolean(child.subItems && child.subItems.length > 0);
                      const isChildActive = activeItem === child.id;
                      const isSubChildActive = hasSubItems && child.subItems.some((s) => s.id === activeItem);
                      const isSubOpen = openSubMenus[child.id] ?? isSubChildActive;

                      if (hasSubItems) {
                        return (
                          <div key={child.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <button
                              type="button"
                              onClick={(e) => toggleSubMenu(e, child.id)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: isSubChildActive
                                  ? isGreen
                                    ? 'rgba(255, 255, 255, 0.12)'
                                    : darkMode
                                      ? 'rgba(30, 41, 59, 0.7)'
                                      : '#f0fdf4'
                                  : 'transparent',
                                color: isSubChildActive ? textActiveColor : textColor,
                                fontSize: '13.5px',
                                fontWeight: isSubChildActive ? '700' : '600',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSubChildActive) {
                                  e.currentTarget.style.backgroundColor = isGreen
                                    ? 'rgba(255, 255, 255, 0.1)'
                                    : isDark
                                      ? '#1e293b'
                                      : '#f8fafc';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSubChildActive) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                <ChildIcon
                                  size={16}
                                  style={{
                                    color: isSubChildActive
                                      ? textActiveColor
                                      : isGreen
                                        ? 'rgba(255, 255, 255, 0.75)'
                                        : darkMode
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

                              <div style={{ display: 'flex', alignItems: 'center', opacity: 0.75 }}>
                                {isSubOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </div>
                            </button>

                            {isSubOpen && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  paddingLeft: '12px',
                                  marginTop: '2px',
                                  marginBottom: '4px',
                                  borderLeft: `1.5px dashed ${isGreen
                                    ? 'rgba(255, 255, 255, 0.25)'
                                    : darkMode
                                      ? '#334155'
                                      : '#cbd5e1'
                                    }`,
                                  marginLeft: '18px',
                                }}
                              >
                                {child.subItems.map((sub) => {
                                  const SubIcon = sub.icon;
                                  const isSubActive = activeItem === sub.id;

                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() => {
                                        setActiveItem(sub.id);
                                        if (sub.path) navigate(sub.path);
                                      }}
                                      style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '7px 10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: isSubActive ? bgActive : 'transparent',
                                        color: isSubActive ? textActiveColor : textColor,
                                        fontSize: '13px',
                                        fontWeight: isSubActive ? '700' : '500',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.15s ease',
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isSubActive) {
                                          e.currentTarget.style.backgroundColor = isGreen
                                            ? 'rgba(255, 255, 255, 0.08)'
                                            : isDark
                                              ? '#1e293b'
                                              : '#f8fafc';
                                          e.currentTarget.style.color = textActiveColor;
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isSubActive) {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                          e.currentTarget.style.color = textColor;
                                        }
                                      }}
                                    >
                                      <SubIcon
                                        size={14}
                                        style={{
                                          color: isSubActive
                                            ? textActiveColor
                                            : isGreen
                                              ? 'rgba(255, 255, 255, 0.7)'
                                              : darkMode
                                                ? '#94a3b8'
                                                : '#64748b',
                                          flexShrink: 0,
                                        }}
                                      />
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {sub.label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => {
                            setActiveItem(child.id);
                            if (child.path) navigate(child.path);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
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
                          <ChildIcon
                            size={16}
                            style={{
                              color: isChildActive
                                ? textActiveColor
                                : isGreen
                                  ? 'rgba(255, 255, 255, 0.75)'
                                  : darkMode
                                    ? '#94a3b8'
                                    : '#64748b',
                              flexShrink: 0,
                              transition: 'color 0.15s ease',
                            }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {child.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Flyout Popover Menu (When Sidebar is Collapsed) */}
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
                      width: '250px',
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
                        if (child.subItems && child.subItems.length > 0) {
                          return (
                            <div key={child.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                              <div
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11.5px',
                                  fontWeight: '700',
                                  color: isDark ? '#94a3b8' : '#64748b',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {child.label}
                              </div>
                              {child.subItems.map((sub) => (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveItem(sub.id);
                                    setFlyoutGroup(null);
                                    if (sub.path) navigate(sub.path);
                                  }}
                                  style={{
                                    padding: '7px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    backgroundColor: activeItem === sub.id ? bgActive : 'transparent',
                                    color: activeItem === sub.id ? textActiveColor : textColor,
                                    fontSize: '13px',
                                    fontWeight: activeItem === sub.id ? '700' : '500',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {sub.label}
                                </button>
                              ))}
                            </div>
                          );
                        }

                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveItem(child.id);
                              setFlyoutGroup(null);
                              if (child.path) navigate(child.path);
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: activeItem === child.id ? bgActive : 'transparent',
                              color: activeItem === child.id ? textActiveColor : textColor,
                              fontSize: '13px',
                              fontWeight: activeItem === child.id ? '700' : '500',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                          >
                            {child.label}
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

      {/* Bottom Profile & Logout */}
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
            {/* Phần 1: Avatar */}
            <div
              onClick={() => setIsProfileModalOpen(true)}
              title="Thông tin cá nhân & Đổi ảnh đại diện"
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
              {isUploadingAvatar ? (
                <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              ) : user?.avatarUrl && !avatarLoadError ? (
                <img
                  src={getFullAvatarUrl(user.avatarUrl)}
                  alt={user?.displayName || 'Admin'}
                  onError={() => setAvatarLoadError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                user?.displayName?.slice(0, 2)?.toUpperCase() || 'AD'
              )}
            </div>

            {/* Phần 2: Icon Cài đặt bên dưới Avatar */}
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
                    {user?.displayName || 'Quản trị viên'}
                  </p>
                  <span style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                    {user?.email}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsPopup(false);
                    setIsProfileModalOpen(true);
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
                  <User size={16} color="#15803d" />
                  <span>Thông tin cá nhân</span>
                </button>

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
                    setIsProfileModalOpen(true);
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
                  <User size={16} color="#15803d" />
                  <span>Thông tin cá nhân</span>
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

            {/* Thông tin tài khoản: Avatar + Tên/Email/Role + Icon Cài đặt bên phải */}
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
                onClick={() => setIsProfileModalOpen(true)}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                title="Nhấp để xem hồ sơ & đổi ảnh đại diện"
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
                {isUploadingAvatar ? (
                  <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                ) : user?.avatarUrl && !avatarLoadError ? (
                  <img
                    src={getFullAvatarUrl(user.avatarUrl)}
                    alt={user?.displayName || 'Admin'}
                    onError={() => setAvatarLoadError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  user?.displayName?.slice(0, 2)?.toUpperCase() || 'AD'
                )}

                {/* Overlay camera icon khi hover */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: avatarHover && !isUploadingAvatar ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    color: '#ffffff',
                  }}
                >
                  <Camera size={14} />
                </div>
              </div>

              {/* Phần tên & role */}
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
                  title={user?.email || 'admin@lemoguide.com'}
                >
                  {user?.displayName || user?.email || 'admin@lemoguide.com'}
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
                  <ShieldCheck size={13} />
                  {user?.role === 'ADMIN' ? 'Super Admin' : (user?.currentTitle || 'Quản trị viên')}
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
                title="Cài đặt tài khoản"
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

      {/* Input ẩn để chọn file ảnh đại diện */}
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        style={{ display: 'none' }}
        onChange={handleAvatarFileChange}
      />

      {/* Modal Thông tin cá nhân */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </aside>
  );
};

export default AdminSidebar;
