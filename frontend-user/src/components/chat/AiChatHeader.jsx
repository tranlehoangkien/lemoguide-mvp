import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Download,
  Trash2,
  Plus,
  ChevronDown,
  Cpu,
  Share2,
  Check,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';

const AiChatHeader = () => {
  const { darkMode } = useTheme();
  const {
    activeConversation,
    startNewChat,
    availableModels,
    loadingModels,
    selectedModel,
    setSelectedModel,
    clearAllChats,
  } = useChat();

  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const dropdownRef = React.useRef(null);

  // Đóng dropdown khi click bên ngoài
  React.useEffect(() => {
    if (!showModelDropdown) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelDropdown]);

  const isDark = darkMode;
  const models = availableModels && availableModels.length > 0 ? availableModels : [];
  const currentModel =
    models.find(
      (m) => m.id === selectedModel || m.name === selectedModel || m.modelName === selectedModel
    ) ||
    models[0] || { name: 'Chọn Model', provider: 'AI' };

  const handleExportChat = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const textData = activeConversation.messages
      .map((m) => `[${m.sender === 'user' ? 'BẠN' : 'LEMOGUIDE AI'}] (${m.timestamp}):\n${m.content}\n`)
      .join('\n---\n\n');

    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LemoGuide_Chat_${activeConversation.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div
      style={{
        height: '58px',
        borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Left: Model Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Model dropdown button */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6.5px 13px',
              borderRadius: '9px',
              backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
              color: isDark ? '#f8fafc' : '#0f172a',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
            <span>{currentModel.name || currentModel.modelName || 'Chọn Model'}</span>
            <ChevronDown size={15} color={isDark ? '#94a3b8' : '#64748b'} />
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
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
                padding: '6px',
                width: '240px',
                zIndex: 50,
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              {loadingModels && models.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  Đang tải danh sách model...
                </div>
              ) : models.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                  Chưa có model nào trong database
                </div>
              ) : (
                models.map((m) => {
                  const isSelected =
                    m.id === selectedModel ||
                    m.modelName === selectedModel ||
                    m.name === selectedModel;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setShowModelDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: isSelected
                          ? isDark
                            ? '#0f172a'
                            : '#dcfce7'
                          : 'transparent',
                        color: isSelected
                          ? isDark
                            ? '#34d399'
                            : '#15803d'
                          : isDark
                            ? '#f8fafc'
                            : '#0f172a',
                        fontSize: '13px',
                        fontWeight: isSelected ? '700' : '500',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600' }}>{m.name || m.modelName}</div>
                        <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '2px' }}>
                          {m.provider}
                        </div>
                      </div>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick actions (New chat, Export, Share) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {activeConversation && activeConversation.messages.length > 0 && (
          <>
            <button
              type="button"
              onClick={handleExportChat}
              title="Xuất nội dung trò chuyện (TXT)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6.5px 12px',
                borderRadius: '8px',
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                color: isDark ? '#cbd5e1' : '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Download size={15} />
              <span>Xuất</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Sao chép liên kết"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6.5px 12px',
                borderRadius: '8px',
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                color: copiedNotification ? '#15803d' : isDark ? '#cbd5e1' : '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copiedNotification ? <Check size={15} /> : <Share2 size={15} />}
              <span>{copiedNotification ? 'Đã chép' : 'Chia sẻ'}</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={startNewChat}
          title="Bắt đầu đoạn chat mới"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6.5px 14px',
            borderRadius: '9px',
            backgroundColor: isDark ? 'rgba(52, 211, 153, 0.12)' : '#dcfce7',
            border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.3)' : '#86efac'}`,
            color: isDark ? '#34d399' : '#15803d',
            fontSize: '13.5px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
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
    </div>
  );
};

export default AiChatHeader;
