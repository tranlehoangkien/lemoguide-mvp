import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal, Button, Badge, FormAlert } from '@/components/ui';
import { userService } from '@/services/userService';
import './UsageLimitsModal.css';

const VN_ZONE = 'Asia/Ho_Chi_Minh';
const number = (value) => Number(value).toLocaleString('vi-VN');
const resetTime = (value) => {
  const date = new Date(value);
  const time = date.toLocaleTimeString('vi-VN', { timeZone: VN_ZONE, hour: '2-digit', minute: '2-digit', hour12: false });
  const day = date.toLocaleDateString('vi-VN', { timeZone: VN_ZONE, day: 'numeric', month: 'numeric', year: 'numeric' });
  return `${time} · ${day}`;
};
const METERS = [
  ['dailyMessages', 'Tin nhắn hôm nay', 'tin nhắn'],
  ['weeklyMessages', 'Tin nhắn tuần này', 'tin nhắn'],
  ['monthlyMessages', 'Tin nhắn tháng này', 'tin nhắn'],
  ['monthlyCredits', 'Credit AI tháng này', 'credit'],
  ['cvs', 'Số lượng CV', 'CV'],
];

export default function UsageLimitsModal({ isOpen, user, onClose }) {
  return isOpen && user ? <UsageLimitsContent key={user.id} user={user} onClose={onClose} /> : null;
}

function UsageLimitsContent({ user, onClose }) {
  const [result, setResult] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const loading = result?.refresh !== refresh;
  const usage = loading ? null : result?.usage;
  const error = loading ? '' : result?.error;

  useEffect(() => {
    let cancelled = false;
    userService.getUsage(user.id)
      .then((data) => { if (!cancelled) setResult({ refresh, usage: data }); })
      .catch((err) => { if (!cancelled) setResult({ refresh, error: err.message || 'Không thể tải mức sử dụng.' }); });
    return () => { cancelled = true; };
  }, [user.id, refresh]);

  return (
    <Modal open title="Giới hạn & Sử dụng" description={`${user?.fullName ?? ''} · ${user?.email ?? ''}`}
      onClose={onClose} footer={<Button variant="secondary" icon={RefreshCw} loading={loading} onClick={() => setRefresh((v) => v + 1)}>Làm mới</Button>}>
      <div className="user-usage">
        <FormAlert>{error}</FormAlert>
        {loading && <div className="user-usage__group" role="status" aria-busy="true" aria-label="Đang tải mức sử dụng">
          {METERS.map(([key]) => <div key={key} className="user-usage__meter user-usage__meter--skeleton" aria-hidden="true">
            <span className="user-usage__bone user-usage__bone--title" />
            <span className="user-usage__bone user-usage__bone--bar" />
            <span className="user-usage__bone user-usage__bone--meta" />
          </div>)}
        </div>}
        {usage && <>
          <div className="user-usage__plan">
            <Badge>Gói {usage.planName}</Badge>
            <span className="ui-hint">Hạn mức lấy từ Gói & Giới hạn</span>
          </div>
          <div className="user-usage__group">
            {METERS.map(([key, title, unit]) => {
              const meter = usage[key];
              const unlimited = meter.limit == null;
              const percent = unlimited ? 0 : meter.limit === 0 ? 100 : Math.min(100, meter.used / meter.limit * 100);
              // A sliver of use (5 of 800) must still be visible as a bar, not vanish at <1% width.
              const width = meter.used > 0 ? Math.max(percent, 2) : percent;
              return <section key={key} className="user-usage__meter" data-exhausted={meter.exhausted}>
                <div className="user-usage__heading">
                  <h3>{title}</h3>
                  <span className="user-usage__value"><b>{number(meter.used)}</b>{' / '}{unlimited ? 'Không giới hạn' : number(meter.limit)}</span>
                </div>
                {!unlimited && <div className="user-usage__track" role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={meter.limit || 1} aria-valuenow={Math.min(meter.used, meter.limit || 1)} aria-valuetext={`Đã dùng ${number(meter.used)} trên ${number(meter.limit)} ${unit}`}><span style={{ width: `${width}%` }} /></div>}
                <p className="user-usage__meta">
                  <span>{unlimited ? `Đã dùng ${number(meter.used)} ${unit}` : `Còn lại ${number(meter.remaining)} ${unit}`}</span>
                  {meter.resetsAt && <span>Đặt lại {resetTime(meter.resetsAt)}</span>}
                </p>
                {meter.exhausted && <p className="user-usage__warning" role="status">
                  {key === 'cvs' ? 'Đã đạt giới hạn CV. Cần xóa bớt CV hoặc đổi gói để tạo thêm.'
                    : key === 'monthlyCredits' ? 'Đã hết credit AI. Các tác vụ AI sẽ bị chặn đến kỳ tiếp theo hoặc khi đổi gói.'
                      : `Đã hết hạn mức ${title.toLowerCase()}. Không thể gửi thêm cho đến khi đặt lại hoặc đổi gói.`}
                </p>}
              </section>;
            })}
          </div>
          <div className="user-usage__note">
            <h3>Cách tính</h3>
            <p className="ui-hint">Tuần tính từ thứ Hai; tháng tính từ ngày 1. Mọi mốc đặt lại theo giờ Việt Nam. Mỗi phản hồi chat thành công tính 1 tin nhắn và 1 credit. Các tác vụ AI khác thành công tính 1 credit; lỗi và kết quả đã lưu không tính thêm.</p>
          </div>
        </>}
      </div>
    </Modal>
  );
}
