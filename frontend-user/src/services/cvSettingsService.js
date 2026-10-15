import { useEffect, useState } from 'react';
import { apiRequest } from './apiClient';

/**
 * CV publish settings chosen by admins ("Cấu hình publish_mode"): the state a new CV starts in, whether public
 * links are allowed, and the private mode used for drafts. The backend enforces them; the UI only mirrors them.
 */
export const DEFAULT_CV_SETTINGS = { defaultPublishMode: 'PDF', publicLinkEnabled: true, defaultShareExpiryDays: 0 };

let cached = null;
export function getCvPublishSettings() {
  if (!cached) {
    cached = apiRequest('/api/lookups/cv-settings')
      .then((res) => ({ ...DEFAULT_CV_SETTINGS, ...(res?.data || {}) }))
      .catch(() => { cached = null; return DEFAULT_CV_SETTINGS; });
  }
  return cached;
}

/** Private publish mode for a draft: the admin default when it is a private one, otherwise PDF. */
export const draftModeOf = (settings) => (settings.defaultPublishMode === 'PUBLIC_LINK' ? 'PDF' : settings.defaultPublishMode);

/** Whether a brand-new CV should start as "Công khai". */
export const startsPublic = (settings) => settings.publicLinkEnabled && settings.defaultPublishMode === 'PUBLIC_LINK';

export function useCvPublishSettings() {
  const [settings, setSettings] = useState(DEFAULT_CV_SETTINGS);
  useEffect(() => {
    let alive = true;
    getCvPublishSettings().then((s) => { if (alive) setSettings(s); });
    return () => { alive = false; };
  }, []);
  return settings;
}
