import { useState } from 'react';
import { Button, Modal } from '@/components/ui';

const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export default function CvSelectionModal({ kind, items, selectedId, loading, error, description, onRetry, onClose, onConfirm }) {
  const [draftId, setDraftId] = useState(selectedId);
  const [query, setQuery] = useState('');
  const isCv = kind === 'cv';
  const title = isCv ? 'Chọn CV' : 'Chọn việc làm';
  const filtered = items.filter((item) => normalize(`${item.title} ${item.companyName || ''}`).includes(normalize(query.trim())));

  return (
    <Modal open title={title} size="lg" onClose={onClose}
      description={description || (isCv ? 'Chọn CV bạn muốn tối ưu hóa và dùng để viết thư xin việc.' : 'Chọn vị trí bạn muốn ứng tuyển.')}
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (draftId && !loading && !error) onConfirm(draftId);
      }}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button type="submit" disabled={!draftId || loading || Boolean(error)}>Xác nhận</Button>
      </>}
    >
      <div className="cvs-picker">
        <label className="cvs-form__row">
          <span>{isCv ? 'Tìm CV' : 'Tìm việc làm'}</span>
          <input type="search" className="ui-input" value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={isCv ? 'Nhập tên CV...' : 'Nhập vị trí hoặc tên công ty...'} />
        </label>
        {loading ? <p role="status">Đang tải danh sách...</p> : error ? (
          <div className="cvs-note cvs-note--error" role="alert">
            {error}
            {onRetry && <Button variant="ghost" onClick={onRetry}>Thử lại</Button>}
          </div>
        ) : (
          <fieldset className="cvs-picker__list">
            <legend className="cvs-picker__legend">{title}</legend>
            {filtered.length === 0 && <p className="cvs-empty-line">{items.length ? 'Không tìm thấy kết quả phù hợp.' : 'Danh sách hiện đang trống.'}</p>}
            {filtered.map((item) => (
              <label key={item.id} className={`cvs-picker__item${draftId === String(item.id) ? ' cvs-picker__item--selected' : ''}`}>
                <input type="radio" name="cvs-selection" value={item.id} checked={draftId === String(item.id)} onChange={() => setDraftId(String(item.id))} />
                <span>
                  <strong>{item.title}</strong>
                  {!isCv && <small>{item.companyName}</small>}
                  {draftId === String(item.id) && <small>Đang chọn</small>}
                </span>
              </label>
            ))}
          </fieldset>
        )}
      </div>
    </Modal>
  );
}
