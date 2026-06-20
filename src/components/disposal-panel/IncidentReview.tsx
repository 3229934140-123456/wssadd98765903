import { useState } from "react";
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
  XCircle,
  Phone,
  Warehouse,
  MessageSquare,
  FileText,
  RefreshCw,
  Bell,
  BellOff,
  BellRing,
  Megaphone,
  UserCheck,
  DoorClosed as DoorClosedIcon,
  ChevronDown,
  ChevronRight,
  Copy,
  Layers,
  List,
} from "lucide-react";
import {
  DoorEvent,
  TemperatureRecord,
  LocationPoint,
  Alarm,
  DriverReport,
  DisposalAction,
  Vehicle,
} from "../../types";
import { formatDateTime } from "../../utils/dateUtils";
import {
  getAlarmStatusLabel,
  getAlarmStatusColor,
  getAbnormalTypeLabel,
} from "../../utils/statusUtils";
import { PhaseKey, PHASE_DEFS, PHASE_ORDER, getPhaseForItem } from "./phaseConfig";

interface IncidentReviewProps {
  events: DoorEvent[];
  tempRecords: TemperatureRecord[];
  locations: LocationPoint[];
  alarm: Alarm | undefined;
  driverReports: DriverReport[];
  disposalActions: DisposalAction[];
  vehicle: Vehicle | undefined;
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
  actionType?: string;
  subType?: string;
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

const formatDuration = (items: TimelineItem[]): string | null => {
  if (items.length < 2) return null;
  const start = new Date(items[0].timestamp).getTime();
  const end = new Date(items[items.length - 1].timestamp).getTime();
  const diffMs = Math.max(0, end - start);
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
};

const getOperators = (items: TimelineItem[]): string[] => {
  const set = new Set<string>();
  for (const item of items) {
    if (item.operator) set.add(item.operator);
  }
  return Array.from(set);
};

const renderTimelineItem = (item: TimelineItem, index: number, total: number) => {
  const badge = getTypeBadge(item.type);
  const isFirst = index === 0;
  const isLast = index === total - 1;
  return (
    <div key={item.id} className="relative pl-10">
      <div
        className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${getSeverityStyle(
          item.severity
        )} ${item.severity === "critical" ? "animate-pulse" : ""} ${
          isFirst ? "ring-2 ring-emerald-500/30" : ""
        } ${isLast ? "ring-2 ring-cyan-500/30" : ""}`}
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
            当前
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
};

export const IncidentReview = ({
  events,
  tempRecords,
  locations,
  alarm,
  driverReports,
  disposalActions,
  vehicle,
}: IncidentReviewProps) => {
  const [viewMode, setViewMode] = useState<"phase" | "timeline">("phase");
  const [collapsedPhases, setCollapsedPhases] = useState<Set<PhaseKey>>(new Set());

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
      actionType: "DRIVER_REPORT",
    });
  });

  disposalActions.forEach((action) => {
    let icon: React.ReactNode;
    let label: string;
    let severity: "normal" | "warning" | "critical" = "normal";
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
      case "STATUS_CHANGE": {
        const status = action.subType as any;
        if (status === "FALSE_ALARM") {
          icon = <XCircle className="w-4 h-4 text-gray-400" />;
        } else if (status === "NEED_QC") {
          icon = <AlertTriangle className="w-4 h-4 text-orange-400" />;
          severity = "warning";
        } else {
          icon = <RefreshCw className="w-4 h-4 text-emerald-400" />;
        }
        label = "状态变更";
        break;
      }
      case "REMINDER_CHANGE": {
        const kind = action.subType;
        if (kind === "CLEARED") {
          icon = <BellOff className="w-4 h-4 text-slate-400" />;
        } else if (kind === "CHANGED") {
          icon = <BellRing className="w-4 h-4 text-blue-400" />;
        } else if (kind === "KEPT") {
          icon = <BellRing className="w-4 h-4 text-emerald-400" />;
        } else {
          icon = <Bell className="w-4 h-4 text-cyan-400" />;
        }
        label = "提醒变更";
        break;
      }
      case "FOLLOW_UP": {
        const result = action.subType;
        if (result === "URGED") {
          icon = <Megaphone className="w-4 h-4 text-orange-400" />;
          severity = "warning";
        } else if (result === "ON_SITE") {
          icon = <UserCheck className="w-4 h-4 text-blue-400" />;
        } else if (result === "CLOSED") {
          icon = <DoorClosedIcon className="w-4 h-4 text-emerald-400" />;
        } else {
          icon = <MessageSquare className="w-4 h-4 text-cyan-400" />;
        }
        label = "跟进登记";
        break;
      }
      default:
        icon = <RefreshCw className="w-4 h-4 text-slate-400" />;
        label = "处置操作";
    }
    timelineItems.push({
      id: action.id,
      timestamp: action.timestamp,
      type: action.actionType === "STATUS_CHANGE" ? "alarm_action" : "disposal_action",
      icon,
      label,
      detail: action.detail,
      location: "",
      severity,
      operator: action.operator,
      actionType: action.actionType,
      subType: action.subType,
    });
  });

  if (
    alarm &&
    !disposalActions.some(
      (a) => a.actionType === "STATUS_CHANGE" && a.alarmId === alarm.id
    )
  ) {
    timelineItems.push({
      id: `${alarm.id}-status`,
      timestamp: alarm.createdAt,
      type: "alarm_action",
      icon:
        alarm.status === "FALSE_ALARM" ? (
          <XCircle className="w-4 h-4 text-gray-400" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ),
      label: `标记为${getAlarmStatusLabel(alarm.status)}`,
      detail: alarm.remark || `告警状态更新为：${getAlarmStatusLabel(alarm.status)}`,
      location: "",
      severity: "normal",
      operator: alarm.handler || "调度员",
      actionType: "STATUS_CHANGE",
      subType: alarm.status,
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

  const closingDisposal = [...disposalActions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .find(
      (a) =>
        (a.actionType === "FOLLOW_UP" && a.subType === "CLOSED") ||
        (a.actionType === "STATUS_CHANGE" &&
          (a.subType === "FALSE_ALARM" ||
            a.subType === "CONTACTED" ||
            a.subType === "NEED_QC"))
    );

  const latestDisposalItem = [...timelineItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .find((i) => i.type === "alarm_action" || i.type === "disposal_action");

  const durationIsClosed =
    !!closingDisposal || (!!alarm && alarm.status === "FALSE_ALARM");

  const getDuration = () => {
    if (!firstAbnormalItem) return null;
    const start = new Date(firstAbnormalItem.timestamp).getTime();
    const endAnchor =
      durationIsClosed && latestDisposalItem
        ? new Date(latestDisposalItem.timestamp).getTime()
        : Date.now();
    const diffMs = Math.max(0, endAnchor - start);
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const phaseGroups = (() => {
    const groups: Record<PhaseKey, TimelineItem[]> = {
      discovery: [],
      contact: [],
      qc_transfer: [],
      urge: [],
      close: [],
    };
    let lastPhase: PhaseKey = "discovery";
    for (const item of timelineItems) {
      let phase = getPhaseForItem(item.type, item.actionType, item.subType);
      if (!phase) phase = lastPhase;
      lastPhase = phase;
      groups[phase].push(item);
    }
    return groups;
  })();

  const togglePhase = (key: PhaseKey) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const exportReviewChain = () => {
    const lines: string[] = [];
    lines.push("异常复盘报告");
    lines.push("══════════════════════════════════");
    if (vehicle) {
      lines.push(
        `车辆：${vehicle.plateNumber} | 车次：${vehicle.tripNo} | 司机：${vehicle.driverName}`
      );
    }
    if (alarm) {
      lines.push(`告警类型：${getAbnormalTypeLabel(alarm.abnormalType)}`);
      lines.push(`告警状态：${getAlarmStatusLabel(alarm.status)}`);
      lines.push(`创建时间：${formatDateTime(alarm.createdAt)}`);
    }
    lines.push("──────────────────────────────────");
    for (const key of PHASE_ORDER) {
      const items = phaseGroups[key];
      if (items.length === 0) continue;
      const def = PHASE_DEFS[key];
      const duration = formatDuration(items);
      const operators = getOperators(items);
      const durationStr = duration ? ` | 持续: ${duration}` : "";
      const operatorStr =
        operators.length > 0 ? ` | 负责人: ${operators.join(", ")}` : "";
      lines.push(`【${def.label}】${items.length}条记录${durationStr}${operatorStr}`);
      for (const item of items) {
        lines.push(
          `  ${formatDateTime(item.timestamp)} ${item.label} - ${item.detail}`
        );
      }
    }
    lines.push("──────────────────────────────────");
    lines.push(`生成时间：${formatDateTime(new Date().toISOString())}`);
    navigator.clipboard.writeText(lines.join("\n"));
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
              <div className="text-red-400 text-xs mt-1">
                {firstAbnormalItem.label}
              </div>
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
                ? `从首次异常→${latestDisposalItem ? latestDisposalItem.label : "处置结束"}`
                : "从首次异常至今（持续进行）"}
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
                  <div className="text-slate-500 text-xs mt-1">
                    处理人：{alarm.handler}
                  </div>
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
              {timelineItems.filter((i) => i.type === "alarm_action").length ||
                (alarm ? 1 : 0)}
            </span>
          </div>
        </div>

        {lastCriticalItem &&
          firstAbnormalItem &&
          lastCriticalItem.id !== firstAbnormalItem.id && (
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>最新关键事件：</span>
              <span className="text-red-300">{lastCriticalItem.label}</span>
              <span>·</span>
              <span className="font-mono">
                {formatDateTime(lastCriticalItem.timestamp)}
              </span>
            </div>
          )}
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-slate-300 font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            事件复盘时间线（最早 → 当前）
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={exportReviewChain}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-600/40"
            >
              <Copy className="w-3.5 h-3.5" />
              导出复盘链
            </button>
            <div className="flex rounded-lg bg-slate-700/40 border border-slate-600/30 overflow-hidden">
              <button
                onClick={() => setViewMode("phase")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "phase"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                阶段视图
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "timeline"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                时间线视图
              </button>
            </div>
          </div>
        </div>

        {timelineItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            暂无事件数据
          </div>
        ) : viewMode === "timeline" ? (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
            <div className="space-y-3">
              {timelineItems.map((item, index) =>
                renderTimelineItem(item, index, timelineItems.length)
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {PHASE_ORDER.map((key) => {
              const items = phaseGroups[key];
              if (items.length === 0) return null;
              const def = PHASE_DEFS[key];
              const isCollapsed = collapsedPhases.has(key);
              const duration = formatDuration(items);
              const operators = getOperators(items);
              return (
                <div key={key} className={`rounded-lg border ${def.borderColor} ${def.bgColor}`}>
                  <button
                    onClick={() => togglePhase(key)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {isCollapsed ? (
                        <ChevronRight className={`w-4 h-4 ${def.accentColor}`} />
                      ) : (
                        <ChevronDown className={`w-4 h-4 ${def.accentColor}`} />
                      )}
                      <div className={`flex items-center gap-2 ${def.accentColor}`}>
                        {def.icon}
                        <span className="font-medium text-sm text-white">
                          {def.label}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xs">
                        {items.length}条记录
                      </span>
                      {duration && (
                        <span className="text-slate-500 text-xs font-mono">
                          持续 {duration}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {operators.length > 0 && (
                        <div className="flex items-center gap-1">
                          {operators.slice(0, 3).map((op) => (
                            <span
                              key={op}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600/40 text-slate-300"
                            >
                              {op}
                            </span>
                          ))}
                          {operators.length > 3 && (
                            <span className="text-[10px] text-slate-500">
                              +{operators.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-slate-500 text-[10px] font-mono">
                        {formatDateTime(items[0].timestamp)}
                      </span>
                    </div>
                  </button>
                  {!isCollapsed && (
                    <div className="px-3 pb-3">
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700/50" />
                        <div className="space-y-3">
                          {items.map((item, index) =>
                            renderTimelineItem(item, index, items.length)
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
