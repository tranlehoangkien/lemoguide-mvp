import { apiRequest } from './apiClient';

const formatProviderDisplay = (provider) => {
  if (!provider) return 'AI';
  const p = String(provider).toUpperCase();
  if (p === 'ANTHROPIC') return 'Anthropic';
  if (p === 'OPENAI') return 'OpenAI';
  if (p === 'GOOGLE') return 'Google';
  if (p === 'OTHER') return 'Tùy biến';
  return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
};

export const formatModelItem = (m) => {
  const providerDisplay = formatProviderDisplay(m.provider);
  return {
    id: m.id,
    modelName: m.modelName,
    name: m.modelName,
    provider: providerDisplay,
    rawProvider: m.provider,
    apiKeyConfigured: m.apiKeyConfigured,
    maxTokens: m.maxTokensPerRequest || 4096,
    isActive: m.isActive,
  };
};

export const aiModelService = {
  /**
   * Lấy danh sách các AI model đang kích hoạt từ database
   * Chỉ trả về các model thực tế có trong database, không thêm model ngoài
   */
  async getActiveModels() {
    try {
      let res = null;
      try {
        res = await apiRequest('/api/lookups/ai-models');
      } catch (err) {
        res = await apiRequest('/api/ai-models');
      }

      const list = res?.data;
      if (Array.isArray(list)) {
        return list.map(formatModelItem);
      }
      return [];
    } catch (error) {
      console.warn('Lỗi kết nối cơ sở dữ liệu lấy danh sách AI models:', error);
      return [];
    }
  },
};
