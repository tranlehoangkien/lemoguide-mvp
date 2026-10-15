import { useState, useEffect, useCallback } from 'react';
import { Mail, Zap, Copy, Download, Trash2, Save, TriangleAlert, Check } from 'lucide-react';
import { Button, Segmented } from '@/components/ui';
import { cvOptimizerService } from '@/services/cvOptimizerService';
import { formatWhen, errorText } from './cvStudioUtils';

const TONES = [
  { value: 'professional', label: 'Chuyên nghiệp' },
  { value: 'friendly', label: 'Thân thiện' },
  { value: 'confident', label: 'Tự tin' },
];

const LANGUAGES = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];

const fileName = (title) =>
  `${(title || 'thu-xin-viec').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'thu-xin-viec'}.txt`;

/**
 * Tab "Thư xin việc": soạn thư từ CV thật và vị trí mục tiêu, sửa tay, lưu, sao chép, tải về. AI chỉ dùng sự
 * thật trong CV; chỗ chưa biết (tên người nhận...) để trong ngoặc vuông; số liệu không có trong CV được cảnh báo.
 */
const CoverLetterPanel = ({ cvId, target, targetLabel, modelId, targetSelector }) => {
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('vi');
  const [notes, setNotes] = useState('');

  const [letters, setLetters] = useState([]);
  const [current, setCurrent] = useState(null); // { id, title, content, unverifiedNumbers }
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(null); // 'generate' | 'save' | 'delete'
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadLetters = useCallback(async () => {
    try {
      setLetters(await cvOptimizerService.listCoverLetters(cvId));
    } catch (err) {
      console.warn('Không tải được danh sách thư đã lưu:', err);
    }
  }, [cvId]);

  useEffect(() => {
    let cancelled = false;
    cvOptimizerService.listCoverLetters(cvId)
      .then((items) => { if (!cancelled) setLetters(items); })
      .catch((err) => console.warn('Không tải được danh sách thư đã lưu:', err));
    return () => { cancelled = true; };
  }, [cvId]);

  const generate = async () => {
    if (!target || busy) return;
    setBusy('generate');
    setError(null);
    try {
      const letter = await cvOptimizerService.generateCoverLetter(cvId, { target, modelId, tone, language, notes });
      setCurrent({ ...letter, unverifiedNumbers: letter.unverifiedNumbers || [] });
      setDirty(false);
      await loadLetters();
    } catch (err) {
      setError(errorText(err, 'Không thể viết thư lúc này, vui lòng thử lại.'));
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (!current || !dirty) return;
    setBusy('save');
    setError(null);
    try {
      const saved = await cvOptimizerService.updateCoverLetter(current.id, { title: current.title, content: current.content });
      setCurrent((prev) => ({ ...prev, ...saved, unverifiedNumbers: prev.unverifiedNumbers }));
      setDirty(false);
      await loadLetters();
    } catch (err) {
      setError(errorText(err, 'Không thể lưu thư lúc này, vui lòng thử lại.'));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!current) return;
    setBusy('delete');
    setError(null);
    try {
      await cvOptimizerService.deleteCoverLetter(current.id);
      setCurrent(null);
      setDirty(false);
      await loadLetters();
    } catch (err) {
      setError(errorText(err, 'Không thể xóa thư lúc này, vui lòng thử lại.'));
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Trình duyệt không cho phép sao chép, hãy chọn văn bản và sao chép thủ công.');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([current.content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName(current.title);
    link.click();
    URL.revokeObjectURL(url);
  };

  const open = (letter) => {
    setCurrent({ ...letter, unverifiedNumbers: [] });
    setDirty(false);
    setError(null);
  };

  return (
    <div className="cvs-panel" style={{ marginTop: 0 }}>
      <section className="cvs-form" aria-label="Tùy chọn thư xin việc">
        <div className="cvs-form__row">
          <span className="cvs-form__label">Việc làm ứng tuyển</span>
          {targetSelector}
        </div>
        <div className="cvs-form__pair">
          <div className="cvs-form__row">
            <span className="cvs-form__label">Giọng văn</span>
            <div>
              <Segmented label="Giọng văn" value={tone} onChange={setTone} options={TONES} />
            </div>
          </div>
          <div className="cvs-form__row">
            <span className="cvs-form__label">Ngôn ngữ</span>
            <div>
              <Segmented label="Ngôn ngữ" value={language} onChange={setLanguage} options={LANGUAGES} />
            </div>
          </div>
        </div>
        <div className="cvs-form__row">
          <label htmlFor="cvs-letter-notes">Điều bạn muốn nhấn mạnh (không bắt buộc)</label>
          <textarea
            id="cvs-letter-notes"
            className="ui-textarea"
            rows={2}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: nhấn mạnh kinh nghiệm làm việc từ xa và làm việc nhóm"
          />
        </div>
        {!target && (
          <div className="cvs-note" role="note">
            Hãy chọn một việc làm hoặc dán mô tả công việc ở mục &quot;Việc làm ứng tuyển&quot; để viết thư phù hợp.
          </div>
        )}
        {error && (
          <div className="cvs-note cvs-note--error" role="alert">
            {error}
          </div>
        )}
        <div className="cvs-actions">
          <Button variant="ai" icon={Zap} loading={busy === 'generate'} disabled={!target || Boolean(busy)} onClick={generate}>
            {current ? 'Viết thư mới' : 'Viết thư xin việc'}
          </Button>
          {target && <span className="cvs-empty-line">Cho: {targetLabel}</span>}
        </div>
      </section>

      {current && (
        <section className="cvs-letter" aria-label="Thư xin việc">
          <div className="cvs-form__row">
            <label htmlFor="cvs-letter-title">Tiêu đề</label>
            <input
              id="cvs-letter-title"
              className="ui-input"
              value={current.title}
              maxLength={200}
              onChange={(e) => {
                setCurrent((prev) => ({ ...prev, title: e.target.value }));
                setDirty(true);
              }}
            />
          </div>
          {current.unverifiedNumbers.length > 0 && (
            <p className="cvs-warning" role="note">
              <TriangleAlert size={18} aria-hidden="true" />
              <span>
                Số liệu <strong>{current.unverifiedNumbers.join(', ')}</strong> không có trong CV của bạn. Hãy kiểm tra và sửa
                trước khi gửi.
              </span>
            </p>
          )}
          <textarea
            className="cvs-letter__body"
            value={current.content}
            aria-label="Nội dung thư"
            onChange={(e) => {
              setCurrent((prev) => ({ ...prev, content: e.target.value }));
              setDirty(true);
            }}
          />
          <p className="cvs-empty-line">
            Chỗ trong ngoặc vuông [ ] là thông tin AI chưa biết, hãy điền trước khi gửi.
          </p>
          <div className="cvs-actions">
            <Button variant="primary" icon={Save} loading={busy === 'save'} disabled={!dirty} onClick={save}>
              {dirty ? 'Lưu thay đổi' : 'Đã lưu'}
            </Button>
            <Button variant="secondary" icon={copied ? Check : Copy} onClick={copy}>
              {copied ? 'Đã sao chép' : 'Sao chép'}
            </Button>
            <Button variant="secondary" icon={Download} onClick={download}>
              Tải về (.txt)
            </Button>
            <span style={{ flex: 1 }} />
            <Button variant="ghost" icon={Trash2} loading={busy === 'delete'} onClick={remove}>
              Xóa thư
            </Button>
          </div>
        </section>
      )}

      {letters.length > 0 && (
        <section>
          <header className="cvs-head">
            <Mail size={20} aria-hidden="true" />
            <h3>Thư đã lưu cho CV này</h3>
            <span className="cvs-head__count">{letters.length}</span>
          </header>
          <ul className="cvs-list">
            {letters.map((letter) => (
              <li key={letter.id}>
                <button type="button" className="cvs-saved__row" aria-current={current?.id === letter.id} onClick={() => open(letter)}>
                  <span>
                    <strong>{letter.title}</strong>
                    <small>Cập nhật {formatWhen(letter.updatedAt) || ''}</small>
                  </span>
                  <span className="cvs-link">Mở</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default CoverLetterPanel;
