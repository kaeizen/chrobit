import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white',
  ghost: 'bg-transparent hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300',
  danger: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white',
  outline: 'border border-zinc-700 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-200',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-base rounded-xl',
  lg: 'px-6 py-4 text-lg rounded-2xl',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: Props) {
  return (
    <button
      {...props}
      className={`font-semibold transition-colors duration-100 disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}
