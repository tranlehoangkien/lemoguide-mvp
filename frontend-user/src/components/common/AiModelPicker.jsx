import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import './AiModelPicker.css';

const AUTO = { id: '', name: 'Tự động', provider: 'Hệ thống chọn model phù hợp' };

/**
 * Model dropdown in the same shape as the AI Coach header picker (status dot, name, chevron;
 * menu rows with name + provider and a tick), built on the --ui-* tokens.
 * `value` is a model id or '' for automatic selection when `allowAuto` is set.
 */
export default function AiModelPicker({ models, value, onChange, allowAuto = false, disabled = false, align = 'start', label = 'Chọn mô hình AI' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const options = allowAuto ? [AUTO, ...models] : models;
  const current = options.find((m) => String(m.id) === String(value ?? '')) || options[0] || AUTO;

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey, true); };
  }, [open]);

  const choose = (id) => { onChange(id); setOpen(false); };

  return (
    <div ref={rootRef} className={`ai-model-picker ai-model-picker--${align}`}>
      <button type="button" className="ai-model-picker__trigger" disabled={disabled}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-label={`${label}: ${current.name || current.modelName}`}
        onClick={() => setOpen((v) => !v)}>
        <span className="ai-model-picker__dot" aria-hidden="true" />
        <span className="ai-model-picker__name">{current.name || current.modelName}</span>
        <ChevronDown size={15} className="ai-model-picker__chevron" aria-hidden="true" />
      </button>
      {open && (
        <ul id={listId} className="ai-model-picker__menu" role="listbox" aria-label={label}>
          {options.map((m) => {
            const selected = String(m.id) === String(current.id);
            return (
              <li key={m.id || 'auto'} role="option" aria-selected={selected}>
                <button type="button" className={`ai-model-picker__option${selected ? ' is-selected' : ''}`} onClick={() => choose(m.id)}>
                  <span className="ai-model-picker__text">
                    <strong>{m.name || m.modelName}</strong>
                    {m.provider && <small>{m.provider}</small>}
                  </span>
                  {selected && <Check size={14} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
