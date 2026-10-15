import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Target, ArrowRightLeft, Sparkles, FileText, ExternalLink, RotateCcw, Clock, CalendarDays, Info } from 'lucide-react';
import { Button, SectionCard } from '@/components/ui';
import { useChat } from '@/context/ChatContext';
import { cvProfileService } from '@/services/cvProfileService';
import { careerPlanService } from '@/services/careerPlanService';
import { ROUTES } from '@/constants/routes';
import CvSelectionModal from '../cv-studio/CvSelectionModal';

const INTENTS = [
  { key: 'target', icon: Target, title: 'Đã có mục tiêu', text: 'Biết kỹ năng cần bổ sung và từng bước thực hiện.' },
  { key: 'explore', icon: Compass, title: 'Khám phá hướng đi', text: 'Thử những hướng nghề dựa trên thế mạnh và sở thích.' },
  { key: 'transition', icon: ArrowRightLeft, title: 'Chuyển nghề / phát triển', text: 'Tận dụng kinh nghiệm để tiến tới vai trò mới.' },
];

export default function CareerSetup({ seed, onCreated, onCancel }) {
  const navigate = useNavigate();
  const { selectedModel } = useChat();
  const [intent, setIntent] = useState(seed?.intent || 'target');
  const [role, setRole] = useState(seed?.targetRole || '');
  const [hours, setHours] = useState(seed?.hoursPerWeek || 6);
  const [weeks, setWeeks] = useState('');
  const [proposal, setProposal] = useState(null);
  const submitLock = useRef(false);
  const [useProfile, setUseProfile] = useState(seed?.useProfile ?? true);
  const [cvId, setCvId] = useState(seed?.cvProfileId ? String(seed.cvProfileId) : '');
  const [background, setBackground] = useState(seed?.background || '');
  const [constraints, setConstraints] = useState(seed?.constraints || '');
  const [profile, setProfile] = useState(null);
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([careerPlanService.profileContext(), cvProfileService.getMyCvs({ size: 50 })])
      .then(([context, page]) => {
        if (!cancelled) { setProfile(context); setCvs(page.content || []); setLoadError(''); }
      })
      .catch((err) => { if (!cancelled) setLoadError(err.message || 'Không tải được hồ sơ và CV.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retry]);

  const selectedCv = useMemo(() => cvs.find((c) => String(c.id) === cvId) || null, [cvs, cvId]);

  const request = {
    intent, targetRole: role.trim(), hoursPerWeek: Number(hours),
    useProfile, cvProfileId: cvId ? Number(cvId) : null, background: background.trim(),
    constraints: constraints.trim(), modelId: selectedModel || null, replacePlanId: seed?.id || null,
  };
  const inputKey = JSON.stringify(request);
  const currentProposal = proposal?.inputKey === inputKey ? proposal.data : null;

  const submit = async (event) => {
    event.preventDefault();
    if (event.target !== event.currentTarget || picker || busy || submitLock.current) return;
    if (!background.trim() && !cvId && !(useProfile && profile && !profile.empty)) {
      setError('Hãy mô tả kỹ năng, kinh nghiệm hoặc sở thích để AI có căn cứ lập lộ trình.');
      return;
    }
    submitLock.current = true;
    setBusy(true); setError('');
    try {
      if (!currentProposal) {
        const data = await careerPlanService.propose(request);
        setProposal({ inputKey, data });
        setWeeks(data.options[0].weeks);
        return;
      }
      const plan = await careerPlanService.create({
        ...request, durationWeeks: Number(weeks), proposalId: currentProposal.id,
      });
      onCreated(plan);
    } catch (err) {
      setError(err.message || 'Chưa tạo được lộ trình. Vui lòng thử lại.');
    } finally { submitLock.current = false; setBusy(false); }
  };

  return (
    <>
      {picker && (
        <CvSelectionModal
          kind="cv"
          items={cvs}
          selectedId={cvId}
          loading={loading}
          error={null}
          description="Chọn CV để lộ trình bám vào kinh nghiệm thật của bạn."
          onClose={() => setPicker(false)}
          onConfirm={(id) => { setCvId(id); setPicker(false); }}
        />
      )}

      <form onSubmit={submit} className="career-setup" aria-busy={busy}>
      <fieldset disabled={busy}>
        <legend className="ui-sr-only">Mục tiêu và thời gian</legend>
        <SectionCard icon={Target} title="Mục tiêu và thời gian">

          <div className="cvs-setup__row">
            <div className="cvs-setup__label">Hướng đi</div>
            <div className="cvs-setup__body">
              <div className="career-intents">
                {INTENTS.map(({ key, icon: Icon, title, text }) => (
                  <label key={key} className={`career-intent${intent === key ? ' is-selected' : ''}`}>
                    <input type="radio" name="career-intent" value={key} checked={intent === key} onChange={() => setIntent(key)} />
                    <Icon size={20} aria-hidden="true" />
                    <strong>{title}</strong><span>{text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="cvs-setup__row">
            <div className="cvs-setup__label">Vị trí</div>
            <div className="cvs-setup__body">
              <input id="career-target-role" aria-label="Vị trí mục tiêu" className="ui-input" value={role} onChange={(e) => setRole(e.target.value)} required={intent !== 'explore'} maxLength={200}
                placeholder="Ví dụ: Backend Developer ở cấp độ Junior" />
            </div>
          </div>

          <div className="cvs-setup__row">
            <div className="cvs-setup__label">Thời gian</div>
            <div className="cvs-setup__body">
              <div className="career-two-col">
                <label className="career-field"><span>Thời gian mỗi tuần</span>
                  <div className="career-input-unit"><input className="ui-input" type="number" min="1" max="20" required value={hours}
                    onChange={(e) => setHours(e.target.value)} /><span>giờ / tuần</span></div>
                </label>
                <div className="career-field"><span>Thời lượng theo mục tiêu</span>
                  <p className="career-muted">AI sẽ đánh giá điểm xuất phát và quỹ giờ để đề xuất các lựa chọn khả thi, kể cả lộ trình dài hơn 12 tuần.</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </fieldset>

      <fieldset disabled={busy}>
        <legend className="ui-sr-only">Xác nhận điểm xuất phát</legend>
        <SectionCard icon={FileText} title="Điểm xuất phát">

          {loading ? <div className="cvs-setup__row"><div className="cvs-setup__body"><p className="cvs-empty-line">Đang tải hồ sơ và CV…</p></div></div> : loadError ? (
            <div className="cvs-setup__row"><div className="cvs-setup__body">
              <div className="cvs-note cvs-note--error" role="alert">{loadError} <Button size="sm" variant="secondary" onClick={() => {
                setLoading(true); setRetry((v) => v + 1);
              }}>Thử lại</Button></div>
            </div></div>
          ) : <>
            <div className="cvs-setup__row">
              <div className="cvs-setup__label">Hồ sơ</div>
              <div className="cvs-setup__body">
                <label className="career-check"><input type="checkbox" checked={useProfile} onChange={(e) => setUseProfile(e.target.checked)} />
                  Sử dụng hồ sơ LemoGuide của tôi
                </label>
                {useProfile && <div className="career-profile">
                  {profile?.empty ? <p>Hồ sơ chưa có dữ liệu. Bạn có thể mô tả bên dưới hoặc <button type="button" className="cvs-link" onClick={() => navigate(ROUTES.PROFILE)}>bổ sung hồ sơ</button>.</p> : (
                    <details><summary>Xem kỹ năng, kinh nghiệm và học vấn được sử dụng</summary><pre>{profile?.text}</pre></details>
                  )}
                </div>}
              </div>
            </div>

            <div className="cvs-setup__row">
              <div className="cvs-setup__label">CV</div>
              <div className="cvs-setup__body">
                <div className="cvs-cv-selection">
                  <div className={`cvs-choice${selectedCv ? ' cvs-choice--selected' : ''}`}>
                    <span className="cvs-choice__icon"><FileText size={22} aria-hidden="true" /></span>
                    <div className="cvs-choice__text">
                      <small>{selectedCv ? 'CV đang sử dụng' : 'Chưa dùng CV'}</small>
                      <strong>{selectedCv ? selectedCv.title : 'Chọn một CV để bổ sung ngữ cảnh'}</strong>
                    </div>
                    <Button variant="secondary" size="sm" aria-haspopup="dialog" disabled={!cvs.length} onClick={() => setPicker(true)}>
                      {selectedCv ? 'Đổi CV' : 'Chọn CV'}
                    </Button>
                  </div>
                  {!cvs.length && <p className="cvs-empty-line">Bạn chưa có CV nào đã lưu.</p>}
                  {selectedCv && (
                    <div className="cvs-setup__inline">
                      <button type="button" className="cvs-link" onClick={() => navigate(`${ROUTES.CV_EDITOR}?id=${cvId}`)}>
                        Mở trình chỉnh sửa <ExternalLink size={14} aria-hidden="true" />
                      </button>
                      <button type="button" className="cvs-link cvs-link--quiet" onClick={() => setCvId('')}>Không dùng CV</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="cvs-setup__row">
              <div className="cvs-setup__label">Mô tả thêm</div>
              <div className="cvs-setup__body">
                <textarea aria-label="Mô tả thêm" className="ui-textarea" rows={4} maxLength={4000} value={background} onChange={(e) => setBackground(e.target.value)}
                  placeholder="Ví dụ: Tôi biết Java cơ bản, đã làm đồ án quản lý thư viện, thích xây API và chưa học kiểm thử tự động." />
              </div>
            </div>

            <div className="cvs-setup__row">
              <div className="cvs-setup__label">Điều kiện</div>
              <div className="cvs-setup__body">
                <textarea aria-label="Điều kiện" className="ui-textarea" rows={2} maxLength={1500} value={constraints} onChange={(e) => setConstraints(e.target.value)}
                  placeholder="Ví dụ: Chỉ học buổi tối, ưu tiên tài liệu miễn phí, cần cải thiện tiếng Anh." />
              </div>
            </div>
          </>}
        </SectionCard>
      </fieldset>

      {currentProposal && <SectionCard icon={Compass} title="Chọn thời lượng phù hợp"
        action={<Button variant="ghost" size="sm" icon={RotateCcw} disabled={busy} onClick={() => setProposal(null)}>Đánh giá lại</Button>}>

        <div className="career-proposal__goal">
          <span className="career-proposal__label">Mục tiêu</span>
          <h4>{currentProposal.goal}</h4>
          <p>{currentProposal.rationale}</p>
          <div className="career-proposal__meta">
            <span><Clock size={14} aria-hidden="true" />Tối thiểu <strong>{currentProposal.minimumHours} giờ</strong> học và thực hành</span>
            <span><CalendarDays size={14} aria-hidden="true" /><strong>{Number(hours)} giờ</strong> mỗi tuần</span>
          </div>
        </div>

        <fieldset disabled={busy} className="career-proposal__block">
          <legend className="career-proposal__label">Thời lượng AI đề xuất</legend>
          <div className="career-durations">
            {currentProposal.options.map((option) => {
              const selected = Number(weeks) === option.weeks;
              return (
                <label key={option.weeks} className={`career-duration${selected ? ' is-selected' : ''}`}>
                  <input type="radio" name="career-duration" value={option.weeks} checked={selected} onChange={() => setWeeks(option.weeks)} />
                  <span className="career-duration__figure"><strong>{option.weeks}</strong> tuần</span>
                  <span className="career-duration__hours">{option.weeks * Number(hours)} giờ tổng cộng</span>
                  <span className="career-duration__reason">{option.reason}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="career-proposal__block">
          <span className="career-proposal__label">Kỹ năng và thành tựu dự kiến</span>
          <ul className="cvs-list career-proposal-outcomes">
            {currentProposal.outcomes.map((outcome, index) => (
              <li key={index}>
                <strong>{outcome.skill}</strong>
                <p>{outcome.achievement}</p>
              </li>
            ))}
          </ul>
          <p className="career-proposal__hint"><Info size={14} aria-hidden="true" />Đầu ra cần được kiểm chứng qua sản phẩm thực hành; đây chưa phải kỹ năng hay thành tích đã đạt được. Thay đổi mục tiêu hoặc điểm xuất phát cần đánh giá lại.</p>
        </div>
      </SectionCard>}

      {seed?.id && <p className="career-muted">Điều chỉnh sẽ thay thế lộ trình hiện tại bằng lộ trình mới. Mỗi tài khoản chỉ lưu một lộ trình phát triển.</p>}

      <div className="career-startbar">
        {error && <div className="cvs-note cvs-note--error" role="alert">{error}</div>}
        <div className="career-startbar__bar">
          <div className="career-startbar__summary">
            <strong>{busy ? 'Đang phân tích và lập lộ trình…' : currentProposal ? 'Chọn thời lượng và tạo lộ trình' : 'Đánh giá thời lượng phù hợp'}</strong>
            <span>{busy ? 'AI đang đọc hồ sơ và chia nhiệm vụ theo quỹ giờ của bạn. Vui lòng giữ trang này mở.' : 'Lộ trình được tự động lưu để bạn tiếp tục vào lần sau.'}</span>
          </div>
          <div className="career-actions career-actions--flush">
            {onCancel && <Button variant="secondary" disabled={busy} onClick={onCancel}>Quay lại</Button>}
            <Button type="submit" variant="ai" icon={Sparkles} loading={busy} disabled={loading || (!!loadError && useProfile)}>
              {!currentProposal ? 'AI đề xuất thời lượng' : seed?.id ? 'Tạo lộ trình điều chỉnh' : 'Tạo lộ trình của tôi'}
            </Button>
          </div>
        </div>
      </div>
      </form>
    </>
  );
}
