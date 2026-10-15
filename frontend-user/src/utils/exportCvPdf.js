/**
 * Utility kết xuất bản in / tải file PDF chất lượng cao cho CV LemoGuide.
 * Sử dụng cơ chế in qua iframe chuẩn vector, tương thích 100% các trình duyệt:
 * Chrome, Edge, Safari, Firefox.
 * 
 * - Bảo toàn 100% màu sắc (-webkit-print-color-adjust: exact)
 * - Tự động đặt tên file tải về trùng với tên CV
 * - Khử bỏ toàn bộ nút chỉnh sửa (pencil buttons), placeholder và thanh hướng dẫn
 * - Căn chỉnh kích thước chuẩn A4 (210mm x 297mm)
 */

export const exportCvToPdf = ({
  elementId = 'printable-cv',
  title = 'CV_LemoGuide',
  onBeforePrint,
  onAfterPrint,
} = {}) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`[exportCvToPdf] Không tìm thấy phần tử #${elementId}, chuyển sang in trực tiếp trang`);
    window.print();
    return false;
  }

  if (typeof onBeforePrint === 'function') {
    onBeforePrint();
  }

  // Tạo iframe ẩn dùng riêng cho tác vụ in
  const existingFrame = document.getElementById('cv-export-iframe');
  if (existingFrame && existingFrame.parentNode) {
    existingFrame.parentNode.removeChild(existingFrame);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'cv-export-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    console.warn('[exportCvToPdf] Không thể truy cập frame document, dùng window.print()');
    window.print();
    return false;
  }

  frameDoc.open();

  // Gom toàn bộ thẻ style và link stylesheet từ trang cha
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  // Clone cây DOM của CV và loại bỏ các phần tử không dành cho bản in
  const cloned = element.cloneNode(true);
  cloned.querySelectorAll('.no-print, button, [data-no-print]').forEach((el) => el.remove());

  // Chuẩn hóa khung chứa CV cho vừa trang A4
  cloned.style.maxWidth = '100%';
  cloned.style.width = '100%';
  cloned.style.margin = '0 auto';
  cloned.style.boxShadow = 'none';
  cloned.style.borderRadius = '0';
  cloned.style.border = 'none';

  const safeTitle = (title || 'CV_LemoGuide').replace(/[\\/:*?"<>|]/g, '_');

  frameDoc.write(`
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${safeTitle}</title>
        ${headStyles}
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            min-height: 100% !important;
            font-family: inherit;
          }
          .no-print {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${cloned.outerHTML}
      </body>
    </html>
  `);
  frameDoc.close();

  // Đợi hình ảnh, font chữ trong frame load đầy đủ trước khi gọi hộp thoại in
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error('[exportCvToPdf] Lỗi in iframe:', err);
      window.print();
    } finally {
      if (typeof onAfterPrint === 'function') {
        onAfterPrint();
      }
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);

  return true;
};
