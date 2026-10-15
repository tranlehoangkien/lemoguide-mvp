import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Target, Search, Wand2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { aiConversationService } from '@/services/aiConversationService';
import { aiModelService } from '@/services/aiModelService';
import { cvProfileService } from '@/services/cvProfileService';
import { extractCvPatch } from '@/utils/cvAiPatch';
import CvAiChatHeader from './CvAiChatHeader';
import CvAiWelcomeHero from './CvAiWelcomeHero';
import CvAiMessageList from './CvAiMessageList';
import CvAiChatInput from './CvAiChatInput';

const conversationTitleFor = (cvId) => `AI CV Builder #${cvId}`;

// Gợi ý hành động tập trung vào việc VIẾT và TỐI ƯU nội dung CV (không phải
// thao tác quản lý mục chung chung) - hiển thị ở màn hình chào mừng và làm
// chip nhanh trong ô nhập liệu.
const CV_WRITING_PROMPTS = [
  {
    icon: Sparkles,
    label: 'Tối ưu tóm tắt mục tiêu',
    title: 'Viết tóm tắt mục tiêu nghề nghiệp',
    desc: 'Đoạn giới thiệu ngắn gọn, ấn tượng, chuẩn ATS dựa trên kinh nghiệm hiện có',
    prompt: 'Hãy viết giúp tôi đoạn tóm tắt mục tiêu nghề nghiệp (professional summary) ngắn gọn, ấn tượng, chuẩn ATS dựa trên các thông tin hiện có trong CV của tôi.',
  },
  {
    icon: Target,
    label: 'Chuẩn STAR cho kinh nghiệm',
    title: 'Tối ưu kinh nghiệm theo chuẩn STAR',
    desc: 'Viết lại mô tả công việc theo Tình huống - Nhiệm vụ - Hành động - Kết quả, kèm số liệu',
    prompt: 'Hãy viết lại phần mô tả kinh nghiệm làm việc gần nhất của tôi theo công thức STAR (Situation - Task - Action - Result), ưu tiên động từ hành động mạnh và số liệu định lượng cụ thể.',
  },
  {
    icon: Search,
    label: 'Gợi ý từ khóa ATS',
    title: 'Gợi ý từ khóa chuẩn ATS',
    desc: 'Phân tích và đề xuất từ khóa quan trọng cho vị trí bạn đang ứng tuyển',
    prompt: 'Hãy phân tích CV hiện tại của tôi và gợi ý các từ khóa (keywords) quan trọng nên bổ sung vào phần kỹ năng và kinh nghiệm để tối ưu tỷ lệ vượt qua bộ lọc ATS.',
  },
  {
    icon: Wand2,
    label: 'Rút gọn mô tả dự án',
    title: 'Rút gọn & làm nổi bật dự án',
    desc: 'Viết súc tích hơn, nhấn mạnh vai trò và thành tích cụ thể trong từng dự án',
    prompt: 'Hãy rút gọn và viết lại phần mô tả các dự án trong CV của tôi sao cho súc tích, làm nổi bật vai trò và thành tích cụ thể của tôi trong từng dự án.',
  },
];

const mapHistoryMessage = (m) => {
  const { displayText } = m.sender === 'assistant' ? extractCvPatch(m.content) : { displayText: m.content };
  return { id: m.id, sender: m.sender, content: displayText };
};

/**
 * Cột trợ lý AI bên trái trang chỉnh sửa CV - giao diện đồng bộ với trang AI
 * Coach (components/chat/*). Tự tìm/khởi tạo cuộc hội thoại AI (category
 * CV_OPTIMIZATION) gắn với CV đang chỉnh sửa, gửi kèm dữ liệu CV hiện tại
 * (`data`) dưới dạng JSON context mỗi lượt chat, và gọi `onApplyPatch(patch)`
 * khi AI trả về khối ```cvpatch``` - việc merge patch vào state CV thật +
 * đánh dấu "có thay đổi chưa lưu" do trang cha đảm nhiệm để nhất quán với
 * các thao tác chỉnh sửa thủ công khác.
 */
