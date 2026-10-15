import { AlertCircle, ArrowRight, Compass, Heart, Hexagon, Sparkles, Target } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import AuroraBackdrop from '@/components/stage/AuroraBackdrop';
import mascot from '@/assets/images/11.svg';
import './SelfDiscoveryStage.css';

const ICONS = { holland: Hexagon, interests: Compass, values: Heart, skills: Target };
const DESCRIPTIONS = {
  holland: 'Tìm mã Holland 3 chữ và nhóm nghề phù hợp theo lý thuyết RIASEC.',
  interests: 'Khám phá xu hướng sở thích và lĩnh vực nghề nghiệp phù hợp theo mô hình RIASEC.',
  values: 'Xác định các giá trị cốt lõi và động lực thúc đẩy sự nghiệp bền vững.',
  skills: 'Đánh giá năng lực nền tảng, nhận diện thế mạnh và theo dõi mốc tiến bộ.',
};
const day = (value) => new Date(value).toLocaleDateString('vi-VN');

/** One assessment row in the stage panel: status comes from the user's history (draft first, then latest result). */
function StageRow({ item, draft, latest, busy, onStart }) {
  const Icon = ICONS[item.kind] || Compass;
  const status = draft ? `Đang làm dở · ${draft.answered}/${draft.total} câu`
    : latest ? `Hoàn thành ngày ${day(latest.completedAt)}` : 'Chưa thực hiện';
  const action = draft ? 'Tiếp tục' : latest ? 'Làm lại' : 'Bắt đầu';
  const desc = item.description || DESCRIPTIONS[item.kind];

  return <li>
    <button type="button" className="sd-stage-row" disabled={busy} onClick={() => onStart(item.kind)}
      aria-label={`${action}: ${item.title}. ${status}`}>
      <span className="sd-stage-row__icon" aria-hidden="true"><Icon size={22} /></span>
      <span className="sd-stage-row__text">
        <strong>{item.title}</strong>
        {desc && <span className="sd-stage-row__desc">{desc}</span>}
        <small>{item.total} câu · {status}</small>
      </span>
      <span className="sd-stage-row__go" aria-hidden="true">{action}<ArrowRight size={14} /></span>
    </button>
  </li>;
}

/**
 * "Khám phá bản thân" intro: same always-dark aurora stage as "Tạo CV với AI" and "Việc làm phù hợp".
 * Intro, steps and actions on the left; the three assessments with the user's status in a double-bezel panel
 * on the right. Starting a row goes straight into the assessment; "Xem tất cả" opens the full page.
 */
const SelfDiscoveryStage = ({ catalog, history, progress, loading, busy, error, notice, onStart, onOpenAll, onStartAi, onRetry }) => {
  const aiDraft = history.find((h) => h.kind === 'holland-ai' && !h.completedAt);
  return (
  <div className="ui-aistage">
    <AuroraBackdrop />

    <div className="ui-aistage__scroll">
      <div className="ui-aistage__inner">
        <div className="ui-aistage__grid">
          <section className="ui-aistage__intro sd-stage__intro" aria-labelledby="self-discovery-title">
            <span className="ui-aistage__mascot-wrap">
              <img className="ui-aistage__mascot" src={mascot} alt="" width="240" height="240" />
            </span>
            <h1 id="self-discovery-title" className="ui-aistage__title">
              Khám phá <span>bản thân</span>
            </h1>
            <p className="ui-aistage__lead">
              Trò chuyện với AI để tìm mã Holland chỉ trong khoảng 20 câu hỏi thích ứng, hoặc tự khám phá từng bài đánh giá đầy đủ.
            </p>
            <div className="ui-aistage__actions">
              <Button variant="ai" icon={Sparkles} trailingIcon={ArrowRight} className="ui-aistage__cta" loading={busy} onClick={onStartAi}>
                {aiDraft ? 'Tiếp tục trắc nghiệm với AI' : 'Trắc nghiệm với AI'}
              </Button>
              <Button variant="secondary" icon={Compass} onClick={onOpenAll}>
                Khám phá
              </Button>
            </div>
          </section>

          <div className="ui-aistage__panel sd-stage__panel">
            <div className="ui-aistage__core sd-stage__core">
              <div className="sd-stage__head">
                <h2 className="sd-stage__heading">{catalog.length || 3} bài đánh giá</h2>
                <p className="sd-stage__hint">Chọn một bài để bắt đầu ngay. Kết quả được dùng khi bạn tạo lộ trình.</p>
              </div>

              {loading ? <EmptyState icon={Sparkles} title="Đang tải bài đánh giá..." />
                : error ? <EmptyState icon={AlertCircle} title="Không tải được dữ liệu" hint={error}
                  action={<Button variant="secondary" onClick={onRetry}>Thử lại</Button>} />
                  : <ul className="sd-stage-list">{catalog.map((item) => <StageRow key={item.kind} item={item} busy={busy} onStart={onStart}
                    draft={history.find((h) => h.kind === item.kind && !h.completedAt)}
                    latest={history.find((h) => h.kind === item.kind && h.completedAt)} />)}</ul>}

              {notice && <p className="sd-stage__notice" role="alert"><AlertCircle size={15} aria-hidden="true" />{notice}</p>}

              {!loading && !error && <div className="sd-stage__foot">
                <span>{progress?.attempts
                  ? `Mốc năng lực: ${progress.attempts} lần đánh giá · gần nhất ${day(progress.latestAt)}`
                  : 'Chưa có mốc năng lực. Làm bài Năng lực nền tảng để tạo mốc đầu tiên.'}</span>
                <button type="button" className="sd-stage__link" onClick={onOpenAll}>Tiến bộ & lịch sử<ArrowRight size={14} aria-hidden="true" /></button>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SelfDiscoveryStage;
