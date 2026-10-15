import React from 'react';
import { Compass } from 'lucide-react';

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
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(13, 148, 136, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(245, 158, 11, 0.06) 0px, transparent 50%)',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
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
              backgroundColor: '#f0fdfa',
              color: 'var(--color-brand-primary)',
              border: '1px solid rgba(13, 148, 136, 0.2)',
              marginBottom: 'var(--spacing-4)',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.15)',
            }}
          >
            <Compass size={32} />
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
            {title || 'LemoGuide'}
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {subtitle || 'Khám phá hành trình du lịch & trải nghiệm tuyệt vời'}
          </p>
        </div>

        {/* Card Container */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-8)',
            boxShadow: 'var(--shadow-card)',
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
          &copy; {new Date().getFullYear()} LemoGuide. Đồng hành cùng mọi chuyến đi.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
