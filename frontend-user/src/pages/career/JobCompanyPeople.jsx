import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Network, MessageSquare, UserPlus } from 'lucide-react';
import { SectionCard, Button } from '@/components/ui';
import { networkService as api } from '@/services/networkService';
import { useNetworkQuery } from '@/pages/network/networkUtils';
import { Person } from '@/pages/network/NetworkShared';

/**
 * Members who chose to share a job at this company (LemoNetwork experience items). Lets the viewer ask about the
 * company or request a referral. Hidden when nobody matches, so job pages never show an empty social block.
 */
export default function JobCompanyPeople({ company }) {
  const navigate = useNavigate();
  const query = useNetworkQuery(company ? `/company-people?company=${encodeURIComponent(company)}` : null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  if (!query.data?.length) return null;
  const run = async (person, fn) => {
    if (busy) return;
    setBusy(person.account_id); setError('');
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(null); }
  };
  return <SectionCard icon={Network} title={`Người trong LemoNetwork từng làm tại ${company}`} count={query.data.length}>
    <p className="job-company-people__lead">Hỏi họ về môi trường làm việc, quy trình phỏng vấn hoặc nhờ giới thiệu. Chỉ hiện những người đã chọn công khai kinh nghiệm này.</p>
    <ul className="job-company-people">{query.data.map((p) => <li key={p.account_id}>
      <Person person={p} size={38} />
      <div className="job-company-people__actions">
        {/* The server refuses a first message when the person only accepts messages from connections; the error is shown below. */}
        <Button size="sm" variant="secondary" icon={MessageSquare} disabled={!!busy}
          onClick={() => run(p, async () => { const t = await api.send(`/people/${p.account_id}/threads`); navigate(`/network/messages/${t.id}`); })}>Nhắn tin</Button>
        {!p.connection && <Button size="sm" variant="ghost" icon={UserPlus} disabled={!!busy}
          onClick={() => run(p, async () => { await api.send(`/people/${p.account_id}/connections/request`); query.reload(); })}>Kết nối</Button>}
        <Link className="network-link" to={`/u/${p.handle}`}>Xem hồ sơ</Link>
      </div>
    </li>)}</ul>
    {error && <p className="job-company-people__error" role="alert">{error}</p>}
  </SectionCard>;
}
