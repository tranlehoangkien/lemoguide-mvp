import { useEffect, useEffectEvent } from 'react';
import { subscribeProfileChanges } from '@/services/profileChanges';

/** Refresh mutations immediately, returning tabs on focus, and external changes every 30 seconds. */
export function useProfileRefresh(accountId, refresh) {
  const reload = useEffectEvent(refresh);
  useEffect(() => {
    if (accountId == null) return;
    let timer;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (document.visibilityState === 'visible') reload(); }, 150);
    };
    const visible = () => { if (document.visibilityState === 'visible') schedule(); };
    const unsubscribe = subscribeProfileChanges(accountId, schedule);
    window.addEventListener('focus', schedule);
    document.addEventListener('visibilitychange', visible);
    const interval = setInterval(visible, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('focus', schedule);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [accountId]);
}
