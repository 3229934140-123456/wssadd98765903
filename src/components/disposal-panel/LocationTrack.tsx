import { MapPin, Navigation, AlertTriangle } from "lucide-react";
import { LocationPoint } from "../../types";
import { formatTime } from "../../utils/dateUtils";

interface LocationTrackProps {
  points: LocationPoint[];
}

export const LocationTrack = ({ points }: LocationTrackProps) => {
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 20, left: 20 };

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const getX = (lng: number) =>
    padding.left +
    ((lng - minLng) / (maxLng - minLng || 1)) * (width - padding.left - padding.right);

  const getY = (lat: number) =>
    padding.top +
    ((maxLat - lat) / (maxLat - minLat || 1)) * (height - padding.top - padding.bottom);

  const pathPoints = points.map((p) => `${getX(p.lng)},${getY(p.lat)}`).join(" ");

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Navigation className="w-5 h-5 text-emerald-400" />
        运输轨迹
      </h3>

      <div className="relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="1" />
          </pattern>
          <rect
            x={padding.left}
            y={padding.top}
            width={width - padding.left - padding.right}
            height={height - padding.top - padding.bottom}
            fill="url(#grid)"
            rx="8"
          />

          <polyline
            points={pathPoints}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {points.map((point, index) => (
            <g key={point.id}>
              {point.hasDoorEvent && (
                <>
                  <circle
                    cx={getX(point.lng)}
                    cy={getY(point.lat)}
                    r="12"
                    fill="#EF4444"
                    opacity="0.3"
                    className="animate-ping"
                  />
                  <circle
                    cx={getX(point.lng)}
                    cy={getY(point.lat)}
                    r="8"
                    fill="#EF4444"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <AlertTriangle
                    x={getX(point.lng) - 5}
                    y={getY(point.lat) - 5}
                    width="10"
                    height="10"
                    fill="#fff"
                  />
                </>
              )}
              {!point.hasDoorEvent && index < points.length - 1 && (
                <circle
                  cx={getX(point.lng)}
                  cy={getY(point.lat)}
                  r="4"
                  fill="#3B82F6"
                  stroke="#1E40AF"
                  strokeWidth="1"
                />
              )}
              {index === points.length - 1 && (
                <>
                  <circle
                    cx={getX(point.lng)}
                    cy={getY(point.lat)}
                    r="10"
                    fill="#10B981"
                    opacity="0.3"
                    className="animate-ping"
                  />
                  <circle
                    cx={getX(point.lng)}
                    cy={getY(point.lat)}
                    r="8"
                    fill="#10B981"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <Navigation
                    x={getX(point.lng) - 5}
                    y={getY(point.lat) - 5}
                    width="10"
                    height="10"
                    fill="#fff"
                  />
                </>
              )}
              {index === 0 && (
                <>
                  <circle
                    cx={getX(point.lng)}
                    cy={getY(point.lat)}
                    r="8"
                    fill="#F59E0B"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                </>
              )}

              <text
                x={getX(point.lng)}
                y={getY(point.lat) - 15}
                fill="#94A3B8"
                fontSize="10"
                textAnchor="middle"
              >
                {point.locationName}
              </text>
              <text
                x={getX(point.lng)}
                y={getY(point.lat) + 20}
                fill="#64748B"
                fontSize="9"
                textAnchor="middle"
              >
                {formatTime(point.timestamp)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-400">起点</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-400">当前位置</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-400">门开事件</span>
          </div>
        </div>
        <div className="text-slate-500">{points.length} 个途经点</div>
      </div>

      <div className="mt-3 space-y-2">
        {points.filter((p) => p.hasDoorEvent).map((point) => (
          <div
            key={point.id}
            className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-white text-sm">{point.locationName}</div>
              <div className="text-slate-400 text-xs">
                {formatTime(point.timestamp)} · 检测到车门打开事件
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
