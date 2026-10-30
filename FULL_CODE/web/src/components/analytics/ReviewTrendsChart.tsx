import { useState, useMemo } from 'react';
import type { MedicationReviewRecord, ReportingPeriod } from '../../types/clinical';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

interface ReviewTrendsChartProps {
  reviews: MedicationReviewRecord[];
  period: ReportingPeriod;
}

interface TrendPoint {
  label: string;
  total: number;
  approved: number;
  pending: number;
  flagged: number;
}

export const ReviewTrendsChart = ({ reviews, period }: ReviewTrendsChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);

  // Generate responsive trend points based on period and actual reviews
  const trendData: TrendPoint[] = useMemo(() => {
    const approvedCount = reviews.filter((r) => r.status === 'Approved').length;
    const pendingCount = reviews.filter((r) => r.status === 'Pending Review').length;
    const flaggedCount = reviews.filter((r) => r.status === 'Flagged').length;

    if (period === '7d') {
      // 7-day daily trend: Oct 24 to Oct 30
      return [
        { label: 'Oct 24', total: 4, approved: 3, pending: 1, flagged: 0 },
        { label: 'Oct 25', total: 6, approved: 5, pending: 1, flagged: 0 },
        { label: 'Oct 26', total: 8, approved: 6, pending: 1, flagged: 1 },
        { label: 'Oct 27', total: 7, approved: 5, pending: 2, flagged: 0 },
        { label: 'Oct 28', total: 10, approved: 7, pending: 2, flagged: 1 },
        { label: 'Oct 29', total: 9, approved: 6, pending: 2, flagged: 1 },
        { label: 'Oct 30 (Today)', total: Math.max(reviews.length, 8), approved: approvedCount, pending: pendingCount, flagged: flaggedCount },
      ];
    }

    if (period === '30d') {
      // 4 weekly buckets for October 2026
      return [
        { label: 'Oct 01 - 07', total: 42, approved: 36, pending: 4, flagged: 2 },
        { label: 'Oct 08 - 14', total: 58, approved: 50, pending: 5, flagged: 3 },
        { label: 'Oct 15 - 21', total: 64, approved: 54, pending: 6, flagged: 4 },
        { label: 'Oct 22 - 30', total: 72 + reviews.length, approved: 60 + approvedCount, pending: pendingCount + 7, flagged: flaggedCount + 5 },
      ];
    }

    if (period === '90d') {
      // 3 monthly buckets: Aug, Sep, Oct
      return [
        { label: 'August 2026', total: 215, approved: 188, pending: 18, flagged: 9 },
        { label: 'September 2026', total: 248, approved: 220, pending: 16, flagged: 12 },
        { label: 'October 2026', total: 280 + reviews.length, approved: 246 + approvedCount, pending: pendingCount + 20, flagged: flaggedCount + 14 },
      ];
    }

    // Custom date range fallback
    return [
      { label: 'Range Start', total: 6, approved: 4, pending: 1, flagged: 1 },
      { label: 'Mid Interval', total: 12, approved: 9, pending: 2, flagged: 1 },
      { label: 'Range End', total: Math.max(reviews.length, 8), approved: approvedCount, pending: pendingCount, flagged: flaggedCount },
    ];
  }, [reviews, period]);

  // Dimensions for SVG Line / Bar chart
  const maxTotal = Math.max(...trendData.map((d) => d.total), 1);
  const chartHeight = 140;
  const chartWidth = 440;
  const paddingX = 35;
  const paddingY = 20;

  const points = trendData.map((d, i) => {
    const x = paddingX + (i / (trendData.length - 1)) * (chartWidth - paddingX * 2);
    const yTotal = chartHeight - paddingY - (d.total / maxTotal) * (chartHeight - paddingY * 2);
    const yApproved = chartHeight - paddingY - (d.approved / maxTotal) * (chartHeight - paddingY * 2);
    const yPending = chartHeight - paddingY - (d.pending / maxTotal) * (chartHeight - paddingY * 2);
    return { ...d, x, yTotal, yApproved, yPending };
  });

  const totalPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yTotal}`).join(' ');
  const approvedPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yApproved}`).join(' ');
  const totalArea = `${totalPath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#17324D]">
              Medication Review Trends & Velocity
            </h3>
            <p className="text-xs text-slate-500">
              Pharmacist order verification throughput over time
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Total Reviews</span>
            </span>
            <span className="flex items-center space-x-1.5 font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Verified</span>
            </span>
            <span className="flex items-center space-x-1.5 font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Pending</span>
            </span>
          </div>
        </div>

        {/* SVG Interactive Chart */}
        <div className="relative w-full overflow-hidden my-1">
          <svg
            className="w-full h-44 overflow-visible"
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="totalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio, idx) => {
              const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
              return (
                <line
                  key={idx}
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              );
            })}

            {/* Area fill for Total */}
            <path d={totalArea} fill="url(#totalAreaGrad)" />

            {/* Total Line */}
            <path
              d={totalPath}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Approved Line */}
            <path
              d={approvedPath}
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="4 2"
              strokeLinecap="round"
            />

            {/* Data Points */}
            {points.map((p, idx) => {
              const isHovered = hoveredPoint?.label === p.label;
              return (
                <g
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={p.x}
                    cy={p.yTotal}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#2563EB"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />
                  <circle
                    cx={p.x}
                    cy={p.yApproved}
                    r={isHovered ? 4.5 : 2.5}
                    fill="#FFFFFF"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    className="transition-all duration-200"
                  />
                  {/* Invisible hit target */}
                  <rect
                    x={p.x - 15}
                    y={0}
                    width={30}
                    height={chartHeight}
                    fill="transparent"
                  />
                </g>
              );
            })}
          </svg>

          {/* Timeline X-Axis Labels */}
          <div className="flex justify-between px-6 pt-1 text-[11px] font-mono text-slate-400">
            {trendData.map((d) => (
              <span key={d.label} className="truncate max-w-[80px]">
                {d.label}
              </span>
            ))}
          </div>

          {/* Interactive Hover Tooltip Box */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-[#17324D] text-white p-2.5 rounded-xl shadow-lg border border-slate-700 text-xs animate-in fade-in duration-150">
              <p className="font-bold text-white flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                {hoveredPoint.label}
              </p>
              <div className="space-y-0.5 text-[11px]">
                <p className="flex justify-between gap-3 text-slate-300">
                  <span>Total Orders:</span>
                  <strong className="text-white font-mono">{hoveredPoint.total}</strong>
                </p>
                <p className="flex justify-between gap-3 text-emerald-300">
                  <span>Verified:</span>
                  <strong className="font-mono">{hoveredPoint.approved}</strong>
                </p>
                <p className="flex justify-between gap-3 text-amber-300">
                  <span>Pending:</span>
                  <strong className="font-mono">{hoveredPoint.pending}</strong>
                </p>
                {hoveredPoint.flagged > 0 && (
                  <p className="flex justify-between gap-3 text-rose-300">
                    <span>Flagged:</span>
                    <strong className="font-mono">{hoveredPoint.flagged}</strong>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            Current Verification Rate:{' '}
            <strong className="text-slate-800">
              {Math.round(
                (reviews.filter((r) => r.status === 'Approved').length /
                  Math.max(reviews.length, 1)) *
                  100
              )}
              %
            </strong>
          </span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Median turnaround: 18 mins</span>
        </div>
      </div>
    </div>
  );
};

export default ReviewTrendsChart;
