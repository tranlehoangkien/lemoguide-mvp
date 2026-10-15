import CvEditorPage from './CvEditorPage';

/**
 * Trang "Tạo CV với AI" (route /cv-builder). Dùng lại y hệt trải nghiệm
 * chỉnh sửa CV thông thường (CvEditorPage) để tránh trùng lặp logic chỉnh
 * sửa (modal từng mục, Quản lý mục, Lưu CV...), chỉ khác ở chỗ bật thêm cột
 * trợ lý AI bên trái (CvAiAssistantPanel, xem CvEditorPage.jsx).
 */
const CvBuilderPage = () => <CvEditorPage withAiAssistant />;

export default CvBuilderPage;
