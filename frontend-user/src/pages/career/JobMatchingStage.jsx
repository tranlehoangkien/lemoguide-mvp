import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Sparkles, User } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import AuroraBackdrop from '@/components/stage/AuroraBackdrop';
import mascot from '@/assets/images/12.svg';
import { ROUTES } from '@/constants/routes';
import './JobMatchingStage.css';

/**
 * "Việc làm phù hợp" showcase: same always-dark aurora stage as the AI create
 * page. Intro + actions on the left, the top matches in a double-bezel panel on
 * the right. Job cards are rendered by the page (`renderJobCard`) so the list
 * view and this view share one card.
 */
const JobMatchingStage = ({ jobs, loading, renderJobCard, onOpenProfile, onOpenList }) => (
  <div className="ui-aistage">
    <AuroraBackdrop />

    <div className="ui-aistage__scroll">
      <div className="ui-aistage__inner">
        <div className="ui-aistage__grid">
          <section className="ui-aistage__intro" aria-labelledby="job-match-title">
            <span className="ui-aistage__mascot-wrap">
              <img className="ui-aistage__mascot" src={mascot} alt="" width="240" height="240" />
            </span>
            <h1 id="job-match-title" className="ui-aistage__title">
              Việc làm <span>phù hợp</span>
            </h1>
            <p className="ui-aistage__lead">
              Dựa trên kỹ năng và kinh nghiệm trong Hồ sơ năng lực của bạn, trợ lý AI đã đối soát và đề xuất 3 việc làm
              có độ tương thích cao nhất.
            </p>
            <div className="ui-aistage__actions">
              <Button variant="ai" trailingIcon={ArrowRight} className="ui-aistage__cta" onClick={onOpenList}>
                Xem danh sách việc làm
              </Button>
              <Button variant="secondary" icon={User} onClick={onOpenProfile}>
                Hồ sơ của tôi
              </Button>
            </div>
          </section>

          <div className="ui-aistage__panel">
            <div className="ui-aistage__core">
              <div>
                <h2 className="ui-stage-heading">3 việc làm phù hợp nhất</h2>
                <p className="ui-hint" style={{ margin: '4px 0 0' }}>
                  Do AI đối soát từ Hồ sơ năng lực của bạn
                </p>
              </div>

              {loading ? (
                <EmptyState icon={Sparkles} title="Đang phân tích việc làm phù hợp..." />
              ) : jobs.length === 0 ? (
                <EmptyState
                  icon={AlertCircle}
                  title="Chưa có đủ dữ liệu kỹ năng từ Hồ sơ để chấm điểm phù hợp."
                  action={
                    <Link to={ROUTES.PROFILE} className="ui-btn ui-btn--primary">
                      <User size={16} aria-hidden="true" />
                      <span>Cập nhật Hồ sơ cá nhân</span>
                    </Link>
                  }
                />
              ) : (
                <div className="ui-stage-jobs">
                  {jobs.map((job, idx) => renderJobCard(job, { rank: idx + 1, compact: true }))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default JobMatchingStage;
