import UsagePanel from './UsagePanel';
import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  ShieldCheck,
  Settings,
  Sparkles,
  Link2,
  Sun,
  Moon,
  Lock,
  Check,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { userProfileService } from '@/services/userProfileService';
import {
  Modal,
  SearchBox,
  Badge,
  Button,
  TextField,
  FormAlert,
  EmptyState,
} from '@/components/ui';

const SETTINGS_SECTIONS = [
  {
    group: 'Settings',
    groupLabel: 'Cài đặt',
    items: [
      { id: 'usage', label: 'Giới hạn & Sử dụng', enLabel: 'Usage', icon: BarChart3 },
      { id: 'security', label: 'Bảo mật & Mật khẩu', enLabel: 'Privacy & Security', icon: ShieldCheck },
      { id: 'general', label: 'Cài đặt chung', enLabel: 'General', icon: Settings },
    ],
  },
  {
    group: 'Customize',
    groupLabel: 'Tùy chỉnh & CV',
    items: [
      { id: 'skills', label: 'Kỹ năng chuyên môn', enLabel: 'Skills', icon: Sparkles },
      { id: 'contacts', label: 'Kênh liên lạc', enLabel: 'Connectors', icon: Link2 },
    ],
  },
];

const SIDEBAR_STYLES = [
  { id: 'light', name: 'Trắng thanh lịch', desc: 'Sạch sẽ, nhẹ nhàng' },
  { id: 'green', name: 'Xanh Lemo đặc trưng', desc: 'Tông xanh rừng tự nhiên' },
  { id: 'dark', name: 'Đen Slate hiện đại', desc: 'Bảo vệ mắt khi làm việc' },
  { id: 'floating', name: 'Thẻ nổi sang trọng', desc: 'Bo góc nổi tinh tế' },
];

const PanelHead = ({ title, description }) => (
  <div>
    <h3 className="ui-card__title">{title}</h3>
    {description && (
      <p className="ui-hint" style={{ margin: '4px 0 0' }}>
        {description}
      </p>
    )}
  </div>
);

