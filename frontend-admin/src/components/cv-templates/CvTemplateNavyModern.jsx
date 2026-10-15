import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  User as UserIcon,
  Camera,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';
import { getFullAvatarUrl } from '@/services/apiClient';
import { formatMonthYearRange } from './cvTemplateFormat';
import { EditButton, RemoveButton, AddPlaceholder, getContactIcon, getSkillDisplayLabel, GithubIcon } from './cvTemplateUtils';

const COLORS = {
  navyDark: '#1E2D3D',
  navyCardBg: '#1E2D3D',
  headingColor: '#1E2D3D',
  bodyText: '#334155',
  bodyTextDark: '#0F172A',
  bodyTextMuted: '#64748B',
  infoBoxBg: '#F0F5F8',
};

/** Section heading with bold navy uppercase title & solid underline bar matching CV2.jpg */
const SectionHeader = ({ title, editable, onEdit, onRemove, style }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: `2.5px solid ${COLORS.navyDark}`,
      paddingBottom: '4px',
      marginBottom: '12px',
      ...style,
    }}
  >
    <h3
      style={{
        margin: 0,
        fontSize: '14px',
        fontWeight: '800',
        color: COLORS.navyDark,
        letterSpacing: '0.4px',
        textTransform: 'uppercase',
      }}
    >
      {title}
    </h3>
    {editable && (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} className="no-print">
        {onEdit && (
          <EditButton
            onClick={onEdit}
            style={{
              color: COLORS.navyDark,
              backgroundColor: 'rgba(30, 45, 61, 0.08)',
            }}
          />
        )}
        {onRemove && <RemoveButton onClick={onRemove} />}
      </div>
    )}
  </div>
);

