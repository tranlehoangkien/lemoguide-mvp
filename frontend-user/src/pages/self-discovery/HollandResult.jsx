import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Hexagon as HexagonIcon, Info, MessagesSquare, Sparkles } from 'lucide-react';
import { Card, Button, Badge, Bar, SectionCard } from '@/components/ui';
import { ROUTES } from '@/constants/routes';
import './HollandResult.css';

const ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];
const PARTS = [['activities', 'Hoạt động', 8], ['competencies', 'Năng lực', 8], ['occupations', 'Nghề nghiệp', 8], ['selfRating', 'Tự đánh giá', 14]];
const dateTime = (value) => (value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '');

/** Holland's hexagon: R top-left, then clockwise I, A, S, E, C, so neighbours on the page are neighbours in theory. */
function Hexagon({ types, code }) {
  const size = 300, c = size / 2, r = 96;
  const point = (i, scale) => {
    const angle = ((-120 + 60 * i) * Math.PI) / 180;
    return [c + r * scale * Math.cos(angle), c + r * scale * Math.sin(angle)];
  };
  const ring = (scale) => ORDER.map((_, i) => point(i, scale).join(',')).join(' ');
  const byCode = Object.fromEntries(types.map((t) => [t.code, t]));
  const shape = ORDER.map((k, i) => point(i, Math.max(0.03, byCode[k].raw / byCode[k].max)));
  return <svg className="holland-hex" viewBox={`0 0 ${size} ${size}`} role="img"
    aria-label={`Lục giác Holland: ${ORDER.map((k) => `${k} ${byCode[k].raw}/${byCode[k].max}`).join(', ')}`}>
    {[0.25, 0.5, 0.75, 1].map((s) => <polygon key={s} className="holland-hex__grid" points={ring(s)} />)}
    {ORDER.map((k, i) => { const [x, y] = point(i, 1); return <line key={k} className="holland-hex__grid" x1={c} y1={c} x2={x} y2={y} />; })}
    <polygon className="holland-hex__shape" points={shape.map((p) => p.join(',')).join(' ')} />
    {shape.map(([x, y], i) => <circle key={ORDER[i]} className="holland-hex__dot" cx={x} cy={y} r="3" />)}
    {ORDER.map((k, i) => {
      const [x, y] = point(i, 1.28);
      return <g key={k} className={`holland-hex__label${code.includes(k) ? ' is-top' : ''}`}>
        <text x={x} y={y - 3} textAnchor="middle">{k}</text>
        <text x={x} y={y + 12} textAnchor="middle" className="holland-hex__name">{byCode[k].name}</text>
      </g>;
    })}
  </svg>;
}

/**
 * Result of the Holland inventory. Hero: the three-letter code with the reading of the profile and the next step;
 * then the RIASEC profile (hexagon beside one-line scores, per-section detail folded away); then type portraits
 * beside the matching careers. Neutral ink throughout; the accent marks only the three letters of the code.
 */