const SettingsModal = ({ isOpen, onClose, initialTab = 'usage' }) => {
  const { changePassword } = useAuth();
  const { darkMode, toggleDarkMode, sidebarStyle, setSidebarStyle } = useTheme();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // User skills & contacts data state
  const [userSkills, setUserSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [userContacts, setUserContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Khởi tạo khi mở modal
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'usage');
      setSearchQuery('');
      setPasswordSuccessMsg('');
      setPasswordErrorMsg('');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Fetch user skills & contacts
      setLoadingSkills(true);
      userProfileService.getSkills()
        .then((data) => setUserSkills(data || []))
        .catch(() => setUserSkills([]))
        .finally(() => setLoadingSkills(false));

      setLoadingContacts(true);
      userProfileService.getContacts()
        .then((data) => setUserContacts(data || []))
        .catch(() => setUserContacts([]))
        .finally(() => setLoadingContacts(false));
    }
  }, [isOpen, initialTab]);

  // Xử lý đổi mật khẩu
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (!passwordData.currentPassword) {
      setPasswordErrorMsg('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
      setPasswordErrorMsg('Mật khẩu mới phải có tối thiểu 8 ký tự');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setSavingPassword(true);
      if (changePassword) {
        await changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
      } else {
        await userProfileService.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
      }
      setPasswordSuccessMsg('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccessMsg(''), 4000);
    } catch (err) {
      setPasswordErrorMsg(err?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Lọc sections theo Search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SETTINGS_SECTIONS;
    const q = searchQuery.toLowerCase().trim();
    return SETTINGS_SECTIONS.map((group) => {
      const filteredItems = group.items.filter(
        (it) =>
          it.label.toLowerCase().includes(q) ||
          it.enLabel.toLowerCase().includes(q) ||
          it.id.toLowerCase().includes(q)
      );
      return { ...group, items: filteredItems };
    }).filter((group) => group.items.length > 0);
  }, [searchQuery]);

  const setPasswordField = (field) => (e) => setPasswordData((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal open={isOpen} title="Cài đặt" description="Giao diện, bảo mật và thông tin tài khoản của bạn." size="xl" className="ui-settings-modal" onClose={onClose}>
      <div className="ui-settings">
        <nav className="ui-settings__nav" aria-label="Các mục cài đặt">
          <SearchBox
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Tìm cài đặt..."
            label="Tìm cài đặt"
          />
          {filteredSections.length === 0 && <p className="ui-hint">Không tìm thấy mục phù hợp.</p>}
          {filteredSections.map((group) => (
            <div key={group.group} className="ui-settings__group">
              <span className="ui-settings__group-label">{group.groupLabel}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="ui-settings__item"
                    aria-current={activeTab === item.id ? 'page' : undefined}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <section key={activeTab} className="ui-settings__panel" aria-label={SETTINGS_SECTIONS.flatMap((group) => group.items).find((item) => item.id === activeTab)?.label} tabIndex={0}>
          {activeTab === 'usage' && (
            <>
              <PanelHead title="Giới hạn và sử dụng" description="Theo dõi hạn mức sử dụng AI và phiên làm việc hiện tại của bạn." />

              <UsagePanel />
            </>
          )}

          {activeTab === 'security' && (
            <>
              <PanelHead title="Bảo mật và mật khẩu" description="Quản lý mật khẩu và quyền riêng tư bảo mật tài khoản." />

              <form onSubmit={handlePasswordSubmit} noValidate className="ui-form">
                <FormAlert tone="success">{passwordSuccessMsg}</FormAlert>
                <FormAlert>{passwordErrorMsg}</FormAlert>
                <TextField
                  label="Mật khẩu hiện tại"
                  type="password"
                  autoComplete="current-password"
                  value={passwordData.currentPassword}
                  onChange={setPasswordField('currentPassword')}
                  placeholder="••••••••"
                />
                <TextField
                  label="Mật khẩu mới"
                  type="password"
                  autoComplete="new-password"
                  value={passwordData.newPassword}
                  onChange={setPasswordField('newPassword')}
                  placeholder="Tối thiểu 8 ký tự"
                />
                <TextField
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  autoComplete="new-password"
                  value={passwordData.confirmPassword}
                  onChange={setPasswordField('confirmPassword')}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <div>
                  <Button type="submit" icon={Lock} loading={savingPassword}>
                    {savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                  </Button>
                </div>
              </form>

              <div className="ui-callout" style={{ justifyContent: 'flex-start' }}>
                <Shield size={22} className="ui-section-icon" aria-hidden="true" />
                <div>
                  <strong>Trạng thái bảo mật phiên</strong>
                  <div className="ui-hint">
                    Không chia sẻ mật khẩu. Hãy đăng xuất khi sử dụng thiết bị dùng chung.
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'general' && (
            <>
              <PanelHead
                title="Cài đặt chung"
                description="Chọn chế độ hiển thị và phong cách thanh bên. Thay đổi được lưu tự động trên trình duyệt này."
              />

              <div className="ui-detail-section" style={{ marginTop: 0 }}>
                <h4>Chế độ hiển thị</h4>
                <div className="ui-choice-grid">
                  <button
                    type="button"
                    className="ui-choice"
                    aria-pressed={!darkMode}
                    onClick={() => darkMode && toggleDarkMode()}
                  >
                    <Sun size={18} aria-hidden="true" />
                    <span>
                      <strong>Giao diện Sáng</strong>
                      <small>Nền sáng, rõ ràng</small>
                    </span>
                    {!darkMode && <Check size={16} aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    className="ui-choice"
                    aria-pressed={darkMode}
                    onClick={() => !darkMode && toggleDarkMode()}
                  >
                    <Moon size={18} aria-hidden="true" />
                    <span>
                      <strong>Giao diện Tối</strong>
                      <small>Nền tối, dịu mắt</small>
                    </span>
                    {darkMode && <Check size={16} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="ui-detail-section" style={{ marginTop: 0 }}>
                <h4>Phong cách thanh bên</h4>
                <div className="ui-choice-grid">
                  {SIDEBAR_STYLES.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="ui-choice"
                      aria-pressed={sidebarStyle === opt.id}
                      onClick={() => setSidebarStyle(opt.id)}
                    >
                      <span>
                        <strong>{opt.name}</strong>
                        <small>{opt.desc}</small>
                      </span>
                      {sidebarStyle === opt.id && <Check size={16} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'skills' && (
            <>
              <PanelHead
                title="Kỹ năng chuyên môn"
                description="Xem nhanh kỹ năng chuyên môn của bạn. Để chỉnh sửa đầy đủ, hãy truy cập trang Chi tiết hồ sơ."
              />
              {loadingSkills ? (
                <EmptyState icon={Sparkles} title="Đang tải kỹ năng..." />
              ) : userSkills.length === 0 ? (
                <EmptyState icon={Sparkles} title="Chưa có kỹ năng nào được lưu" />
              ) : (
                <div className="ui-cols-2">
                  {userSkills.map((sk) => (
                    <div key={sk.id} className="ui-contact">
                      <div style={{ minWidth: 0 }}>
                        <strong>{sk.skillName || `Kỹ năng #${sk.skillId}`}</strong>
                        <div className="ui-hint">
                          {sk.languageLevel ? `Trình độ: ${sk.languageLevel}`
                            : sk.proficiencyLevel == null ? 'Mức thành thạo: Chưa đánh giá' : `Thành thạo: ${sk.proficiencyLevel}%`}
                          {sk.source === 'CAREER_PLAN' && <span> · Từ lộ trình học</span>}
                        </div>
                      </div>
                      <Sparkles size={16} className="ui-section-icon" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'contacts' && (
            <>
              <PanelHead title="Kênh liên lạc" description="Các kênh liên kết đã kết nối với hồ sơ của bạn." />
              {loadingContacts ? (
                <EmptyState icon={Link2} title="Đang tải kênh liên lạc..." />
              ) : userContacts.length === 0 ? (
                <EmptyState icon={Link2} title="Chưa có kênh liên lạc nào" />
              ) : (
                <div className="ui-cols-2">
                  {userContacts.map((c) => (
                    <div key={c.id} className="ui-contact">
                      <div className="ui-contact__main">
                        <span className="ui-contact__icon">
                          <Link2 size={16} aria-hidden="true" />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="ui-hint">{c.type}</div>
                          <strong style={{ overflowWrap: 'anywhere' }}>{c.value}</strong>
                        </div>
                      </div>
                      {c.isPrimary && <Badge tone="warning">Chính</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </Modal>
  );
};

export default SettingsModal;
