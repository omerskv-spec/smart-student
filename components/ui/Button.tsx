import { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
        variant === 'primary' && 'bg-purple-600 hover:bg-purple-700 text-white',
        variant === 'secondary' && 'bg-purple-100 hover:bg-purple-200 text-purple-900',
        variant === 'ghost' && 'bg-transparent hover:bg-purple-50 text-[var(--muted)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
