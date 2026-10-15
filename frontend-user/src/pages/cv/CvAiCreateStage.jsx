import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import mascot from '@/assets/images/6.svg';
import AuroraBackdrop from '@/components/stage/AuroraBackdrop';
import CvCreateFields from './CvCreateFields';

const STEPS = [
  { title: 'Chọn mẫu & vị trí', desc: 'Đặt tên CV và chọn mẫu chuẩn ATS phù hợp với bạn.' },
  { title: 'AI dựng bản CV', desc: 'Trợ lý AI dựng sẵn bản CV hoàn chỉnh trong ít phút.' },
  { title: 'Tinh chỉnh & hoàn thiện', desc: 'Chỉnh sửa trong trình soạn thảo trước khi chia sẻ.' },
];

/**
 * Immersive "Tạo CV với AI" page: an always-dark aurora stage (glowing color
 * orbs drifting left to right), a short intro on the left and the create form in
 * a double-bezel panel on the right. The form itself is the shared
 * CvCreateFields so the dialog and this page keep the same fields and validation.
 */
const CvAiCreateStage = ({ form, setForm, onTargetModeChange, templates, loading, isSubmitting, onSubmit, onBack }) => (
  <div className="ui-aistage">
    <AuroraBackdrop />

    <div className="ui-aistage__scroll">
      <div className="ui-aistage__inner">
        <div className="ui-aistage__top">
          <Button variant="secondary" icon={ArrowLeft} onClick={onBack} disabled={isSubmitting}>
            Quay lại danh sách CV
          </Button>
        </div>

        <div className="ui-aistage__grid">
          <section className="ui-aistage__intro" aria-labelledby="ai-create-title">
            <span className="ui-aistage__mascot-wrap">
              <img className="ui-aistage__mascot" src={mascot} alt="" width="240" height="240" />
            </span>
            <h1 id="ai-create-title" className="ui-aistage__title">
              Tạo CV với <span>AI</span>
            </h1>
            <p className="ui-aistage__lead">
              Điền vài thông tin cơ bản, trợ lý AI sẽ dựng sẵn bản CV hoàn chỉnh để bạn tinh chỉnh.
            </p>
            <ol className="ui-aistage__steps">
              {STEPS.map((step, index) => (
                <li key={step.title} className="ui-aistage__step">
                  <span className="ui-aistage__step-no">{String(index + 1).padStart(2, '0')}</span>
                  <span className="ui-aistage__step-text">
                    <strong>{step.title}</strong>
                    <small>{step.desc}</small>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <div className="ui-aistage__panel">
            <form className="ui-aistage__core" onSubmit={onSubmit} noValidate aria-busy={isSubmitting}>
              <CvCreateFields
                form={form}
                setForm={setForm}
                onTargetModeChange={onTargetModeChange}
                templates={templates}
                loading={loading}
              />
              <div className="ui-aistage__actions">
                <Button
                  type="submit"
                  variant="ai"
                  size="md"
                  trailingIcon={ArrowRight}
                  loading={isSubmitting}
                  className="ui-aistage__cta"
                >
                  {isSubmitting ? 'Đang khởi tạo CV với AI...' : 'Bắt đầu tạo CV với AI'}
                </Button>
                <Button variant="secondary" size="md" onClick={onBack} disabled={isSubmitting}>
                  Hủy bỏ
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default CvAiCreateStage;
