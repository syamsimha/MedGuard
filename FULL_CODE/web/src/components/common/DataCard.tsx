import React from 'react';

interface DataCardProps {
  title: string;
  subtitle?: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  statusBadge?: React.ReactNode;
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  subtitle,
  value,
  icon,
  footer,
  statusBadge,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon && <div className="text-slate-500">{icon}</div>}
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </span>
          </div>
          {statusBadge && <div>{statusBadge}</div>}
        </div>

        <div className="mt-1 text-xl font-semibold text-[#17324D]">{value}</div>

        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>

      {footer && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};
