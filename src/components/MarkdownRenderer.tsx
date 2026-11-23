import React from 'react';
import { CheckSquare, Info, Square } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onCitationClick?: (citationTitle: string) => void;
  onWikiLinkClick?: (noteTitle: string) => void;
  onTagClick?: (tag: string) => void;
}

function renderInline(
  text: string,
  onCitationClick?: (citationTitle: string) => void,
  onWikiLinkClick?: (noteTitle: string) => void,
  onTagClick?: (tag: string) => void
): React.ReactNode[] {
  const tokenRegex =
    /(\[《[^》]+》\]|\[\[[^\]]+\]\]|\*\*[^*]+\*\*|`[^`]+`|#[\u4e00-\u9fa5A-Za-z0-9_-]+)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('[《') && part.endsWith('》]')) {
      const docTitle = part.slice(2, -2);
      return (
        <button
          key={idx}
          type="button"
          onClick={() => onCitationClick?.(docTitle)}
          className="mx-0.5 inline-flex items-center rounded-md bg-[#0071E3]/10 px-1.5 py-0.5 text-[12px] font-medium text-[#0071E3] transition-colors hover:bg-[#0071E3]/18 dark:bg-[#2997FF]/15 dark:text-[#47A3FF]"
          title={`查看来源文档：${docTitle}`}
        >
          {docTitle}
        </button>
      );
    }

    if (part.startsWith('[[') && part.endsWith(']]')) {
      const target = part.slice(2, -2);
      return (
        <button
          key={idx}
          type="button"
          onClick={() => onWikiLinkClick?.(target)}
          className="mx-0.5 inline-flex items-center font-medium text-[#6E56CF] underline decoration-[#6E56CF]/35 underline-offset-3 transition-colors hover:text-[#5B43B8] hover:decoration-[#6E56CF] dark:text-[#A78BFA] dark:decoration-[#A78BFA]/40"
          title={`打开双向链接笔记：${target}`}
        >
          {target}
        </button>
      );
    }

    if (part.startsWith('#') && part.length > 1) {
      return (
        <button
          key={idx}
          type="button"
          onClick={() => onTagClick?.(part)}
          className="mx-0.5 inline-flex items-center rounded-md bg-[#6E56CF]/10 px-1.5 py-0.5 text-[12px] font-medium text-[#6E56CF] transition-colors hover:bg-[#6E56CF]/18 dark:bg-[#8E75FF]/15 dark:text-[#A78BFA]"
        >
          {part}
        </button>
      );
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-[#1D1D1F] dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[12.5px] text-neutral-800 dark:bg-white/10 dark:text-neutral-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCitationClick,
  onWikiLinkClick,
  onTagClick,
}) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre
          key={`code-${i}`}
          className="my-3 overflow-x-auto rounded-xl border border-neutral-200/80 bg-[#F5F5F7] p-3.5 font-mono text-[12.5px] leading-relaxed text-[#1D1D1F] dark:border-white/10 dark:bg-[#1C1C1E] dark:text-neutral-200"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Obsidian Callout block (> [!info] ...)
    if (trimmed.startsWith('> [!')) {
      const calloutTitle = trimmed.replace(/^>\s*\[![^\]]+\]\s*/, '') || '提示';
      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        bodyLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <div
          key={`callout-${i}`}
          className="my-3 rounded-xl border border-[#0071E3]/20 bg-[#0071E3]/[0.05] p-3.5 dark:border-[#2997FF]/30 dark:bg-[#2997FF]/[0.09]"
        >
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#0071E3] dark:text-[#47A3FF]">
            <Info className="h-4 w-4 shrink-0" />
            <span>{calloutTitle}</span>
          </div>
          <div className="mt-1.5 space-y-1 text-[13.5px] leading-relaxed text-[#3A3A3C] dark:text-neutral-300">
            {bodyLines.map((b, idx) => (
              <p key={idx}>{renderInline(b, onCitationClick, onWikiLinkClick, onTagClick)}</p>
            ))}
          </div>
        </div>
      );
      continue;
    }

    // Markdown Table
    if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|---')) {
      const headerCells = trimmed
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      i += 2; // skip header and separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(
          lines[i]
            .trim()
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );
        i++;
      }
      elements.push(
        <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-black/[0.08] dark:border-white/[0.1]">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#F5F5F7]/80 dark:border-white/[0.08] dark:bg-[#1C1C1E]">
                {headerCells.map((h, idx) => (
                  <th key={idx} className="px-3.5 py-2.5 font-semibold text-[#1D1D1F] dark:text-white">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#FAFAFC] dark:hover:bg-white/[0.02]">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3.5 py-2.5 text-[#3A3A3C] tabular-nums dark:text-neutral-300"
                    >
                      {renderInline(cell, onCitationClick, onWikiLinkClick, onTagClick)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4
          key={`h3-${i}`}
          className="mt-4 mb-1.5 font-display text-[15px] font-semibold tracking-tight text-[#1D1D1F] dark:text-white"
        >
          {renderInline(trimmed.slice(4), onCitationClick, onWikiLinkClick, onTagClick)}
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3
          key={`h2-${i}`}
          className="mt-5 mb-2 font-display text-[17px] font-semibold tracking-tight text-[#1D1D1F] dark:text-white"
        >
          {renderInline(trimmed.slice(3), onCitationClick, onWikiLinkClick, onTagClick)}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2
          key={`h1-${i}`}
          className="mt-5 mb-2.5 font-display text-[20px] font-semibold tracking-tight text-[#1D1D1F] dark:text-white"
        >
          {renderInline(trimmed.slice(2), onCitationClick, onWikiLinkClick, onTagClick)}
        </h2>
      );
      i++;
      continue;
    }

    // Obsidian Task Checkboxes (- [ ] / - [x])
    if (/^[-*]\s\[[ xX]\]\s/.test(trimmed)) {
      const taskItems: { done: boolean; text: string }[] = [];
      while (i < lines.length && /^[-*]\s\[[ xX]\]\s/.test(lines[i].trim())) {
        const lineTrim = lines[i].trim();
        const done = /^[-*]\s\[[xX]\]/.test(lineTrim);
        const text = lineTrim.replace(/^[-*]\s\[[ xX]\]\s/, '');
        taskItems.push({ done, text });
        i++;
      }
      elements.push(
        <ul key={`tasks-${i}`} className="my-2 space-y-1.5">
          {taskItems.map((t, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[14px] leading-relaxed">
              {t.done ? (
                <CheckSquare className="mt-1 h-4 w-4 shrink-0 text-[#0D9488] dark:text-[#10B981]" />
              ) : (
                <Square className="mt-1 h-4 w-4 shrink-0 text-[#86868B]" />
              )}
              <span
                className={
                  t.done
                    ? 'line-through text-[#86868B]'
                    : 'text-[#3A3A3C] dark:text-neutral-300'
                }
              >
                {renderInline(t.text, onCitationClick, onWikiLinkClick, onTagClick)}
              </span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Unordered list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1.5 pl-4">
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className="relative pl-2 text-[14.5px] leading-[1.65] text-[#3A3A3C] before:absolute before:-left-2.5 before:top-[0.65em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#0071E3]/50 dark:text-neutral-300 dark:before:bg-[#2997FF]/60"
            >
              {renderInline(item, onCitationClick, onWikiLinkClick, onTagClick)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol
          key={`ol-${i}`}
          className="my-2 space-y-1.5 pl-5 list-decimal marker:text-[#86868B] marker:tabular-nums"
        >
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className="pl-1 text-[14.5px] leading-[1.65] text-[#3A3A3C] dark:text-neutral-300"
            >
              {renderInline(item, onCitationClick, onWikiLinkClick, onTagClick)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph
    elements.push(
      <p
        key={`p-${i}`}
        className="my-2 text-[14.5px] leading-[1.7] text-[#3A3A3C] dark:text-neutral-300"
      >
        {renderInline(trimmed, onCitationClick, onWikiLinkClick, onTagClick)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
};
