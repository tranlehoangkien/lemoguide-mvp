import React from 'react';
import {
  Calendar,
  MapPin,
  Mail,
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
  beige: '#F5EEE8',
  brown: '#855829',
  brownDark: '#5C3C1A',
  headingColor: '#241C16',
  bodyText: '#2E251E',
  bodyTextMuted: '#6B5A4E',
};

const Banner = ({ children, editable, onEdit, onRemove, style }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: COLORS.brown,
      padding: '7px 14px',
      borderRadius: '4px',
      marginBottom: '14px',
      ...style,
    }}
  >
    <h3
      style={{
        margin: 0,
        fontSize: '13px',
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: '0.5px',
      }}
    >
      {children}
    </h3>
    {editable && (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} className="no-print">
        {onEdit && <EditButton onClick={onEdit} style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' }} />}
        {onRemove && <RemoveButton onClick={onRemove} style={{ color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.25)' }} />}
      </div>
    )}
  </div>
);

const BrownContactRow = ({ icon, children, editable, onEdit, onDelete }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px',
        padding: '3px 4px',
        borderRadius: '4px',
        backgroundColor: hovered && editable ? 'rgba(133, 88, 41, 0.08)' : 'transparent',
        transition: 'background-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
        <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ wordBreak: 'break-word' }}>{children}</span>
      </div>

      {editable && hovered && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} className="no-print">
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
                backgroundColor: 'rgba(133, 88, 41, 0.15)',
                color: COLORS.brown,
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

const TimelineItem = ({ children, isLast }) => (
  <div style={{ position: 'relative', paddingLeft: '22px', marginBottom: isLast ? 0 : '16px' }}>
    {/* Vertical connecting line */}
    {!isLast && (
      <span
        style={{
          position: 'absolute',
          left: '4px',
          top: '12px',
          bottom: '-16px',
          width: '1.5px',
          backgroundColor: '#D6C8BC',
        }}
      />
    )}
    {/* Timeline dot */}
    <span
      style={{
        position: 'absolute',
        left: 0,
        top: '4px',
        width: '9px',
        height: '9px',
        borderRadius: '50%',
        backgroundColor: COLORS.brown,
      }}
    />
    {children}
  </div>
);

/**
 * Pixel-accurate clone of frontend-user/src/assets/CV/CV3.jpg —
 * Cream/Beige sidebar (~36%) + Warm Brown banners + Timeline connectors (~64%).
 */
