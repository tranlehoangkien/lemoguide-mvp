import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import logoImg from '@/assets/lemoguide-png.png';
import userAuthBg from '@/assets/user-auth-bg.jpg';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import './login.css';

const FIELD_ORDER = ['fullName', 'email', 'password', 'confirmPassword'];

const PasswordField = ({ inputRef, name, label, placeholder, value, visible, onToggle, onChange, error, autoComplete }) => (
  <div className="login-field">
    <label htmlFor={`register-${name}`} className="login-label">
      {label}
    </label>
    <div className="login-input-wrap">
      <Lock size={18} className="login-input-icon" aria-hidden="true" />
      <input
        ref={inputRef}
        id={`register-${name}`}
        type={visible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="login-input"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `register-${name}-error` : undefined}
      />
      <button
        type="button"
        className="login-toggle"
        onClick={onToggle}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
    {error && (
      <span id={`register-${name}-error`} className="login-error">
        {error}
      </span>
    )}
  </div>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (formError) setFormError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu tối thiểu 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Bạn cần đồng ý với điều khoản dịch vụ';
    }

    setErrors(newErrors);

    const firstInvalid = FIELD_ORDER.find((name) => newErrors[name]);
    const fieldRefs = { fullName: fullNameRef, email: emailRef, password: passwordRef, confirmPassword: confirmPasswordRef };
    if (firstInvalid) fieldRefs[firstInvalid].current?.focus();

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError('');

    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Đăng ký không thành công, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <aside className="login-visual">
        <img src={userAuthBg} alt="" className="login-visual-img" fetchPriority="high" decoding="async" />

        <div className="login-brand">
          <img src={logoImg} alt="" className="login-brand-logo" />
          <span className="login-brand-name">LemoGuide</span>
        </div>

        <div className="login-tagline">
          <p className="login-tagline-title">Bắt đầu hành trình nghề nghiệp cùng LemoGuide.</p>
          <p className="login-tagline-text">Tạo tài khoản miễn phí để dựng CV, tìm việc phù hợp và hỏi trợ lý AI.</p>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-main">
          <div className="login-form-wrap">
            <h1 className="login-title">Tạo tài khoản</h1>
            <p className="login-subtitle">Đăng ký miễn phí để bắt đầu.</p>

            {formError && (
              <div className="login-alert" role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="login-form" aria-busy={loading}>
              <div className="login-field">
                <label htmlFor="register-fullName" className="login-label">
                  Họ và tên
                </label>
                <div className="login-input-wrap">
                  <User size={18} className="login-input-icon" aria-hidden="true" />
                  <input
                    ref={fullNameRef}
                    id="register-fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn An"
                    autoComplete="name"
                    className="login-input"
                    aria-invalid={errors.fullName ? 'true' : 'false'}
                    aria-describedby={errors.fullName ? 'register-fullName-error' : undefined}
                  />
                </div>
                {errors.fullName && (
                  <span id="register-fullName-error" className="login-error">
                    {errors.fullName}
                  </span>
                )}
              </div>

              <div className="login-field">
                <label htmlFor="register-email" className="login-label">
                  Email
                </label>
                <div className="login-input-wrap">
                  <Mail size={18} className="login-input-icon" aria-hidden="true" />
                  <input
                    ref={emailRef}
                    id="register-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    autoComplete="email"
                    spellCheck={false}
                    className="login-input"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'register-email-error' : undefined}
                  />
                </div>
                {errors.email && (
                  <span id="register-email-error" className="login-error">
                    {errors.email}
                  </span>
                )}
              </div>

              <PasswordField
                inputRef={passwordRef}
                name="password"
                label="Mật khẩu"
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                visible={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
                onChange={handleChange}
                error={errors.password}
                autoComplete="new-password"
              />

              <PasswordField
                inputRef={confirmPasswordRef}
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((prev) => !prev)}
                onChange={handleChange}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />

              <button type="submit" disabled={loading} className="login-submit">
                {loading && <span className="login-spinner" aria-hidden="true" />}
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              </button>
            </form>

            <p className="login-switch">
              Đã có tài khoản?{' '}
              <Link to={ROUTES.LOGIN} className="login-link">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>

        <footer className="login-footer">&copy; {new Date().getFullYear()} LemoGuide</footer>
      </main>
    </div>
  );
};

export default RegisterPage;
