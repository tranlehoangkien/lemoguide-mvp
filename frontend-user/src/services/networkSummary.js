import { useEffect, useRef, useSyncExternalStore } from 'react';
import { networkService } from './networkService';
import { API_BASE_URL, getAuthToken } from './apiClient';

/**
 * LemoNetwork live state shared by the sidebar and the network pages:
 * - badge counts ({ requests, messages, notifications, cohorts }) from /api/network/summary;
 * - one server-sent-event stream (/api/network/stream) that says *what* changed, so open pages refetch at once.
 * The stream is read with fetch (EventSource cannot send the Bearer header). Polling stays as a slow fallback.
 */
const POLL_MS = 60000;
let summary = null;
let timer = null;
let inflight = null;
const listeners = new Set();
const eventListeners = new Set();

const emit = () => listeners.forEach((listener) => listener());

export function refreshNetworkSummary() {
  if (inflight) return inflight;
  inflight = networkService
    .get('/summary')
    .then((data) => { summary = data || null; emit(); })
    .catch(() => {}) // Badges are a hint only: keep the last known counts on failure.
    .finally(() => { inflight = null; });
  return inflight;
}

/* ---------- Event stream ---------- */
let stream = null;

function startStream() {
  if (stream) return;
  const controller = new AbortController();
  let retry = 2000;
  stream = { controller };
  const connect = async () => {
    const token = getAuthToken();
    if (!token || controller.signal.aborted) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/network/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) return; // Signed out or not allowed: stop quietly.
      if (!response.ok || !response.body) throw new Error(`stream ${response.status}`);
      retry = 2000;
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let split;
        while ((split = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, split);
          buffer = buffer.slice(split + 2);
          const data = block.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n');
          if (!data || !block.includes('event:network')) continue;
          try { dispatch(JSON.parse(data)); } catch { /* ignore malformed frames */ }
        }
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      void err;
    }
    if (controller.signal.aborted) return;
    setTimeout(connect, retry);
    retry = Math.min(retry * 2, 30000);
  };
  connect();
}

function stopStream() {
  stream?.controller.abort();
  stream = null;
}

function dispatch(event) {
  refreshNetworkSummary();
  eventListeners.forEach((listener) => listener(event));
}

function subscribe(listener) {
  listeners.add(listener);
  if (listeners.size === 1) {
    refreshNetworkSummary();
    startStream();
    timer = setInterval(() => { if (document.visibilityState === 'visible') refreshNetworkSummary(); }, POLL_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) { clearInterval(timer); timer = null; stopStream(); }
  };
}

export function useNetworkSummary() {
  return useSyncExternalStore(subscribe, () => summary, () => null);
}

/**
 * Calls `handler(event)` for live events whose type is in `types` (notification, message, cohort).
 * Keeps the stream alive while mounted, even on pages without a badge.
 */
export function useNetworkEvent(types, handler) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; });
  const key = types.join(',');
  useEffect(() => {
    const wanted = new Set(key.split(','));
    const listener = (event) => { if (wanted.has(event.type)) ref.current(event); };
    eventListeners.add(listener);
    const unsubscribe = subscribe(() => {});
    return () => { eventListeners.delete(listener); unsubscribe(); };
  }, [key]);
}

/** Badge text for a count: nothing for zero, "99+" above 99. */
export const badgeText = (n) => (n > 0 ? (n > 99 ? '99+' : String(n)) : null);
