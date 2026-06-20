import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  User,
  Truck,
  Phone,
  MapPin,
  Ticket,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Megaphone,
  UserCheck,
  DoorClosed,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "../../store/useStore";
import { FollowUpRecord } from "../../types";
import {
  getAbnormalTypeLabel,
  getAbnormalTypeColor,
  getAlarmStatusLabel,
  getAlarmStatusColor,
} from "../../utils/statusUtils";
import {
  formatDateTime,
  formatMinutesRemaining,
  getMinutesRemaining,
  getSlaMinutesRemaining,
} from "../../utils/dateUtils";

const PENDING_VERIFY_SLA_MINUTES = 15;
const QC_RESPONSE_SLA_MINUTES = 30;

type SlaTierKey = "pending_overdue" | "reminder_expired" | "qc_pending";

type SlaTier = {
  key: SlaTierKey;
  title: string;
  subtitle: string;
  color: string;
  textColor: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
};

const TIERS: SlaTier[] = [
  {
    key: "pending_overdue",
    title: "超时未核实",
    subtitle: `告警超过 ${PENDING_VERIFY_SLA_MINUTES} 分钟仍待核实，需立即联系司机`,
    color: "bg-red-500/20",
    textColor: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
  },
  {
    key: "reminder_expired",
    title: "提醒已过期",
    subtitle: "设置的跟进提醒时间已过，请确认处理进度",
    color: "bg-orange-500/20",
    textColor: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: <Clock className="w-5 h-5 text-orange-400" />,
  },
  {
    key: "qc_pending",
    title: "质检待响应",
    subtitle: `需质检介入（${QC_RESPONSE_SLA_MINUTES} 分钟 SLA），超时自动升级为催办`,
    color: "bg-purple-500/20",
    textColor: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: <AlertTriangle className="w-5 h-5 text-purple-400" />,
  },
];

const QC_CONTACT = "质检组 - 李主任 138****8000";

type FollowUpResult = FollowUpRecord["result"];

const FOLLOWUP_OPTIONS: { value: FollowUpResult; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "URGED", label: "已催办", icon: <Megaphone className="w-3.5 h-3.5" />, color: "bg-orange-500 text-white" },
  { value: "ON_SITE", label: "已到场", icon: <UserCheck className="w-3.5 h-3.5" />, color: "bg-blue-500 text-white" },
  { value: "REPLIED", label: "已回复", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "bg-cyan-500 text-white" },
  { value: "CLOSED", label: "已关闭", icon: <DoorClosed className="w-3.5 h-3.5" />, color: "bg-emerald-500 text-white" },
];