export default function HollandResult({ attempt, busy, onStart, heading }) {
  const { result } = attempt;
  const h = result.holland;
  const ranked = [...h.types].sort((a, b) => b.raw - a.raw || ORDER.indexOf(a.code) - ORDER.indexOf(b.code));
  const tied = h.alternatives.length > 1;
  // Adaptive AI test: 0–100 estimates instead of section sums, plus the model's reading and the conversation.
  const ai = result.adaptive;
  return <div className="holland-result">
    <Card className="holland-hero"><section className="holland-hero__body">
      <div className="discovery-result__head">
        <div>
          <span className="discovery-kicker">Kết quả · {dateTime(attempt.completedAt)}</span>
          <h2 ref={heading} tabIndex={-1}>{attempt.title}</h2>
        </div>
        <Badge tone="success"><CheckCircle2 size={13} aria-hidden="true" />Đã hoàn thành</Badge>
      </div>

      <div className="holland-hero__grid">
        <div className="holland-code">
          <span className="discovery-kicker">Mã Holland của bạn</span>
          <p className="holland-code__letters" aria-label={`Mã ${h.code}`}>{h.code}</p>
          <ol className="holland-code__names">{h.top.map((t) => <li key={t.code}><strong>{t.code}</strong>{t.name}</li>)}</ol>
          {tied && <p className="discovery-meta">
            {h.alternatives.length > 3 ? 'Nhiều nhóm bằng điểm nhau nên thứ tự các chữ chưa rõ nét.' : `Cách đọc khác do bằng điểm: ${h.alternatives.slice(1).join(', ')}.`}
          </p>}
        </div>

        <div className="holland-reading">
          {ai?.narrative && <div className="holland-ai-reading">
            <span className="discovery-kicker"><Sparkles size={13} aria-hidden="true" />Nhận xét của AI</span>
            <p>{ai.narrative}</p>
            {ai.highlights?.length > 0 && <ul>{ai.highlights.map((x) => <li key={x}>{x}</li>)}</ul>}
          </div>}
          <dl className="holland-quality">
            {ai && <div>
              <dt>Độ chắc chắn<span>{ai.confidence}</span></dt>
              <dd>Mã được xác định sau {ai.questions} câu hỏi thích ứng{ai.confidence === 'Cao' ? ', khi ba nhóm đầu đã tách rõ khỏi các nhóm còn lại.' : '. Một số nhóm còn sát điểm nhau; làm bài Holland đầy đủ để kiểm chứng.'}</dd>
            </div>}
            <div>
              <dt>Độ phân hóa<span>{h.differentiationLevel}</span></dt>
              <dd>{h.differentiationText}</dd>
            </div>
            <div>
              <dt>Độ nhất quán<span>{h.consistencyLevel}</span></dt>
              <dd>{h.consistencyText}</dd>
            </div>
          </dl>
          <div className="discovery-result__actions">
            <Link className="ui-btn ui-btn--primary ui-btn--has-trail" to={ROUTES.CAREER_ROADMAP}>
              <span>Xây dựng lộ trình</span><span className="ui-btn__trail"><ArrowRight size={14} aria-hidden="true" /></span>
            </Link>
            <Button variant="secondary" onClick={() => onStart(attempt.kind)} loading={busy}>Làm lại bài</Button>
          </div>
        </div>
      </div>
    </section></Card>

    <SectionCard icon={HexagonIcon} title="Hồ sơ RIASEC" className="holland-profile-card">
      <div className="holland-profile">
        <Hexagon types={h.types} code={h.code} />
        <div className="holland-profile__side">
          <ul className="holland-scores">{ranked.map((t) => <li key={t.code} className={h.code.includes(t.code) ? 'is-top' : undefined}>
            <span className="holland-scores__code">{t.code}</span>
            <span className="holland-scores__name">{t.name}</span>
            <Bar percent={(t.raw / t.max) * 100} />
            <span className="discovery-score" aria-label={`${t.name}: ${t.raw} trên ${t.max} điểm`}>{t.raw}<small>/{t.max}</small></span>
          </li>)}</ul>
          {!ai && <details className="holland-detail">
            <summary>Điểm theo từng phần</summary>
            <table>
              <thead><tr><th scope="col">Nhóm</th>{PARTS.map(([key, label, max]) => <th key={key} scope="col">{label}<small>/{max}</small></th>)}<th scope="col">Tổng</th></tr></thead>
              <tbody>{ranked.map((t) => <tr key={t.code}>
                <th scope="row">{t.code}</th>{PARTS.map(([key]) => <td key={key}>{t[key]}</td>)}<td><strong>{t.raw}</strong></td>
              </tr>)}</tbody>
            </table>
          </details>}
        </div>
      </div>
      <p className="discovery-meta">{ai
        ? 'Điểm 0–100 ước lượng mức yêu thích từng nhóm từ câu trả lời của bạn. Nhóm càng gần nhau trên lục giác càng có nhiều điểm chung.'
        : `Mỗi nhóm tối đa ${h.types[0].max} điểm: 8 hoạt động, 8 năng lực, 8 nghề nghiệp và 2 câu tự đánh giá (1–7). Nhóm càng gần nhau trên lục giác càng có nhiều điểm chung.`}</p>
    </SectionCard>

    <div className="holland-columns">
      <SectionCard icon={Sparkles} title="Ba nhóm nổi bật">
        <ul className="holland-types">{h.top.map((t) => <li key={t.code}>
          <h3><span className="holland-types__code">{t.code}</span>{t.name}<small>{t.english}</small></h3>
          <p className="holland-types__summary">{t.summary}</p>
          <dl>
            <div><dt>Tính cách</dt><dd>{t.traits.join(', ')}</dd></div>
            <div><dt>Môi trường</dt><dd>{t.environment}</dd></div>
            <div><dt>Coi trọng</dt><dd>{t.values.join(', ')}</dd></div>
            <div><dt>Thử ngay</dt><dd>{t.action}</dd></div>
          </dl>
        </li>)}</ul>
      </SectionCard>

      <SectionCard icon={BriefcaseBusiness} title="Nghề gợi ý" count={h.careers.length || null}>
        <p className="discovery-meta">Xếp theo mức trùng giữa mã của bạn và mã nghề (chỉ số Iachan). Đây là điểm khởi đầu để tìm hiểu, không phải giới hạn.</p>
        {h.careers.length ? <ul className="holland-careers">{h.careers.map((c) => <li key={c.name}>
          <div>
            <strong>{c.name}</strong>
            <span>{c.field} · {c.level}</span>
          </div>
          <span className={`holland-careers__code${c.level === 'Rất phù hợp' ? ' is-strong' : ''}`} aria-label={`Mã nghề ${c.code}`}>{c.code}</span>
        </li>)}</ul> : <p className="discovery-meta">Chưa có nghề trùng mã. Xem mô tả các nhóm bên cạnh để tự tìm hiểu thêm.</p>}
      </SectionCard>
    </div>

    {ai && result.review?.length > 0 && <SectionCard icon={MessagesSquare} title="Nhìn lại cuộc trò chuyện" count={result.review.length}>
      <details className="holland-transcript">
        <summary>Xem các câu hỏi, câu trả lời và phản hồi của AI</summary>
        <ol>{result.review.map((r, i) => <li key={i}>
          <p className="holland-transcript__q">{r.question}</p>
          <p><span>Bạn chọn</span>{r.selected}</p>
          {r.explanation && <p className="discovery-meta">{r.explanation}</p>}
        </li>)}</ol>
      </details>
    </SectionCard>}

    <p className="discovery-note"><Info size={15} aria-hidden="true" />{result.note}</p>
  </div>;
}
