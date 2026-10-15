import logoImg from '@/assets/images/6.svg';
import { useTheme } from '@/context/ThemeContext';

/**
 * Màn hình chào mừng khi chưa có tin nhắn - đồng bộ giao diện tối giản với
 * AiWelcomeHero.jsx (trang AI Coach): logo lớn + lời chào, kèm vài gợi ý
 * hành động tập trung vào việc VIẾT và TỐI ƯU nội dung CV (không phải các
 * thao tác quản lý mục chung chung).
 */
const CvAiWelcomeHero = ({ prompts = [], onSelectPrompt }) => {
  const { darkMode } = useTheme();
  const isDark = darkMode;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        maxWidth: '460px',
        margin: '0 auto',
        width: '100%',
        textAlign: 'center',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <img src={logoImg} alt="LemoGuide AI" style={{ width: '96px', height: '96px', objectFit: 'contain' }} />
      </div>

      <h1
        style={{
          fontSize: '20px',
          fontWeight: '800',
          color: isDark ? '#f8fafc' : '#0f172a',
          letterSpacing: '-0.02em',
          margin: '0 0 8px',
        }}
      >
        Trợ lý Viết &amp; Tối ưu CV
      </h1>

      <p style={{ margin: '0 0 22px', fontSize: '13px', lineHeight: 1.6, color: isDark ? '#94a3b8' : '#64748b' }}>
        Nhờ AI viết mới hoặc tối ưu lại nội dung CV theo chuẩn ATS, hoặc bấm vào một gợi ý dưới đây để bắt đầu.
      </p>

      {prompts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          {prompts.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.title}
                type="button"
                onClick={() => onSelectPrompt?.(p.prompt)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: isDark ? '#161f30' : '#ffffff',
                  border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#15803d';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark ? '#1e293b' : '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '9px',
                    backgroundColor: isDark ? 'rgba(21, 128, 61, 0.2)' : '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={15} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a', marginBottom: '2px' }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.4 }}>{p.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CvAiWelcomeHero;
