import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', onClick, hoverable = false, padding = 'md' }: CardProps) {
  const padMap = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${padMap[padding]} ${
        hoverable ? 'hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer active:scale-[0.98]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
  sub?: string;
}

export function StatCard({ label, value, icon, color = 'bg-[#2b2378]', sub }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-center gap-4">
      <div className={`${color} text-white p-3 rounded-xl shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5 font-medium truncate">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color = '#2b2378', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {children}
    </span>
  );
}
