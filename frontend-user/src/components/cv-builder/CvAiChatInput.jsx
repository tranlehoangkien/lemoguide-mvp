import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * Ô nhập liệu dạng nổi (floating pill) - đồng bộ giao diện với
 * AiChatInput.jsx (trang AI Coach), điều khiển qua props thay vì ChatContext
 * vì trợ lý AI của CV quản lý state hội thoại riêng theo từng CV.
 */
const CvAiChatInput = ({ onSendMessage, onFileUpload, isTyping }) => {
  const { darkMode } = useTheme();
  const isDark = darkMode;

  const [inputVal, setInputVal] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 46), 180);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputVal]);

  const handleSend = () => {
    if (!inputVal.trim() || isTyping) return;
    onSendMessage(inputVal.trim());
    setInputVal('');
    if (textareaRef.current) textareaRef.current.style.height = '46px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Gửi lên và xử lý ngay khi chọn file (không có bước "đính kèm rồi bấm gửi" -
  // phản hồi hiển thị dưới dạng bong bóng chat do component cha thêm vào).
  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload?.(file);
      e.target.value = '';
    }
  };

  const canSend = inputVal.trim().length > 0 && !isTyping;

  return (
    <div style={{ width: '100%', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, position: 'relative', zIndex: 10 }}>
      <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div
          style={{
            width: '100%',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            borderRadius: '20px',
            boxShadow: isDark ? '0 8px 30px rgba(0, 0, 0, 0.4)' : '0 8px 30px rgba(0, 0, 0, 0.08)',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi LemoGuide AI hoặc nhập kinh nghiệm, kỹ năng để thêm vào CV..."
            style={{
              width: '100%', backgroundColor: 'transparent', border: 'none', outline: 'none',
              fontSize: '14.5px', lineHeight: '1.5', color: isDark ? '#f8fafc' : '#0f172a',
              resize: 'none', fontFamily: 'inherit', padding: '4px 6px',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelected} style={{ display: 'none' }} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Tải lên CV dạng PDF để AI tự động điền vào các mục"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 10px', borderRadius: '9px',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  color: isDark ? '#cbd5e1' : '#64748b', fontSize: '12.5px', fontWeight: '500', cursor: 'pointer',
                }}
              >
                <Paperclip size={15} />
                <span>Đính kèm</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              title="Gửi tin nhắn (Enter)"
              style={{
                width: '38px', height: '38px', borderRadius: '50%', border: 'none',
                backgroundColor: canSend ? '#15803d' : (isDark ? '#334155' : '#e2e8f0'),
                color: canSend ? '#ffffff' : (isDark ? '#64748b' : '#94a3b8'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: canSend ? 'pointer' : 'default',
                boxShadow: canSend ? '0 2px 10px rgba(21, 128, 61, 0.35)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <ArrowUp size={19} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <p style={{ margin: '8px 0 0', fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8', textAlign: 'center' }}>
          LemoGuide AI có thể đưa ra câu trả lời chưa chính xác. Nhấn Shift + Enter để xuống dòng.
        </p>
      </div>
    </div>
  );
};

export default CvAiChatInput;
