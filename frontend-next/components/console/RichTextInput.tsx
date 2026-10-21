'use client';

import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

const ACTIONS = [
  { command: 'bold', label: 'Tebal', Icon: Bold },
  { command: 'italic', label: 'Miring', Icon: Italic },
  { command: 'underline', label: 'Garis bawah', Icon: Underline },
] as const;

/**
 * One-line rich text field (bold / italic / underline). The value is inline HTML; the backend
 * sanitises it to <b>/<i>/<u> before storing, and pages render it without innerHTML.
 */
export default function RichTextInput({ value, onChange, label, placeholder }: {
  value: string; onChange: (html: string) => void; label: string; placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value (initial load, save) without moving the caret while typing.
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

  const emit = () => onChange(ref.current?.innerHTML ?? '');

  return (
    <div className="rich-input">
      <div role="toolbar" aria-label={`Format ${label.toLowerCase()}`} style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {ACTIONS.map(({ command, label: name, Icon }) => (
          <button key={command} type="button" className="btn-secondary" aria-label={name} title={name}
            style={{ padding: '4px 8px', minHeight: 0 }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { ref.current?.focus(); document.execCommand?.(command); emit(); }}>
            <Icon size={14} />
          </button>
        ))}
      </div>
      <div ref={ref} role="textbox" aria-label={label} aria-multiline="false" contentEditable suppressContentEditableWarning
        className="form-input" data-placeholder={placeholder}
        style={{ minHeight: 40, lineHeight: 1.5, whiteSpace: 'nowrap', overflowX: 'auto' }}
        onInput={emit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
        onPaste={(e) => {
          // Paste as plain text; formatting comes only from the toolbar.
          e.preventDefault();
          document.execCommand?.('insertText', false, e.clipboardData.getData('text/plain').replace(/\s+/g, ' '));
        }} />
    </div>
  );
}
