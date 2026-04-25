'use client';

import { cn } from '@/lib/utils';
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';

/**
 * `Field` — wraps a label + form control + optional helper/error text.
 *
 * Pairs with `<Input>` / `<Textarea>` (or any native form control given a
 * matching `id`). When `error` is set, sighted users see red text and screen
 * readers receive `aria-invalid` + `aria-describedby` automatically on any
 * direct `<Input>` / `<Textarea>` child.
 *
 * @example
 *   <Field label="Display name" htmlFor="name" required error={err}>
 *     <Input id="name" value={name} onChange={...} />
 *   </Field>
 */
export interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  error,
  helper,
  required,
  children,
  className,
}: FieldProps) {
  const errorId = `${htmlFor}-error`;
  const helperId = `${htmlFor}-helper`;
  const describedBy = error ? errorId : helper ? helperId : undefined;

  return (
    <div className={cn('w-full', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-0.5" aria-hidden>
            *
          </span>
        )}
      </label>
      <FieldContext.Provider
        value={{ id: htmlFor, invalid: !!error, describedBy }}
      >
        {children}
      </FieldContext.Provider>
      {error && (
        <p id={errorId} className="text-xs text-red-500 mt-1.5" role="alert">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={helperId} className="text-xs text-warm-400 mt-1.5">
          {helper}
        </p>
      )}
    </div>
  );
}

import { createContext, useContext } from 'react';

const FieldContext = createContext<{
  id?: string;
  invalid?: boolean;
  describedBy?: string;
} | null>(null);

const baseControl =
  'w-full bg-warm-50 dark:bg-warm-900 border rounded-xl px-4 py-2.5 text-sm ' +
  'text-warm-900 dark:text-warm-100 placeholder:text-warm-400 outline-none ' +
  'transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

const validBorder = 'border-warm-200 dark:border-warm-700';
const invalidBorder =
  'border-red-300 dark:border-red-700 focus:ring-red-500/20 focus:border-red-500';

/**
 * `Input` — styled `<input>` wrapper. Forwards all native props and refs.
 * When wrapped by `<Field>`, automatically picks up `id`, `aria-invalid`, and
 * `aria-describedby` from context.
 *
 * @example
 *   <Input id="email" type="email" autoComplete="email" />
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, id, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy, ...props },
  ref,
) {
  const ctx = useContext(FieldContext);
  const isInvalid = invalid ?? ctx?.invalid ?? false;
  return (
    <input
      ref={ref}
      id={id ?? ctx?.id}
      aria-invalid={ariaInvalid ?? (isInvalid ? true : undefined)}
      aria-describedby={ariaDescribedBy ?? ctx?.describedBy}
      className={cn(baseControl, isInvalid ? invalidBorder : validBorder, className)}
      {...props}
    />
  );
});

/**
 * `Textarea` — styled `<textarea>` wrapper. Same conventions as `Input`.
 *
 * @example
 *   <Textarea id="bio" rows={4} maxLength={200} />
 */
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { className, invalid, id, 'aria-invalid': ariaInvalid, 'aria-describedby': ariaDescribedBy, ...props },
    ref,
  ) {
    const ctx = useContext(FieldContext);
    const isInvalid = invalid ?? ctx?.invalid ?? false;
    return (
      <textarea
        ref={ref}
        id={id ?? ctx?.id}
        aria-invalid={ariaInvalid ?? (isInvalid ? true : undefined)}
        aria-describedby={ariaDescribedBy ?? ctx?.describedBy}
        className={cn(
          baseControl,
          'resize-none leading-relaxed',
          isInvalid ? invalidBorder : validBorder,
          className,
        )}
        {...props}
      />
    );
  },
);
