import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { userProfileService } from '@/services/userProfileService';
import { Modal, Button, Field, TextField, TextareaField, FormAlert } from '@/components/ui';

const UserAdditionalModal = ({ isOpen, onClose, type, item = null, onSaved, onSaveItem, onDeleteItem }) => {
  const isEdit = Boolean(item?.id);

  // Certificate state
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certYear, setCertYear] = useState('');
  const [certUrl, setCertUrl] = useState('');
  const [certDesc, setCertDesc] = useState('');

  // Award state
  const [awardName, setAwardName] = useState('');
  const [awardIssuer, setAwardIssuer] = useState('');
  const [awardYear, setAwardYear] = useState('');
  const [awardDesc, setAwardDesc] = useState('');

  // Interest state
  const [interestName, setInterestName] = useState('');
  const [interestDesc, setInterestDesc] = useState('');

  // Referrer state
  const [refName, setRefName] = useState('');
  const [refPosition, setRefPosition] = useState('');
  const [refCompany, setRefCompany] = useState('');
  const [refContact, setRefContact] = useState('');
  const [refVisibility, setRefVisibility] = useState('PRIVATE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCertName(type === 'certificate' ? item?.name || '' : '');
      setCertIssuer(type === 'certificate' ? item?.issuedBy || '' : '');
      setCertYear(type === 'certificate' && item?.issuedYear ? String(item.issuedYear) : '');
      setCertUrl(type === 'certificate' ? item?.credentialUrl || '' : '');
      setCertDesc(type === 'certificate' ? item?.description || '' : '');

      setAwardName(type === 'award' ? item?.name || '' : '');
      setAwardIssuer(type === 'award' ? item?.grantedBy || '' : '');
      setAwardYear(type === 'award' && item?.grantedYear ? String(item.grantedYear) : '');
      setAwardDesc(type === 'award' ? item?.description || '' : '');

      setInterestName(type === 'interest' ? item?.name || '' : '');
      setInterestDesc(type === 'interest' ? item?.description || '' : '');

      setRefName(type === 'referrer' ? item?.name || '' : '');
      setRefPosition(type === 'referrer' ? item?.position || '' : '');
      setRefCompany(type === 'referrer' ? item?.company || '' : '');
      setRefContact(type === 'referrer' ? item?.contactInfo || '' : '');
      setRefVisibility(type === 'referrer' ? item?.visibility || 'PRIVATE' : 'PRIVATE');
      setErrorMessage(null);
    }
  }, [isOpen, type, item]);

  if (!isOpen) return null;

  const getTitle = () => {
    switch (type) {
      case 'certificate':
        return isEdit ? 'Chỉnh sửa chứng chỉ' : 'Thêm chứng chỉ mới';
      case 'award':
        return isEdit ? 'Chỉnh sửa giải thưởng' : 'Thêm giải thưởng mới';
      case 'interest':
        return isEdit ? 'Chỉnh sửa sở thích' : 'Thêm sở thích mới';
      case 'referrer':
        return isEdit ? 'Chỉnh sửa người giới thiệu' : 'Thêm người giới thiệu mới';
      default:
        return isEdit ? 'Chỉnh sửa mục bổ sung' : 'Thêm mục bổ sung';
    }
  };

  const getSubtitle = () => {
    switch (type) {
      case 'certificate':
        return isEdit
          ? 'Cập nhật thông tin chứng chỉ đã đạt được trong hồ sơ của bạn'
          : 'Thêm chứng chỉ đã đạt được vào hồ sơ của bạn';
      case 'award':
        return isEdit
          ? 'Cập nhật thông tin giải thưởng / danh hiệu trong hồ sơ của bạn'
          : 'Thêm giải thưởng / danh hiệu vào hồ sơ của bạn';
      case 'interest':
        return isEdit
          ? 'Cập nhật thông tin sở thích cá nhân trong hồ sơ của bạn'
          : 'Thêm sở thích cá nhân vào hồ sơ của bạn';
      case 'referrer':
        return isEdit
          ? 'Cập nhật thông tin người giới thiệu (Reference) trong hồ sơ của bạn'
          : 'Thêm người giới thiệu (Reference) vào hồ sơ của bạn';
      default:
        return '';
    }
  };


  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục này?')) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      if (onDeleteItem) {
        await onDeleteItem(type, item?.id);
      } else if (isEdit && item?.id) {
        if (type === 'certificate') await userProfileService.deleteCertificate(item.id);
        else if (type === 'award') await userProfileService.deleteAward(item.id);
        else if (type === 'interest') await userProfileService.deleteInterest(item.id);
        else if (type === 'referrer') await userProfileService.deleteReferrer(item.id);
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi xóa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      setIsSubmitting(true);

      if (onSaveItem) {
        let customPayload = null;
        if (type === 'certificate') {
          if (!certName.trim()) {
            setErrorMessage('Vui lòng nhập tên chứng chỉ');
            setIsSubmitting(false);
            return;
          }
          customPayload = {
            name: certName.trim(),
            issuedBy: certIssuer.trim() || null,
            issuedYear: certYear ? Number(certYear) : null,
            credentialUrl: certUrl.trim() || null,
            description: certDesc.trim() || null,
          };
        } else if (type === 'award') {
          if (!awardName.trim()) {
            setErrorMessage('Vui lòng nhập tên giải thưởng');
            setIsSubmitting(false);
            return;
          }
          customPayload = {
            name: awardName.trim(),
            grantedBy: awardIssuer.trim() || null,
            grantedYear: awardYear ? Number(awardYear) : null,
            description: awardDesc.trim() || null,
          };
        } else if (type === 'interest') {
          if (!interestName.trim()) {
            setErrorMessage('Vui lòng nhập tên sở thích');
            setIsSubmitting(false);
            return;
          }
          customPayload = {
            name: interestName.trim(),
            description: interestDesc.trim() || null,
          };
        } else if (type === 'referrer') {
          if (!refName.trim()) {
            setErrorMessage('Vui lòng nhập họ tên người giới thiệu');
            setIsSubmitting(false);
            return;
          }
          customPayload = {
            name: refName.trim(),
            position: refPosition.trim() || null,
            company: refCompany.trim() || null,
            contactInfo: refContact.trim() || null,
            visibility: refVisibility || 'PRIVATE',
          };
        }

        if (customPayload) {
          await onSaveItem(type, customPayload, item?.id);
          if (onSaved) onSaved();
          onClose();
          return;
        }
      }

      if (type === 'certificate') {
        if (!certName.trim()) {
          setErrorMessage('Vui lòng nhập tên chứng chỉ');
          return;
        }
        if (certYear && (Number(certYear) < 1900 || Number(certYear) > 2100)) {
          setErrorMessage('Năm cấp chứng chỉ không hợp lệ');
          return;
        }
        const payload = {
          name: certName.trim(),
          issuedBy: certIssuer.trim() || null,
          issuedYear: certYear ? Number(certYear) : null,
          credentialUrl: certUrl.trim() || null,
          description: certDesc.trim() || null,
        };
        if (isEdit) {
          await userProfileService.updateCertificate(item.id, payload);
        } else {
          await userProfileService.createCertificate(payload);
        }
      } else if (type === 'award') {
        if (!awardName.trim()) {
          setErrorMessage('Vui lòng nhập tên giải thưởng');
          return;
        }
        if (awardYear && (Number(awardYear) < 1900 || Number(awardYear) > 2100)) {
          setErrorMessage('Năm trao giải không hợp lệ');
          return;
        }
        const payload = {
          name: awardName.trim(),
          grantedBy: awardIssuer.trim() || null,
          grantedYear: awardYear ? Number(awardYear) : null,
          description: awardDesc.trim() || null,
        };
        if (isEdit) {
          await userProfileService.updateAward(item.id, payload);
        } else {
          await userProfileService.createAward(payload);
        }
      } else if (type === 'interest') {
        if (!interestName.trim()) {
          setErrorMessage('Vui lòng nhập tên sở thích');
          return;
        }
        const payload = {
          name: interestName.trim(),
          description: interestDesc.trim() || null,
        };
        if (isEdit) {
          await userProfileService.updateInterest(item.id, payload);
        } else {
          await userProfileService.createInterest(payload);
        }
      } else if (type === 'referrer') {
        if (!refName.trim()) {
          setErrorMessage('Vui lòng nhập họ tên người giới thiệu');
          return;
        }
        const payload = {
          name: refName.trim(),
          position: refPosition.trim() || null,
          company: refCompany.trim() || null,
          contactInfo: refContact.trim() || null,
          visibility: refVisibility || 'PRIVATE',
        };
        if (isEdit) {
          await userProfileService.updateReferrer(item.id, payload);
        } else {
          await userProfileService.createReferrer(payload);
        }
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setErrorMessage(err?.message || 'Không thể lưu thông tin. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={Boolean(isOpen)}
      size={type === 'interest' ? 'md' : 'lg'}
      title={getTitle()}
      description={getSubtitle()}
      onClose={onClose}
      busy={isSubmitting}
      onSubmit={handleSubmit}
      footerSplit
      footer={
        <>
          {isEdit ? (
            <Button variant="danger" icon={Trash2} onClick={handleDelete} disabled={isSubmitting}>
              Xóa mục này
            </Button>
          ) : (
            <span />
          )}
          <div className="ui-modal__foot-group">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting
                ? 'Đang lưu...'
                : isEdit
                ? 'Lưu thay đổi'
                : type === 'certificate'
                ? 'Lưu chứng chỉ'
                : type === 'award'
                ? 'Lưu giải thưởng'
                : type === 'interest'
                ? 'Lưu sở thích'
                : 'Lưu người giới thiệu'}
            </Button>
          </div>
        </>
      }
    >
      <div className="ui-form ui-form--2">
        <FormAlert>{errorMessage}</FormAlert>

        {type === 'certificate' && (
          <>
            <TextField
              className="ui-col-2"
              label="Tên chứng chỉ"
              required
              placeholder="Ví dụ: AWS Certified Solutions Architect, IELTS 7.0..."
              maxLength={200}
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
            />
            <TextField
              label="Tổ chức cấp chứng chỉ"
              placeholder="Ví dụ: Amazon Web Services, British Council..."
              maxLength={200}
              value={certIssuer}
              onChange={(e) => setCertIssuer(e.target.value)}
            />
            <TextField
              type="number"
              label="Năm cấp"
              placeholder="Ví dụ: 2024"
              min={1900}
              max={2100}
              value={certYear}
              onChange={(e) => setCertYear(e.target.value)}
            />
            <TextField
              className="ui-col-2"
              type="url"
              label="Liên kết minh chứng / Credential URL"
              placeholder="https://www.credly.com/badges/..."
              maxLength={500}
              value={certUrl}
              onChange={(e) => setCertUrl(e.target.value)}
            />
            <TextareaField
              className="ui-col-2"
              rows={3}
              label="Mô tả chi tiết"
              placeholder="Mô tả phạm vi, kỹ năng hoặc nội dung chứng chỉ..."
              value={certDesc}
              onChange={(e) => setCertDesc(e.target.value)}
            />
          </>
        )}

        {type === 'award' && (
          <>
            <TextField
              className="ui-col-2"
              label="Tên giải thưởng"
              required
              placeholder="Ví dụ: Giải Nhất Cuộc thi Sinh viên Nghiên cứu khoa học..."
              maxLength={200}
              value={awardName}
              onChange={(e) => setAwardName(e.target.value)}
            />
            <TextField
              label="Đơn vị trao giải"
              placeholder="Ví dụ: Bộ Giáo dục và Đào tạo, Trường Đại học..."
              maxLength={200}
              value={awardIssuer}
              onChange={(e) => setAwardIssuer(e.target.value)}
            />
            <TextField
              type="number"
              label="Năm đạt giải"
              placeholder="Ví dụ: 2024"
              min={1900}
              max={2100}
              value={awardYear}
              onChange={(e) => setAwardYear(e.target.value)}
            />
            <TextareaField
              className="ui-col-2"
              rows={3}
              label="Mô tả chi tiết"
              placeholder="Mô tả bối cảnh, thành tích hoặc ý nghĩa của giải thưởng..."
              value={awardDesc}
              onChange={(e) => setAwardDesc(e.target.value)}
            />
          </>
        )}

        {type === 'interest' && (
          <>
            <TextField
              className="ui-col-2"
              label="Tên sở thích"
              required
              placeholder="Ví dụ: Đọc sách, Chơi bóng đá, Nhiếp ảnh..."
              maxLength={150}
              value={interestName}
              onChange={(e) => setInterestName(e.target.value)}
            />
            <TextareaField
              className="ui-col-2"
              rows={3}
              label="Mô tả chi tiết"
              placeholder="Mô tả thêm về sở thích này (không bắt buộc)..."
              value={interestDesc}
              onChange={(e) => setInterestDesc(e.target.value)}
            />
          </>
        )}

        {type === 'referrer' && (
          <>
            <TextField
              label="Họ và tên"
              required
              placeholder="Ví dụ: Nguyễn Văn A"
              maxLength={150}
              value={refName}
              onChange={(e) => setRefName(e.target.value)}
            />
            <TextField
              label="Chức vụ"
              placeholder="Ví dụ: Trưởng phòng Kỹ thuật"
              maxLength={150}
              value={refPosition}
              onChange={(e) => setRefPosition(e.target.value)}
            />
            <TextField
              label="Công ty / Đơn vị"
              placeholder="Ví dụ: FPT Software"
              maxLength={200}
              value={refCompany}
              onChange={(e) => setRefCompany(e.target.value)}
            />
            <TextField
              label="Thông tin liên hệ"
              placeholder="Email hoặc số điện thoại liên hệ"
              maxLength={255}
              value={refContact}
              onChange={(e) => setRefContact(e.target.value)}
            />
            <Field className="ui-col-2" label="Chế độ hiển thị">
              {() => (
                <div className="ui-radio-row" role="radiogroup" aria-label="Chế độ hiển thị">
                  {[
                    { id: 'PRIVATE', label: 'Riêng tư', desc: 'Chỉ bạn mới xem được' },
                    { id: 'PUBLIC', label: 'Công khai', desc: 'Hiển thị trên hồ sơ / CV công khai' },
                  ].map((opt) => (
                    <label key={opt.id} className="ui-radio ui-radio--card">
                      <input
                        type="radio"
                        name="refVisibility"
                        checked={refVisibility === opt.id}
                        onChange={() => setRefVisibility(opt.id)}
                      />
                      <span>
                        <strong>{opt.label}</strong>
                        <span className="ui-hint">{opt.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Field>
          </>
        )}
      </div>
    </Modal>
  );
};

export default UserAdditionalModal;
