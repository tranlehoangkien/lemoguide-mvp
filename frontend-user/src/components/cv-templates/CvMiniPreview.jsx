import { useRef, useState, useLayoutEffect } from 'react';
import { FileText } from 'lucide-react';
import { CV_TEMPLATE_REGISTRY } from './cvTemplateRegistry';
import { buildCvRenderData, resolveActiveSections } from './cvRenderData';

// 210mm ở 96 CSS px/inch: chiều rộng thật mà các template CV được thiết kế
const CV_PAGE_WIDTH_PX = 793.7;

/**
 * Bản xem trước thu nhỏ của một CV thật: dựng đúng template với dữ liệu của CV
 * ở khổ A4 rồi thu nhỏ theo chiều rộng khung chứa, chỉ lộ phần đầu trang 1.
 * Chỉ để nhìn, không tương tác được (inert). Rơi về biểu tượng khi CV chưa có
 * nội dung hoặc mẫu chưa có bản dựng.
 */
const CvMiniPreview = ({ cv, template }) => {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0);

  const TemplateComponent = CV_TEMPLATE_REGISTRY[template?.renderKey] || null;
  const data = buildCvRenderData(cv);
  const canRender = Boolean(TemplateComponent && data);

  useLayoutEffect(() => {
    // The preview node mounts only after both CV data and its template are available.
    if (!canRender) return undefined;
    const el = boxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / CV_PAGE_WIDTH_PX));
    ro.observe(el);
    return () => ro.disconnect();
  }, [canRender]);

  if (!canRender) {
    return (
      <span className="ui-cv-card__fallback">
        <FileText size={40} strokeWidth={1.25} aria-hidden="true" />
      </span>
    );
  }

  return (
    <div ref={boxRef} className="ui-cv-card__paper" aria-hidden="true" inert>
      {scale > 0 && (
        <div className="ui-cv-card__sheet" style={{ transform: `scale(${scale})` }}>
          <TemplateComponent data={data} editable={false} activeSections={resolveActiveSections(cv)} />
        </div>
      )}
    </div>
  );
};

export default CvMiniPreview;
