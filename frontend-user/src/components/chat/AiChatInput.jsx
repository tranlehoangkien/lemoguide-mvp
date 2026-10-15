import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useChat } from '@/context/ChatContext';

const AiChatInput = () => {
  const { darkMode } = useTheme();
  const { sendMessage, isTyping, stopGenerating, importProfileFromCv } = useChat();

  const [inputVal, setInputVal] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const cvToProfileInputRef = useRef(null);

  const isDark = darkMode;

  // Auto-resize textarea smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 46), 180);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputVal]);

  const handleSend = () => {
    if (isTyping) {
      stopGenerating();
      return;
    }

    if (!inputVal.trim() && !attachedFile) return;

    sendMessage(inputVal.trim(), attachedFile);
    setInputVal('');
    setAttachedFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = '46px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Dung lượng tệp tối đa cho phép là 10MB!');
        return;
      }
      setAttachedFile(file);
      e.target.value = '';
    }
  };

  // Nút "Tạo Profile từ CV" luôn mở picker riêng và gọi thẳng luồng trích xuất có cấu
  // trúc (importProfileFromCv) - không còn điền sẵn text vào ô chat như trước, vì đó
  // là bước gửi tin nhắn hội thoại thường, không thực sự đọc được nội dung file.
  const handleCreateProfileFromCv = () => {
    cvToProfileInputRef.current?.click();
  };

  const handleCvForProfileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Dung lượng tệp tối đa cho phép là 10MB!');
        return;
      }
      e.target.value = '';
      importProfileFromCv(file);
    }
  };

  const canSend = inputVal.trim().length > 0 || !!attachedFile;

  return (
    <div
      style={{
        width: '100%',
        padding: '0 20px 18px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'transparent',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Main Floating Input Box (ChatGPT & Claude Style) */}
        <div
          style={{
            width: '100%',
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            border: `1.5px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            borderRadius: '20px',
            boxShadow: isDark
              ? '0 8px 30px rgba(0, 0, 0, 0.4)'
              : '0 8px 30px rgba(0, 0, 0, 0.08)',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        >
          {/* File Attachment Chip (if attached) */}
          {attachedFile && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '10px',
                backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
                maxWidth: 'fit-content',
                fontSize: '12.5px',
                color: isDark ? '#f8fafc' : '#0f172a',
              }}
            >
              <FileText size={15} color="#15803d" />
              <span style={{ fontWeight: '600', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {attachedFile.name}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                ({(attachedFile.size / 1024).toFixed(1)} KB)
              </span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  color: '#94a3b8',
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Textarea Field */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi bất kỳ điều gì về CV, định hướng nghề nghiệp, phỏng vấn..."
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              lineHeight: '1.5',
              color: isDark ? '#f8fafc' : '#0f172a',
              resize: 'none',
              fontFamily: 'inherit',
              padding: '4px 6px',
            }}
          />

          {/* Action Row inside Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '4px',
            }}
          >
            {/* Left Tools (Attach file, Quick tag) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelected}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Đính kèm CV dạng PDF"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 10px',
                  borderRadius: '9px',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  color: isDark ? '#cbd5e1' : '#64748b',
                  fontSize: '12.5px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#15803d';
                  e.currentTarget.style.borderColor = '#15803d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isDark ? '#cbd5e1' : '#64748b';
                  e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0';
                }}
              >
                <Paperclip size={15} />
                <span>Đính kèm</span>
              </button>

              <input
                ref={cvToProfileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleCvForProfileSelected}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={handleCreateProfileFromCv}
                title="Tải lên CV để AI tự động trích xuất thông tin và tạo Dynamic Profile"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 11px',
                  borderRadius: '9px',
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4',
                  border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.35)' : '#bbf7d0'}`,
                  color: isDark ? '#34d399' : '#15803d',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(16, 185, 129, 0.22)' : '#dcfce7';
                  e.currentTarget.style.borderColor = '#15803d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(16, 185, 129, 0.35)' : '#bbf7d0';
                }}
              >
                <Sparkles size={14} />
                <span>Tạo Profile từ CV</span>
              </button>
            </div>

            {/* Right: Send / Stop button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend && !isTyping}
              title={isTyping ? 'Dừng phản hồi' : 'Gửi tin nhắn (Enter)'}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isTyping
                  ? '#dc2626'
                  : canSend
                    ? '#15803d'
                    : isDark
                      ? '#334155'
                      : '#e2e8f0',
                color: isTyping
                  ? '#ffffff'
                  : canSend
                    ? '#ffffff'
                    : isDark
                      ? '#64748b'
                      : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canSend || isTyping ? 'pointer' : 'default',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: canSend ? '0 2px 10px rgba(21, 128, 61, 0.35)' : 'none',
              }}
            >
              {isTyping ? (
                <Square size={16} fill="#ffffff" />
              ) : (
                <ArrowUp size={19} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Disclaimer Note */}
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '11.5px',
            color: isDark ? '#64748b' : '#94a3b8',
            textAlign: 'center',
            letterSpacing: '0.01em',
          }}
        >
          LemoGuide AI có thể đưa ra câu trả lời chưa chính xác. Vui lòng kiểm tra lại các thông tin quan trọng.
        </p>
      </div>
    </div>
  );
};

export default AiChatInput;
