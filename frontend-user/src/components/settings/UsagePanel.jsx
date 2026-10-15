import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { apiRequest } from '@/services/apiClient';
import { Badge, Bar, Button, Card, FormAlert } from '@/components/ui';

export default function UsagePanel() {
  const [result, setResult] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const loading = result?.refresh !== refresh;
  const usage = loading ? null : result?.usage;
  const error = loading ? '' : result?.error;
  useEffect(() => {
    let cancelled = false;
    apiRequest('/api/me/usage')
      .then((res) => { if (!cancelled) setResult({ refresh, usage: res.data }); })
      .catch((err) => { if (!cancelled) setResult({ refresh, error: err.message || 'Không thể tải mức sử dụng.' }); });
    return () => { cancelled = true; };
  }, [refresh]);
  return <Card>
    <div className="ui-card__head"><h4 className="ui-card__title">Hạn mức theo gói</h4>{usage && <Badge tone="info">{usage.planName}</Badge>}</div>
    <div className="ui-card__body">
      <FormAlert>{error}</FormAlert>
      {loading && <p role="status">Đang tải mức sử dụng...</p>}
      {usage && [
        ['dailyMessages', 'Tin nhắn hôm nay'], ['weeklyMessages', 'Tin nhắn tuần này'],
        ['monthlyMessages', 'Tin nhắn tháng này'], ['monthlyCredits', 'Credit AI tháng này'], ['cvs', 'Số lượng CV'],
      ].map(([key, title]) => {
        const meter = usage[key];
        return <div className="ui-entry" key={key}>
          <div className="ui-entry__head"><h4 className="ui-entry__title">{title}</h4><span>{meter.used.toLocaleString('vi-VN')} / {meter.limit == null ? 'Không giới hạn' : meter.limit.toLocaleString('vi-VN')}</span></div>
          {meter.limit != null && <Bar percent={meter.limit === 0 ? 100 : Math.min(100, meter.used / meter.limit * 100)} />}
          {meter.remaining != null && <p className="ui-hint">Còn lại: {meter.remaining.toLocaleString('vi-VN')}</p>}
          {meter.resetsAt && <p className="ui-hint">Đặt lại: {new Date(meter.resetsAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} (giờ Việt Nam)</p>}
          {meter.exhausted && <FormAlert>{key === 'cvs' ? 'Đã đủ số CV. Hãy xóa bớt CV hoặc đổi gói.' : key === 'monthlyCredits' ? 'Đã hết credit AI trong tháng.' : `Đã hết hạn mức ${title.toLowerCase()}.`}</FormAlert>}
        </div>;
      })}
      <p className="ui-hint">Tuần bắt đầu từ thứ Hai, tháng bắt đầu từ ngày 1. Mỗi phản hồi chat thành công dùng 1 tin nhắn và 1 credit; tác vụ AI khác thành công dùng 1 credit. Lỗi và kết quả đã lưu không tính thêm.</p>
      <Button variant="ghost" size="sm" icon={RotateCcw} loading={loading} onClick={() => setRefresh((v) => v + 1)}>Làm mới</Button>
    </div>
  </Card>;
}
