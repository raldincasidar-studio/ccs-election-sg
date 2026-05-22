import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-gray-400 pointer-events-none">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition-all duration-150
              placeholder:text-gray-400 placeholder:font-normal
              focus:outline-none focus:ring-2 focus:ring-[#2b2378]/30 focus:border-[#2b2378]
              disabled:opacity-60 disabled:bg-gray-50
              ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 hover:border-gray-300'}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}`}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-gray-400">{rightIcon}</span>
          )}
        </div>
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, hint, options, className = '', id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={`w-full rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-[#2b2378]/30 focus:border-[#2b2378]
          disabled:opacity-60 disabled:bg-gray-50
          ${error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}
          ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
}

export function TextArea({ label, error, hint, rows = 3, className = '', id, ...props }: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition-all duration-150 resize-none
          placeholder:text-gray-400 placeholder:font-normal
          focus:outline-none focus:ring-2 focus:ring-[#2b2378]/30 focus:border-[#2b2378]
          ${error ? 'border-red-400' : 'border-gray-200 hover:border-gray-300'}
          ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
