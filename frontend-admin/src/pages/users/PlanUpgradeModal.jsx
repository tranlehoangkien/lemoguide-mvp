import { useState, useEffect } from 'react';
import { CheckCircle2, Sparkles, Layers, Loader2, Check, Ban } from 'lucide-react';
import { planService } from '@/services/planService';
import { userService } from '@/services/userService';
import { Modal, Badge, FormAlert } from '@/components/ui';

const formatPrice = (price, billingCycle) => {
  const n = Number(price) || 0;
  if (n === 0) return 'Miễn phí';
  const suffix = billingCycle === 'YEARLY' ? '/năm' : billingCycle === 'ONE_TIME' ? '' : '/tháng';
  return `${n.toLocaleString('vi-VN')} ₫${suffix}`;
};

/** Popup chọn gói cho người dùng — chọn gói nào sẽ cập nhật ngay lập tức, không cần xác nhận thêm. */
const PlanUpgradeModal = ({ isOpen, user, onClose, onSuccess }) => {

  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selectingId, setSelectingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setActionError(null);
    setIsLoading(true);
    setLoadError(null);
    planService
      .listPlans({ size: 50 })
      .then((res) => {
        if (cancelled) return;
        const active = (res.content || [])
          .filter((p) => p.isActive)
          .sort((a, b) => Number(a.price) - Number(b.price));
        setPlans(active);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Không thể tải danh sách gói.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan) => {
    if (selectingId || plan.id === user?.planId) return;
    setSelectingId(plan.id);
    setActionError(null);
    try {
      await userService.updateUserPlan(user.id, plan.id);
      onSuccess?.(plan);
    } catch (err) {
      setActionError(err.message || 'Đổi gói thất bại, vui lòng thử lại.');
    } finally {
      setSelectingId(null);
    }
  };

  const renderPlans = (currentId) => {
    if (isLoading) {
      return (
        <div className="ui-empty">
          <Loader2 size={26} className="animate-spin" aria-hidden="true" />
          <p className="ui-empty__title">Đang tải danh sách gói...</p>
        </div>
      );
    }
    if (loadError) return <FormAlert>{loadError}</FormAlert>;
    if (plans.length === 0) return <p className="ui-placeholder-text">Chưa có gói nào đang hoạt động.</p>;

    return (
      <div className="ui-plan-list">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentId;
          const isSelecting = selectingId === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              className="ui-plan-option"
              data-current={isCurrent}
              onClick={() => handleSelectPlan(plan)}
              disabled={isCurrent || Boolean(selectingId)}
            >
              <span className="ui-stat__icon">
                {isSelecting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="ui-inline">
                  <span className="ui-cell-title">{plan.name}</span>
                  {isCurrent && (
                    <Badge tone="success">
                      <Check size={11} aria-hidden="true" /> Gói hiện tại
                    </Badge>
                  )}
                </span>
                <span className="ui-hint" style={{ display: 'block' }}>
                  {formatPrice(plan.price, plan.billingCycle)}
                </span>
                <span className="ui-plan-option__meta">
                  <span className="ui-inline">
                    <Sparkles size={12} aria-hidden="true" />{' '}
                    {Number(plan.aiCreditsPerMonth || 0).toLocaleString('vi-VN')} credits AI/tháng
                  </span>
                  <span className="ui-inline">
                    <Layers size={12} aria-hidden="true" />
                    {plan.maxCvs === null || plan.maxCvs === undefined ? 'Không giới hạn số CV' : `Tối đa ${plan.maxCvs} CV`}
                  </span>
                  <span className="ui-inline">
                    {plan.allowPremiumTemplates ? <CheckCircle2 size={12} aria-hidden="true" /> : <Ban size={12} aria-hidden="true" />}
                    Mẫu CV cao cấp
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Modal
      open={Boolean(isOpen)}
      title="Nâng cấp gói"
      description={`${user?.fullName ?? ''} · ${user?.email ?? ''}`}
      onClose={onClose}
      busy={Boolean(selectingId)}
      footer={
        <span className="ui-hint" style={{ marginRight: 'auto' }}>
          Bấm chọn một gói để cập nhật ngay lập tức. Việc đổi gói hiện không phát sinh phí.
        </span>
      }
    >
      <FormAlert>{actionError}</FormAlert>
      {renderPlans(user?.planId)}
    </Modal>
  );
};

export default PlanUpgradeModal;