const CvAiAssistantPanel = ({ cvId, cvName, data, onApplyPatch }) => {
  const { darkMode } = useTheme();
  const isDark = darkMode;

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);

  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!cvId) return;
    let cancelled = false;

    (async () => {
      try {
        const [activeModels, conversations] = await Promise.all([
          aiModelService.getActiveModels(),
          aiConversationService.listConversations({ category: 'CV_OPTIMIZATION' }).catch(() => []),
        ]);
        if (cancelled) return;
        setModels(activeModels || []);

        const marker = conversationTitleFor(cvId);
        const existing = (conversations || []).find((c) => c.title && c.title.startsWith(marker));
        if (existing) {
          setConversationId(existing.id);
          setSelectedModelId(existing.modelId || activeModels?.[0]?.id || null);
          try {
            const detail = await aiConversationService.getConversation(existing.id, { size: 100 });
            if (!cancelled) setMessages((detail.messages || []).map(mapHistoryMessage));
          } catch (err) {
            console.error('Lỗi tải lịch sử hội thoại AI:', err);
          }
        } else {
          setSelectedModelId(activeModels?.[0]?.id || null);
        }
      } catch (err) {
        console.error('Lỗi khởi tạo trợ lý AI:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cvId]);

  const ensureConversation = useCallback(async () => {
    if (conversationId) return conversationId;
    const created = await aiConversationService.createConversation({
      category: 'CV_OPTIMIZATION',
      modelId: selectedModelId || null,
      title: `${conversationTitleFor(cvId)} - ${cvName || ''}`.trim(),
    });
    setConversationId(created.id);
    if (!selectedModelId && created.modelId) setSelectedModelId(created.modelId);
    return created.id;
  }, [conversationId, selectedModelId, cvId, cvName]);

  // `displayText` cho phép hiển thị một nội dung ngắn gọn hơn trong bong bóng chat
  // (VD khi gửi nguyên văn CV trích xuất từ PDF) trong khi vẫn gửi `text` đầy đủ cho AI.
  const handleSendMessage = async (text, displayText) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, sender: 'user', content: displayText || trimmed }]);
    setIsTyping(true);

    try {
      const convId = await ensureConversation();
      const context = JSON.stringify(dataRef.current || {});
      const { assistantMessage } = await aiConversationService.sendMessage(convId, { content: trimmed, context });

      const { displayText: patchDisplayText, patch } = extractCvPatch(assistantMessage.content);
      setMessages((prev) => [...prev, { id: assistantMessage.id, sender: 'assistant', content: patchDisplayText || assistantMessage.content }]);

      if (patch) {
        onApplyPatch(patch);
      }
    } catch (err) {
      console.error('Lỗi trò chuyện với AI:', err);
      const reason = err.message || 'Không thể kết nối tới AI.';
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, sender: 'assistant', content: `⚠️ ${reason} Vui lòng thử lại sau ít phút.` }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Tải PDF CV lên: trích xuất text ở backend (PDFBox, chưa OCR) rồi gửi qua đúng
  // luồng chat CV Builder hiện có (context + CV_BUILDER_MODE_INSTRUCTIONS -> cvpatch)
  // để AI đọc và điền vào các mục CV - không có pipeline "extract" riêng biệt.
  const handleFileUpload = async (file) => {
    if (!file || isTyping) return;
    const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setMessages((prev) => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: '⚠️ Hiện tại mới hỗ trợ tải lên file PDF có văn bản (chưa hỗ trợ Word/ảnh/scan). Vui lòng chọn file .pdf.',
      }]);
      return;
    }

    setIsTyping(true);
    try {
      const text = await cvProfileService.extractPdfText(file);
      const instruction = `Day la noi dung trich xuat tu file CV PDF toi vua tai len ("${file.name}"). Hay doc va `
        + 'dien/cap nhat cac muc CV con thieu hoac chua chinh xac (thong tin ca nhan, hoc van, kinh nghiem, du an, '
        + 'ky nang, chung chi, giai thuong, so thich, nguoi gioi thieu) dua tren dung noi dung nay, KHONG bia them '
        + `thong tin khong co trong CV:\n\n${text}`;
      setIsTyping(false);
      await handleSendMessage(instruction, `📄 Đã tải lên "${file.name}" - đang phân tích và điền vào CV...`);
    } catch (err) {
      setIsTyping(false);
      console.error('Lỗi trích xuất PDF:', err);
      const reason = err.message || 'Không thể đọc file PDF này.';
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, sender: 'assistant', content: `⚠️ ${reason}` }]);
    }
  };

  const handleSelectModel = async (modelId) => {
    setSelectedModelId(modelId);
    if (conversationId) {
      try {
        await aiConversationService.updateConversation(conversationId, { modelId });
      } catch (err) {
        console.error('Lỗi đổi model AI:', err);
      }
    }
  };

  // Bắt đầu đoạn chat mới: xóa lịch sử hiển thị và quên hội thoại hiện tại -
  // lượt gửi tin nhắn tiếp theo sẽ tạo một ai_conversation mới cho CV này
  // (xem ensureConversation), model AI đang chọn vẫn được giữ nguyên.
  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  const DEFAULT_WIDTH = 480;
  const MIN_WIDTH = 340;
  const MAX_WIDTH = 640;

  const [panelWidth, setPanelWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('cv_ai_panel_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_WIDTH;
  });

  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const startX = panelRef.current ? panelRef.current.getBoundingClientRect().left : 0;

    const handleMouseMove = (moveEvent) => {
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, moveEvent.clientX - startX));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = (upEvent) => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const finalWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, upEvent.clientX - startX));
      setPanelWidth(finalWidth);
      try {
        localStorage.setItem('cv_ai_panel_width', String(finalWidth));
      } catch {
        // ignore
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleResetWidth = useCallback(() => {
    setPanelWidth(DEFAULT_WIDTH);
    try {
      localStorage.setItem('cv_ai_panel_width', String(DEFAULT_WIDTH));
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      ref={panelRef}
      style={{
        flex: `0 0 ${panelWidth}px`,
        width: `${panelWidth}px`,
        minWidth: `${MIN_WIDTH}px`,
        maxWidth: `${MAX_WIDTH}px`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        borderRight: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
        backgroundColor: isDark ? '#0b1329' : '#f8fafc',
        transition: isResizing ? 'none' : 'width 0.1s ease',
      }}
    >
      <CvAiChatHeader models={models} selectedModelId={selectedModelId} onSelectModel={handleSelectModel} onNewChat={handleNewChat} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {messages.length > 0 ? (
          <CvAiMessageList messages={messages} isTyping={isTyping} />
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <CvAiWelcomeHero prompts={CV_WRITING_PROMPTS} onSelectPrompt={handleSendMessage} />
          </div>
        )}
      </div>

      <CvAiChatInput onSendMessage={handleSendMessage} onFileUpload={handleFileUpload} isTyping={isTyping} />

      {/* Thanh kéo điều chỉnh độ rộng cột AI */}
      <div
        onMouseDown={handleResizeStart}
        onDoubleClick={handleResetWidth}
        title="Kéo để điều chỉnh độ rộng (nhấp đúp để về mặc định 480px)"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '6px',
          height: '100%',
          cursor: 'col-resize',
          zIndex: 20,
          userSelect: 'none',
          backgroundColor: isResizing ? '#10b981' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#cbd5e1';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      />
    </div>
  );
};

export default CvAiAssistantPanel;
