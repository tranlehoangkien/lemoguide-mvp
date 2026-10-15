import { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

import { renderFormattedContent } from '@/utils/markdownRenderer';


/**
 * Khung hiển thị hội thoại - đồng bộ giao diện với AiMessageList.jsx (trang
 * AI Coach): bong bóng xanh bo tròn cho người dùng, nội dung markdown
 * "trần" (không khung) cho AI kèm nút Sao chép.
 */
const CvAiMessageList = ({ messages, isTyping }) => {
  const { darkMode } = useTheme();
  const isDark = darkMode;

  const [copiedId, setCopiedId] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 160);
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleCopyMessage = (msgId, content) => {
    navigator.clipboard?.writeText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          if (isUser) {
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '11px 16px',
                    borderRadius: '18px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    fontSize: '14px',
                    lineHeight: '1.55',
                    boxShadow: '0 2px 8px rgba(21, 128, 61, 0.2)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '100%', fontSize: '14.5px', lineHeight: '1.7', color: isDark ? '#f8fafc' : '#0f172a', wordBreak: 'break-word' }}>
                {renderFormattedContent(msg.content, isDark)}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                  title="Sao chép câu trả lời"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '11.5px', color: copiedId === msg.id ? '#15803d' : (isDark ? '#94a3b8' : '#64748b'), padding: '3px 6px', borderRadius: '5px',
                  }}
                >
                  {copiedId === msg.id ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedId === msg.id ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 0', color: isDark ? '#34d399' : '#15803d' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span className="cv-ai-typing-dot" style={{ animationDelay: '0ms' }}>•</span>
              <span className="cv-ai-typing-dot" style={{ animationDelay: '180ms' }}>•</span>
              <span className="cv-ai-typing-dot" style={{ animationDelay: '360ms' }}>•</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} style={{ height: '4px' }} />
      </div>

      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          title="Cuộn xuống tin nhắn mới nhất"
          style={{
            position: 'sticky', bottom: '8px', width: '32px', height: '32px', borderRadius: '50%',
            backgroundColor: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)', cursor: 'pointer', zIndex: 15,
          }}
        >
          <ChevronDown size={16} />
        </button>
      )}

      <style>{`
        .cv-ai-typing-dot { font-size: 18px; display: inline-block; animation: cvAiBounce 1.2s infinite ease-in-out; }
        @keyframes cvAiBounce { 0%, 80%, 100% { opacity: 0.35; transform: scale(0.7); } 40% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default CvAiMessageList;
