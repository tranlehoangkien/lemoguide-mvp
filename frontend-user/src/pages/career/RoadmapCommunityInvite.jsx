import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersRound, ArrowRight } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { networkService as api } from '@/services/networkService';
import { useNetworkQuery } from '@/pages/network/networkUtils';

/**
 * On the roadmap page: a one-click opt-in to LemoNetwork (publish the community profile, optionally auto-share
 * finished weeks) and, once published, a pointer to the study cohorts built from this roadmap.
 * Renders nothing while loading, on error, or when the member already belongs to a cohort.
 */
export default function RoadmapCommunityInvite() {
  const me = useNetworkQuery('/me');
  const cohorts = useNetworkQuery(me.data?.published ? '/cohorts' : null);
  const [autoShare, setAutoShare] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!me.data || me.data.suspended) return null;
  if (me.data.published) {
    if (!cohorts.data || cohorts.data.joined.length > 0 || !cohorts.data.candidates.length) return null;
    return <Card><div className="roadmap-invite">
      <span className="roadmap-invite__icon"><UsersRound size={20} aria-hidden="true" /></span>
      <div className="roadmap-invite__text">
        <strong>Có {cohorts.data.candidates.length} nhóm học từ lộ trình này</strong>
        <p>Học cùng những người đang theo cùng khóa hoặc cùng vị trí, điểm danh mỗi tuần và tìm bạn đồng hành.</p>
      </div>
      <Link className="ui-btn ui-btn--secondary" to="/network/cohorts">Xem nhóm học <ArrowRight size={16} aria-hidden="true" /></Link>
    </div></Card>;
  }
  const publish = async () => {
    setBusy(true); setError('');
    try { await api.send('/me/publish', { autoShareMilestones: autoShare }); me.reload(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <Card><div className="roadmap-invite">
    <span className="roadmap-invite__icon"><UsersRound size={20} aria-hidden="true" /></span>
    <div className="roadmap-invite__text">
      <strong>Đi cùng người khác sẽ dễ giữ nhịp hơn</strong>
      <p>Bật hồ sơ cộng đồng để tham gia nhóm học của lộ trình này và tìm bạn đồng hành. Chưa có mục nào trong hồ sơ được công khai cho tới khi bạn chọn.</p>
      <label className="ui-check roadmap-invite__check">
        <input type="checkbox" checked={autoShare} disabled={busy} onChange={(e) => setAutoShare(e.target.checked)} />
        <span>Tự chia sẻ lên bảng tin khi mình hoàn thành một tuần</span>
      </label>
      {error && <p className="roadmap-invite__error" role="alert">{error}</p>}
    </div>
    <Button loading={busy} onClick={publish}>Bật hồ sơ cộng đồng</Button>
  </div></Card>;
}
