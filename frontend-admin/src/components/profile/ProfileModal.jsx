import { useState, useRef, useEffect } from 'react';
import { Camera, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getFullAvatarUrl } from '@/services/apiClient';
import { FormModal, TextField, FormAlert, Avatar, Badge } from '@/components/ui';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateMyProfile, uploadMyAvatar } = useAuth();

  const [fullName, setFullName] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      setFullName(user.displayName || '');
      setCurrentTitle(user.currentTitle || '');
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen, user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Dung lượng ảnh không được vượt quá 5MB');
      return;
    }

    setAvatarUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await uploadMyAvatar(file);
      setSuccessMsg('Cập nhật ảnh đại diện thành công!');
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi tải ảnh đại diện');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await updateMyProfile({
        fullName: fullName.trim(),
        currentTitle: currentTitle.trim(),
      });
      setSuccessMsg('Cập nhật thông tin cá nhân thành công!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Cập nhật thông tin thất bại');
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc = user?.avatarUrl ? getFullAvatarUrl(user.avatarUrl) : null;

  return (
    <FormModal
      open={isOpen}
      title="Thông tin cá nhân"
      description="Xem và chỉnh sửa hồ sơ tài khoản của bạn"
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={loading}
      cancelLabel="Đóng"
      submitLabel="Lưu thay đổi"
    >
      <FormAlert tone="success">{successMsg}</FormAlert>
      <FormAlert>{errorMsg}</FormAlert>

      <div className="ui-person" style={{ alignItems: 'center' }}>
        <Avatar size={64} name={user?.displayName || 'AD'} src={avatarSrc} />
        <div>
          <label
            className="ui-btn ui-btn--secondary ui-btn--sm" style={{ cursor: 'pointer' }}>
            <Camera size={14} aria-hidden="true" />
            <span>{avatarUploading ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="ui-sr-only"
              disabled={avatarUploading}
              onChange={handleAvatarChange}
            />
          </label>
          <p className="ui-hint" style={{ margin: '6px 0 0' }}>
            Tối đa 5MB, định dạng PNG, JPG hoặc WEBP.
          </p>
        </div>
      </div>

      <TextField label="Email đăng nhập" value={user?.email || ''} disabled readOnly />

      <div className="ui-field">
        <span className="ui-label">Vai trò và quyền hạn</span>
        <div className="ui-chip-row">
          <Badge tone="info">
            <ShieldCheck size={12} aria-hidden="true" />
            {user?.role === 'ADMIN' ? 'Quản trị viên (ADMIN)' : 'Người dùng (USER)'}
          </Badge>
          <Badge tone="success">Đang hoạt động</Badge>
        </div>
      </div>

      <TextField
        label="Họ và tên"
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Nhập họ và tên đầy đủ..."
      />

      <TextField
        label="Chức danh / Tiêu đề nghề nghiệp"
        value={currentTitle}
        onChange={(e) => setCurrentTitle(e.target.value)}
        placeholder="Ví dụ: Super Admin, Frontend Developer..."
      />
    </FormModal>
  );
};

export default ProfileModal;
