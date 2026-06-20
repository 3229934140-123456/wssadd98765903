import { useState } from "react";
import { Thermometer, AlertCircle } from "lucide-react";
import { TemperatureRecord } from "../../types";
import { formatTime } from "../../utils/dateUtils";

interface TemperatureChartProps {
  records: TemperatureRecord[];
}

export const TemperatureChart = ({ records }: TemperatureChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minTemp = -5;
  const maxTemp = 15;

  const safeZoneMin = 0;
  const safeZoneMax = 8;

  const getX = (index: number) =>
    padding.left + (index / (records.length - 1)) * chartWidth;

  const getY = (temp: number) =>
    padding.top + ((maxTemp - temp) / (maxTemp - minTemp)) * chartHeight;

  const safeZoneY1 = getY(safeZoneMax);
  const safeZoneY2 = getY(safeZoneMin);

  const points = records
    .map((r, i) => `${getX(i)},${getY(r.temperature)}`)
    .join(" ");

  const isAbnormal = (temp: number) => temp < 0 || temp > 8;

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-cyan-400" />
          24小时温度曲线
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
            <span className="text-slate-400">安全区间 0-8℃</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span className="text-slate-400">超温点</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="safeZoneGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <rect
            x={padding.left}
            y={safeZoneY1}
            width={chartWidth}
            height={safeZoneY2 - safeZoneY1}
            fill="url(#safeZoneGradient)"
            stroke="#10B981"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {[minTemp, 0, 5, 8, maxTemp].map((temp) => (
            <g key={temp}>
              <line
                x1={padding.left}
                y1={getY(temp)}
                x2={width - padding.right}
                y2={getY(temp)}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <text
                x={padding.left - 8}
                y={getY(temp) + 4}
                fill="#64748b"
                fontSize="10"
                textAnchor="end"
              >
                {temp}℃
              </text>
            </g>
          ))}

          <polygon
            points={`${padding.left},${height - padding.bottom} ${points} ${width - padding.right},${height - padding.bottom}`}
            fill="url(#tempGradient)"
          />

          <polyline
            points={points}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {records.map((record, index) => (
            <g
              key={record.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={getX(index)}
                cy={getY(record.temperature)}
                r={isAbnormal(record.temperature) ? 6 : 4}
                fill={isAbnormal(record.temperature) ? "#EF4444" : "#06B6D4"}
                stroke={isAbnormal(record.temperature) ? "#EF4444" : "#06B6D4"}
                strokeWidth="2"
                className={`transition-all ${hoveredIndex === index ? "r-8" : ""}`}
              />
              {isAbnormal(record.temperature) && (
                <circle
                  cx={getX(index)}
                  cy={getY(record.temperature)}
                  r="10"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="1"
                  opacity="0.5"
                  className="animate-ping"
                />
              )}
            </g>
          ))}

          {records.map((record, index) => {
            if (index % 4 !== 0) return null;
            return (
              <text
                key={`label-${record.id}`}
                x={getX(index)}
                y={height - 10}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
              >
                {formatTime(record.timestamp)}
              </text>
            );
          })}
        </svg>

        {hoveredIndex !== null && records[hoveredIndex] && (
          <div
            className="absolute bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl pointer-events-none z-10"
            style={{
              left: `${(hoveredIndex / (records.length - 1)) * 100}%`,
              top: `${(getY(records[hoveredIndex].temperature) / height) * 100}%`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <div
              className={`font-mono font-bold ${
                isAbnormal(records[hoveredIndex].temperature)
                  ? "text-red-400"
                  : "text-cyan-400"
              }`}
            >
              {records[hoveredIndex].temperature}℃
            </div>
            <div className="text-slate-400 text-xs">
              {formatTime(records[hoveredIndex].timestamp)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <div className="text-slate-500">24小时前</div>
        <div className="text-slate-500">现在</div>
      </div>
    </div>
  );
};
