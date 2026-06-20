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
  Phone,
  PhoneCall,
  Warehouse,
  MessageSquare,
  FileText,
} from "lucide-react";
import {
  DoorEvent,
  TemperatureRecord,
  LocationPoint,
  Alarm,
  DriverReport,
  DisposalAction,
} from "../../types";
import { formatDateTime } from "../../utils/dateUtils";
import { getAlarmStatusLabel, getAlarmStatusColor } from "../../utils/statusUtils";

interface IncidentReviewProps {
  events: DoorEvent[];
  tempRecords: TemperatureRecord[];
  locations: LocationPoint[];
  alarm: Alarm | undefined;
  driverReports: DriverReport[];
  disposalActions: DisposalAction[];
}

type TimelineItem = {
  id: string;
  timestamp: string;
  type:
    | "door"
    | "temperature"
    | "location"
    | "driver_report"
    | "disposal_action"
    | "alarm_action";
  icon: React.ReactNode;
  label: string;
  detail: string;
  location: string;
  severity: "normal" | "warning" | "critical";
  operator?: string;
};

export const IncidentReview = ({
  events,
  tempRecords,
  locations,
  alarm,
  driverReports,
  disposalActions,
}: IncidentReviewProps) => {
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

  driverReports.forEach((report) => {
    timelineItems.push({
      id: report.id,
      timestamp: report.timestamp,
      type: "driver_report",
      icon: <FileText className="w-4 h-4 text-cyan-400" />,
      label: "司机上报",
      detail: report.content,
      location: "",
      severity: report.abnormal === "YES" ? "warning" : "normal",
      operator: "司机",
    });
  });

  disposalActions.forEach((action) => {
    let icon: React.ReactNode;
    let label: string;
    switch (action.actionType) {
      case "CALL_DRIVER":
        icon = <Phone className="w-4 h-4 text-blue-400" />;
        label = "拨打司机电话";
        break;
      case "NOTIFY_WAREHOUSE":
        icon = <Warehouse className="w-4 h-4 text-purple-400" />;
        label = "通知仓库值班人";
        break;
      case "SEND_MESSAGE":
        icon = <MessageSquare className="w-4 h-4 text-cyan-400" />;
        label = "发送通知消息";
        break;
      default:
        icon = <PhoneCall className="w-4 h-4 text-slate-400" />;
        label = "处置操作";
    }
    timelineItems.push({
      id: action.id,
      timestamp: action.timestamp,
      type: "disposal_action",
      icon,
      label,
      detail: action.detail,
      location: "",
      severity: "normal",
      operator: action.operator,
    });
  });

  if (alarm && alarm.status !== "PENDING_VERIFY") {
    timelineItems.push({
      id: `${alarm.id}-status`,
      timestamp: alarm.createdAt,
      type: "alarm_action",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      label: `标记为${getAlarmStatusLabel(alarm.status)}`,
      detail: alarm.remark || `告警状态更新为：${getAlarmStatusLabel(alarm.status)}`,
      location: "",
      severity: "normal",
      operator: alarm.handler || "调度员",
    });
  }

  timelineItems.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const firstAbnormalItem = timelineItems.find((item) => item.severity === "critical");
  const latestItem = timelineItems[timelineItems.length - 1];
  const lastCriticalItem = [...timelineItems]
    .reverse()
    .find((item) => item.severity === "critical");

  const getDuration = () => {
    if (!firstAbnormalItem) return null;
    const start = new Date(firstAbnormalItem.timestamp).getTime();
    const endAnchor = alarm && alarm.status !== "PENDING_VERIFY" && latestItem
      ? new Date(latestItem.timestamp).getTime()
      : Date.now();
    const diffMs = endAnchor - start;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const durationIsClosed =
    !!alarm && alarm.status !== "PENDING_VERIFY" && !!latestItem;

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
      case "driver_report":
        return { label: "司机", bg: "bg-cyan-500/20", text: "text-cyan-400" };
      case "disposal_action":
        return { label: "处置", bg: "bg-purple-500/20", text: "text-purple-400" };
      case "alarm_action":
        return { label: "状态", bg: "bg-emerald-500/20", text: "text-emerald-400" };
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
            <div className="text-slate-400 text-xs mb-1">
              持续时间{durationIsClosed ? "(已截止)" : "（进行中）"}
            </div>
            <div
              className={`text-sm font-bold font-mono ${
                durationIsClosed ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {getDuration() || "--"}
            </div>
            <div className="text-slate-500 text-xs mt-1">
              {durationIsClosed
                ? `从首次异常→${latestItem ? latestItem.label : "最新节点"}`
                : "从首次异常至今"}
            </div>
          </div>
          <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <div className="text-slate-400 text-xs mb-1">处置进度</div>
            {alarm ? (
              <>
                <div
                  className="text-sm font-bold"
                  style={{ color: getAlarmStatusColor(alarm.status) }}
                >
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

        <div className="grid grid-cols-4 gap-3 text-xs mb-4 pb-3 border-b border-slate-700">
          <div className="p-2 bg-slate-700/20 rounded">
            <div className="flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              门磁
            </div>
            <span className="text-white font-bold">
              {timelineItems.filter((i) => i.type === "door").length}
            </span>
          </div>
          <div className="p-2 bg-slate-700/20 rounded">
            <div className="flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              温度
            </div>
            <span className="text-white font-bold">
              {timelineItems.filter((i) => i.type === "temperature").length}
            </span>
          </div>
          <div className="p-2 bg-slate-700/20 rounded">
            <div className="flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              司机/处置
            </div>
            <span className="text-white font-bold">
              {timelineItems.filter(
                (i) => i.type === "driver_report" || i.type === "disposal_action"
              ).length}
            </span>
          </div>
          <div className="p-2 bg-slate-700/20 rounded">
            <div className="flex items-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              状态节点
            </div>
            <span className="text-white font-bold">
              {timelineItems.filter((i) => i.type === "alarm_action").length || (alarm ? 1 : 0)}
            </span>
          </div>
        </div>

        {lastCriticalItem && firstAbnormalItem && lastCriticalItem.id !== firstAbnormalItem.id && (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>最新关键事件：</span>
            <span className="text-red-300">{lastCriticalItem.label}</span>
            <span>·</span>
            <span className="font-mono">{formatDateTime(lastCriticalItem.timestamp)}</span>
          </div>
        )}
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4">
        <h4 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          事件复盘时间线（最早 → 当前）
        </h4>
        {timelineItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            暂无事件数据
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
            <div className="space-y-3">
              {timelineItems.map((item, index) => {
                const badge = getTypeBadge(item.type);
                const isFirst = index === 0;
                const isLast = index === timelineItems.length - 1;
                return (
                  <div key={item.id} className="relative pl-10">
                    <div
                      className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${getSeverityStyle(
                        item.severity
                      )} ${
                        item.severity === "critical" ? "animate-pulse" : ""
                      } ${isFirst ? "ring-2 ring-emerald-500/30" : ""} ${
                        isLast ? "ring-2 ring-cyan-500/30" : ""
                      }`}
                    >
                      {item.icon}
                    </div>
                    {isFirst && (
                      <div className="absolute left-2 -top-1 -translate-x-0.5 -translate-y-full">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium whitespace-nowrap">
                          起点
                        </span>
                      </div>
                    )}
                    {isLast && (
                      <div className="absolute left-2 -bottom-1 -translate-x-0.5 translate-y-full">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-medium whitespace-nowrap">
                          {durationIsClosed ? "已截止" : "当前"}
                        </span>
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-lg border ${getSeverityStyle(item.severity)} ${
                        isLast ? "ring-2 ring-cyan-500/50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded font-medium ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-white font-medium text-sm">{item.label}</span>
                          {item.operator && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600/30 text-slate-300">
                              {item.operator}
                            </span>
                          )}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
