import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Send,
  History,
  User,
  Clock,
  ChevronDown,
  Phone,
  Warehouse,
  MessageSquare,
  RefreshCw,
  Bell,
  BellOff,
  BellRing,
  Megaphone,
  UserCheck,
  DoorClosed,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { StatusSelector } from "./StatusSelector";
import { AlarmStatus, DisposalAction } from "../../types";
import {
  getAbnormalTypeLabel,
  getAbnormalTypeColor,
  getAlarmStatusLabel,
  getAlarmStatusBgColor,
  getAlarmStatusBorderColor,
} from "../../utils/statusUtils";
import { formatDateTime, getTimeAgo } from "../../utils/dateUtils";

type ReminderValue = { kind: "existing"; label: string; time: string; expired: boolean }
  | { kind: "picked"; minutes: number | null };

const buildReminderLabel = (minutes: number | null): string => {
  if (minutes === null) return "不设置提醒";
  const map: Record<number, string> = {
    15: "15分钟后",
    30: "30分钟后",
    60: "1小时后",
    120: "2小时后",
    240: "4小时后",
    1440: "明天同一时间",
  };
  return map[minutes] || `${minutes}分钟后`;
};

const PRESET_OPTIONS: { label: string; value: number | null }[] = [
  { label: "不设置提醒", value: null },
  { label: "15分钟后", value: 15 },
  { label: "30分钟后", value: 30 },
  { label: "1小时后", value: 60 },
  { label: "2小时后", value: 120 },
  { label: "4小时后", value: 240 },
  { label: "明天同一时间", value: 1440 },
];

const getActionVisual = (action: DisposalAction) => {
  switch (action.actionType) {
    case "CALL_DRIVER":
      return {
        icon: <Phone className="w-3.5 h-3.5 text-blue-400" />,
        badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        label: "拨打电话",
      };
    case "NOTIFY_WAREHOUSE":
      return {
        icon: <Warehouse className="w-3.5 h-3.5 text-purple-400" />,
        badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        label: "通知仓库",
      };
    case "SEND_MESSAGE":
      return {
        icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />,
        badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        label: "发送消息",
      };
    case "STATUS_CHANGE": {
      const st = action.subType;
      if (st === "FALSE_ALARM") {
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-gray-400" />,
          badge: "bg-gray-500/20 text-gray-400 border-gray-500/30",
          label: "标记误报",
        };
      }
      if (st === "NEED_QC") {
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
          badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          label: "转质检",
        };
      }
      return {
        icon: <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />,
        badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        label: "状态变更",
      };
    }
    case "REMINDER_CHANGE": {
      const kind = action.subType;
      if (kind === "CLEARED") {
        return {
          icon: <BellOff className="w-3.5 h-3.5 text-slate-400" />,
          badge: "bg-slate-500/20 text-slate-400 border-slate-500/30",
          label: "清除提醒",
        };
      }
      if (kind === "CHANGED") {
        return {
          icon: <BellRing className="w-3.5 h-3.5 text-blue-400" />,
          badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          label: "改新提醒",
        };
      }
      return {
        icon: <Bell className="w-3.5 h-3.5 text-cyan-400" />,
        badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        label: "保留提醒",
      };
    }
    case "FOLLOW_UP": {
      const res = action.subType;
      if (res === "URGED") {
        return {
          icon: <Megaphone className="w-3.5 h-3.5 text-orange-400" />,
          badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          label: "催办",
        };
      }
      if (res === "ON_SITE") {
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-400" />,
          badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          label: "已到场",
        };
      }
      if (res === "CLOSED") {
        return {
          icon: <DoorClosed className="w-3.5 h-3.5 text-emerald-400" />,
          badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          label: "已关闭",
        };
      }
      return {
        icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />,
        badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        label: "已回复",
      };
    }
    default:
      return {
        icon: <History className="w-3.5 h-3.5 text-slate-400" />,
        badge: "bg-slate-500/20 text-slate-400 border-slate-500/30",
        label: "操作",
      };
  }
};

