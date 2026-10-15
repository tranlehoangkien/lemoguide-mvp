const EVENT = 'lemoguide:profile-changed';
const CHANNEL = 'lemoguide-profile';
const SOURCE = globalThis.crypto?.randomUUID?.() ?? String(Math.random());

export function isProfileMutation(endpoint, method = 'GET') {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) return false;
  const path = endpoint.split('?')[0];
  return /^\/api\/me(?:\/(?:avatar|contacts|education|experiences|projects|skills|certificates|awards|interests|referrers|plan)(?:\/.*)?)?$/.test(path)
    || path === '/api/me/profile-import/apply'
    || /^\/api\/me\/workspace\/tasks(?:\/\d+)?$/.test(path)
    || /^\/api\/me\/career-plans(?:\/\d+(?:\/tasks\/\d+)?)?$/.test(path)
    || path.startsWith('/api/me/discovery/');
}

/** Only an account id crosses tabs; profile contents and credentials stay in the requesting tab. */
export function notifyProfileChanged(accountId) {
  if (accountId == null || typeof window === 'undefined') return;
  const event = { accountId: String(accountId), source: SOURCE };
  window.dispatchEvent(new CustomEvent(EVENT, { detail: event }));
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL);
      channel.postMessage(event);
      channel.close();
    }
  } catch { /* Local refresh still works if cross-tab communication is unavailable. */ }
}

export function subscribeProfileChanges(accountId, listener) {
  if (accountId == null || typeof window === 'undefined') return () => {};
  const receive = (event) => {
    if (String(event?.accountId) === String(accountId)) listener();
  };
  const local = (event) => receive(event.detail);
  window.addEventListener(EVENT, local);
  let channel;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = (event) => { if (event.data?.source !== SOURCE) receive(event.data); };
    }
  } catch { /* Focus and polling provide a fallback. */ }
  return () => { window.removeEventListener(EVENT, local); channel?.close(); };
}
