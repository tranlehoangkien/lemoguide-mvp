import { Children } from 'react';
import { ArrowDownRight, ArrowUpRight, Search, X } from 'lucide-react';
import { cx } from './cx';

/** Page wrapper. `fill` makes the page exactly viewport-height (table scrolls inside). */
export const Page = ({ fill = false, className, children }) => (
  <div className={cx('ui-page', fill && 'ui-page--fill', className)}>{children}</div>
);

export const PageHeader = ({ title, description, actions, back }) => (
  <div className="ui-page-header">
    <div>
      {back && <div className="ui-page-header__back">{back}</div>}
      <h1 className="ui-page-title">{title}</h1>
      {description && <p className="ui-page-desc">{description}</p>}
    </div>
    {actions && <div className="ui-page-actions">{actions}</div>}
  </div>
);

export const Toolbar = ({ children }) => <div className="ui-toolbar">{children}</div>;

export const ToolbarGroup = ({ children }) => <div className="ui-toolbar-group">{children}</div>;

export const SearchBox = ({ value, onChange, onClear, placeholder = 'Tìm kiếm...', label = 'Tìm kiếm', type = 'text', min }) => (
  <div className="ui-search">
    <Search size={16} aria-hidden="true" />
    <input
      type={type}
      min={min}
      className="ui-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
    />
    {value && (
      <button type="button" className="ui-search__clear" onClick={onClear} aria-label="Xóa nội dung tìm kiếm">
        <X size={15} aria-hidden="true" />
      </button>
    )}
  </div>
);

/** Two or more mutually exclusive options, e.g. table / grid view. */
export const Segmented = ({ value, onChange, options, label }) => (
  <div className="ui-seg" role="group" aria-label={label}>
    {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
      <button
        key={optionValue}
        type="button"
        aria-pressed={value === optionValue}
        onClick={() => onChange(optionValue)}
      >
        {Icon && <Icon size={15} aria-hidden="true" />}
        <span>{optionLabel}</span>
      </button>
    ))}
  </div>
);

/** Double-bezel panel. `fill` lets it take the remaining page height. */
export const Card = ({ fill = false, padded = false, className, children }) => (
  <div className={cx('ui-card', fill && 'ui-card--fill', className)}>
    <div className={cx('ui-card__core', padded && 'ui-card__pad')}>{children}</div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, hint, action }) => (
  <div className="ui-empty">
    {Icon && (
      <div className="ui-empty__icon">
        <Icon size={22} aria-hidden="true" />
      </div>
    )}
    <p className="ui-empty__title">{title}</p>
    {hint && <p className="ui-empty__hint">{hint}</p>}
    {action && <div className="ui-empty__action">{action}</div>}
  </div>
);

/** tone: neutral | success | info | warning | danger */
export const Badge = ({ tone = 'neutral', children }) => (
  <span className={cx('ui-badge', tone !== 'neutral' && `ui-badge--${tone}`)}>{children}</span>
);

/** Round avatar: image when `src` is set, otherwise the first letter of `name`. size in px. */
export const Avatar = ({ src, name = '', size = 40, className }) => (
  <span className={cx('ui-avatar', className)} style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}>
    {src ? <img src={src} alt={name} /> : name?.slice(0, 1)?.toUpperCase() || 'A'}
  </span>
);

/** KPI tile: icon, big value, optional growth chip and a note. `change` is a preformatted string like "+4.2%". */
export const StatCard = ({ title, value, unit, change, note, icon: Icon, loading = false }) => {
  const positive = change != null && !String(change).startsWith('-');
  return (
    <Card>
      <div className="ui-stat">
        <div className="ui-stat__head">
          <span className="ui-stat__title">{title}</span>
          {Icon && (
            <span className="ui-stat__icon">
              <Icon size={20} aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="ui-stat__value">
          <strong>{loading ? '...' : value}</strong>
          {unit && <span>{unit}</span>}
        </div>
        <div className="ui-stat__foot">
          {change ? (
            <Badge tone={positive ? 'success' : 'danger'}>
              {positive ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}
              {change}
            </Badge>
          ) : (
            <span className="ui-hint">-</span>
          )}
          {note && <span className="ui-hint">{note}</span>}
        </div>
      </div>
    </Card>
  );
};

/** Horizontal share bar (0-100). */
export const Bar = ({ percent }) => (
  <div className="ui-bar" role="presentation">
    <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
  </div>
);

/**
 * Tab bar for pages that split one record into sections.
 * options: [{ value, label, icon, count }]. Scrolls sideways on narrow screens.
 */
export const Tabs = ({ value, onChange, options, label, className }) => (
  <div className={cx('ui-tabs', className)} role="tablist" aria-label={label}>
    {options.map(({ value: optionValue, label: optionLabel, icon: Icon, count }) => (
      <button
        key={optionValue}
        type="button"
        role="tab"
        aria-selected={value === optionValue}
        onClick={() => onChange(optionValue)}
      >
        {Icon && <Icon size={15} aria-hidden="true" />}
        <span>{optionLabel}</span>
        {count != null && <span className="ui-tabs__count">{count}</span>}
      </button>
    ))}
  </div>
);

/** Titled card for one block of a record page: icon + title + count on the left, action on the right. */
export const SectionCard = ({ icon: Icon, title, count, action, className, children }) => (
  <Card className={className}>
    <div className="ui-card__head">
      <h3 className="ui-card__title ui-inline">
        {Icon && <Icon size={18} aria-hidden="true" className="ui-section-icon" />}
        {title}
        {count != null && <span className="ui-tabs__count">{count}</span>}
      </h3>
      {action}
    </div>
    <div className="ui-card__body">{children}</div>
  </Card>
);

/**
 * One record inside a SectionCard (education, job, project...).
 * `meta` sits top right (dates), `actions` is usually <RowActions />, children are the body.
 */
export const Entry = ({ title, subtitle, meta, actions, children }) => (
  <div className="ui-entry">
    <div className="ui-entry__head">
      <div className="ui-entry__main">
        <h4 className="ui-entry__title">{title}</h4>
        {subtitle && <div className="ui-entry__sub">{subtitle}</div>}
      </div>
      {(meta || actions) && (
        <div className="ui-entry__side">
          {meta && <span className="ui-entry__meta">{meta}</span>}
          {actions}
        </div>
      )}
    </div>
    {Children.toArray(children).length > 0 && <div className="ui-entry__body">{children}</div>}
  </div>
);
