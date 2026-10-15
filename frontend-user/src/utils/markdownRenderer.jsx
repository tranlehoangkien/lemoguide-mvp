import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Định dạng inline: **in đậm**, *in nghiêng*, ***đậm & nghiêng***, `code inline`
 */
export const parseInlineFormatting = (text, isDark = false) => {
  if (!text) return null;

  // Hỗ trợ: `code`, ***đậm nghiêng*** (hoặc ****), **in đậm**, *in nghiêng*
  const parts = text.split(/(`[^`]+`|\*{3,}[^\n*]+?\*{3,}|\*\*[^\n*]+?\*\*|\*[^\n*]+?\*)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          style={{
            backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
            color: isDark ? '#34d399' : '#0f766e',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            padding: '2px 6px',
            borderRadius: '5px',
            fontSize: '13px',
            fontFamily: 'monospace',
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('***') && part.endsWith('***')) {
      const inner = part.replace(/^\*+|\*+$/g, '');
      return inner ? (
        <strong key={index} style={{ fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}>
          <em>{inner}</em>
        </strong>
      ) : null;
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return inner ? (
        <strong key={index} style={{ fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}>
          {inner}
        </strong>
      ) : null;
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      const inner = part.slice(1, -1);
      return inner ? <em key={index}>{inner}</em> : null;
    }

    return part;
  }).filter(Boolean);
};

/**
 * Khối hiển thị code với nút sao chép
 */
export const CodeBlock = ({ code, language, isDark }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        margin: '14px 0',
        borderRadius: '10px',
        overflow: 'hidden',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        backgroundColor: isDark ? '#090d16' : '#1e293b',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          backgroundColor: '#0f172a',
          borderBottom: `1px solid ${isDark ? '#1e293b' : '#334155'}`,
          fontSize: '12px',
          color: '#94a3b8',
          fontWeight: '600',
        }}
      >
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            color: copied ? '#34d399' : '#cbd5e1',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
        </button>
      </div>

      <pre
        style={{
          margin: 0,
          padding: '14px',
          overflowX: 'auto',
          color: '#f8fafc',
          fontSize: '13px',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          lineHeight: '1.55',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * Khối hiển thị bảng Markdown với định dạng inline cho từng ô dữ liệu
 */
export const TableBlock = ({ rows, isDark }) => {
  if (!rows || rows.length === 0) return null;

  const parseRow = (line) => {
    const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    return trimmed.split('|').map((cell) => cell.trim());
  };

  const headerCells = parseRow(rows[0]);
  const bodyRows = rows.slice(1).map(parseRow);

  return (
    <div
      style={{
        margin: '14px 0',
        overflowX: 'auto',
        borderRadius: '8px',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
        <thead>
          <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
            {headerCells.map((h, idx) => (
              <th
                key={idx}
                style={{
                  padding: '9px 12px',
                  fontWeight: '700',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  textAlign: 'left',
                }}
              >
                {parseInlineFormatting(h, isDark)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rIdx) => (
            <tr
              key={rIdx}
              style={{
                backgroundColor: isDark
                  ? rIdx % 2 === 0
                    ? '#1e293b'
                    : '#161f30'
                  : rIdx % 2 === 0
                  ? '#ffffff'
                  : '#f8fafc',
                borderBottom: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
              }}
            >
              {row.map((cell, cIdx) => (
                <td key={cIdx} style={{ padding: '8px 12px', color: isDark ? '#cbd5e1' : '#334155' }}>
                  {parseInlineFormatting(cell, isDark)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Bộ phân tích và render Markdown phong phú:
 * - Khối mã nguồn ```
 * - Bảng Markdown | Col 1 | Col 2 |
 * - Phân cách ngang ---, ***, ****, ___
 * - Tiêu đề #, ##, ###, ####
 * - Trích dẫn >
 * - Danh sách không thứ tự -, *, •
 * - Danh sách có thứ tự 1., 2.
 * - Đoạn văn bản kèm định dạng inline
 */
export const renderFormattedContent = (content, isDark) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = '';
  let inTable = false;
  let tableBuffer = [];

  const flushCodeBlock = (key) => {
    const codeText = codeBuffer.join('\n');
    elements.push(
      <CodeBlock key={`code-${key}`} code={codeText} language={codeLang} isDark={isDark} />
    );
    codeBuffer = [];
    codeLang = '';
  };

  const flushTable = (key) => {
    elements.push(
      <TableBlock key={`table-${key}`} rows={tableBuffer} isDark={isDark} />
    );
    tableBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Kiểm tra code block ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(i);
        inCodeBlock = false;
      } else {
        if (inTable) {
          flushTable(i);
          inTable = false;
        }
        inCodeBlock = true;
        codeLang = trimmed.replace('```', '') || 'text';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // 2. Kiểm tra bảng Markdown (có chứa |)
    if (trimmed.startsWith('|')) {
      if (!inTable) inTable = true;
      // Bỏ qua dòng phân cách | :--- | :--- |
      if (/^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(trimmed)) {
        continue;
      }
      tableBuffer.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable(i);
      inTable = false;
    }

    // 3. Đường phân cách ngang: ---, ***, ****, ___
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      elements.push(
        <hr
          key={`hr-${i}`}
          style={{
            margin: '16px 0',
            border: 'none',
            borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          }}
        />
      );
      continue;
    }

    // 4. Tiêu đề #, ##, ###, ####
    if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          style={{
            fontSize: '20px',
            fontWeight: '800',
            color: isDark ? '#34d399' : '#15803d',
            margin: '22px 0 10px',
            letterSpacing: '-0.02em',
          }}
        >
          {parseInlineFormatting(line.replace(/^#\s+/, ''), isDark)}
        </h1>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          style={{
            fontSize: '18px',
            fontWeight: '800',
            color: isDark ? '#34d399' : '#15803d',
            margin: '20px 0 8px',
            letterSpacing: '-0.015em',
          }}
        >
          {parseInlineFormatting(line.replace(/^##\s+/, ''), isDark)}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          style={{
            fontSize: '16.5px',
            fontWeight: '700',
            color: isDark ? '#34d399' : '#15803d',
            margin: '16px 0 8px',
            letterSpacing: '-0.01em',
          }}
        >
          {parseInlineFormatting(line.replace(/^###\s+/, ''), isDark)}
        </h3>
      );
      continue;
    }

    if (line.startsWith('#### ')) {
      elements.push(
        <h4
          key={`h4-${i}`}
          style={{
            fontSize: '15px',
            fontWeight: '700',
            color: isDark ? '#f8fafc' : '#0f172a',
            margin: '14px 0 6px',
          }}
        >
          {parseInlineFormatting(line.replace(/^####\s+/, ''), isDark)}
        </h4>
      );
      continue;
    }

    // 5. Blockquote >
    if (line.startsWith('> ')) {
      elements.push(
        <div
          key={`quote-${i}`}
          style={{
            borderLeft: `3.5px solid ${isDark ? '#34d399' : '#15803d'}`,
            padding: '10px 14px',
            margin: '10px 0',
            backgroundColor: isDark ? 'rgba(52, 211, 153, 0.08)' : '#f0fdf4',
            borderRadius: '0 8px 8px 0',
            fontSize: '14px',
            lineHeight: '1.6',
            color: isDark ? '#e2e8f0' : '#166534',
            fontStyle: 'italic',
          }}
        >
          {parseInlineFormatting(line.replace(/^>\s+/, ''), isDark)}
        </div>
      );
      continue;
    }

    // 6. Danh sách có gạch đầu dòng - hoặc * hoặc •
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      elements.push(
        <div
          key={`li-${i}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            margin: '4px 0',
            paddingLeft: '4px',
            fontSize: '14.5px',
            lineHeight: '1.6',
            color: isDark ? '#e2e8f0' : '#334155',
          }}
        >
          <span style={{ color: isDark ? '#34d399' : '#15803d', fontWeight: 'bold', lineHeight: '1.5' }}>•</span>
          <div style={{ flex: 1 }}>{parseInlineFormatting(line.replace(/^[-*•]\s+/, ''), isDark)}</div>
        </div>
      );
      continue;
    }

    // 7. Danh sách số 1. 2.
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        elements.push(
          <div
            key={`num-${i}`}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              margin: '5px 0',
              paddingLeft: '4px',
              fontSize: '14.5px',
              lineHeight: '1.6',
              color: isDark ? '#e2e8f0' : '#334155',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : '#dcfce7',
                color: isDark ? '#34d399' : '#15803d',
                fontSize: '11px',
                fontWeight: '700',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              {match[1]}
            </span>
            <div style={{ flex: 1 }}>{parseInlineFormatting(match[2], isDark)}</div>
          </div>
        );
        continue;
      }
    }

    // 8. Đoạn văn thường (hoặc khoảng cách)
    if (!trimmed) {
      elements.push(<div key={`space-${i}`} style={{ height: '8px' }} />);
    } else {
      elements.push(
        <p
          key={`p-${i}`}
          style={{
            margin: '6px 0',
            fontSize: '14.5px',
            lineHeight: '1.65',
            color: isDark ? '#e2e8f0' : '#334155',
          }}
        >
          {parseInlineFormatting(line, isDark)}
        </p>
      );
    }
  }

  if (inCodeBlock) flushCodeBlock('end');
  if (inTable) flushTable('end');

  return elements;
};
