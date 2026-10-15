import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Cake,
  User as UserIcon,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Trophy,
  FileBadge,
  Users,
  Camera,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';
import { getFullAvatarUrl } from '@/services/apiClient';
import { formatYearRange } from './cvTemplateFormat';
import { EditButton, RemoveButton, AddPlaceholder, getContactIcon, getSkillDisplayLabel, GithubIcon } from './cvTemplateUtils';

const COLORS = {
  sidebarBg: '#38523C',
  sidebarBgDark: '#2B3E2E',
  sidebarText: '#FFFFFF',
  sidebarTextMuted: '#D2E0D4',
  badgeBg: '#38523C',
  headingColor: '#1B271D',
  bodyText: '#2C382D',
  bodyTextMuted: '#5C6B5E',
};

const genderLabel = (g) => {
  const v = (g || '').toUpperCase();
  if (v === 'MALE') return 'Nam';
  if (v === 'FEMALE') return 'Nữ';
  if (v === 'OTHER') return 'Khác';
  return '';
};

const SidebarContactRow = ({ icon, children, editable, onEdit, onDelete }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        fontSize: '12px',
        color: COLORS.sidebarText,
        minHeight: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0, flex: 1 }}>
        <span
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.22)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#ffffff',
          }}
        >
          {icon}
        </span>
        <span style={{ wordBreak: 'break-word', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
          {children}
        </span>
      </div>

      {editable && hovered && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', flexShrink: 0 }} className="no-print">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Chỉnh sửa kênh liên lạc này"
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'background-color 0.15s ease',
              }}
            >
              <Pencil size={11} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Xóa kênh liên lạc này"
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(239, 68, 68, 0.4)',
                color: '#fee2e2',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                transition: 'background-color 0.15s ease',
              }}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const SectionHeading = ({ icon, children, editable, onEdit, onRemove }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: COLORS.badgeBg,
          color: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: COLORS.headingColor }}>
        {children}
      </h3>
    </div>
    {editable && (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} className="no-print">
        {onEdit && <EditButton onClick={onEdit} />}
        {onRemove && <RemoveButton onClick={onRemove} />}
      </div>
    )}
  </div>
);

/**
 * Pixel-accurate clone of frontend-user/src/assets/CV/CV1.jpg —
 * Forest Green sidebar (34%) + Clean white content column (66%).
 */
