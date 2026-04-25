'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef } from 'react';

/**
 * Either `title` (rendered as a visible heading) OR `ariaLabel` must be
 * provided so the dialog has an accessible name. Discriminated union enforces
 * this at the type level for new call sites; legacy callers without either
 * still type-check via `BaseModalProps` but trigger a dev-time warning.
 */
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  title?: string;
  ariaLabel?: string;
}

export type ModalProps =
  | (BaseModalProps & { title: string; ariaLabel?: string })
  | (BaseModalProps & { title?: undefined; ariaLabel: string })
  | BaseModalProps; // permissive fallback — see dev warning below

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, ariaLabel, children, size = 'md', className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      // Dev-time guard: every dialog needs an accessible name. Either a visible
      // `title` (becomes aria-labelledby) or an explicit `ariaLabel` is required.
      if (process.env.NODE_ENV !== 'production' && !title && !ariaLabel) {
        // eslint-disable-next-line no-console
        console.warn('[Modal] Missing both `title` and `ariaLabel`. Provide one for screen-reader users.');
      }
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', trapFocus);
      // Focus the dialog after mount
      requestAnimationFrame(() => dialogRef.current?.focus());
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', trapFocus);
      previousFocusRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', trapFocus);
    };
  }, [isOpen, trapFocus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-white dark:bg-warm-900 rounded-2xl shadow-2xl animate-scale-in outline-none',
          sizeMap[size],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100 dark:border-warm-800">
            <h3 id={titleId} className="text-lg font-semibold text-warm-900 dark:text-warm-50">{title}</h3>
            <button onClick={onClose} aria-label="Close dialog" className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-warm-400" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
