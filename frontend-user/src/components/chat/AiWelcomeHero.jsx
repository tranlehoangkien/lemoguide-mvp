import React from 'react';
import logoImg from '@/assets/images/7.svg';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import AiTopicNav from './AiTopicNav';

const AiWelcomeHero = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();

  const isDark = darkMode;
  const userName = user?.displayName || user?.fullName || user?.profile?.fullName || user?.email?.split('@')[0] || '';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        maxWidth: '860px',
        margin: '0 auto',
        width: '100%',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* AI Avatar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <img
          src={logoImg}
          alt="LemoGuide AI"
          style={{
            width: '170px',
            height: '170px',
            objectFit: 'contain',
          }}
        />
      </div>

      {/* Greeting Title */}
      <h1
        style={{
          fontSize: '28px',
          fontWeight: '700',
          color: isDark ? '#f8fafc' : '#0f172a',
          letterSpacing: '-0.025em',
          margin: 0,
          textAlign: 'center',
        }}
      >
        {userName ? `Xin chào, ${userName}!` : 'Xin chào!'}
      </h1>

      {/* Gợi ý 4 hướng trọng tâm để người dùng bắt đầu nhanh, tránh mông lung
          trước một khung chat trống */}
      <p
        style={{
          fontSize: '14px',
          color: isDark ? '#94a3b8' : '#64748b',
          margin: '10px 0 0',
          textAlign: 'center',
        }}
      >
        Bạn muốn LemoGuide AI hỗ trợ điều gì hôm nay?
      </p>
      <AiTopicNav />
    </div>
  );
};

export default AiWelcomeHero;

