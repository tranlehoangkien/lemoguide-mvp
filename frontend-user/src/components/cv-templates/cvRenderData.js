export const DEFAULT_ACTIVE_SECTIONS = ['profile', 'contacts', 'education', 'experiences', 'skills'];

const LIST_KEYS = [
  'contacts',
  'education',
  'experiences',
  'projects',
  'skills',
  'certificates',
  'awards',
  'interests',
  'referrers',
];

/**
 * Turns a CV record (as returned by cvProfileService) into the `data` prop the
 * CV template components expect. Returns null when the CV has no content yet.
 */
export const buildCvRenderData = (cv) => {
  const source = cv?.cvData;
  if (!source || typeof source !== 'object' || Object.keys(source).length === 0) return null;

  const profile = { ...(source.profile || {}) };
  if (!profile.avatarUrl && cv.avatarUrl) profile.avatarUrl = cv.avatarUrl;

  const data = { profile, avatarUrl: cv.avatarUrl || profile.avatarUrl || null };
  LIST_KEYS.forEach((key) => {
    data[key] = Array.isArray(source[key]) ? source[key] : [];
  });
  return data;
};

export const resolveActiveSections = (cv) =>
  Array.isArray(cv?.activeSections) && cv.activeSections.length > 0 ? cv.activeSections : DEFAULT_ACTIVE_SECTIONS;
