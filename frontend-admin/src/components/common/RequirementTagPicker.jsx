import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge, IconButton } from '@/components/ui';

/**
 * Multi-select tag picker cho yêu cầu công việc: mỗi tag đã chọn có thể bật/tắt
 * "Bắt buộc" / "Không bắt buộc".
 * options: [{ id, name }]
 * selected: [{ id, required }]
 */
const RequirementTagPicker = ({ options = [], selected = [], onChange, placeholder = 'Tìm và thêm...' }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedIds = useMemo(() => new Set(selected.map((s) => Number(s.id))), [selected]);
  const optionById = useMemo(() => new Map(options.map((o) => [Number(o.id), o])), [options]);
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((o) => !selectedIds.has(Number(o.id)))
      .filter((o) => !q || o.name.toLowerCase().includes(q))
      .slice(0, 30);
  }, [options, selectedIds, query]);

  const addTag = (id) => {
    onChange([...selected, { id, required: true }]);
    setQuery('');
  };

  const removeTag = (id) => {
    onChange(selected.filter((s) => Number(s.id) !== Number(id)));
  };

  const toggleRequired = (id) => {
    onChange(selected.map((s) => (Number(s.id) === Number(id) ? { ...s, required: !s.required } : s)));
  };

  return (
    <div ref={containerRef} className="ui-combo">
      {selected.length > 0 && (
        <div className="ui-req-list">
          {selected.map((s) => {
            const opt = optionById.get(Number(s.id));
            if (!opt) return null;
            return (
              <div key={s.id} className="ui-req-row">
                <span>{opt.name}</span>
                <div className="ui-req-row__side">
                  <button
                    type="button"
                    className="ui-req-toggle"
                    aria-pressed={s.required}
                    title="Bấm để đổi giữa Bắt buộc và Không bắt buộc"
                    onClick={() => toggleRequired(s.id)}
                  >
                    <Badge tone={s.required ? 'danger' : 'neutral'}>{s.required ? 'Bắt buộc' : 'Không bắt buộc'}</Badge>
                  </button>
                  <IconButton icon={X} size={14} tone="danger" label={`Bỏ ${opt.name}`} onClick={() => removeTag(s.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <input
        type="text"
        className="ui-input"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
      />

      {isOpen && filteredOptions.length > 0 && (
        <div className="ui-combo__menu">
          <div className="ui-combo__list" role="listbox">
            {filteredOptions.map((o) => (
              <div key={o.id} role="option" aria-selected="false" className="ui-combo__option" onClick={() => addTag(o.id)}>
                <span className="ui-inline">
                  <Plus size={14} aria-hidden="true" className="ui-section-icon" />
                  {o.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementTagPicker;
