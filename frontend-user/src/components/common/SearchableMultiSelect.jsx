import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, X, Check, Search, Loader2 } from 'lucide-react';
import { Badge, Button } from '@/components/ui';

/**
 * Hàm chuẩn hóa chuỗi tiếng Việt (loại bỏ dấu và chuyển về chữ thường)
 */
const normalizeText = (str) => {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

const SearchableMultiSelect = ({
  options = [], // [{ value: id, label: name, category?: string }]
  values = [], // [id1, id2, ...]
  onChange, // (newValues) => void
  placeholder = 'Nhấp để tìm kiếm và chọn công nghệ...',
  searchPlaceholder = 'Gõ tên công nghệ để tìm kiếm nhanh (ví dụ: React, Docker, Java...)...',
  disabled = false,
  loading = false,
  onSearch,
  emptyText = 'Không tìm thấy công nghệ phù hợp',
  categories = [], // danh sách category để lọc nhanh nếu có
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Set các ID đã chọn để tra cứu nhanh O(1)
  const selectedValuesSet = useMemo(() => {
    return new Set((values || []).map((v) => String(v)));
  }, [values]);

  // Danh sách các options đã được chọn để hiển thị dạng chips/tags
  const selectedItems = useMemo(() => {
    return options.filter((opt) => selectedValuesSet.has(String(opt.value)));
  }, [options, selectedValuesSet]);

  // Lọc options theo từ khóa tìm kiếm và category
  const filteredOptions = useMemo(() => {
    let result = options;

    if (selectedCategory && selectedCategory !== 'ALL') {
      const catLower = selectedCategory.toLowerCase();
      result = result.filter((opt) => {
        const optCat = (opt.category || '').toLowerCase();
        // 1. Khớp chính xác
        if (optCat === catLower) return true;
        // 2. Khớp chuỗi con hai chiều (ví dụ "Database" khớp "Database - Relational", "Database - NoSQL")
        if (optCat.includes(catLower) || catLower.includes(optCat)) return true;
        // 3. Khớp nhóm Frontend
        if (catLower.includes('front') && optCat.includes('front')) return true;
        // 4. Khớp nhóm Backend
        if (catLower.includes('back') && optCat.includes('back')) return true;
        // 5. Khớp nhóm Database
        if ((catLower.includes('data') || catLower.includes('db')) && optCat.includes('database')) return true;
        // 6. Khớp nhóm AI / Machine Learning
        if (
          (catLower.includes('ai') || catLower.includes('machine')) &&
          (optCat.includes('machine') || optCat.includes('data science') || optCat.includes('ai'))
        ) return true;
        // 7. Khớp nhóm DevOps & Cloud
        if (
          (catLower.includes('cloud') || catLower.includes('devops')) &&
          (optCat.includes('cloud') || optCat.includes('ci/cd') || optCat.includes('container') || optCat.includes('orchestration') || optCat.includes('devops'))
        ) return true;
        // 8. Khớp nhóm Mobile
        if (catLower.includes('mobile') && optCat.includes('mobile')) return true;
        // 9. Khớp nhóm Testing & QA
        if ((catLower.includes('test') || catLower.includes('qa')) && (optCat.includes('test') || optCat.includes('qa'))) return true;
        // 10. Khớp nhóm Programming Language / Ngôn ngữ
        if ((catLower.includes('language') || catLower.includes('ngôn ngữ')) && optCat.includes('language')) return true;
        // 11. Khớp nhóm Tools & Utilities / Công cụ
        if (
          (catLower.includes('tool') || catLower.includes('util') || catLower.includes('công cụ')) &&
          (optCat.includes('tool') || optCat.includes('version control') || optCat.includes('build') || optCat.includes('monitoring'))
        ) return true;

        return false;
      });
    }

    if (searchTerm.trim()) {
      const term = normalizeText(searchTerm);
      result = result.filter((opt) => {
        const normLabel = normalizeText(opt.label);
        const normCat = opt.category ? normalizeText(opt.category) : '';
        return normLabel.includes(term) || normCat.includes(term);
      });
    }

    return result;
  }, [options, searchTerm, selectedCategory]);

  // Click outside listener để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus ô tìm kiếm khi mở dropdown
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Debounce gọi onSearch (nếu có)
  useEffect(() => {
    if (!onSearch || !isOpen) return;
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch, isOpen]);

  // Toggle chọn / bỏ chọn một item
  const handleToggle = (val) => {
    if (disabled) return;
    const strVal = String(val);
    let newValues;
    if (selectedValuesSet.has(strVal)) {
      newValues = (values || []).filter((v) => String(v) !== strVal);
    } else {
      newValues = [...(values || []), val];
    }
    onChange(newValues);
  };

  // Xóa một tag cụ thể
  const handleRemoveTag = (e, val) => {
    e.stopPropagation();
    if (disabled) return;
    const newValues = (values || []).filter((v) => String(v) !== String(val));
    onChange(newValues);
  };

  // Xóa toàn bộ tags đã chọn
  const handleClearAll = (e) => {
    e.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  return (
    <div ref={containerRef} className="ui-combo">
      <div
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        className="ui-combo__trigger ui-combo__trigger--multi"
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
            if (!disabled) setIsOpen(true);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <div className="ui-combo__tags">
          {selectedItems.length === 0 ? (
            <span className="ui-combo__value ui-combo__value--placeholder">{placeholder}</span>
          ) : (
            selectedItems.map((item) => (
              <span key={item.value} className="ui-tag">
                <span>{item.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    className="ui-tag__x"
                    aria-label={`Bỏ chọn ${item.label}`}
                    title={`Bỏ chọn ${item.label}`}
                    onClick={(e) => handleRemoveTag(e, item.value)}
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        <span className="ui-combo__icons">
          {loading && <Loader2 size={15} className="animate-spin" aria-label="Đang tải" />}
          {selectedItems.length > 0 && !disabled && (
            <button type="button" className="ui-link" title="Xóa tất cả đã chọn" onClick={handleClearAll}>
              Xóa hết ({selectedItems.length})
            </button>
          )}
          <ChevronDown size={16} className="ui-combo__chev" aria-hidden="true" />
        </span>
      </div>

      {isOpen && (
        <div className="ui-combo__menu">
          <div className="ui-combo__search">
            <Search size={16} aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
            {searchTerm && (
              <button type="button" className="ui-combo__clear" onClick={() => setSearchTerm('')} aria-label="Xóa từ khóa">
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          {Array.isArray(categories) && categories.length > 0 && (
            <div className="ui-combo__cats">
              <button
                type="button"
                className="ui-chip"
                aria-pressed={selectedCategory === 'ALL'}
                onClick={() => setSelectedCategory('ALL')}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="ui-chip"
                  aria-pressed={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div ref={listRef} className="ui-combo__list" role="listbox" aria-multiselectable="true">
            {filteredOptions.length === 0 ? (
              <div className="ui-combo__empty">
                {emptyText}
                {searchTerm && <div className="ui-hint">"{searchTerm}"</div>}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValuesSet.has(String(opt.value));
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className="ui-combo__option"
                    onClick={() => handleToggle(opt.value)}
                  >
                    <span className="ui-inline" style={{ minWidth: 0 }}>
                      <span className="ui-check-box" data-checked={isSelected}>
                        {isSelected && <Check size={13} strokeWidth={3} aria-hidden="true" />}
                      </span>
                      <span className="ui-combo__option-label">{opt.label}</span>
                    </span>
                    {opt.category && <Badge>{opt.category}</Badge>}
                  </div>
                );
              })
            )}
          </div>

          <div className="ui-combo__foot">
            <span>
              Đã chọn: <strong style={{ color: 'var(--ui-text)' }}>{selectedItems.length}</strong> công nghệ
            </span>
            <Button
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm('');
              }}
            >
              Xong
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableMultiSelect;
