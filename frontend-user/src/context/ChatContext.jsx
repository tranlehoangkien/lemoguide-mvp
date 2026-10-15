import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { aiModelService } from '@/services/aiModelService';
import { aiConversationService } from '@/services/aiConversationService';
import { cvProfileService } from '@/services/cvProfileService';
import { profileImportService } from '@/services/profileImportService';
import { AI_TOPICS, topicToBackendCategory } from '@/constants/aiTopics';
import { useAuth } from '@/context/AuthContext';

const ChatContext = createContext(null);

const ACTIVE_ID_KEY = 'lemoguide_ai_active_chat_id';

const nowLabel = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const friendlyErrorMessage = (err) => {
  const quotaCodes = ['DAILY_MESSAGE_LIMIT', 'WEEKLY_MESSAGE_LIMIT', 'MONTHLY_MESSAGE_LIMIT', 'AI_CREDIT_EXHAUSTED', 'CV_LIMIT_REACHED'];
  if (quotaCodes.includes(err?.data?.data?.code)) {
    return `⚠️ ${err.message}`;
  }
  if (err?.status === 402) {
    return '⚠️ Bạn đã dùng hết credit AI. Vui lòng nâng cấp gói hoặc chờ credit được làm mới.';
  }
  if (err?.status === 502) {
    return '⚠️ AI hiện không phản hồi được, vui lòng thử lại sau ít phút.';
  }
  if (err?.status === 400) {
    return `⚠️ ${err.message || 'Không thể gửi tin nhắn, vui lòng thử lại.'}`;
  }
  return '⚠️ Đã xảy ra lỗi khi kết nối tới AI. Vui lòng thử lại.';
};

const PATCH_SECTION_LABELS = {
  profile: 'Thông tin hồ sơ',
  contacts: 'Kênh liên lạc',
  education: 'Học vấn',
  experiences: 'Kinh nghiệm làm việc',
  projects: 'Dự án',
  skills: 'Kỹ năng',
  certificates: 'Chứng chỉ',
  awards: 'Giải thưởng',
  interests: 'Sở thích',
  referrers: 'Người giới thiệu',
};

// Tóm tắt ngắn gọn số mục trích xuất được theo từng phần, hiển thị trước khi người
// dùng bấm "Áp dụng vào Profile" - patch là chuỗi JSON thô trả về từ backend.
const summarizeProfilePatch = (patchJson) => {
  try {
    const patch = JSON.parse(patchJson);
    const lines = Object.entries(PATCH_SECTION_LABELS)
      .map(([key, label]) => {
        if (key === 'profile') {
          return patch.profile && typeof patch.profile === 'object' ? `- ${label}: có cập nhật` : null;
        }
        const count = Array.isArray(patch[key]) ? patch[key].length : 0;
        return count > 0 ? `- ${label}: ${count} mục` : null;
      })
      .filter(Boolean);
    return lines.length > 0
      ? `Đã trích xuất được từ CV:\n${lines.join('\n')}\n\nBấm "Áp dụng vào Profile" để lưu vào hồ sơ của bạn.`
      : 'Không tìm thấy thông tin nào có thể trích xuất từ CV này.';
  } catch {
    return 'Đã trích xuất xong, bấm "Áp dụng vào Profile" để lưu vào hồ sơ của bạn.';
  }
};

// Hiệu ứng "gõ chữ" mượt mà dựa trên nội dung thật trả về từ backend
const revealAssistantText = (assistantId, fullText, controller, setActiveMessages) =>
  new Promise((resolve) => {
    let revealed = 0;
    const chunkSize = 18;
    const intervalMs = 25;

    const finish = (text) => {
      setActiveMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m)));
      resolve();
    };

    const timer = setInterval(() => {
      revealed += chunkSize;
      if (controller.signal.aborted || revealed >= fullText.length) {
        clearInterval(timer);
        finish(fullText);
        return;
      }
      setActiveMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: fullText.slice(0, revealed) } : m))
      );
    }, intervalMs);
  });

export const ChatProvider = ({ children }) => {
  const { user, loading } = useAuth();
  const accountId = !loading ? user?.id : null;
  return (
    <AccountChatProvider key={accountId ?? 'guest'} accountId={accountId}>
      {children}
    </AccountChatProvider>
  );
};

