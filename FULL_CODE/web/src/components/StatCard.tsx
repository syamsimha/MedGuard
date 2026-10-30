import type { ReactNode } from 'react';
import type { StatCardData } from '../types/clinical';

interface StatCardProps {
  data: StatCardData;
  icon?: ReactNode;
}

export const StatCard = ({ data, icon }: StatCardProps) => {
  const getVariantStyles = (variant: StatCardData['variant']) => {
    switch (variant) {
      case 'success':
        return {
          iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          accentBorder: 'border-l-4 border-l-emerald-500',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          accentBorder: 'border-l-4 border-l-amber-500',
        };
      case 'danger':
        return {
          iconBg: 'bg-rose-50 text-rose-700 border-rose-100',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          accentBorder: 'border-l-4 border-l-rose-500',
        };
      default:
        return {
          iconBg: 'bg-blue-50 text-[#17324D] border-blue-100',
          badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
          accentBorder: 'border-l-4 border-l-[#168C83]',
        };
    }
  };

  const styles = getVariantStyles(data.variant);

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm transition-all duration-150 flex flex-col justify-between ${styles.accentBorder}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {data.title}
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#17324D]">
            {data.value}
          </div>
        </div>

        {icon && (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${styles.iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="truncate mr-2 font-medium">{data.changeLabel}</span>
        {data.badge && (
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-medium border shrink-0 ${styles.badgeBg}`}
          >
            {data.badge}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
