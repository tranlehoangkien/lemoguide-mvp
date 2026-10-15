import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { SectionCard } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import './SelfDiscovery.css';

/** Latest self-discovery results on the profile page, one grouped row per assessment. */
export default function DiscoveryProfileCard({ results = null, error = false }) {
  return <SectionCard icon={Compass} title="Khám phá bản thân" className="discovery-profile"
    action={<Link className="discovery-link" to={ROUTES.SELF_DISCOVERY}>Mở trang khám phá<ArrowRight size={14} aria-hidden="true" /></Link>}>
    {error ? <p className="discovery-meta">Chưa tải được kết quả. Mở trang khám phá để thử lại.</p>
      : results === null ? <span className="ui-skel discovery-profile__skel" role="status" aria-label="Đang tải kết quả khám phá" />
        : !results.length ? <p className="discovery-meta">Khám phá sở thích, giá trị nghề nghiệp và tạo mốc đánh giá năng lực đầu tiên.</p>
          : <ul className="discovery-profile__list">{results.map((r) => <li key={r.id}>
            <div>
              <strong>{r.title}</strong>
              <p>{r.result.summary}</p>
            </div>
            <Link className="discovery-link" to={`${ROUTES.SELF_DISCOVERY}?attempt=${r.id}`}>{new Date(r.completedAt).toLocaleDateString('vi-VN')}</Link>
          </li>)}</ul>}
  </SectionCard>;
}