export const SlaDashboard = () => {
  const { alarms, vehicles, followUpRecords, addFollowUp, setSelectedVehicleId, currentShift } =
    useStore();
  const [expandedTier, setExpandedTier] = useState<SlaTierKey | null>("qc_pending");
  const [activeFollowUp, setActiveFollowUp] = useState<{ alarmId: string; result: FollowUpResult } | null>(null);
  const [followUpDetail, setFollowUpDetail] = useState("");

  const buildTierData = (tierKey: SlaTierKey) => {
    return alarms
      .filter((a) => {
        if (a.status === "FALSE_ALARM") return false;
        if (tierKey === "pending_overdue") {
          return (
            a.status === "PENDING_VERIFY" &&
            getSlaMinutesRemaining(a.createdAt, PENDING_VERIFY_SLA_MINUTES) < 0
          );
        }
        if (tierKey === "reminder_expired") {
          return (
            a.status !== "PENDING_VERIFY" &&
            !!a.nextReminder &&
            new Date(a.nextReminder).getTime() < Date.now()
          );
        }
        if (tierKey === "qc_pending") {
          return a.status === "NEED_QC";
        }
        return false;
      })
      .map((a) => {
        const vehicle = vehicles.find((v) => v.id === a.vehicleId);
        let minutesRemaining = 0;
        if (tierKey === "pending_overdue") {
          minutesRemaining = getSlaMinutesRemaining(a.createdAt, PENDING_VERIFY_SLA_MINUTES);
        } else if (tierKey === "qc_pending") {
          minutesRemaining = getSlaMinutesRemaining(a.createdAt, QC_RESPONSE_SLA_MINUTES);
        } else if (tierKey === "reminder_expired" && a.nextReminder) {
          minutesRemaining = getMinutesRemaining(a.nextReminder);
        }
        const itemFollowUps = followUpRecords
          .filter((f) => f.alarmId === a.id)
          .sort((x, y) => new Date(y.timestamp).getTime() - new Date(x.timestamp).getTime());
        const owner =
          tierKey === "qc_pending"
            ? QC_CONTACT
            : a.handler || `${currentShift.operator}（本班调度员）`;
        const overdue = minutesRemaining < 0;
        return {
          alarm: a,
          vehicle,
          minutesRemaining,
          overdue,
          owner,
          itemFollowUps,
          nextStep:
            tierKey === "pending_overdue"
              ? "立即拨打司机电话核实情况并标记已联系"
              : tierKey === "qc_pending"
              ? overdue
                ? "催办质检组尽快到场处理并登记结果"
                : "联系质检组确认到岗时间"
              : "跟进提醒是否已处理，必要时更新状态",
        };
      })
      .sort((a, b) => a.minutesRemaining - b.minutesRemaining);
  };

  const totalItems =
    buildTierData("pending_overdue").length +
    buildTierData("reminder_expired").length +
    buildTierData("qc_pending").length;

  const handleRegisterFollowUp = (alarmId: string, result: FollowUpResult) => {
    const detail = followUpDetail.trim();
    const alarm = alarms.find((a) => a.id === alarmId);
    if (!alarm) return;
    const targetPerson =
      result === "URGED" || result === "REPLIED"
        ? QC_CONTACT
        : result === "ON_SITE"
        ? "质检人员"
        : currentShift.operator;
    addFollowUp(alarmId, result, detail, targetPerson);
    setActiveFollowUp(null);
    setFollowUpDetail("");
  };

  const getResultLabel = (r: FollowUpResult) =>
    FOLLOWUP_OPTIONS.find((o) => o.value === r)?.label || r;

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Ticket className="w-5 h-5 text-amber-400" />
            告警升级 & SLA 看板
          </h2>
          {totalItems > 0 && (
            <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-lg animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-bold text-sm">{totalItems}</span>
              <span className="text-red-400 text-xs">项待升级</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TIERS.map((tier) => {
            const count = buildTierData(tier.key).length;
            return (
              <div
                key={tier.key}
                onClick={() => setExpandedTier(expandedTier === tier.key ? null : tier.key)}
                className={`p-2 rounded-lg border cursor-pointer transition-all ${
                  expandedTier === tier.key
                    ? `${tier.bg} ${tier.border} ring-2 ring-offset-0 ring-slate-700`
                    : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {tier.icon}
                  <span className={`text-[11px] font-semibold ${tier.textColor}`}>
                    {tier.title}
                  </span>
                </div>
                <div className={`text-xl font-bold ${count > 0 ? tier.textColor : "text-slate-500"}`}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {TIERS.map((tier) => {
          const rows = buildTierData(tier.key);
          const isExpanded = expandedTier === tier.key;
          return (
            <div
              key={tier.key}
              className={`rounded-lg border ${tier.border} ${tier.bg} overflow-hidden`}
            >
              <div
                onClick={() => setExpandedTier(isExpanded ? null : tier.key)}
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start gap-2">
                  {tier.icon}
                  <div>
                    <div className={`font-semibold ${tier.textColor}`}>{tier.title}</div>
                    <div className="text-slate-500 text-xs">{tier.subtitle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tier.color} ${tier.textColor}`}>
                    {rows.length}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-slate-700/50 pt-3">
                  {rows.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      暂无本层级的升级项
                    </div>
                  ) : (
                    rows.map((row) => {
                      if (!row.vehicle) return null;
                      const isUrged = row.itemFollowUps.some((f) => f.result === "URGED");
                      const isClosed = row.itemFollowUps.some((f) => f.result === "CLOSED");
                      const qcOverdue = tier.key === "qc_pending" && row.overdue;
                      const timeColor = row.overdue ? "text-red-400" : "text-amber-400";
                      return (
                        <div
                          key={row.alarm.id}
                          className="p-3 rounded-lg bg-slate-800/70 border border-slate-700"
                        >
                          <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                            <div
                              className="flex items-center gap-2 flex-wrap cursor-pointer"
                              onClick={() => setSelectedVehicleId(row.vehicle!.id)}
                            >
                              <Truck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <span
                                className="text-white font-bold font-mono text-sm"
                                style={{ fontFamily: "JetBrains Mono, monospace" }}
                              >
                                {row.vehicle.plateNumber}
                              </span>
                              <span className="px-1.5 py-0.5 text-xs rounded bg-cyan-500/10 text-cyan-400 font-mono">
                                {row.vehicle.tripNo}
                              </span>
                              <span
                                className="px-1.5 py-0.5 text-xs rounded font-semibold"
                                style={{
                                  backgroundColor: `${getAbnormalTypeColor(row.alarm.abnormalType)}20`,
                                  color: getAbnormalTypeColor(row.alarm.abnormalType),
                                }}
                              >
                                {getAbnormalTypeLabel(row.alarm.abnormalType)}
                              </span>
                              <span
                                className="px-1.5 py-0.5 text-xs rounded font-semibold"
                                style={{
                                  backgroundColor: `${getAlarmStatusColor(row.alarm.status)}20`,
                                  color: getAlarmStatusColor(row.alarm.status),
                                }}
                              >
                                {getAlarmStatusLabel(row.alarm.status)}
                              </span>
                              {qcOverdue && (
                                <span className="px-1.5 py-0.5 text-xs rounded font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                                  催办中
                                </span>
                              )}
                              {isUrged && !qcOverdue && (
                                <span className="px-1.5 py-0.5 text-xs rounded font-semibold bg-orange-500/20 text-orange-400">
                                  已催办
                                </span>
                              )}
                              {isClosed && (
                                <span className="px-1.5 py-0.5 text-xs rounded font-semibold bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  已关闭
                                </span>
                              )}
                            </div>
                            <div
                              className={`px-2 py-1 rounded-md text-xs font-bold font-mono ${
                                row.overdue ? "bg-red-500/20" : "bg-slate-700"
                              } ${timeColor}`}
                            >
                              {qcOverdue && isUrged
                                ? "催办中"
                                : tier.key === "qc_pending" && !row.overdue
                                ? `SLA ${formatMinutesRemaining(row.minutesRemaining)}`
                                : formatMinutesRemaining(row.minutesRemaining)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-xs text-slate-400 mb-2">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-500">司机：</span>
                              <span className="text-slate-300">
                                {row.vehicle.driverName} {row.vehicle.driverPhone}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-500">线路：</span>
                              <span className="text-slate-300">{row.vehicle.route}</span>
                            </span>
                            <span className="flex items-center gap-1 col-span-2">
                              <ShieldAlert className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-500">跟进对象：</span>
                              <span className="text-slate-300">{row.owner}</span>
                            </span>
                          </div>

                          {row.itemFollowUps.length > 0 && (
                            <div className="mb-2 p-2 bg-slate-900/40 rounded-md">
                              <div className="text-[10px] text-slate-500 mb-1">
                                跟进历史（{row.itemFollowUps.length}）
                              </div>
                              {row.itemFollowUps.slice(0, 3).map((f) => {
                                const opt = FOLLOWUP_OPTIONS.find((o) => o.value === f.result);
                                return (
                                  <div
                                    key={f.id}
                                    className="text-[11px] text-slate-300 mb-1 flex items-start gap-1.5"
                                  >
                                    <span
                                      className={`px-1 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                                        opt?.color || "bg-slate-600 text-white"
                                      }`}
                                    >
                                      {getResultLabel(f.result)}
                                    </span>
                                    <span className="text-slate-400 font-mono flex-shrink-0">
                                      {formatDateTime(f.timestamp).slice(5)}
                                    </span>
                                    <span className="text-slate-400">{f.operator}</span>
                                    <span className="text-slate-200">{f.detail}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {activeFollowUp?.alarmId === row.alarm.id ? (
                            <div className="p-2 bg-slate-900/60 rounded-md border border-slate-600 space-y-2">
                              <div className="text-xs text-slate-300">登记跟进结果</div>
                              <textarea
                                value={followUpDetail}
                                onChange={(e) => setFollowUpDetail(e.target.value)}
                                placeholder="补充说明（选填）..."
                                className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
                                rows={2}
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex gap-1 flex-wrap">
                                  {FOLLOWUP_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      onClick={() => handleRegisterFollowUp(row.alarm.id, opt.value)}
                                      className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all hover:scale-105 ${opt.color}`}
                                    >
                                      {opt.icon}
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveFollowUp(null);
                                    setFollowUpDetail("");
                                  }}
                                  className="text-xs text-slate-400 hover:text-slate-200"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                {FOLLOWUP_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => {
                                      setActiveFollowUp({ alarmId: row.alarm.id, result: opt.value });
                                      setFollowUpDetail("");
                                    }}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all hover:scale-105 opacity-80 hover:opacity-100 ${opt.color}`}
                                  >
                                    {opt.icon}
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setSelectedVehicleId(row.vehicle!.id)}
                                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
                              >
                                处置 →
                              </button>
                            </div>
                          )}

                          <div className={`p-2 rounded-md text-[11px] ${tier.bg} ${tier.textColor} font-medium flex items-start gap-1.5 mt-2`}>
                            <ChevronDown className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>建议下一步：{row.nextStep}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
