import {
  DoorOpen,
  DoorClosed,
  AlertTriangle,
  WifiOff,
  Thermometer,
  MapPin,
  Clock,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { DoorEvent, TemperatureRecord, LocationPoint, Alarm } from "../../types";
import { formatDateTime } from "../../utils/dateUtils";
import { getAlarmStatusLabel, getAlarmStatusColor } from "../../utils/statusUtils";

interface IncidentReviewProps {
  events: DoorEvent[];
  tempRecords: TemperatureRecord[];
  locations: LocationPoint[];
  alarm: Alarm | undefined;
}

type TimelineItem = {
  id: string;
  timestamp: string;
  type: "door" | "temperature" | "location";
  icon: React.ReactNode;
  label: string;
  detail: string;
  location: string;
  severity: "normal" | "warning" | "critical";
};

export const IncidentReview = ({ events, tempRecords, locations, alarm }: IncidentReviewProps) => {
  const isTempAbnormal = (temp: number) => temp > 8 || temp < 0;

  const abnormalTempRecords = tempRecords.filter((r) => isTempAbnormal(r.temperature));

  const timelineItems: TimelineItem[] = [];

  events.forEach((event) => {
    let icon: React.ReactNode;
    let label: string;
    let severity: "normal" | "warning" | "critical" = "normal";

    switch (event.eventType) {
      case "OPEN":
        icon = <DoorOpen className="w-4 h-4 text-amber-400" />;
        label = "车门打开";
        severity = "warning";
        break;
      case "CLOSE":
        icon = <DoorClosed className="w-4 h-4 text-emerald-400" />;
        label = "车门关闭";
        severity = "normal";
        break;
      case "ABNORMAL":
        icon = <AlertTriangle className="w-4 h-4 text-red-400" />;
        label = "门磁异常";
        severity = "critical";
        break;
      case "OFFLINE":
        icon = <WifiOff className="w-4 h-4 text-gray-400" />;
        label = "门磁离线";
        severity = "critical";
        break;
      default:
        icon = <Clock className="w-4 h-4 text-slate-400" />;
        label = "未知事件";
    }

    timelineItems.push({
      id: event.id,
      timestamp: event.timestamp,
      type: "door",
      icon,
      label,
      detail: event.description,
      location: event.location,
      severity,
    });
  });

  abnormalTempRecords.forEach((record) => {
    timelineItems.push({
      id: record.id,
      timestamp: record.timestamp,
      type: "temperature",
      icon: <Thermometer className="w-4 h-4 text-red-400" />,
      label: `温度异常 ${record.temperature}℃`,
      detail: `车厢温度 ${record.temperature}℃，超出安全范围 0-8℃`,
      location: "",
      severity: "critical",
    });
  });

  locations
    .filter((loc) => loc.hasDoorEvent)
    .forEach((loc) => {
      timelineItems.push({
        id: loc.id,
        timestamp: loc.timestamp,
        type: "location",
        icon: <MapPin className="w-4 h-4 text-orange-400" />,
        label: `途经 ${loc.locationName}`,
        detail: "该位置附近有门磁事件",
        location: loc.locationName,
        severity: "warning",
      });
    });

  timelineItems.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const firstAbnormalItem = [...timelineItems].reverse().find((item) => item.severity === "critical");
  const latestItem = timelineItems[0];

  const getDuration = () => {
    if (!firstAbnormalItem || !latestItem) return null;
    const start = new Date(firstAbnormalItem.timestamp).getTime();
    const end = new Date(latestItem.timestamp).getTime();
    const diffMs = end - start;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 border-red-500/30";
      case "warning":
        return "bg-amber-500/20 border-amber-500/30";
      default:
        return "bg-slate-700/30 border-slate-600/30";
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "door":
        return { label: "门磁", bg: "bg-blue-500/20", text: "text-blue-400" };
      case "temperature":
        return { label: "温度", bg: "bg-red-500/20", text: "text-red-400" };
      case "location":
        return { label: "位置", bg: "bg-orange-500/20", text: "text-orange-400" };
      default:
        return { label: "其他", bg: "bg-slate-500/20", text: "text-slate-400" };
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          异常复盘
        </h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <div className="text-slate-400 text-xs mb-1">异常起始</div>
            <div className="text-white text-sm font-medium font-mono">
              {firstAbnormalItem ? formatDateTime(firstAbnormalItem.timestamp) : "--"}
            </div>
            {firstAbnormalItem && (
              <div className="text-red-400 text-xs mt-1">{firstAbnormalItem.label}</div>
            )}
          </div>
          <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <div className="text-slate-400 text-xs mb-1">持续时间</div>
            <div className="text-amber-400 text-sm font-bold font-mono">
              {getDuration() || "--"}
            </div>
            <div className="text-slate-500 text-xs mt-1">从首次异常至今</div>
          </div>
          <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <div className="text-slate-400 text-xs mb-1">处置进度</div>
            {alarm ? (
              <>
                <div className="text-sm font-bold" style={{ color: getAlarmStatusColor(alarm.status) }}>
                  {getAlarmStatusLabel(alarm.status)}
                </div>
                {alarm.handler && (
                  <div className="text-slate-500 text-xs mt-1">处理人：{alarm.handler}</div>
                )}
              </>
            ) : (
              <div className="text-slate-500 text-sm">暂无告警</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs mb-4 pb-3 border-b border-slate-700">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> 门磁
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> 温度
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> 位置
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> 处置
          </span>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4">
        <h4 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          事件复盘时间线
        </h4>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
          <div className="space-y-3">
            {timelineItems.map((item, index) => {
              const badge = getTypeBadge(item.type);
              return (
                <div key={item.id} className="relative pl-10">
                  <div
                    className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${getSeverityStyle(item.severity)} ${
                      item.severity === "critical" ? "animate-pulse" : ""
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div
                    className={`p-3 rounded-lg border ${getSeverityStyle(item.severity)} ${
                      index === 0 ? "ring-2 ring-cyan-500/50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <span className="text-white font-medium text-sm">{item.label}</span>
                      </div>
                      <span className="text-slate-400 text-xs font-mono">
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mb-1">{item.detail}</p>
                    {item.location && (
                      <p className="text-slate-500 text-xs">📍 {item.location}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {alarm && alarm.status !== "PENDING_VERIFY" && (
              <div className="relative pl-10">
                <div className="absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-emerald-500/20 border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium text-sm">
                      已{getAlarmStatusLabel(alarm.status)}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">
                      {alarm.handler ? `处理人：${alarm.handler}` : ""}
                    </span>
                  </div>
                  {alarm.remark && (
                    <p className="text-slate-300 text-sm">{alarm.remark}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
