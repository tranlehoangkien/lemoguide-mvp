import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/** Page numbers are shown in groups of five: 1-5, 6-10, 11-15... */
const GROUP_SIZE = 5;

const Pagination = ({
  currentPage,
  totalPages,
  totalElements,
  pageSize = 10,
  onPageChange,
  entityName = 'bản ghi',
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const startRecord = totalElements === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalElements);

  const startPage = Math.floor((currentPage - 1) / GROUP_SIZE) * GROUP_SIZE + 1;
  const endPage = Math.min(startPage + GROUP_SIZE - 1, safeTotalPages);
  const pageNumbers = [];
  for (let page = startPage; page <= endPage; page += 1) pageNumbers.push(page);

  const atFirst = currentPage <= 1;
  const atLast = currentPage >= safeTotalPages;

  return (
    <nav className="ui-pagination" aria-label="Phân trang">
      <span className="ui-pagination__info">
        {totalElements > 0 ? (
          <>
            Hiển thị <strong>{startRecord}</strong> - <strong>{endRecord}</strong> trên{' '}
            <strong>{totalElements}</strong> {entityName} ({pageSize} dòng/trang)
          </>
        ) : (
          'Không có dữ liệu'
        )}
      </span>

      <div className="ui-pagination__nav">
        <button
          type="button"
          className="ui-page-btn"
          onClick={() => onPageChange(1)}
          disabled={atFirst}
          aria-label="Về trang đầu"
          title="Về trang đầu"
        >
          <ChevronsLeft size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ui-page-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={atFirst}
          aria-label="Trang trước"
          title="Trang trước"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            className="ui-page-btn"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`Trang ${page}`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          className="ui-page-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={atLast}
          aria-label="Trang sau"
          title="Trang sau"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ui-page-btn"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={atLast}
          aria-label="Về trang cuối"
          title="Về trang cuối"
        >
          <ChevronsRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
