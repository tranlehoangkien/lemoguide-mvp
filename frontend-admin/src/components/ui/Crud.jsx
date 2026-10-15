import { Eye, Pencil, Trash2, RotateCcw, RefreshCw } from 'lucide-react';
import { Button, IconButton } from './Button';
import { EmptyState } from './Layout';
import { cx } from './cx';

/**
 * Standard row actions. Pass only the handlers a page supports.
 * `entity` names the thing in the delete tooltip, e.g. "kỹ năng".
 */
export const RowActions = ({ onView, onEdit, onDelete, entity = '', deleteDisabled = false, deleteLabel, children }) => (
  <div className="ui-row-actions">
    {children}
    {onView && <IconButton icon={Eye} label="Xem chi tiết" onClick={onView} />}
    {onEdit && <IconButton icon={Pencil} label="Chỉnh sửa" tone="info" onClick={onEdit} />}
    {onDelete && (
      <IconButton
        icon={Trash2}
        label={deleteLabel || (entity ? `Xóa ${entity}` : 'Xóa')}
        tone="danger"
        disabled={deleteDisabled}
        onClick={onDelete}
      />
    )}
  </div>
);

/** "Đặt lại" + "Tải lại", the two buttons every list toolbar ends with. */
export const ResetRefreshButtons = ({ onReset, onRefresh, loading = false }) => (
  <>
    <Button variant="secondary" icon={RotateCcw} onClick={onReset} title="Đặt lại bộ lọc và tìm kiếm">
      Đặt lại
    </Button>
    <Button variant="secondary" icon={RefreshCw} onClick={onRefresh} title="Tải lại danh sách" disabled={loading}>
      Tải lại
    </Button>
  </>
);

/** Native select styled as a toolbar filter. Pass <option> children. */
export const FilterSelect = ({ label, value, onChange, children, className }) => (
  <select
    className={cx('ui-select ui-filter', className)}
    aria-label={label}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    {children}
  </select>
);

/**
 * Footer for view (read-only) modals: destructive action on the left,
 * Close and the primary Edit on the right. Use with <Modal footerSplit>.
 */
export const ViewFooter = ({ onDelete, onEdit, onClose, deleteLabel = 'Xóa', editLabel = 'Chỉnh sửa' }) => (
  <>
    {onDelete ? (
      <Button variant="danger" icon={Trash2} onClick={onDelete}>
        {deleteLabel}
      </Button>
    ) : (
      <span />
    )}
    <div className="ui-modal__foot-group">
      <Button variant="secondary" onClick={onClose}>
        Đóng
      </Button>
      {onEdit && (
        <Button icon={Pencil} onClick={onEdit}>
          {editLabel}
        </Button>
      )}
    </div>
  </>
);

/**
 * Declarative table. Columns: { header, cell(row, index), label?, className?, muted?, align? }.
 * `label` is the caption shown on mobile (defaults to `header`). The STT column
 * and the actions column are added automatically.
 */
export const DataTable = ({
  rows,
  rowKey = (row) => row.id,
  columns,
  actions,
  startIndex = 0,
  showIndex = true,
  loading = false,
  emptyIcon,
  emptyTitle = 'Không có bản ghi nào phù hợp.',
  emptyHint,
  onRowClick,
}) => {
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={loading ? 'Đang tải dữ liệu...' : emptyTitle}
        hint={loading ? undefined : emptyHint}
      />
    );
  }

  return (
    <table className="ui-table ui-table--stack">
      <thead>
        <tr>
          {showIndex && <th className="is-num">STT</th>}
          {columns.map((col) => (
            <th key={col.header} style={col.align ? { textAlign: col.align } : undefined}>
              {col.header}
            </th>
          ))}
          {actions && <th className="is-actions">Thao tác</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={rowKey(row, idx)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            style={onRowClick ? { cursor: 'pointer' } : undefined}
          >
            {showIndex && (
              <td className="is-num" data-label="STT">
                {startIndex + idx + 1}
              </td>
            )}
            {columns.map((col) => (
              <td
                key={col.header}
                data-label={col.label || col.header}
                className={cx(col.muted && 'is-muted', col.className)}
                style={col.align ? { textAlign: col.align } : undefined}
              >
                {col.cell(row, idx)}
              </td>
            ))}
            {actions && <td className="is-actions">{actions(row, idx)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
