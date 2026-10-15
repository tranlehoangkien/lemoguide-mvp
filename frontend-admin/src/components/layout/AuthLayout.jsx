import React from 'react';
import { ShieldCheck } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-6)',
        backgroundColor: 'var(--color-bg-page)',
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(13, 148, 136, 0.15), transparent 50%)',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: 'rgba(13, 148, 136, 0.15)',
              border: '1px solid rgba(13, 148, 136, 0.3)',
              color: 'var(--color-brand-primary)',
              marginBottom: 'var(--spacing-4)',
              boxShadow: '0 0 20px rgba(13, 148, 136, 0.25)',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--spacing-2)',
            }}
          >
            {title || 'LemoGuide Admin'}
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {subtitle || 'Cổng đăng nhập bảo mật dành cho Quản trị viên'}
          </p>
        </div>

        {/* Card Container */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-8)',
            boxShadow: 'var(--shadow-card)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {children}
        </div>

        {/* Footer info */}
        <p
          style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            marginTop: 'var(--spacing-6)',
          }}
        >
          &copy; {new Date().getFullYear()} LemoGuide System. Toàn quyền bảo lưu.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
