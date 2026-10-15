import { useState, useRef, useLayoutEffect } from 'react';

// 297mm ở 96 CSS px/inch (chuẩn trình duyệt): 297 / 25.4 * 96 ≈ 1122.52px
const A4_HEIGHT_PX = 1122.52;
const A4_WIDTH = '210mm';
const MEASURE_STYLE_ID = 'cv-page-measure-style';

// Trong bản đo ẩn, luôn bỏ qua các phần tử chỉ hiển thị khi chỉnh sửa (nút
// "+ Thêm...", icon sửa/xóa - đều có class .no-print) để SỐ TRANG tính ra
// giống hệt nhau dù đang ở chế độ chỉnh sửa hay xem trước/in - đây chính là
// nguồn gốc lệch trang giữa 2 chế độ trước đây.
const ensureMeasureStyleInjected = () => {
  if (typeof document === 'undefined' || document.getElementById(MEASURE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = MEASURE_STYLE_ID;
  style.textContent = '.cv-page-measure .no-print { display: none !important; }';
  document.head.appendChild(style);
};

/**
 * Bọc nội dung CV (TemplateComponent) và tự động chia thành nhiều "trang"
 * A4 khi nội dung vượt quá chiều cao 1 trang (297mm).
 *
 * - editable=false (bản xem trước / chỉ đọc): cắt nội dung thành từng khung
 *   297mm riêng biệt, overflow:hidden, dịch lên trên theo bội số 297mm để
 *   mỗi khung chỉ lộ ra đúng phần nội dung tương ứng - giống Google
 *   Docs/Word. Vì chế độ này không có phần tử ".no-print" nào nên phép đo
 *   khớp 100% với nội dung thực sự hiển thị.
 * - editable=true (bản chỉnh sửa): KHÔNG cắt/ẩn nội dung (để không bao giờ
 *   che mất nút "+ Thêm..."/sửa/xóa), chỉ vẽ đường ngắt trang + nhãn tại
 *   đúng vị trí mà bản xem trước/bản in sẽ ngắt trang, tính theo cùng một
 *   phép đo đã lọc bỏ phần tử chỉ-dành-cho-chỉnh-sửa như trên.
 */
const CvPaginatedSheet = ({ id, children, boxShadow = '0 10px 40px rgba(0,0,0,0.18)', editable = false }) => {
  const measureRef = useRef(null);
  const [pageCount, setPageCount] = useState(1);

  useLayoutEffect(() => {
    ensureMeasureStyleInjected();
    const el = measureRef.current;
    if (!el) return;

    const recompute = () => {
      const height = el.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(height / A4_HEIGHT_PX)));
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  // Bản đo ẩn - không hiển thị, không chiếm layout, chỉ dùng để tính tổng
  // chiều cao nội dung (đã lọc bỏ các phần tử .no-print, xem CSS ở trên).
  const measurer = (
    <div
      ref={measureRef}
      className="no-print cv-page-measure"
      aria-hidden="true"
      style={{ position: 'fixed', top: 0, left: 0, width: A4_WIDTH, visibility: 'hidden', pointerEvents: 'none', zIndex: -1 }}
    >
      {children}
    </div>
  );

  if (editable) {
    return (
      <div id={id} style={{ width: '100%' }}>
        {measurer}
        <div
          style={{
            width: A4_WIDTH,
            maxWidth: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow,
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {children}

          {pageCount > 1 &&
            Array.from({ length: pageCount - 1 }).map((_, index) => (
              <div
                key={index}
                className="no-print"
                style={{
                  position: 'absolute',
                  top: `${(index + 1) * A4_HEIGHT_PX}px`,
                  left: 0,
                  width: '100%',
                  borderTop: '2px dashed #cbd5e1',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '14px',
                    padding: '2px 9px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748b',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  Hết trang {index + 1}
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div id={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      {measurer}

      {Array.from({ length: pageCount }).map((_, index) => (
        <div
          key={index}
          style={{
            width: A4_WIDTH,
            height: `${A4_HEIGHT_PX}px`,
            maxWidth: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow,
            overflow: 'hidden',
            boxSizing: 'border-box',
            position: 'relative',
            flexShrink: 0,
            pageBreakAfter: index < pageCount - 1 ? 'always' : 'auto',
            breakAfter: index < pageCount - 1 ? 'page' : 'auto',
          }}
        >
          <div style={{ position: 'absolute', top: `${-index * A4_HEIGHT_PX}px`, left: 0, width: '100%' }}>
            {children}
          </div>

          {pageCount > 1 && (
            <span
              className="no-print"
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '14px',
                padding: '2px 9px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                backgroundColor: 'rgba(241, 245, 249, 0.9)',
                border: '1px solid #e2e8f0',
              }}
            >
              Trang {index + 1}/{pageCount}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CvPaginatedSheet;
