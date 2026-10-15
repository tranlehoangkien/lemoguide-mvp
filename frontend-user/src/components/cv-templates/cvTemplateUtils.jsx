import React from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export const ALL_SECTION_DEFS = [
  { key: 'education', label: 'Học vấn', icon: 'GraduationCap', isStandard: true },
  { key: 'experiences', label: 'Kinh nghiệm làm việc', icon: 'Briefcase', isStandard: true },
  { key: 'skills', label: 'Kỹ năng', icon: 'Zap', isStandard: true },
  { key: 'projects', label: 'Dự án nổi bật', icon: 'FolderGit2', isStandard: true },
  { key: 'contacts', label: 'Thông tin liên lạc', icon: 'Phone', isStandard: true },
  { key: 'profile', label: 'Mục tiêu nghề nghiệp', icon: 'Target', isStandard: true },
  { key: 'certificates', label: 'Chứng chỉ', icon: 'FileBadge', isStandard: false },
  { key: 'awards', label: 'Danh hiệu và giải thưởng', icon: 'Trophy', isStandard: false },
  { key: 'referrers', label: 'Người giới thiệu', icon: 'Users', isStandard: false },
  { key: 'interests', label: 'Sở thích', icon: 'Heart', isStandard: false },
];

export const STANDARD_SECTION_KEYS = ['education', 'experiences', 'skills', 'projects', 'contacts', 'profile'];

/**
 * Small pencil affordance shown on hover over an editable section.
 */
export const EditButton = ({ onClick, title = 'Chỉnh sửa mục này', style, size = 13 }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    title={title}
    className="no-print"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: 'rgba(0,0,0,0.08)',
      color: 'inherit',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'all 0.15s ease',
      ...style,
    }}
  >
    <Pencil size={size} />
  </button>
);

/**
 * Red trash button to remove a section from the CV.
 */
export const RemoveButton = ({ onClick, title = 'Xóa mục này khỏi CV', style, size = 13 }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    title={title}
    className="no-print"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      color: '#ef4444',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'all 0.15s ease',
      ...style,
    }}
  >
    <Trash2 size={size} />
  </button>
);

/**
 * Combined actions wrapper: Edit + Remove
 */
export const SectionActionButtons = ({ onEdit, onRemove, editable, editStyle, removeStyle, size = 13 }) => {
  if (!editable) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} className="no-print">
      {onEdit && <EditButton onClick={onEdit} style={editStyle} size={size} />}
      {onRemove && <RemoveButton onClick={onRemove} style={removeStyle} size={size} />}
    </div>
  );
};

/** Dashed "+ Thêm {label}" placeholder shown for an empty editable section. */
export const AddPlaceholder = ({ label, onClick, style, textColor }) => (
  <button
    type="button"
    onClick={onClick}
    className="no-print"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      width: '100%',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1.5px dashed currentColor',
      backgroundColor: 'transparent',
      color: textColor || 'inherit',
      opacity: 0.75,
      fontSize: '11.5px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      ...style,
    }}
  >
    <Plus size={13} />
    <span>Thêm {label}</span>
  </button>
);

export const GithubIcon = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const LinkedinIcon = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export const getContactIcon = (type, size = 13, color = 'currentColor') => {
  const t = (type || '').toUpperCase();
  switch (t) {
    case 'PHONE':
      return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color }}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>;
    case 'EMAIL':
      return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color }}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span>;
    case 'GITHUB':
      return <GithubIcon size={size} color={color} />;
    case 'LINKEDIN':
      return <LinkedinIcon size={size} color={color} />;
    case 'FACEBOOK':
      return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color }}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></span>;
    case 'PORTFOLIO':
    case 'WEBSITE':
    case 'OTHER':
    default:
      return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color }}><svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>;
  }
};

export const getContactTypeLabel = (type) => {
  const t = (type || '').toUpperCase();
  switch (t) {
    case 'PHONE': return 'Số điện thoại';
    case 'EMAIL': return 'Email';
    case 'GITHUB': return 'GitHub';
    case 'LINKEDIN': return 'LinkedIn';
    case 'FACEBOOK': return 'Facebook';
    case 'PORTFOLIO': return 'Portfolio';
    case 'WEBSITE': return 'Website';
    default: return type || 'Liên kết';
  }
};

/**
 * Display label for a skill entry. Language skills show their concrete
 * proficiency (e.g. "IELTS 7.0", "JLPT N2") next to the bare language name,
 * since "English" alone tells a recruiter nothing about actual level.
 */
export const getSkillDisplayLabel = (skill) => {
  if (!skill) return '';
  const type = (skill.skillType || '').toString().toLowerCase();
  if (type === 'language' && skill.languageLevel) {
    return `${skill.skillName} (${skill.languageLevel})`;
  }
  return skill.skillName;
};

export const getContactHref = (type, value) => {
  if (!value) return '#';
  const t = (type || '').toUpperCase();
  if (t === 'PHONE') return `tel:${value}`;
  if (t === 'EMAIL') return `mailto:${value}`;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${value}`;
};

