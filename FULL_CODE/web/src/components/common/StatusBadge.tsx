import React from 'react';

export type BadgeVariant = 'online' | 'offline' | 'pending' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: BadgeVariant;
  label: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, dot = true }) => {
  const styles: Record<BadgeVariant, { bg: string; text: string; dotColor: string; border: string }> = {
    online: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      dotColor: 'bg-emerald-600',
      border: 'border-emerald-200',
    },
    offline: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      dotColor: 'bg-rose-600',
      border: 'border-rose-200',
    },
    pending: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      dotColor: 'bg-amber-600',
      border: 'border-amber-200',
    },
    info: {
      bg: 'bg-[#168C83]/10',
      text: 'text-[#168C83]',
      dotColor: 'bg-[#168C83]',
      border: 'border-[#168C83]/30',
    },
    neutral: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      dotColor: 'bg-slate-400',
      border: 'border-slate-200',
    },
  };

  const current = styles[status] || styles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`} />}
      {label}
    </span>
  );
};
