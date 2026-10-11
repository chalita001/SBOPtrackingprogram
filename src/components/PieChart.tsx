import React from 'react';

export interface PieChartSlice {
  label: string;
  value: number;
  color: string;
  badgeBg?: string;
  badgeText?: string;
}

interface PieChartProps {
  data: PieChartSlice[];
  title?: string;
  subtitle?: string;
  centerValue?: string;
  centerLabel?: string;
  size?: number;
  donutWidth?: number;
  emptyText?: string;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  subtitle,
  centerValue,
  centerLabel,
  size = 140,
  donutWidth = 20,
  emptyText = 'ไม่มีข้อมูล',
  className = '',
}) => {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const radius = (size - donutWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cumulativePercent = 0;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs ${className}`}>
      {/* Chart Circle */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={donutWidth}
          />

          {total === 0 ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth={donutWidth}
              strokeDasharray={circumference}
            />
          ) : (
            data.map((slice, index) => {
              if (!slice.value || slice.value <= 0) return null;
              const percent = (slice.value / total) * 100;
              const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += percent;

              return (
                <circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={donutWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-500 hover:opacity-90 cursor-pointer"
                />
              );
            })
          )}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          {total === 0 ? (
            <span className="text-[11px] font-bold text-slate-400">{emptyText}</span>
          ) : (
            <>
              {centerValue && (
                <span className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                  {centerValue}
                </span>
              )}
              {centerLabel && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {centerLabel}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend & Details */}
      <div className="flex-1 w-full space-y-2">
        {(title || subtitle) && (
          <div className="border-b border-slate-100 pb-1.5">
            {title && <h4 className="text-xs font-bold text-slate-800">{title}</h4>}
            {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          {data.map((slice, i) => {
            const pct = total > 0 ? ((slice.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-slate-600 font-medium truncate max-w-[120px] sm:max-w-none">
                    {slice.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-right font-bold text-slate-900 ml-2">
                  <span>{slice.value}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