const NavyContactRow = ({ icon, children, editable, onEdit, onDelete }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '9px',
        minHeight: '22px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
              title="Chỉnh sửa kênh liên lạc"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <Pencil size={10} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Xóa kênh liên lạc"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Pixel-accurate clone of frontend-user/src/assets/CV/CV2.jpg — Navy Modern 2-Column layout.
 */
const CvTemplateNavyModern = ({
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
    skills = [],
    certificates = [],
    referrers = [],
    projects = [],
    awards = [],
    interests = [],
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
        width: '100%',
        minHeight: '100%',
        backgroundColor: '#ffffff',
        padding: '34px 36px',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: COLORS.bodyText,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ==================== 1. TOP HEADER ==================== */}
      <div
        style={{
          display: 'flex',
          gap: '22px',
          alignItems: 'stretch',
          marginBottom: '26px',
        }}
      >
        {/* Avatar Photo (Portrait Ratio 3:4) */}
        <div
          style={{
            position: 'relative',
            width: '130px',
            minWidth: '130px',
            height: '165px',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#E2E8F0',
            border: '1px solid #CBD5E1',
            flexShrink: 0,
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={profile.fullName || 'Avatar'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
              }}
            >
              <UserIcon size={48} />
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

        {/* Right Info Box (Light Blue container with Navy Accent Line) */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: COLORS.infoBoxBg,
            borderRadius: '6px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {editable && (
            <div style={{ position: 'absolute', top: '12px', right: '12px' }} className="no-print">
              <EditButton onClick={() => edit('profile')} />
            </div>
          )}

          {/* Name & Title with vertical bar */}
          <div
            style={{
              borderLeft: `4px solid ${COLORS.navyDark}`,
              paddingLeft: '14px',
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: '26px',
                fontWeight: '800',
                color: COLORS.navyDark,
                letterSpacing: '-0.3px',
                lineHeight: 1.2,
              }}
            >
              {profile.fullName || 'Họ và tên'}
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '15px',
                fontWeight: '500',
                color: COLORS.bodyText,
              }}
            >
              {profile.currentTitle || 'Full-stack developer'}
            </p>
          </div>

          {/* Goal / Bio */}
          <div style={{ marginTop: '12px' }}>
            {goal ? (
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: '1.65',
                  color: COLORS.bodyText,
                }}
              >
                {goal}
              </p>
            ) : editable ? (
              <AddPlaceholder
                label="mục tiêu nghề nghiệp"
                onClick={() => edit('profile')}
                textColor={COLORS.bodyTextMuted}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* ==================== 2. MAIN TWO-COLUMN BODY ==================== */}
      <div
        style={{
          display: 'flex',
          gap: '30px',
          alignItems: 'flex-start',
          flex: 1,
        }}
      >
        {/* ==================== LEFT COLUMN (~62%) ==================== */}
        <div
          style={{
            flex: '1.62',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
          }}
        >
          {/* ---- A. HỌC VẤN (Solid Dark Navy Card) ---- */}
          {isSectionActive('education') && (
            <div
              style={{
                backgroundColor: COLORS.navyCardBg,
                borderRadius: '5px',
                padding: '16px 18px',
                color: '#ffffff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
                  paddingBottom: '6px',
                  marginBottom: '10px',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '13.5px',
                    fontWeight: '800',
                    color: '#ffffff',
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                  }}
                >
                  HỌC VẤN
                </h3>
                {editable && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} className="no-print">
                    <EditButton
                      onClick={() => edit('education')}
                      style={{ color: '#ffffff', backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
                    />
                    <RemoveButton
                      onClick={() => remove('education')}
                      style={{ color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.25)' }}
                    />
                  </div>
                )}
              </div>

              {education.length === 0 ? (
                editable && (
                  <AddPlaceholder
                    label="học vấn"
                    onClick={() => edit('education')}
                    textColor="#ffffff"
                  />
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {education.map((edu) => (
                    <div key={edu.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            fontWeight: '700',
                            fontSize: '13px',
                            color: '#ffffff',
                            lineHeight: 1.4,
                          }}
                        >
                          {edu.schoolName}
                        </div>
                        {editable && (
                          <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                            <EditButton
                              onClick={() => edit('education', edu)}
                              size={11}
                              style={{ color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.18)' }}
                            />
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          color: 'rgba(255, 255, 255, 0.82)',
                          margin: '2px 0 5px',
                        }}
                      >
                        {edu.classification ? `${edu.classification} ` : ''}
                        {edu.majorName || ''}
                        {edu.startDate ? ` ( ${formatMonthYearRange(edu.startDate, edu.endDate, false)} )` : ''}
                      </div>
                      {(edu.gpa || edu.thesisAchievement) && (
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '16px',
                            fontSize: '11px',
                            color: 'rgba(255, 255, 255, 0.9)',
                            lineHeight: '1.6',
                          }}
                        >
                          {edu.gpa && <li>GPA: {edu.gpa}</li>}
                          {edu.thesisAchievement && <li>{edu.thesisAchievement}</li>}
                        </ul>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <div style={{ marginTop: '4px' }}>
                      <AddPlaceholder
                        label="học vấn"
                        onClick={() => edit('education', null)}
                        textColor="#ffffff"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---- B. KINH NGHIỆM LÀM VIỆC ---- */}
          {isSectionActive('experiences') && (
            <div>
              <SectionHeader
                title="KINH NGHIỆM LÀM VIỆC"
                editable={editable}
                onEdit={() => edit('experiences')}
                onRemove={() => remove('experiences')}
              />

              {experiences.length === 0 ? (
                editable && (
                  <AddPlaceholder
                    label="kinh nghiệm làm việc"
                    onClick={() => edit('experiences')}
                    textColor={COLORS.bodyTextMuted}
                  />
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {experiences.map((exp) => (
                    <div key={exp.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            fontWeight: '700',
                            fontSize: '13px',
                            color: COLORS.bodyTextDark,
                          }}
                        >
                          {exp.companyName}
                        </div>
                        {editable && (
                          <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                            <EditButton onClick={() => edit('experiences', exp)} size={11} />
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: COLORS.navyDark,
                          margin: '2px 0 5px',
                        }}
                      >
                        {exp.jobTitle}{' '}
                        <span style={{ fontWeight: '400', color: COLORS.bodyTextMuted }}>
                          ( {formatMonthYearRange(exp.startDate, exp.endDate, exp.current)} )
                        </span>
                      </div>
                      {exp.description && (
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: COLORS.bodyText,
                            lineHeight: '1.6',
                            marginTop: '2px',
                          }}
                        >
                          {exp.description
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((line, idx) => (
                              <div key={idx} style={{ marginBottom: '2px' }}>
                                {line}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <div style={{ marginTop: '4px' }}>
                      <AddPlaceholder
                        label="kinh nghiệm làm việc"
                        onClick={() => edit('experiences', null)}
                        textColor={COLORS.navyDark}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---- C. DỰ ÁN NỔI BẬT ---- */}
          {isSectionActive('projects') && (
            <div>
              <SectionHeader
                title="DỰ ÁN NỔI BẬT"
                editable={editable}
                onEdit={() => edit('projects')}
                onRemove={() => remove('projects')}
              />

              {projects.length === 0 ? (
                editable && (
                  <AddPlaceholder
                    label="dự án nổi bật"
                    onClick={() => edit('projects')}
                    textColor={COLORS.bodyTextMuted}
                  />
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {projects.map((p) => (
                    <div key={p.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div
                          style={{
                            fontWeight: '700',
                            fontSize: '13px',
                            color: COLORS.bodyTextDark,
                          }}
                        >
                          {p.name}{' '}
                          <span style={{ fontWeight: '400', color: COLORS.bodyTextMuted, fontSize: '11.5px' }}>
                            ( {formatMonthYearRange(p.startDate, p.endDate, false)} )
                          </span>
                        </div>
                        {editable && (
                          <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                            <EditButton onClick={() => edit('projects', p)} size={11} />
                          </div>
                        )}
                      </div>
                      {p.role && (
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: COLORS.navyDark,
                            margin: '2px 0 3px',
                          }}
                        >
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
                          <GithubIcon size={13} color={COLORS.navyDark} />
                          <a
                            href={p.githubUrl.startsWith('http://') || p.githubUrl.startsWith('https://') ? p.githubUrl : `https://${p.githubUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: COLORS.navyDark,
                              textDecoration: 'none',
                              wordBreak: 'break-all',
                              fontWeight: '500',
                            }}
                          >
                            {p.githubUrl}
                          </a>
                        </div>
                      )}
                      {p.description && (
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: COLORS.bodyText,
                            lineHeight: '1.6',
                            marginTop: '2px',
                          }}
                        >
                          {p.description
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((line, idx) => (
                              <div key={idx} style={{ marginBottom: '2px' }}>
                                {line}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <div style={{ marginTop: '4px' }}>
                      <AddPlaceholder
                        label="dự án nổi bật"
                        onClick={() => edit('projects', null)}
                        textColor={COLORS.navyDark}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---- D. DANH HIỆU VÀ GIẢI THƯỞNG (Nếu thêm vào) ---- */}
          {isSectionActive('awards') && (
            <div>
              <SectionHeader
                title="DANH HIỆU VÀ GIẢI THƯỞNG"
                editable={editable}
                onEdit={() => edit('awards')}
                onRemove={() => remove('awards')}
              />
              {awards.length === 0 ? (
                editable && (
                  <AddPlaceholder
                    label="danh hiệu / giải thưởng"
                    onClick={() => edit('awards')}
                    textColor={COLORS.bodyTextMuted}
                  />
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
                        gap: '10px',
                        fontSize: '12px',
                        color: COLORS.bodyText,
                      }}
                    >
                      <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: '800', minWidth: '40px', color: COLORS.navyDark }}>{a.grantedYear}</span>
                        <span>{a.name}{a.grantedBy ? ` — ${a.grantedBy}` : ''}</span>
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
                      <AddPlaceholder
                        label="danh hiệu / giải thưởng"
                        onClick={() => edit('awards', null)}
                        textColor={COLORS.navyDark}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================== RIGHT COLUMN (~38%) ==================== */}
        <div
          style={{
            flex: '1',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* ---- A. THÔNG TIN CÁ NHÂN ---- */}
          {isSectionActive('contacts') && (
            <div>
              <SectionHeader
                title="THÔNG TIN CÁ NHÂN"
                editable={editable}
                onEdit={() => edit('contacts', null)}
                onRemove={() => remove('contacts')}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '11.5px', color: COLORS.bodyText }}>
                {contacts.map((c) => (
                  <NavyContactRow
                    key={c.id || `${c.type}_${c.value}`}
                    icon={getContactIcon(c.type, 13, COLORS.navyDark)}
                    editable={editable}
                    onEdit={() => edit('contacts', c)}
                    onDelete={() => onDeleteContact?.(c.id)}
                  >
                    {c.value}
                  </NavyContactRow>
                ))}

                {profile.email && !contacts.some((c) => (c.type || '').toUpperCase() === 'EMAIL') && (
                  <NavyContactRow
                    icon={<Mail size={13} style={{ color: COLORS.navyDark }} />}
                    editable={editable}
                    onEdit={() => edit('profile')}
                  >
                    {profile.email}
                  </NavyContactRow>
                )}

                {location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <MapPin size={13} style={{ color: COLORS.navyDark, flexShrink: 0 }} />
                    <span>{location}</span>
                  </div>
                )}
                {profile.dateOfBirth && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <Calendar size={13} style={{ color: COLORS.navyDark, flexShrink: 0 }} />
                    <span>{profile.dateOfBirth}</span>
                  </div>
                )}
                {profile.gender && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <UserIcon size={13} style={{ color: COLORS.navyDark, flexShrink: 0 }} />
                    <span>{profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</span>
                  </div>
                )}

                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder
                      label="liên hệ"
                      onClick={() => edit('contacts', null)}
                      textColor={COLORS.navyDark}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- B. KỸ NĂNG ---- */}
          {isSectionActive('skills') && (
            <div>
              <SectionHeader
                title="KỸ NĂNG"
                editable={editable}
                onEdit={() => edit('skills')}
                onRemove={() => remove('skills')}
              />

              {skills.length === 0 ? (
                editable && (
                  <AddPlaceholder
                    label="kỹ năng"
                    onClick={() => edit('skills')}
                    textColor={COLORS.bodyTextMuted}
                  />
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '11.5px', color: COLORS.bodyTextDark }}>
                  {skills.map((s) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', lineHeight: 1.4 }}>
                      <span>{getSkillDisplayLabel(s)}</span>
                      {editable && (
                        <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                          <EditButton onClick={() => edit('skills', s)} size={11} />
                        </div>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <div style={{ marginTop: '4px' }}>
                      <AddPlaceholder
                        label="kỹ năng"
                        onClick={() => edit('skills', null)}
                        textColor={COLORS.navyDark}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---- C. CHỨNG CHỈ ---- */}
          {isSectionActive('certificates') && (
            <div>
              <SectionHeader
                title="CHỨNG CHỈ"
                editable={editable}
                onEdit={() => edit('certificates')}
                onRemove={() => remove('certificates')}
              />

              {certificates.length === 0 ? (
                editable && (
                  <AddPlaceholder
                    label="chứng chỉ"
                    onClick={() => edit('certificates')}
                    textColor={COLORS.bodyTextMuted}
                  />
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {certificates.map((c) => (
                    <div key={c.id} style={{ fontSize: '11.5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                        <div style={{ fontWeight: '700', color: COLORS.bodyTextDark }}>
                          {c.issuedBy ? `${c.issuedBy} ` : ''}{c.issuedYear ? `${c.issuedYear}` : ''}
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
                      <div style={{ color: COLORS.bodyText, marginTop: '2px' }}>
                        {c.name}
                      </div>
                    </div>
                  ))}
                  {editable && (
                    <div style={{ marginTop: '4px' }}>
                      <AddPlaceholder
                        label="chứng chỉ"
                        onClick={() => edit('certificates', null)}
                        textColor={COLORS.navyDark}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---- D. NGƯỜI GIỚI THIỆU (Soft Pale Blue Box) ---- */}
          {isSectionActive('referrers') && (
            <div
              style={{
                backgroundColor: COLORS.infoBoxBg,
                borderRadius: '6px',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `2px solid ${COLORS.navyDark}`,
                  paddingBottom: '4px',
                  marginBottom: '10px',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: '800',
                    color: COLORS.navyDark,
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                  }}
                >
                  NGƯỜI GIỚI THIỆU
                </h3>
                {editable && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} className="no-print">
                    <EditButton
                      onClick={() => edit('referrers')}
                      style={{ color: COLORS.navyDark, backgroundColor: 'rgba(30, 45, 61, 0.08)' }}
                    />
                    <RemoveButton onClick={() => remove('referrers')} />
                  </div>
                )}
              </div>

              {referrers.length === 0 ? (
                editable && (
                  <AddPlaceholder
                    label="người giới thiệu"
                    onClick={() => edit('referrers')}
                    textColor={COLORS.bodyTextMuted}
                  />
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', color: COLORS.bodyText }}>
                  {referrers.map((r) => (
                    <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700', color: COLORS.bodyTextDark }}>{r.name}</div>
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
                      {r.position && (
                        <div>
                          <strong>Chức vụ:</strong> {r.position}
                        </div>
                      )}
                      {r.company && (
                        <div>
                          <strong>Công ty:</strong> {r.company}
                        </div>
                      )}
                      {r.relationship && (
                        <div>
                          <strong>Mối quan hệ:</strong> {r.relationship}
                        </div>
                      )}
                      {r.contactInfo && (
                        <div>
                          <strong>Liên hệ:</strong> {r.contactInfo}
                        </div>
                      )}
                    </div>
                  ))}
                  {editable && (
                    <div style={{ marginTop: '4px' }}>
                      <AddPlaceholder
                        label="người giới thiệu"
                        onClick={() => edit('referrers', null)}
                        textColor={COLORS.navyDark}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---- E. SỞ THÍCH (Nếu thêm vào) ---- */}
          {isSectionActive('interests') && (
            <div>
              <SectionHeader
                title="SỞ THÍCH"
                editable={editable}
                onEdit={() => edit('interests')}
                onRemove={() => remove('interests')}
              />
              {interests.length === 0 ? (
                editable && (
                  <AddPlaceholder
                    label="sở thích"
                    onClick={() => edit('interests')}
                    textColor={COLORS.bodyTextMuted}
                  />
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {interests.map((it) => (
                      <span
                        key={it.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(30, 45, 61, 0.08)',
                          color: COLORS.bodyTextDark,
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
                              color: '#ef4444',
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
                      <AddPlaceholder
                        label="sở thích"
                        onClick={() => edit('interests', null)}
                        textColor={COLORS.navyDark}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CvTemplateNavyModern;
