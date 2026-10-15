import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * Thanh trên cùng của cột trợ lý AI - đồng bộ giao diện với AiChatHeader.jsx
 * (trang AI Coach): nút chọn model dạng pill với chấm trạng thái xanh, và
 * nút "New Chat" để bắt đầu cuộc trò chuyện mới với CV hiện tại.
 */
const CvAiChatHeader = ({ models, selectedModelId, onSelectModel, onNewChat }) => {
  const { darkMode } = useTheme();
  const isDark = darkMode;

  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!showModelDropdown) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelDropdown]);

  const currentModel = models.find((m) => m.id === selectedModelId) || models[0] || null;

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 30,
        height: '58px',
        borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}
    >
      <div ref={dropdownRef} style={{ position: 'relative', zIndex: 40 }}>
        <button
          type="button"
          onClick={() => setShowModelDropdown((v) => !v)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6.5px 13px', borderRadius: '9px',
            backgroundColor: isDark ? '#1e293b' : '#f1f5f9', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            color: isDark ? '#f8fafc' : '#0f172a', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
          }}
        >
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span>{currentModel ? (currentModel.name || currentModel.modelName) : 'Chọn Model'}</span>
          <ChevronDown size={14} color={isDark ? '#94a3b8' : '#64748b'} />
        </button>

        {showModelDropdown && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              borderRadius: '12px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
              padding: '6px',
              width: '240px',
              maxHeight: '320px',
              overflowY: 'auto',
              zIndex: 100,
            }}
          >
            {models.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                Chưa có model AI nào được cấu hình
              </div>
            ) : (
              models.map((m) => {
                const isSelected = m.id === selectedModelId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(m.id);
                      setShowModelDropdown(false);
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', borderRadius: '8px', border: 'none',
                      backgroundColor: isSelected ? (isDark ? '#0f172a' : '#dcfce7') : 'transparent',
                      color: isSelected ? (isDark ? '#34d399' : '#15803d') : (isDark ? '#f8fafc' : '#0f172a'),
                      fontSize: '13px', fontWeight: isSelected ? '700' : '500', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600' }}>{m.name || m.modelName}</div>
                      <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>{m.provider}</div>
                    </div>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onNewChat}
        title="Bắt đầu đoạn chat mới"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6.5px 14px', borderRadius: '9px',
          backgroundColor: isDark ? 'rgba(52, 211, 153, 0.12)' : '#dcfce7', border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.3)' : '#86efac'}`,
          color: isDark ? '#34d399' : '#15803d', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isDark ? 'rgba(52, 211, 153, 0.2)' : '#bbf7d0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isDark ? 'rgba(52, 211, 153, 0.12)' : '#dcfce7';
        }}
      >
        <Plus size={15} strokeWidth={2.5} />
        <span>New Chat</span>
      </button>
    </div>
  );
};

export default CvAiChatHeader;