const CvTemplateBrownTwoColumn = ({
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
    referrers = [],
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
        display: 'flex',
        width: '100%',
        minHeight: '100%',
        backgroundColor: '#ffffff',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      {/* ==================== LEFT COLUMN (~36%) ==================== */}
      <div
        style={{
          width: '36%',
          minWidth: '220px',
          backgroundColor: COLORS.beige,
          padding: '30px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Name & Title Header */}
        <div style={{ textAlign: 'left' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '800',
              color: COLORS.headingColor,
              lineHeight: 1.2,
              letterSpacing: '-0.2px',
            }}
          >
            {profile.fullName || 'Họ và tên'}
          </h1>
          <p
            style={{
              margin: '5px 0 0',
              fontSize: '14px',
              color: COLORS.bodyText,
              fontWeight: '500',
            }}
          >
            {profile.currentTitle || 'Front-end developer'}
          </p>
        </div>

        {/* Circular Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 6px' }}>
          <div
            style={{
              position: 'relative',
              width: '144px',
              height: '144px',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: 'rgba(133, 88, 41, 0.12)',
              border: '4px solid #ffffff',
              boxShadow: '0 2px 10px rgba(133, 88, 41, 0.2)',
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
                  color: COLORS.brown,
                }}
              >
                <UserIcon size={52} />
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
        </div>

        {/* Thông tin cá nhân */}
        {isSectionActive('contacts') && (
          <div>
            <Banner editable={editable} onEdit={() => edit('contacts', null)} onRemove={() => remove('contacts')}>
              THÔNG TIN CÁ NHÂN
            </Banner>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '12px', color: COLORS.bodyText }}>
              {contacts.map((c) => (
                <BrownContactRow
                  key={c.id || `${c.type}_${c.value}`}
                  icon={getContactIcon(c.type, 13, COLORS.brown)}
                  editable={editable}
                  onEdit={() => edit('contacts', c)}
                  onDelete={() => onDeleteContact?.(c.id)}
                >
                  {c.value}
                </BrownContactRow>
              ))}

              {profile.dateOfBirth && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={13} color={COLORS.brown} style={{ flexShrink: 0 }} />
                  <span>{profile.dateOfBirth}</span>
                </div>
              )}
              {profile.email && !contacts.some((c) => (c.type || '').toUpperCase() === 'EMAIL') && (
                <BrownContactRow
                  icon={<Mail size={13} color={COLORS.brown} />}
                  editable={editable}
                  onEdit={() => edit('profile')}
                >
                  {profile.email}
                </BrownContactRow>
              )}
              {location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin size={13} color={COLORS.brown} style={{ flexShrink: 0 }} />
                  <span>{location}</span>
                </div>
              )}
              {profile.gender && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserIcon size={13} color={COLORS.brown} style={{ flexShrink: 0 }} />
                  <span>{profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</span>
                </div>
              )}
              {editable && (
                <div style={{ marginTop: '4px' }}>
                  <AddPlaceholder
                    label="liên hệ"
                    onClick={() => edit('contacts', null)}
                    textColor={COLORS.brown}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mục tiêu nghề nghiệp */}
        {isSectionActive('profile') && (
          <div>
            <Banner editable={editable} onEdit={() => edit('profile')} onRemove={() => remove('profile')}>
              MỤC TIÊU NGHỀ NGHIỆP
            </Banner>
            {goal ? (
              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.65', color: COLORS.bodyText }}>
                {goal}
              </p>
            ) : editable ? (
              <AddPlaceholder label="mục tiêu nghề nghiệp" onClick={() => edit('profile')} textColor={COLORS.bodyTextMuted} />
            ) : null}
          </div>
        )}

        {/* Kỹ năng */}
        {/* Kỹ năng */}
        {isSectionActive('skills') && (
          <div>
            <Banner editable={editable} onEdit={() => edit('skills', null)} onRemove={() => remove('skills')}>
              KỸ NĂNG
            </Banner>
            {skills.length === 0 ? (
              editable && <AddPlaceholder label="kỹ năng" onClick={() => edit('skills', null)} textColor={COLORS.bodyTextMuted} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '12px', color: COLORS.bodyText }}>
                {skills.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.2px' }}>
                      {getSkillDisplayLabel(s)}
                    </span>
                    {editable && (
                      <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                        <EditButton onClick={() => edit('skills', s)} size={11} />
                      </div>
                    )}
                  </div>
                ))}
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder label="kỹ năng" onClick={() => edit('skills', null)} textColor={COLORS.brown} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Người giới thiệu */}
        {isSectionActive('referrers') && (
          <div>
            <Banner editable={editable} onEdit={() => edit('referrers', null)} onRemove={() => remove('referrers')}>
              NGƯỜI GIỚI THIỆU
            </Banner>
            {referrers.length === 0 ? (
              editable && <AddPlaceholder label="người giới thiệu" onClick={() => edit('referrers', null)} textColor={COLORS.bodyTextMuted} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11.5px', color: COLORS.bodyText }}>
                {referrers.map((r) => (
                  <div key={r.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: '700', fontSize: '12px', color: COLORS.headingColor }}>
                        {r.name}
                      </div>
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
                      <div style={{ marginTop: '2px' }}>
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
                      <div style={{ color: COLORS.bodyTextMuted, marginTop: '2px' }}>
                        {r.contactInfo}
                      </div>
                    )}
                  </div>
                ))}
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder label="người giới thiệu" onClick={() => edit('referrers', null)} textColor={COLORS.brown} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sở thích */}
        {isSectionActive('interests') && (
          <div>
            <Banner editable={editable} onEdit={() => edit('interests', null)} onRemove={() => remove('interests')}>
              SỞ THÍCH
            </Banner>
            {interests.length === 0 ? (
              editable && <AddPlaceholder label="sở thích" onClick={() => edit('interests', null)} textColor={COLORS.bodyTextMuted} />
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
                        backgroundColor: 'rgba(133, 88, 41, 0.12)',
                        color: COLORS.brownDark,
                        fontSize: '11.5px',
                        fontWeight: '600',
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
                    <AddPlaceholder label="sở thích" onClick={() => edit('interests', null)} textColor={COLORS.brown} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== RIGHT COLUMN (~64%) ==================== */}
      <div
        style={{
          flex: 1,
          padding: '30px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          boxSizing: 'border-box',
        }}
      >
        {/* Kinh nghiệm làm việc */}
        {isSectionActive('experiences') && (
          <div>
            <Banner editable={editable} onEdit={() => edit('experiences', null)} onRemove={() => remove('experiences')}>
              KINH NGHIỆM LÀM VIỆC
            </Banner>
            {experiences.length === 0 ? (
              editable && (
                <AddPlaceholder
                  label="kinh nghiệm làm việc"
                  onClick={() => edit('experiences', null)}
                  textColor={COLORS.bodyTextMuted}
                />
              )
            ) : (
              <div>
                {experiences.map((exp, idx) => (
                  <TimelineItem key={exp.id} isLast={idx === experiences.length - 1}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        fontSize: '13.5px',
                        fontWeight: '700',
                        color: COLORS.headingColor,
                      }}
                    >
                      <span>{exp.companyName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '400', color: COLORS.bodyTextMuted, fontSize: '12px' }}>
                          {formatMonthYearRange(exp.startDate, exp.endDate, exp.current)}
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
                        fontSize: '12.5px',
                        color: COLORS.brownDark,
                        margin: '2px 0 5px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {exp.jobTitle}
                    </div>
                    {exp.description && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: COLORS.bodyText,
                          lineHeight: '1.65',
                          marginTop: '2px',
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
                  </TimelineItem>
                ))}
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder
                      label="kinh nghiệm làm việc"
                      onClick={() => edit('experiences', null)}
                      textColor={COLORS.brown}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Học vấn */}
        {isSectionActive('education') && (
          <div>
            <Banner editable={editable} onEdit={() => edit('education', null)} onRemove={() => remove('education')}>
              HỌC VẤN
            </Banner>
            {education.length === 0 ? (
              editable && <AddPlaceholder label="học vấn" onClick={() => edit('education', null)} textColor={COLORS.bodyTextMuted} />
            ) : (
              <div>
                {education.map((edu, idx) => (
                  <TimelineItem key={edu.id} isLast={idx === education.length - 1}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: '700', fontSize: '13.5px', color: COLORS.headingColor }}>
                        {edu.schoolName}
                      </div>
                      {editable && (
                        <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                          <EditButton onClick={() => edit('education', edu)} size={11} />
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: COLORS.bodyTextMuted, margin: '2px 0 4px' }}>
                      {edu.startDate ? `${formatMonthYearRange(edu.startDate, edu.endDate, false)}` : ''}
                    </div>
                    {(edu.majorName || edu.classification) && (
                      <div style={{ fontSize: '12px', color: COLORS.bodyText }}>
                        Chuyên ngành: {edu.majorName || edu.classification}
                      </div>
                    )}
                    {(edu.gpa || edu.thesisAchievement) && (
                      <ul
                        style={{
                          margin: '4px 0 0',
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
                  </TimelineItem>
                ))}
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder label="học vấn" onClick={() => edit('education', null)} textColor={COLORS.brown} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dự án nổi bật */}
        {isSectionActive('projects') && (
          <div>
            <Banner editable={editable} onEdit={() => edit('projects', null)} onRemove={() => remove('projects')}>
              DỰ ÁN NỔI BẬT
            </Banner>
            {projects.length === 0 ? (
              editable && (
                <AddPlaceholder label="dự án nổi bật" onClick={() => edit('projects', null)} textColor={COLORS.bodyTextMuted} />
              )
            ) : (
              <div>
                {projects.map((p, idx) => (
                  <TimelineItem key={p.id} isLast={idx === projects.length - 1}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        fontSize: '13.5px',
                        fontWeight: '700',
                        color: COLORS.headingColor,
                      }}
                    >
                      <span>{p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '400', color: COLORS.bodyTextMuted, fontSize: '12px' }}>
                          {formatMonthYearRange(p.startDate, p.endDate, false)}
                        </span>
                        {editable && (
                          <div style={{ display: 'inline-flex', gap: '4px' }} className="no-print">
                            <EditButton onClick={() => edit('projects', p)} size={11} />
                          </div>
                        )}
                      </div>
                    </div>
                    {p.role && (
                      <div style={{ fontWeight: '600', fontSize: '12.5px', color: COLORS.brownDark, margin: '2px 0 2px' }}>
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
                        <GithubIcon size={13} color={COLORS.brown} />
                        <a
                          href={p.githubUrl.startsWith('http://') || p.githubUrl.startsWith('https://') ? p.githubUrl : `https://${p.githubUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: COLORS.brownDark,
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
                  </TimelineItem>
                ))}
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder label="dự án nổi bật" onClick={() => edit('projects', null)} textColor={COLORS.brown} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chứng chỉ */}
        {isSectionActive('certificates') && (
          <div>
            <Banner editable={editable} onEdit={() => edit('certificates', null)} onRemove={() => remove('certificates')}>
              CHỨNG CHỈ
            </Banner>
            {certificates.length === 0 ? (
              editable && <AddPlaceholder label="chứng chỉ" onClick={() => edit('certificates', null)} textColor={COLORS.bodyTextMuted} />
            ) : (
              <div>
                {certificates.map((c, idx) => (
                  <TimelineItem key={c.id} isLast={idx === certificates.length - 1}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: '700', fontSize: '12.5px', color: COLORS.headingColor }}>
                        {c.issuedBy} {c.issuedYear ? `(${c.issuedYear})` : ''}
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
                    <div style={{ fontSize: '12px', color: COLORS.bodyText, marginTop: '2px' }}>
                      {c.name}
                    </div>
                  </TimelineItem>
                ))}
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder label="chứng chỉ" onClick={() => edit('certificates', null)} textColor={COLORS.brown} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Danh hiệu và giải thưởng */}
        {isSectionActive('awards') && (
          <div>
            <Banner editable={editable} onEdit={() => edit('awards', null)} onRemove={() => remove('awards')}>
              DANH HIỆU VÀ GIẢI THƯỞNG
            </Banner>
            {awards.length === 0 ? (
              editable && (
                <AddPlaceholder label="danh hiệu / giải thưởng" onClick={() => edit('awards', null)} textColor={COLORS.bodyTextMuted} />
              )
            ) : (
              <div>
                {awards.map((a, idx) => (
                  <TimelineItem key={a.id} isLast={idx === awards.length - 1}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: '700', fontSize: '12.5px', color: COLORS.headingColor }}>
                        {a.grantedBy || a.name}
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
                    <div style={{ fontSize: '12px', color: COLORS.bodyText, marginTop: '2px' }}>
                      {a.grantedBy ? a.name : ''} {a.grantedYear ? `— ${a.grantedYear}` : ''}
                    </div>
                  </TimelineItem>
                ))}
                {editable && (
                  <div style={{ marginTop: '4px' }}>
                    <AddPlaceholder label="danh hiệu / giải thưởng" onClick={() => edit('awards', null)} textColor={COLORS.brown} />
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

export default CvTemplateBrownTwoColumn;
