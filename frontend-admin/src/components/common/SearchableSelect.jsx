import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, X, Check, Search, Loader2 } from 'lucide-react';

/**
 * Chuẩn hóa chuỗi tiếng Việt (bỏ dấu, về chữ thường) để tìm "phan mem"
 * vẫn ra "Kỹ thuật phần mềm".
 */
const normalizeText = (str) => {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

/**
 * Single-select dropdown with search. Pair it with <Field> so the label,
 * error and hint match every other input:
 *   <Field label="Chuyên ngành">{(c) => <SearchableSelect id={c.id} invalid={!!c['aria-invalid']} ... />}</Field>
 * `darkMode` is accepted for backwards compatibility and ignored (theme comes from tokens).
 */
const SearchableSelect = ({
  id,
  options = [],
  value = '',
  onChange,
  placeholder = '-- Chọn hoặc tìm kiếm --',
  searchPlaceholder = 'Gõ tên để tìm kiếm nhanh...',
  disabled = false,
  invalid = false,
  loading = false,
  onSearch,
  clearable = true,
  emptyText = 'Không tìm thấy kết quả phù hợp',
  fallbackLabel = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = useMemo(() => {
    if (value === '' || value === null || value === undefined) return null;
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [options, value]);

  const displayLabel = selectedOption?.label || fallbackLabel || '';

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const normalizedTerm = normalizeText(searchTerm);
    return options.filter((opt) => {
      const normalizedLabel = normalizeText(opt.label);
      const normalizedSub = opt.subLabel ? normalizeText(opt.subLabel) : '';
      return normalizedLabel.includes(normalizedTerm) || normalizedSub.includes(normalizedTerm);
    });
  }, [options, searchTerm]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus the search box when opened
  useEffect(() => {
    if (!isOpen) return undefined;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Debounced server-side search when the parent provides onSearch
  useEffect(() => {
    if (!onSearch || !isOpen) return undefined;
    const timer = setTimeout(() => onSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch, isOpen]);

  // Keep the highlighted option in view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-option-item]');
    items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  const closeMenu = () => {
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleSelect = (option) => {
    if (disabled) return;
    onChange(option ? option.value : '', option);
    closeMenu();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onChange('', null);
    setSearchTerm('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.target === e.currentTarget.querySelector('[role="combobox"]') && ['ArrowDown', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        if (!disabled) setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 >= filteredOptions.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 < 0 ? filteredOptions.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className="ui-combo">
      <div
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid ? 'true' : undefined}
        tabIndex={disabled ? -1 : 0}
        className="ui-combo__trigger"
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
      >
        <span className={displayLabel ? 'ui-combo__value' : 'ui-combo__value ui-combo__value--placeholder'}>
          {displayLabel || placeholder}
        </span>

        <span className="ui-combo__icons">
          {loading && <Loader2 size={15} className="animate-spin" aria-label="Đang tải" />}
          {clearable && displayLabel && !disabled && (
            <button type="button" className="ui-combo__clear" onClick={handleClear} title="Bỏ chọn" aria-label="Bỏ chọn">
              <X size={14} aria-hidden="true" />
            </button>
          )}
          <ChevronDown size={16} className="ui-combo__chev" aria-hidden="true" />
        </span>
      </div>

      {isOpen && (
        <div className="ui-combo__menu">
          <div className="ui-combo__search">
            <Search size={15} aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
            {searchTerm && (
              <button type="button" className="ui-combo__clear" onClick={() => setSearchTerm('')} aria-label="Xóa từ khóa">
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>

          <div ref={listRef} className="ui-combo__list" role="listbox">
            {clearable && (
              <div
                role="option"
                aria-selected={false}
                className="ui-combo__option ui-combo__option--none"
                onClick={() => handleSelect(null)}
              >
                Bỏ chọn
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="ui-combo__empty">
                {emptyText}
                {searchTerm && <div className="ui-hint">"{searchTerm}"</div>}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    data-option-item
                    data-active={highlightedIndex === index}
                    role="option"
                    aria-selected={isSelected}
                    className="ui-combo__option"
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="ui-combo__option-text">
                      <div className="ui-combo__option-label">{opt.label}</div>
                      {opt.subLabel && <div className="ui-combo__option-sub">{opt.subLabel}</div>}
                    </div>
                    {isSelected && <Check size={16} aria-hidden="true" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="ui-combo__foot">
            <span>
              {searchTerm ? `Tìm thấy ${filteredOptions.length} kết quả` : `Tổng cộng ${options.length} lựa chọn`}
            </span>
            <span>Dùng ↑↓ Enter để chọn</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
