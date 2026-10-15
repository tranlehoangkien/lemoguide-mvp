import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Info, Lock, Mail } from 'lucide-react';
import logoImg from '@/assets/lemoguide-png.png';
import adminAuthBg from '@/assets/admin-auth-bg.jpg';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import './login.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (formError) setFormError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập Email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu tối thiểu 6 ký tự';
    }

    setErrors(newErrors);

    if (newErrors.email) emailRef.current?.focus();
    else if (newErrors.password) passwordRef.current?.focus();

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice('');
    if (!validate()) return;

    setLoading(true);
    setFormError('');

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Đăng nhập không thành công, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setFormError('');
    setNotice('Vui lòng liên hệ Super Admin để đặt lại mật khẩu.');
  };

  return (
    <div className="login-shell">
      <aside className="login-visual">
        <img
          src={adminAuthBg}
          alt=""
          className="login-visual-img"
          fetchPriority="high"
          decoding="async"
        />

        <div className="login-brand">
          <img src={logoImg} alt="" className="login-brand-logo" />
          <span className="login-brand-name">LemoGuide</span>
          <span className="login-brand-scope">Admin</span>
        </div>

        <div className="login-tagline">
          <p className="login-tagline-title">Vận hành LemoGuide từ một nơi.</p>
          <p className="login-tagline-text">
            Quản lý người dùng, mẫu CV, mô hình AI và nội dung nghề nghiệp.
          </p>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-main">
          <div className="login-form-wrap">
            <h1 className="login-title">Đăng nhập</h1>
            <p className="login-subtitle">Chào mừng quay lại. Nhập thông tin để tiếp tục.</p>

            {formError && (
              <div className="login-alert" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            {notice && (
              <div className="login-alert login-alert--info" role="status">
                <Info size={18} aria-hidden="true" />
                <span>{notice}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="login-form" aria-busy={loading}>
              <div className="login-field">
                <label htmlFor="login-email" className="login-label">
                  Email
                </label>
                <div className="login-input-wrap">
                  <Mail size={18} className="login-input-icon" aria-hidden="true" />
                  <input
                    ref={emailRef}
                    id="login-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="admin@lemoguide.com"
                    autoComplete="email"
                    spellCheck={false}
                    className="login-input"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'login-email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <span id="login-email-error" className="login-error">
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="login-field">
                <div className="login-label-row">
                  <label htmlFor="login-password" className="login-label">
                    Mật khẩu
                  </label>
                  <button type="button" className="login-link" onClick={handleForgotPassword}>
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="login-input-wrap">
                  <Lock size={18} className="login-input-icon" aria-hidden="true" />
                  <input
                    ref={passwordRef}
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    className="login-input"
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="login-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span id="login-password-error" className="login-error">
                    {errors.password}
                  </span>
                )}
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                {loading && <span className="login-spinner" aria-hidden="true" />}
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          </div>
        </div>

        <footer className="login-footer">
          &copy; {new Date().getFullYear()} LemoGuide. Chỉ dành cho quản trị viên.
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
