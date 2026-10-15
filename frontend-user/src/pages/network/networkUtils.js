import { useEffect, useState } from 'react';
import { networkService as api } from '@/services/networkService';
import { useNetworkEvent } from '@/services/networkSummary';

/**
 * Loads a network API path. `poll` (ms) is a fallback refresh; `refreshOn` lists live event types
 * (notification, message, cohort) that trigger an immediate reload through the event stream.
 */
export function useNetworkQuery(path, poll = 0, refreshOn = []) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    let alive = true;
    let timer;
    const load = async () => {
      try { const data = await api.get(path); if (alive) setResult({ path, version, data }); }
      catch (err) { if (alive) setResult({ path, version, error: err.message }); }
      if (alive && poll) timer = setTimeout(load, poll);
    };
    if (path) load();
    return () => { alive = false; clearTimeout(timer); };
  }, [path, version, poll]);
  useNetworkEvent(refreshOn, () => { if (path) setVersion((v) => v + 1); });
  const ready = !!path && result?.path === path && result?.version === version;
  return { data: result?.path === path ? result.data : null, error: ready ? result.error : '', loading: !!path && result?.path !== path, refreshing: !!path && !ready, reload: () => setVersion((v) => v + 1) };
}

export const kindLabels = { KNOWLEDGE: 'Chia sẻ kiến thức', QUESTION: 'Hỏi đáp', PROJECT: 'Giới thiệu dự án', FEEDBACK: 'Nhờ góp ý dự án', MILESTONE: 'Cột mốc học tập' };
/** What a "Nhờ góp ý dự án" post can ask reviewers to look at (same keys as the backend). */
export const aspectLabels = { CODE: 'Mã nguồn', UI: 'Giao diện', README: 'README', ARCHITECTURE: 'Kiến trúc', TESTING: 'Kiểm thử', IDEA: 'Ý tưởng sản phẩm' };
export const itemLabels = { SKILL: 'Kỹ năng', PROJECT: 'Dự án', EXPERIENCE: 'Kinh nghiệm', CERTIFICATE: 'Chứng chỉ' };
/** "3 buổi hỗ trợ · 4,8/5" or a quiet "Chưa có buổi hỗ trợ nào" for a new mentor. */
export function mentorStatsText(stats) {
  if (!stats?.sessions) return 'Chưa có buổi hỗ trợ nào';
  return `${stats.sessions} buổi hỗ trợ${stats.rating != null ? ` · ${String(stats.rating).replace('.', ',')}/5` : ''}`;
}
/** cv_profile.target_mode (stored lowercase) as shown on CV cards. */
export const cvTargetLabel = (mode) => ({ frontend: 'CV Frontend', backend: 'CV Backend', fullstack: 'CV Fullstack' }[String(mode || '').toLowerCase()] || 'CV');
export const dateLabel = (value) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

/** Splits text into plain parts and @handle mentions (same pattern the backend notifies on). */
export function mentionParts(text = '') {
  const parts = [];
  // Handles are lowercase-only, so "@ParameterizedTest" or "@abcDef" is code/text, not a mention.
  const pattern = /(^|[^\w@])@([a-z0-9][a-z0-9_-]{2,39})(?![\w-])/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(text))) {
    const start = match.index + match[1].length;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ handle: match[2], text: `@${match[2]}` });
    last = start + match[2].length + 1;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