// Remount all chat state when the authenticated account changes. Responses
// from the previous account can only update its unmounted provider.
const AccountChatProvider = ({ children, accountId }) => {
  const activeIdKey = accountId != null ? `${ACTIVE_ID_KEY}:${accountId}` : null;
  const [conversationsMeta, setConversationsMeta] = useState([]);
  const [activeChatId, setActiveChatId] = useState(() => {
    try {
      const savedId = activeIdKey ? localStorage.getItem(activeIdKey) : null;
      return savedId ? Number(savedId) : null;
    } catch (e) {
      return null;
    }
  });
  const [activeMessages, setActiveMessages] = useState([]);
  const [activeConversationMeta, setActiveConversationMeta] = useState(null);

  const [isTyping, setIsTyping] = useState(false);
  // Hướng chủ đề đang được chọn trên thanh điều hướng "dẫn đường" phía trên
  // khung chat (xem AI_TOPICS) - dùng để gắn category cho ai_conversation mới
  // và làm nổi bật mục đang active trên UI. null nghĩa là chưa chọn hướng nào.
  const [activeTopic, setActiveTopic] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [selectedModel, setSelectedModelState] = useState(null);
  const [creditsRemaining, setCreditsRemaining] = useState(null);
  const abortControllerRef = useRef(null);
  const chatSelectionRef = useRef(0);
  useEffect(() => () => {
    chatSelectionRef.current += 1;
    abortControllerRef.current?.abort();
  }, []);
  const activeChatIdRef = useRef(activeChatId);
  activeChatIdRef.current = activeChatId;

  // Tải danh sách model thực tế đang có trong database từ backend
  const fetchActiveModels = useCallback(async () => {
    if (accountId == null) {
      setLoadingModels(false);
      return;
    }
    setLoadingModels(true);
    try {
      const models = await aiModelService.getActiveModels();
      const validModels = Array.isArray(models) ? models : [];
      setAvailableModels(validModels);
      if (validModels.length > 0) {
        setSelectedModelState((prev) => {
          const match = validModels.find((m) => m.id === prev || m.modelName === prev || m.name === prev);
          return match ? match.id : validModels[0].id;
        });
      } else {
        setSelectedModelState(null);
      }
    } catch (err) {
      console.warn('Lỗi fetchActiveModels:', err);
      setAvailableModels([]);
      setSelectedModelState(null);
    } finally {
      setLoadingModels(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchActiveModels();
  }, [fetchActiveModels]);

  // Người dùng chọn model trên thanh header: cập nhật lựa chọn, và nếu đang có
  // cuộc trò chuyện active thì đổi luôn model của cuộc trò chuyện đó ngay lập tức.
  const setSelectedModel = useCallback((modelId) => {
    setSelectedModelState(modelId);
    if (activeChatIdRef.current) {
      aiConversationService.updateConversation(activeChatIdRef.current, { modelId }).catch((err) => {
        console.warn('Không thể đổi model cho cuộc trò chuyện hiện tại:', err);
      });
    }
  }, []);

  const refreshConversations = useCallback(async () => {
    if (accountId == null) return;
    try {
      const list = await aiConversationService.listConversations();
      setConversationsMeta(list);
    } catch (err) {
      console.warn('Không tải được danh sách cuộc trò chuyện:', err);
    }
  }, [accountId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Lưu activeChatId để khôi phục khi tải lại trang
  useEffect(() => {
    if (!activeIdKey) return;
    try {
      if (activeChatId) {
        localStorage.setItem(activeIdKey, String(activeChatId));
      } else {
        localStorage.removeItem(activeIdKey);
      }
    } catch (e) {
      // ignore
    }
  }, [activeChatId, activeIdKey]);

  // Chọn một cuộc trò chuyện đã có và tải tin nhắn của nó từ backend
  const selectChat = useCallback(async (id) => {
    const selection = ++chatSelectionRef.current;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsTyping(false);
    if (!id) {
      setActiveChatId(null);
      setActiveMessages([]);
      setActiveConversationMeta(null);
      setActiveTopic(null);
      return true;
    }
    try {
      const detail = await aiConversationService.getConversation(id);
      if (selection !== chatSelectionRef.current) return false;
      setActiveChatId(id);
      setActiveMessages(detail.messages);
      setActiveConversationMeta(detail.conversation);
      if (detail.conversation.modelId) {
        setSelectedModelState(detail.conversation.modelId);
      }
      const matchedTopic = AI_TOPICS.find((t) => t.backendCategory === detail.conversation.category);
      setActiveTopic(matchedTopic?.key || null);
      return true;
    } catch (err) {
      console.warn('Không tải được cuộc trò chuyện:', err);
      return false;
    }
  }, []);

  // Khôi phục cuộc trò chuyện đang mở khi tải lại trang
  useEffect(() => {
    if (activeChatId) {
      selectChat(activeChatId);
    }
    // Chỉ chạy một lần lúc mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cũng hiển thị khi chưa có activeChatId (chưa tạo ai_conversation nào) nhưng đã có
  // tin nhắn cục bộ - trường hợp của importProfileFromCv, vốn không tạo conversation thật.
  const activeConversation = (activeChatId || activeMessages.length > 0)
    ? { id: activeChatId, title: activeConversationMeta?.title || 'Cuộc trò chuyện mới', messages: activeMessages }
    : null;

  // Bắt đầu một đoạn chat mới (Draft)
  const startNewChat = useCallback(() => {
    chatSelectionRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsTyping(false);
    setActiveChatId(null); // null nghĩa là phòng chat mới chưa có tin nhắn
    setActiveMessages([]);
    setActiveConversationMeta(null);
    setActiveTopic(null);
  }, []);

  // Đổi tên cuộc trò chuyện
  const renameChat = useCallback(
    async (id, newTitle) => {
      if (!newTitle.trim()) return;
      try {
        const updated = await aiConversationService.updateConversation(id, { title: newTitle.trim() });
        setConversationsMeta((prev) => prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c)));
        if (id === activeChatId) {
          setActiveConversationMeta((prev) => (prev ? { ...prev, title: updated.title } : prev));
        }
      } catch (err) {
        console.warn('Không đổi được tên cuộc trò chuyện:', err);
      }
    },
    [activeChatId]
  );

  // Xóa cuộc trò chuyện
  const deleteChat = useCallback(
    async (id) => {
      try {
        await aiConversationService.deleteConversation(id);
      } catch (err) {
        console.warn('Không xóa được cuộc trò chuyện:', err);
        return;
      }
      setConversationsMeta((prev) => prev.filter((c) => c.id !== id));
      if (id === activeChatId) {
        setActiveChatId(null);
        setActiveMessages([]);
        setActiveConversationMeta(null);
      }
    },
    [activeChatId]
  );

  // Xóa tất cả cuộc trò chuyện
  const clearAllChats = useCallback(async () => {
    await Promise.allSettled(conversationsMeta.map((c) => aiConversationService.deleteConversation(c.id)));
    setConversationsMeta([]);
    setActiveChatId(null);
    setActiveMessages([]);
    setActiveConversationMeta(null);
  }, [conversationsMeta]);

  // Đổi trạng thái like / dislike tin nhắn (chỉ ở giao diện, chưa lưu ở backend)
  const toggleMessageFeedback = useCallback((messageId, feedbackType) => {
    setActiveMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        if (feedbackType === 'like') {
          return { ...m, isLiked: !m.isLiked, isDisliked: false };
        }
        if (feedbackType === 'dislike') {
          return { ...m, isDisliked: !m.isDisliked, isLiked: false };
        }
        return m;
      })
    );
  }, []);

  // Gửi tin nhắn tới AI Coach thật (model do người dùng chọn ở thanh header quyết định)
  const sendMessage = useCallback(
    async (promptText, attachedFile = null) => {
      const trimmedPrompt = (promptText || '').trim();
      if (!trimmedPrompt && !attachedFile) return;

      if (!selectedModel) {
        setActiveMessages((prev) => [
          ...prev,
          {
            id: `local-error-${Date.now()}`,
            sender: 'assistant',
            content: '⚠️ Chưa có Model AI nào khả dụng. Vui lòng liên hệ quản trị viên để cấu hình.',
            timestamp: nowLabel(),
          },
        ]);
        return;
      }

      const optimisticUserId = `local-user-${Date.now()}`;
      const optimisticFile = attachedFile
        ? { name: attachedFile.name, size: (attachedFile.size / 1024).toFixed(1) + ' KB', type: attachedFile.type }
        : null;
      // Bong bóng chat chỉ hiển thị lời nhắn ngắn gọn của người dùng, không phải
      // toàn bộ text CV dài được ghép vào `contentToSend` gửi cho AI bên dưới.
      const shortDisplayContent = trimmedPrompt || (attachedFile ? `📎 Đã gửi file "${attachedFile.name}"` : '');

      setActiveMessages((prev) => [
        ...prev,
        { id: optimisticUserId, sender: 'user', content: shortDisplayContent, timestamp: nowLabel(), file: optimisticFile },
      ]);
      setIsTyping(true);

      // Backend hien chua co co che nhan file dinh kem thuc su (attachmentUrl chi
      // la link hien thi) - phai tu boc tach text PDF o day va ghep vao noi dung
      // gui cho AI, neu khong AI se khong bao gio thay duoc file (#loi CV builder).
      let contentToSend = trimmedPrompt || `Tôi vừa đính kèm tệp: ${attachedFile?.name || 'tài liệu'}`;
      if (attachedFile) {
        const isPdf = attachedFile.type === 'application/pdf' || attachedFile.name?.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
          setActiveMessages((prev) => [
            ...prev,
            {
              id: `local-error-${Date.now()}`,
              sender: 'assistant',
              content: '⚠️ Hiện tại mới hỗ trợ phân tích file PDF có văn bản (chưa hỗ trợ Word/ảnh/scan). Vui lòng chọn file .pdf.',
              timestamp: nowLabel(),
            },
          ]);
          setIsTyping(false);
          return;
        }
        try {
          const extractedText = await cvProfileService.extractPdfText(attachedFile);
          contentToSend = `${contentToSend}\n\n--- Nội dung trích xuất từ file "${attachedFile.name}" ---\n${extractedText}`;
        } catch (err) {
          setActiveMessages((prev) => [
            ...prev,
            {
              id: `local-error-${Date.now()}`,
              sender: 'assistant',
              content: `⚠️ ${err.message || 'Không thể đọc file PDF này.'}`,
              timestamp: nowLabel(),
            },
          ]);
          setIsTyping(false);
          return;
        }
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        let chatId = activeChatId;
        let isNewConversation = false;
        if (!chatId) {
          const created = await aiConversationService.createConversation({
            category: topicToBackendCategory(activeTopic),
            modelId: selectedModel,
          });
          chatId = created.id;
          isNewConversation = true;
          setActiveChatId(chatId);
          setActiveConversationMeta(created);
          setConversationsMeta((prev) => [created, ...prev]);
        }

        const result = await aiConversationService.sendMessage(
          chatId,
          { content: contentToSend },
          { signal: controller.signal }
        );
        setConversationsMeta((prev) => prev.map((chat) => chat.id === chatId
          ? { ...chat, lastMessageAt: new Date().toISOString() } : chat));

        setCreditsRemaining(result.aiCreditsRemaining ?? null);

        const assistantId = result.assistantMessage.id;
        setActiveMessages((prev) => [
          ...prev.filter((m) => m.id !== optimisticUserId),
          { ...result.userMessage, content: shortDisplayContent, file: optimisticFile },
          { ...result.assistantMessage, content: '' },
        ]);

        await revealAssistantText(assistantId, result.assistantMessage.content, controller, setActiveMessages);

        // Sau tin nhắn đầu tiên, backend tự đặt tiêu đề cuộc trò chuyện -> đồng bộ lại
        if (isNewConversation) {
          try {
            const refreshed = await aiConversationService.getConversation(chatId);
            setActiveConversationMeta(refreshed.conversation);
            setConversationsMeta((prev) =>
              prev.map((c) => (c.id === chatId ? refreshed.conversation : c))
            );
          } catch (err) {
            // Không quan trọng nếu đồng bộ tiêu đề thất bại
          }
        }
      } catch (err) {
        if (err?.name === 'AbortError') {
          // Người dùng đã bấm dừng, giữ nguyên nội dung hiện có
        } else {
          console.warn('Gửi tin nhắn thất bại:', err);
          setActiveMessages((prev) => [
            ...prev,
            { id: `local-error-${Date.now()}`, sender: 'assistant', content: friendlyErrorMessage(err), timestamp: nowLabel() },
          ]);
        }
      } finally {
        setIsTyping(false);
        abortControllerRef.current = null;
      }
    },
    [activeChatId, selectedModel, activeTopic]
  );

  // Tải PDF CV lên -> trích xuất text -> gọi AI trích xuất thành patch có cấu trúc
  // cho Dynamic Profile (KHÔNG đi qua ai_conversation - gọi thẳng 2 endpoint
  // /api/me/profile-import/extract và /apply, xem ProfileImportService ở backend).
  // Patch chỉ được LƯU vào state cục bộ của tin nhắn, người dùng phải bấm
  // "Áp dụng vào Profile" mới thực sự ghi vào các bảng hồ sơ.
  const importProfileFromCv = useCallback(async (file) => {
    if (!file || isTyping) return;
    const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setActiveMessages((prev) => [
        ...prev,
        {
          id: `local-error-${Date.now()}`,
          sender: 'assistant',
          content: '⚠️ Hiện tại mới hỗ trợ phân tích file PDF có văn bản (chưa hỗ trợ Word/ảnh/scan). Vui lòng chọn file .pdf.',
          timestamp: nowLabel(),
        },
      ]);
      return;
    }

    setActiveMessages((prev) => [
      ...prev,
      {
        id: `local-user-${Date.now()}`,
        sender: 'user',
        content: `📎 Đã gửi file "${file.name}" để trích xuất thông tin cho Dynamic Profile`,
        timestamp: nowLabel(),
      },
    ]);
    setIsTyping(true);

    try {
      const text = await cvProfileService.extractPdfText(file);
      const patch = await profileImportService.extractProfile(text);
      setActiveMessages((prev) => [
        ...prev,
        {
          id: `profile-import-${Date.now()}`,
          sender: 'assistant',
          content: summarizeProfilePatch(patch),
          timestamp: nowLabel(),
          profileImport: { status: 'pending', patch },
        },
      ]);
    } catch (err) {
      setActiveMessages((prev) => [
        ...prev,
        {
          id: `local-error-${Date.now()}`,
          sender: 'assistant',
          content: `⚠️ ${err.message || 'Không thể trích xuất thông tin từ CV này.'}`,
          timestamp: nowLabel(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping]);

  // Áp dụng patch đã trích xuất (gắn trên một tin nhắn cụ thể) vào Dynamic Profile thật.
  const applyProfileImport = useCallback(async (messageId) => {
    const message = activeMessages.find((m) => m.id === messageId);
    if (!message?.profileImport?.patch || message.profileImport.status === 'applying') return;

    setActiveMessages((prev) => prev.map((m) => (
      m.id === messageId ? { ...m, profileImport: { ...m.profileImport, status: 'applying' } } : m
    )));

    try {
      const result = await profileImportService.applyProfilePatch(message.profileImport.patch);
      setActiveMessages((prev) => prev.map((m) => (
        m.id === messageId ? { ...m, profileImport: { ...m.profileImport, status: 'applied', result } } : m
      )));
    } catch (err) {
      setActiveMessages((prev) => prev.map((m) => (
        m.id === messageId
          ? { ...m, profileImport: { ...m.profileImport, status: 'error', error: err.message || 'Không thể áp dụng vào hồ sơ.' } }
          : m
      )));
    }
  }, [activeMessages]);

  // Dừng quá trình tạo câu trả lời
  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
    }
  }, []);

  // Tạo lại câu trả lời cuối cùng
  const regenerateLastMessage = useCallback(() => {
    if (activeMessages.length === 0) return;
    const lastUserMessage = [...activeMessages].reverse().find((m) => m.sender === 'user');
    if (!lastUserMessage) return;

    setActiveMessages((prev) => {
      const newMsgs = [...prev];
      if (newMsgs[newMsgs.length - 1]?.sender === 'assistant') {
        newMsgs.pop();
      }
      return newMsgs;
    });

    sendMessage(lastUserMessage.content, null);
  }, [activeMessages, sendMessage]);

  const value = {
    conversations: conversationsMeta,
    activeChatId,
    activeConversation,
    activeConversationMeta,
    isTyping,
    activeTopic,
    setActiveTopic,
    availableModels,
    loadingModels,
    fetchActiveModels,
    selectedModel,
    setSelectedModel,
    creditsRemaining,
    startNewChat,
    selectChat,
    refreshConversations,
    renameChat,
    deleteChat,
    clearAllChats,
    sendMessage,
    importProfileFromCv,
    applyProfileImport,
    stopGenerating,
    regenerateLastMessage,
    toggleMessageFeedback,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
