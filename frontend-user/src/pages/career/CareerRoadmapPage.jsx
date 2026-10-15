import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Compass, Plus } from 'lucide-react';
import UserLayout from '@/components/layout/UserLayout';
import { Page, PageHeader, Card, EmptyState, Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import { careerPlanService } from '@/services/careerPlanService';
import './CareerRoadmap.css';

export default function CareerRoadmapPage() {
  const navigate = useNavigate();
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState(null);

  const loading = result?.key !== retry;
  const error = loading ? '' : result?.error;
  const plan = loading ? null : result?.plan;

  useEffect(() => {
    let cancelled = false;
    careerPlanService
      .list(0)
      .then((loaded) => { if (!cancelled) setResult({ key: retry, plan: loaded?.content?.[0] || null }); })
      .catch((err) => { if (!cancelled) setResult({ key: retry, error: err.message || 'Không tải được lộ trình.' }); });
    return () => { cancelled = true; };
  }, [retry]);

  useEffect(() => {
    if (plan) navigate(`${ROUTES.CAREER_ROADMAP}/${plan.id}`, { replace: true });
  }, [plan, navigate]);

  const goCreate = () => navigate(ROUTES.COACH, { state: { careerStudio: { openSetup: true } } });

  return (
    <UserLayout>
      <Page className="roadmap-page">
        <PageHeader
          back={
            <button
              type="button"
              className="ui-back-btn"
              onClick={() => navigate(ROUTES.COACH)}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Bảng điều khiển</span>
            </button>
          }
          title="Lộ trình phát triển"
          description="Biến mục tiêu nghề nghiệp thành nhiệm vụ cụ thể theo từng tuần, theo dõi tiến độ và quay lại tiếp tục bất cứ lúc nào."
        />

        <div className="roadmap-flow" aria-label="Quy trình">
          <span>01 · Chọn mục tiêu</span>
          <span>02 · Xây kế hoạch</span>
          <span>03 · Theo dõi tiến độ</span>
        </div>

        {error ? (
          <Card>
            <EmptyState icon={AlertCircle} title="Không thể tải lộ trình" hint={error} action={<Button onClick={() => setRetry((v) => v + 1)}>Thử lại</Button>} />
          </Card>
        ) : loading || plan ? (
          <div className="roadmap-grid" aria-busy="true" aria-label="Đang tải lộ trình">
            <div className="ui-skel roadmap-card__skel" />
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={Compass}
              title="Bắt đầu từ một mục tiêu nhỏ"
              hint="Lộ trình bạn tạo sẽ xuất hiện ở đây. AI chia nhỏ mục tiêu thành nhiệm vụ mỗi tuần và bạn có thể quay lại tiếp tục bất cứ lúc nào."
              action={<Button variant="ai" icon={Plus} onClick={goCreate}>Tạo lộ trình đầu tiên</Button>}
            />
          </Card>
        )}
      </Page>
    </UserLayout>
  );
}