export const AlarmDispatch = () => {
  const { selectedVehicleId, vehicles, alarms, disposalActions, updateAlarmStatus, currentShift } = useStore();
  const [status, setStatus] = useState<AlarmStatus>("PENDING_VERIFY");
  const [remark, setRemark] = useState("");
  const [reminder, setReminder] = useState<ReminderValue>({ kind: "picked", minutes: null });
  const [showSuccess, setShowSuccess] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const alarm = alarms.find((a) => a.vehicleId === selectedVehicleId);

  useEffect(() => {
    if (alarm) {
      setStatus(alarm.status);
      setRemark(alarm.remark);
      if (alarm.nextReminder) {
        const expired = new Date(alarm.nextReminder).getTime() < Date.now();
        setReminder({
          kind: "existing",
          label: `原提醒：${formatDateTime(alarm.nextReminder)}${expired ? "（已过期）" : ""}`,
          time: alarm.nextReminder,
          expired,
        });
      } else {
        setReminder({ kind: "picked", minutes: null });
      }
      setShowSuccess(false);
    } else {
      setStatus("PENDING_VERIFY");
      setRemark("");
      setReminder({ kind: "picked", minutes: null });
    }
  }, [selectedVehicleId, alarm?.id]);

  const handlePickReminder = (minutes: number | null) => {
    setReminder({ kind: "picked", minutes });
    setReminderOpen(false);
  };

  const remindMinutesToStore: number | null | undefined =
    reminder.kind === "existing" ? undefined : reminder.minutes;

  const currentReminderLabel =
    reminder.kind === "existing"
      ? reminder.label
      : buildReminderLabel(reminder.minutes);

  const handleSubmit = () => {
    if (!alarm) return;
    updateAlarmStatus(alarm.id, status, remark, remindMinutesToStore);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (!selectedVehicle) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/50 p-4">
        <div className="text-center text-slate-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>请先选择车辆</p>
        </div>
      </div>
    );
  }

  if (!alarm) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/50 p-4">
        <div className="text-center text-slate-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>该车辆当前无告警</p>
        </div>
      </div>
    );
  }

  if (alarm.status === "FALSE_ALARM") {
    return (
      <div className="h-full flex flex-col bg-slate-900/50">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-slate-400" />
            告警分派
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-xs">
            <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-400 font-bold text-lg mb-2">已标记为误报</h3>
            <p className="text-slate-500 text-sm">
              {selectedVehicle.plateNumber} 的门磁异常已确认为误报，不再计入异常统计。
            </p>
            {alarm.remark && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-left">
                <span className="text-slate-500 text-xs">误报说明：</span>
                <p className="text-slate-300 text-sm mt-1">{alarm.remark}</p>
              </div>
            )}
            <div className="mt-3 text-slate-500 text-xs">
              处理人：{alarm.handler} · {getTimeAgo(alarm.createdAt)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          告警分派
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          className={`p-4 rounded-lg border-2 ${getAlarmStatusBgColor(alarm.status)} ${getAlarmStatusBorderColor(alarm.status)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">异常类型</span>
            <span
              className="font-semibold"
              style={{ color: getAbnormalTypeColor(alarm.abnormalType) }}
            >
              {getAbnormalTypeLabel(alarm.abnormalType)}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">当前状态</span>
            <span className="text-white font-medium">{getAlarmStatusLabel(alarm.status)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">创建时间</span>
            <span className="text-slate-300 text-sm">{getTimeAgo(alarm.createdAt)}</span>
          </div>
          {alarm.handler && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">处理人</span>
              <span className="text-slate-300 text-sm">{alarm.handler}</span>
            </div>
          )}
          {alarm.remark && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-slate-300 text-sm">
                <span className="text-slate-500">最新备注：</span>
                {alarm.remark}
              </p>
            </div>
          )}
          {alarm.nextReminder && (
            <div className={`mt-2 flex items-center gap-2 text-sm ${
              new Date(alarm.nextReminder).getTime() < Date.now() ? "text-red-400" : "text-blue-400"
            }`}>
              <Clock className="w-4 h-4" />
              <span>下次提醒：{formatDateTime(alarm.nextReminder)}</span>
              {new Date(alarm.nextReminder).getTime() < Date.now() && (
                <span className="text-red-500 font-semibold">已过期！</span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-2">告警状态</label>
          <StatusSelector value={status} onChange={setStatus} />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-2">备注说明</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="请输入处置说明..."
            className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none transition-colors"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-2">下次提醒时间</label>
          <div className="relative">
            <button
              onClick={() => setReminderOpen(!reminderOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                reminder.kind === "existing" && reminder.expired
                  ? "border-red-500/50 bg-red-500/10"
                  : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${
                  reminder.kind === "existing" && reminder.expired ? "text-red-400" : "text-blue-400"
                }`} />
                <span className={`font-medium ${
                  reminder.kind === "existing" && reminder.expired
                    ? "text-red-300"
                    : "text-white"
                }`}>
                  {currentReminderLabel}
                </span>
                {reminder.kind === "picked" && reminder.minutes !== null && (
                  <span className="px-1.5 py-0.5 text-xs rounded bg-blue-500/20 text-blue-300">
                    新设置
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${reminderOpen ? "rotate-180" : ""}`} />
            </button>

            {reminderOpen && (
              <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                {reminder.kind === "existing" && (
                  <button
                    onClick={() => {
                      if (alarm?.nextReminder) {
                        const expired = new Date(alarm.nextReminder).getTime() < Date.now();
                        setReminder({
                          kind: "existing",
                          label: `原提醒：${formatDateTime(alarm.nextReminder)}${expired ? "（已过期）" : ""}`,
                          time: alarm.nextReminder,
                          expired,
                        });
                      }
                      setReminderOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border-b border-slate-700 transition-colors"
                  >
                    <span className="text-cyan-300 text-sm">保留原提醒（不修改）</span>
                    <span className="text-xs text-cyan-400">推荐</span>
                  </button>
                )}
                {PRESET_OPTIONS.map((option) => {
                  const isActive =
                    reminder.kind === "picked" && reminder.minutes === option.value;
                  return (
                    <button
                      key={option.label}
                      onClick={() => handlePickReminder(option.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors ${
                        isActive ? "bg-slate-700" : ""
                      }`}
                    >
                      <span className="text-white">{option.label}</span>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <User className="w-3 h-3" />
          <span>当前处理人：{currentShift.operator}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={showSuccess}
          className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg font-bold text-lg transition-all active:scale-95 ${
            showSuccess
              ? "bg-emerald-500 text-white"
              : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/30"
          }`}
        >
          {showSuccess ? (
            <>
              <History className="w-5 h-5" />
              已保存
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              确认分派
            </>
          )}
        </button>

        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-slate-400 text-sm mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="w-4 h-4" />
              处理记录
            </span>
            <span className="text-[10px] text-slate-500">
              共 {1 + ((disposalActions[selectedVehicleId || ""] || []).length)} 条
            </span>
          </h3>
          {(() => {
            const vehicleActions = disposalActions[selectedVehicleId || ""] || [];
            type Rec = {
              id: string;
              timestamp: string;
              text: string;
              operator?: string;
              visual: ReturnType<typeof getActionVisual> | null;
            };
            const allRecords: Rec[] = [
              {
                id: "sys-create",
                timestamp: alarm.createdAt,
                text: "系统自动创建告警",
                operator: "系统",
                visual: {
                  icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />,
                  badge: "bg-slate-600/40 text-slate-300 border-slate-500/30",
                  label: "创建",
                },
              },
              ...vehicleActions
                .filter((a) => (!alarm ? true : a.alarmId === alarm.id || !a.alarmId))
                .map((a) => ({
                  id: a.id,
                  timestamp: a.timestamp,
                  text: a.detail,
                  operator: a.operator,
                  visual: getActionVisual(a),
                })),
            ];
            allRecords.sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            return (
              <div className="space-y-2">
                {allRecords.map((rec) => (
                  <div key={rec.id} className="flex items-start gap-2">
                    {rec.visual && (
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] whitespace-nowrap flex items-center gap-1 mt-0.5 ${rec.visual.badge}`}>
                        {rec.visual.icon}
                        {rec.visual.label}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-300">{rec.text}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        {rec.operator && (
                          <>
                            <User className="w-2.5 h-2.5" />
                            <span>{rec.operator}</span>
                            <span>·</span>
                          </>
                        )}
                        <span className="font-mono">
                          {formatDateTime(rec.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