const CvTemplateGreenSidebar = ({
  data,
  editable,
  activeSections,
  onEditSection,
  onRemoveSection,
  onDeleteContact,
  onDeleteAdditional,
  onEditAvatar,
}) => {
  const {
    profile = {},
    contacts = [],
    education = [],
    experiences = [],
    projects = [],
    skills = [],
    awards = [],
    certificates = [],
    interests = [],
    referrers = [],
  } = data || {};

  const phone = contacts.find((c) => c.type === 'PHONE')?.value;
  const email = contacts.find((c) => c.type === 'EMAIL')?.value || profile.email;
  const location = [profile.district, profile.city].filter(Boolean).join(', ');
  const goal = profile.shortTermGoal || profile.longTermGoal;
  const rawAvatar = (profile?.avatarUrl && typeof profile.avatarUrl === 'string')
    ? profile.avatarUrl
    : (data?.avatarUrl && typeof data.avatarUrl === 'string')
    ? data.avatarUrl
    : null;
  const avatar = rawAvatar ? getFullAvatarUrl(rawAvatar) : null;

  const edit = (section, item) => editable && onEditSection?.(section, item || null);
  const remove = (section) => editable && onRemoveSection?.(section);
  const isSectionActive = (key) => (!activeSections ? true : activeSections.includes(key));

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100%',
        backgroundColor: '#ffffff',
        fontFamily: '"Roboto", "Inter", sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* ==================== SIDEBAR (~34%) ==================== */}
      <div
        style={{
          width: '34%',
          minWidth: '220px',
          background: `linear-gradient(180deg, ${COLORS.sidebarBg} 0%, ${COLORS.sidebarBgDark} 100%)`,
          padding: '30px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          color: COLORS.sidebarText,
          boxSizing: 'border-box',
        }}
      >
        {/* Avatar & Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              position: 'relative',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              border: '3px solid #ffffff',
              boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.25)',
              flexShrink: 0,
            }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={profile.fullName || 'Avatar'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <UserIcon size={56} />
              </div>
            )}
            {editable && (
              <button
                type="button"
                onClick={onEditAvatar}
                title="Đổi ảnh đại diện"
                className="no-print"
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
              >
                <Camera size={22} />
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: '800',
                color: '#ffffff',
                letterSpacing: '0.3px',
              }}
            >
              {profile.fullName || 'Họ và tên'}
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: COLORS.sidebarTextMuted,
                fontWeight: '500',
              }}
            >
              {profile.currentTitle || 'Lập trình viên'}
            </p>
          </div>
        </div>

        {/* Contacts */}
        {isSectionActive('contacts') && (
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '11px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {editable && (
              <div style={{ position: 'absolute', top: '4px', right: 0, display: 'inline-flex', gap: '4px' }} className="no-print">
                <EditButton
                  onClick={() => edit('contacts', null)}
                  title="Thêm kênh liên lạc mới"
                  style={{ color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
                />
                <RemoveButton
                  onClick={() => remove('contacts')}
                  title="Xóa toàn bộ mục liên hệ khỏi CV"
                  style={{ color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.25)' }}
                />
              </div>
            )}

            {/* Danh sách các kênh liên lạc từ contacts */}
            {contacts.map((c) => (
              <SidebarContactRow
                key={c.id || `${c.type}_${c.value}`}
                icon={getContactIcon(c.type, 12, '#ffffff')}
                editable={editable}
                onEdit={() => edit('contacts', c)}
                onDelete={() => onDeleteContact?.(c.id)}
              >
                {c.value}
              </SidebarContactRow>
            ))}

            {/* Email từ hồ sơ cá nhân nếu trong contacts chưa có kênh EMAIL */}
            {profile.email && !contacts.some((c) => (c.type || '').toUpperCase() === 'EMAIL') && (
              <SidebarContactRow
                icon={<Mail size={12} />}
                editable={editable}
                onEdit={() => edit('profile')}
              >
                {profile.email}
              </SidebarContactRow>
            )}

            {location && <SidebarContactRow icon={<MapPin size={12} />}>{location}</SidebarContactRow>}
            {profile.dateOfBirth && <SidebarContactRow icon={<Cake size={12} />}>{profile.dateOfBirth}</SidebarContactRow>}
            {genderLabel(profile.gender) && (
              <SidebarContactRow icon={<UserIcon size={12} />}>{genderLabel(profile.gender)}</SidebarContactRow>
            )}

            {/* Nút thêm liên hệ dạng dashed placeholder */}
            {editable && (
              <div style={{ marginTop: '2px' }}>
                <AddPlaceholder
                  label="liên hệ"
                  onClick={() => edit('contacts', null)}
                  textColor="#ffffff"
                />
              </div>
            )}
          </div>
        )}

        {/* Mục tiêu nghề nghiệp */}
        {isSectionActive('profile') && (
          <div style={{ position: 'relative' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
              Mục tiêu nghề nghiệp
            </h3>
            {editable && (
              <div style={{ position: 'absolute', top: '-4px', right: 0, display: 'inline-flex', gap: '4px' }} className="no-print">
                <EditButton
                  onClick={() => edit('profile')}
                  style={{ color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
                />
                <RemoveButton
                  onClick={() => remove('profile')}
                  style={{ color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.25)' }}
                />
              </div>
            )}
            {goal ? (
              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.65', color: COLORS.sidebarText }}>
                {goal}
              </p>
            ) : editable ? (
              <AddPlaceholder label="mục tiêu nghề nghiệp" onClick={() => edit('profile')} textColor="#ffffff" />
            ) : null}
          </div>
        )}

        {/* Kỹ năng */}
        {isSectionActive('skills') && (
          <div style={{ position: 'relative' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
              Kỹ năng
            </h3>
            {editable && (
              <div style={{ position: 'absolute', top: '-4px', right: 0, display: 'inline-flex', gap: '4px' }} className="no-print">
                <EditButton
                  onClick={() => edit('skills')}
                  style={{ color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
                />
                <RemoveButton
                  onClick={() => remove('skills')}
                  style={{ color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.25)' }}
                />
              </div>
            )}
            {skills.length === 0 ? (
              editable && <AddPlaceholder label="kỹ năng" onClick={() => edit('skills')} textColor="#ffffff" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                {skills.map((s) => {
                  const isLanguage = (s.skillType || '').toString().toLowerCase() === 'language';
                  return (
                  <div key={s.id}>
                    <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span>{isLanguage ? s.skillName : getSkillDisplayLabel(s)}</span>
                      {isLanguage && s.languageLevel && (
                        <span style={{ fontSize: '10.5px', color: '#BCCBBD', fontWeight: '700', flexShrink: 0 }}>
                          {s.languageLevel}
                        </span>
                      )}
                    </div>
                    {!isLanguage && s.proficiencyLevel != null && (
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '1px',
                        backgroundColor: '#253527',
                        marginTop: '5px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(0, Math.min(100, Number(s.proficiencyLevel) > 5 ? Number(s.proficiencyLevel) : Number(s.proficiencyLevel) * 20))}%`,
                          backgroundColor: '#BCCBBD',
                          borderRadius: '1px',
                        }}
                      />
                    </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sở thích */}
        {isSectionActive('interests') && (
          <div style={{ position: 'relative' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
              Sở thích
            </h3>
            {editable && (
              <div style={{ position: 'absolute', top: '-4px', right: 0, display: 'inline-flex', gap: '4px' }} className="no-print">
                <EditButton
                  onClick={() => edit('interests', null)}
                  style={{ color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
                />
                <RemoveButton
                  onClick={() => remove('interests')}
                  style={{ color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.25)' }}
                />
              </div>
            )}
            {interests.length === 0 ? (
              editable && <AddPlaceholder label="sở thích" onClick={() => edit('interests', null)} textColor="#ffffff" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {interests.map((it) => (
                    <span
                      key={it.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: '500',
                      }}
                    >
                      <span
                        onClick={() => editable && edit('interests', it)}
                        style={{ cursor: editable ? 'pointer' : 'default' }}
                        title={editable ? 'Bấm để chỉnh sửa sở thích' : undefined}
                      >
                        {it.name}
                      </span>
                      {editable && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteAdditional) {
                              onDeleteAdditional('interests', it.id);
                            } else {
                              edit('interests', it);
                            }
                          }}
                          title="Xóa sở thích"
                          className="no-print"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#fca5a5',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '14px',
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder label="sở thích" onClick={() => edit('interests', null)} textColor="#ffffff" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== MAIN CONTENT (~66%) ==================== */}
      <div
        style={{
          flex: 1,
          padding: '30px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* Học vấn */}
        {isSectionActive('education') && (
          <div>
            <SectionHeading
              icon={<GraduationCap size={16} />}
              editable={editable}
              onEdit={() => edit('education')}
              onRemove={() => remove('education')}
            >
              Học vấn
            </SectionHeading>
            {education.length === 0 ? (
              editable && <AddPlaceholder label="học vấn" onClick={() => edit('education')} textColor={COLORS.bodyTextMuted} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: COLORS.headingColor,
                      }}
                    >
                      <span>{edu.majorName || edu.classification || 'Chuyên ngành'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '400', color: COLORS.bodyTextMuted }}>
                          {formatYearRange(edu.startDate, edu.endDate)}
                        </span>
                        {editable && (
                          <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                            <EditButton onClick={() => edit('education', edu)} size={11} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: '800',
                        fontSize: '13.5px',
                        color: COLORS.headingColor,
                        margin: '2px 0 5px',
                      }}
                    >
                      {edu.schoolName}
                    </div>
                    {(edu.thesisAchievement || edu.gpa) && (
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '18px',
                          fontSize: '12px',
                          color: COLORS.bodyText,
                          lineHeight: '1.65',
                          listStyleType: 'disc',
                        }}
                      >
                        {edu.gpa && <li>GPA: {edu.gpa}</li>}
                        {edu.thesisAchievement &&
                          String(edu.thesisAchievement)
                            .split('\n')
                            .filter(Boolean)
                            .map((l, i) => <li key={i}>{l.replace(/^[•\-\*]\s*/, '')}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
                {editable && (
                  <div style={{ marginTop: '2px' }}>
                    <AddPlaceholder label="học vấn" onClick={() => edit('education', null)} textColor={COLORS.bodyTextMuted} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Kinh nghiệm làm việc */}
        {isSectionActive('experiences') && (
          <div>
            <SectionHeading
              icon={<Briefcase size={16} />}
              editable={editable}
              onEdit={() => edit('experiences', null)}
              onRemove={() => remove('experiences')}
            >
              Kinh nghiệm làm việc
            </SectionHeading>
            {experiences.length === 0 ? (
              editable && (
                <AddPlaceholder
                  label="kinh nghiệm làm việc"
                  onClick={() => edit('experiences', null)}
                  textColor={COLORS.bodyTextMuted}
                />
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {experiences.map((exp) => (
                  <div key={exp.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        fontSize: '13.5px',
                        fontWeight: '800',
                        color: COLORS.headingColor,
                      }}
                    >
                      <span>{exp.jobTitle}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '400', color: COLORS.bodyTextMuted, fontSize: '12px' }}>
                          {formatYearRange(exp.startDate, exp.current ? null : exp.endDate)}
                        </span>
                        {editable && (
                          <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                            <EditButton onClick={() => edit('experiences', exp)} size={11} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '13px',
                        color: COLORS.headingColor,
                        margin: '2px 0 5px',
                      }}
                    >
                      {exp.companyName}
                    </div>
                    {exp.description && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: COLORS.bodyText,
                          lineHeight: '1.65',
                          marginTop: '3px',
                        }}
                      >
                        {exp.description
                          .split('\n')
                          .map((l) => l.trim())
                          .filter(Boolean)
                          .map((l, i) => (
                            <div key={i} style={{ marginBottom: '2px' }}>
                              {l}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
                {editable && (
                  <div style={{ marginTop: '2px' }}>
                    <AddPlaceholder
                      label="kinh nghiệm làm việc"
                      onClick={() => edit('experiences', null)}
                      textColor={COLORS.bodyTextMuted}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dự án nổi bật */}
        {isSectionActive('projects') && (
          <div>
            <SectionHeading
              icon={<FolderGit2 size={16} />}
              editable={editable}
              onEdit={() => edit('projects', null)}
              onRemove={() => remove('projects')}
            >
              Dự án nổi bật
            </SectionHeading>
            {projects.length === 0 ? (
              editable && (
                <AddPlaceholder label="dự án nổi bật" onClick={() => edit('projects', null)} textColor={COLORS.bodyTextMuted} />
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {projects.map((p) => (
                  <div key={p.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        fontSize: '13.5px',
                        fontWeight: '800',
                        color: COLORS.headingColor,
                      }}
                    >
                      <span>{p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '400', color: COLORS.bodyTextMuted, fontSize: '12px' }}>
                          {formatYearRange(p.startDate, p.endDate)}
                        </span>
                        {editable && (
                          <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                            <EditButton onClick={() => edit('projects', p)} size={11} />
                          </div>
                        )}
                      </div>
                    </div>
                    {p.role && (
                      <div style={{ fontWeight: '600', fontSize: '12.5px', color: COLORS.bodyText, margin: '2px 0 2px' }}>
                        {p.role}
                      </div>
                    )}
                    {p.githubUrl && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          margin: '2px 0 4px',
                          fontSize: '11.5px',
                        }}
                      >
                        <GithubIcon size={13} color={COLORS.headingColor} />
                        <a
                          href={p.githubUrl.startsWith('http://') || p.githubUrl.startsWith('https://') ? p.githubUrl : `https://${p.githubUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: COLORS.headingColor,
                            textDecoration: 'none',
                            wordBreak: 'break-all',
                            fontWeight: '600',
                          }}
                        >
                          {p.githubUrl}
                        </a>
                      </div>
                    )}
                    {p.description && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: COLORS.bodyText,
                          lineHeight: '1.65',
                          marginTop: '2px',
                        }}
                      >
                        {p.description
                          .split('\n')
                          .map((l) => l.trim())
                          .filter(Boolean)
                          .map((l, i) => (
                            <div key={i} style={{ marginBottom: '2px' }}>
                              {l}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
                {editable && (
                  <div style={{ marginTop: '2px' }}>
                    <AddPlaceholder label="dự án nổi bật" onClick={() => edit('projects', null)} textColor={COLORS.bodyTextMuted} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Danh hiệu và giải thưởng */}
        {isSectionActive('awards') && (
          <div>
            <SectionHeading
              icon={<Trophy size={16} />}
              editable={editable}
              onEdit={() => edit('awards', null)}
              onRemove={() => remove('awards')}
            >
              Danh hiệu và giải thưởng
            </SectionHeading>
            {awards.length === 0 ? (
              editable && (
                <AddPlaceholder label="danh hiệu / giải thưởng" onClick={() => edit('awards', null)} textColor={COLORS.bodyTextMuted} />
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {awards.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      fontSize: '12.5px',
                      color: COLORS.bodyText,
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: '800', minWidth: '42px', color: COLORS.headingColor }}>
                        {a.grantedYear}
                      </span>
                      <span>
                        {a.name}
                        {a.grantedBy ? ` — ${a.grantedBy}` : ''}
                      </span>
                    </div>
                    {editable && (
                      <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                        <EditButton onClick={() => edit('awards', a)} size={11} />
                        <RemoveButton
                          onClick={() => (onDeleteAdditional ? onDeleteAdditional('awards', a.id) : edit('awards', a))}
                          size={11}
                          title="Xóa giải thưởng"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder label="danh hiệu / giải thưởng" onClick={() => edit('awards', null)} textColor={COLORS.bodyTextMuted} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chứng chỉ */}
        {isSectionActive('certificates') && (
          <div>
            <SectionHeading
              icon={<FileBadge size={16} />}
              editable={editable}
              onEdit={() => edit('certificates', null)}
              onRemove={() => remove('certificates')}
            >
              Chứng chỉ
            </SectionHeading>
            {certificates.length === 0 ? (
              editable && (
                <AddPlaceholder label="chứng chỉ" onClick={() => edit('certificates', null)} textColor={COLORS.bodyTextMuted} />
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {certificates.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      fontSize: '12.5px',
                      color: COLORS.bodyText,
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: '800', minWidth: '42px', color: COLORS.headingColor }}>
                        {c.issuedYear}
                      </span>
                      <span>
                        {c.name}
                        {c.issuedBy ? ` — ${c.issuedBy}` : ''}
                      </span>
                    </div>
                    {editable && (
                      <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                        <EditButton onClick={() => edit('certificates', c)} size={11} />
                        <RemoveButton
                          onClick={() => (onDeleteAdditional ? onDeleteAdditional('certificates', c.id) : edit('certificates', c))}
                          size={11}
                          title="Xóa chứng chỉ"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder label="chứng chỉ" onClick={() => edit('certificates', null)} textColor={COLORS.bodyTextMuted} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Người giới thiệu (nếu người dùng thêm vào) */}
        {isSectionActive('referrers') && (
          <div>
            <SectionHeading
              icon={<Users size={16} />}
              editable={editable}
              onEdit={() => edit('referrers', null)}
              onRemove={() => remove('referrers')}
            >
              Người giới thiệu
            </SectionHeading>
            {referrers.length === 0 ? (
              editable && (
                <AddPlaceholder label="người giới thiệu" onClick={() => edit('referrers', null)} textColor={COLORS.bodyTextMuted} />
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {referrers.map((r) => (
                  <div key={r.id} style={{ fontSize: '12.5px', color: COLORS.bodyText }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: '700', color: COLORS.headingColor }}>{r.name}</div>
                      {editable && (
                        <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                          <EditButton onClick={() => edit('referrers', r)} size={11} />
                          <RemoveButton
                            onClick={() => (onDeleteAdditional ? onDeleteAdditional('referrers', r.id) : edit('referrers', r))}
                            size={11}
                            title="Xóa người giới thiệu"
                          />
                        </div>
                      )}
                    </div>
                    {r.position && <div>Chức vụ: {r.position}</div>}
                    {r.company && <div>Công ty: {r.company}</div>}
                    {r.contactInfo && <div style={{ color: COLORS.bodyTextMuted }}>{r.contactInfo}</div>}
                  </div>
                ))}
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder label="người giới thiệu" onClick={() => edit('referrers', null)} textColor={COLORS.bodyTextMuted} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CvTemplateGreenSidebar;
