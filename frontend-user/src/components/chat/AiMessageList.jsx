import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  FileText,
  ChevronDown,
  UserCheck,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';
import { ROUTES } from '@/constants/routes';

import { renderFormattedContent } from '@/utils/markdownRenderer';


// Thẻ hành động gắn dưới tin nhắn trích xuất CV -> Dynamic Profile: "Áp dụng vào
// Profile" khi còn pending, chuyển thành tóm tắt kết quả + "Xem Profile" sau khi áp dụng.
const ProfileImportCard = ({ messageId, profileImport, isDark }) => {
  const navigate = useNavigate();
  const { applyProfileImport } = useChat();
  const { status, result, error } = profileImport;

  const cardStyle = {
    marginTop: '12px',
    padding: '14px 16px',
    borderRadius: '12px',
    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4',
    border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#bbf7d0'}`,
    maxWidth: '420px',
  };

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#15803d',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  };

  if (status === 'applied') {
    const createdTotal = Object.values(result?.created || {}).reduce((sum, n) => sum + n, 0);
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: '13.5px', fontWeight: '600', color: isDark ? '#34d399' : '#15803d', marginBottom: '4px' }}>
          ✅ Đã áp dụng {createdTotal} mục vào Profile của bạn
        </div>
        {result?.skipped?.length > 0 && (
          <div style={{ fontSize: '12.5px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '10px' }}>
            Bỏ qua {result.skipped.length} mục: {result.skipped.slice(0, 3).join('; ')}
            {result.skipped.length > 3 ? '…' : ''}
          </div>
        )}
        <button type="button" onClick={() => navigate(ROUTES.PROFILE)} style={buttonStyle}>
          <ExternalLink size={14} />
          <span>Xem Profile</span>
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {error && (
        <div style={{ fontSize: '12.5px', color: '#dc2626', marginBottom: '8px' }}>⚠️ {error}</div>
      )}
      <button
        type="button"
        onClick={() => applyProfileImport(messageId)}
        disabled={status === 'applying'}
        style={{ ...buttonStyle, opacity: status === 'applying' ? 0.7 : 1, cursor: status === 'applying' ? 'default' : 'pointer' }}
      >
        {status === 'applying' ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
        <span>{status === 'applying' ? 'Đang áp dụng...' : 'Áp dụng vào Profile'}</span>
      </button>
    </div>
  );
};

const AiMessageList = () => {
  const { darkMode } = useTheme();
  const { activeConversation, isTyping, regenerateLastMessage, toggleMessageFeedback } = useChat();

  const [copiedId, setCopiedId] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const listContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const isDark = darkMode;
  const messages = activeConversation?.messages || [];

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Kiểm tra vị trí scroll để hiển thị nút cuộn xuống
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 160);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyMessage = (msgId, content) => {
    navigator.clipboard?.writeText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      ref={listContainerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const isLastAssistant = !isUser && index === messages.length - 1;

          if (isUser) {
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  {/* File attachment preview if attached */}
                  {msg.file && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                        border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                        marginBottom: '6px',
                        fontSize: '12.5px',
                        color: isDark ? '#f8fafc' : '#0f172a',
                      }}
                    >
                      <FileText size={15} color="#15803d" />
                      <span style={{ fontWeight: '600' }}>{msg.file.name}</span>
                      <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>({msg.file.size})</span>
                    </div>
                  )}

                  {/* User Bubble */}
                  <div
                    style={{
                      padding: '12px 18px',
                      borderRadius: '20px',
                      backgroundColor: '#15803d',
                      color: '#ffffff',
                      fontSize: '15px',
                      lineHeight: '1.55',
                      boxShadow: '0 2px 8px rgba(21, 128, 61, 0.2)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          }

          // AI Assistant Message (ChatGPT / Claude Style: Clean, Borderless)
          return (
            <div
              key={msg.id}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Formatted Content - Pure content like Claude / ChatGPT */}
              <div
                style={{
                  width: '100%',
                  fontSize: '15.5px',
                  lineHeight: '1.75',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  wordBreak: 'break-word',
                }}
              >
                {renderFormattedContent(msg.content, isDark)}
              </div>

              {msg.profileImport && (
                <ProfileImportCard messageId={msg.id} profileImport={msg.profileImport} isDark={isDark} />
              )}

              {/* Action Toolbar on Assistant Message */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px',
                }}
              >
                {/* Copy Button */}
                <button
                  type="button"
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  title="Sao chép câu trả lời"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12.5px',
                    color: copiedId === msg.id ? '#15803d' : isDark ? '#94a3b8' : '#64748b',
                    padding: '3px 6px',
                    borderRadius: '5px',
                    transition: 'color 0.15s',
                  }}
                >
                  {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === msg.id ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>

                {/* Thumbs Up */}
                <button
                  type="button"
                  onClick={() => toggleMessageFeedback(msg.id, 'like')}
                  title="Hài lòng với câu trả lời"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: msg.isLiked ? '#15803d' : isDark ? '#94a3b8' : '#64748b',
                    padding: '3px 6px',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ThumbsUp size={14} fill={msg.isLiked ? '#15803d' : 'none'} />
                </button>

                {/* Thumbs Down */}
                <button
                  type="button"
                  onClick={() => toggleMessageFeedback(msg.id, 'dislike')}
                  title="Chưa hài lòng"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: msg.isDisliked ? '#dc2626' : isDark ? '#94a3b8' : '#64748b',
                    padding: '3px 6px',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ThumbsDown size={14} fill={msg.isDisliked ? '#dc2626' : 'none'} />
                </button>

                {/* Regenerate Button on last assistant message */}
                {isLastAssistant && !isTyping && (
                  <button
                    type="button"
                    onClick={regenerateLastMessage}
                    title="Tạo lại câu trả lời"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      color: isDark ? '#94a3b8' : '#64748b',
                      padding: '3px 6px',
                      borderRadius: '5px',
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Tạo lại</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* AI Typing / Thinking Indicator */}
        {isTyping && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 0',
              color: isDark ? '#34d399' : '#15803d',
            }}
          >
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span className="typing-dot" style={{ animationDelay: '0ms', fontSize: '18px' }}>•</span>
              <span className="typing-dot" style={{ animationDelay: '180ms', fontSize: '18px' }}>•</span>
              <span className="typing-dot" style={{ animationDelay: '360ms', fontSize: '18px' }}>•</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} style={{ height: '10px' }} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          title="Cuộn xuống tin nhắn mới nhất"
          style={{
            position: 'sticky',
            bottom: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            color: isDark ? '#f8fafc' : '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            zIndex: 15,
          }}
        >
          <ChevronDown size={18} />
        </button>
      )}
    </div>
  );
};

export default AiMessageList;
