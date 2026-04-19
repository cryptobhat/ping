'use client';
import { useRef, useCallback } from 'react';
import { Bold, Italic, Underline, Heading2, List, ListOrdered, Quote, AlignLeft, AlignCenter, Undo2, Redo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichEditor({ value, onChange, placeholder, className, minHeight = '400px' }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const tools = [
    { cmd: 'bold', icon: Bold, label: 'Bold' },
    { cmd: 'italic', icon: Italic, label: 'Italic' },
    { cmd: 'underline', icon: Underline, label: 'Underline' },
    { cmd: 'formatBlock', value: 'H2', icon: Heading2, label: 'Heading' },
    { cmd: 'insertUnorderedList', icon: List, label: 'Bullet List' },
    { cmd: 'insertOrderedList', icon: ListOrdered, label: 'Numbered List' },
    { cmd: 'formatBlock', value: 'BLOCKQUOTE', icon: Quote, label: 'Quote' },
    { cmd: 'justifyLeft', icon: AlignLeft, label: 'Align Left' },
    { cmd: 'justifyCenter', icon: AlignCenter, label: 'Center' },
    { cmd: 'undo', icon: Undo2, label: 'Undo' },
    { cmd: 'redo', icon: Redo2, label: 'Redo' },
  ];

  return (
    <div className={cn('border border-warm-200 dark:border-warm-700 rounded-2xl overflow-hidden bg-white dark:bg-warm-900', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-warm-100 dark:border-warm-800 bg-warm-50/50 dark:bg-warm-800/30 overflow-x-auto scrollbar-hide">
        {tools.map(({ cmd, value: toolVal, icon: Icon, label }) => (
          <button
            key={cmd + (toolVal || '')}
            type="button"
            onClick={() => exec(cmd, toolVal)}
            className="p-2 rounded-lg text-warm-500 dark:text-warm-400 hover:text-warm-800 dark:hover:text-warm-200 hover:bg-warm-100 dark:hover:bg-warm-700 transition-colors flex-shrink-0"
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          'px-5 py-4 outline-none text-lg leading-[1.8] font-serif',
          'text-warm-800 dark:text-warm-200',
          'prose prose-warm dark:prose-invert max-w-none',
          '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-warm-300 dark:[&:empty]:before:text-warm-600 [&:empty]:before:pointer-events-none',
        )}
        style={{ minHeight }}
        data-placeholder={placeholder || 'Start writing your story...'}
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
        onKeyDown={(e) => {
          // Tab = indent
          if (e.key === 'Tab') {
            e.preventDefault();
            exec('insertText', '    ');
          }
        }}
      />
    </div>
  );
}
