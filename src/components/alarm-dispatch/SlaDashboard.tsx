import { AlertTriangle, Clock, ShieldAlert, ChevronDown, ChevronUp, User, Truck, Phone, MapPin, Ticket } from "lucide-react";
import { useState } from "react";
import { useStore } from "../../store/useStore";
import {
  getAbnormalTypeLabel,
  getAbnormalTypeColor,
  getAlarmStatusLabel,
  getAlarmStatusColor,
} from "../../utils/statusUtils";
import { formatDateTime, formatMinutesRemaining, getMinutesRemaining, getSlaMinutesRemaining } from "../../utils/dateUtils";

const PENDING_VERIFY_SLA_MINUTES = 15;
const QC_RESPONSE_SLA_MINUTES = 30;

type SlaTier = {
  key: "pending_overdue" | "reminder_expired" | "qc_pending";
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
};

const TIERS: SlaTier[] = [
  {
    key: "pending_overdue",
    title: "超时未核实",
    subtitle: `告警超过 ${PENDING_VERIFY_SLA_MINUTES} 分钟仍待核实`,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
  },
  {
    key: "reminder_expired",
    title: "提醒已过期",
    subtitle: "设置的跟进提醒时间已过",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: <Clock className="w-5 h-5 text-orange-400" />,
  },
  {
    key: "qc_pending",
    title: "质检待响应",
    subtitle: `标记为需质检介入，超过 ${QC_RESPONSE_SLA_MINUTES} 分钟未跟进`,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    icon: <AlertTriangle className="w-5 h-5 text-purple-400" />,
  },
];

export const SlaDashboard = () => {
  const { alarms, vehicles, setSelectedVehicleId } = useStore();
  const [expandedTier, setExpandedTier] = useState<string | null>("pending_overdue");

  const buildTierData = (tierKey: SlaTier["key"]) => {
    const now = Date.now();
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
            new Date(a.nextReminder).getTime() < now
          );
        }
        if (tierKey === "qc_pending") {
          return (
            a.status === "NEED_QC" &&
            getSlaMinutesRemaining(a.createdAt, QC_RESPONSE_SLA_MINUTES) < 0
          );
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
        const qcResponsible = tierKey === "qc_pending" ? "质检组 - 李主任" : "值班调度员";
        return {
          alarm: a,
          vehicle,
          minutesRemaining,
          nextStep:
            tierKey === "pending_overdue"
              ? "立即联系司机核实情况"
              : tierKey === "qc_pending"
              ? "通知质检人员到岗处理"
              : "跟进该提醒是否已处理并调整状态",
          owner:
            tierKey === "qc_pending"
              ? "质检组（李主任 138****8000）"
              : a.handler || "待分派",
          qcResponsible,
        };
      })
      .sort((a, b) => a.minutesRemaining - b.minutesRemaining);
  };

  const totalItems =
    buildTierData("pending_overdue").length +
    buildTierData("reminder_expired").length +
    buildTierData("qc_pending").length;

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
                onClick={() =>
                  setExpandedTier(expandedTier === tier.key ? null : tier.key)
                }
                className={`p-2 rounded-lg border cursor-pointer transition-all ${
                  expandedTier === tier.key
                    ? `${tier.bg} ${tier.border} ring-2 ring-offset-0 ring-slate-700`
                    : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {tier.icon}
                  <span className={`text-xs font-semibold ${tier.color}`}>
                    {tier.title}
                  </span>
                </div>
                <div
                  className={`text-xl font-bold ${
                    count > 0 ? tier.color : "text-slate-500"
                  }`}
                >
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
                onClick={() =>
                  setExpandedTier(isExpanded ? null : tier.key)
                }
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {tier.icon}
                  <span className={`font-semibold ${tier.color}`}>
                    {tier.title}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {tier.subtitle}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${tier.bg} ${tier.color}`}
                  >
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
                      const overdue = row.minutesRemaining < 0;
                      const timeColor =
                        tier.key === "pending_overdue" || tier.key === "qc_pending"
                          ? overdue
                            ? "text-red-400"
                            : "text-amber-400"
                          : overdue
                          ? "text-orange-500"
                          : "text-slate-400";
                      return (
                        <div
                          key={row.alarm.id}
                          onClick={() => setSelectedVehicleId(row.vehicle.id)}
                          className="p-3 rounded-lg bg-slate-800/70 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Truck
                                className="w-4 h-4 text-cyan-400"
                                style={{ flexShrink: 0 }}
                              />
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
                                  backgroundColor: `${getAbnormalTypeColor(
                                    row.alarm.abnormalType
                                  )}20`,
                                  color: getAbnormalTypeColor(row.alarm.abnormalType),
                                }}
                              >
                                {getAbnormalTypeLabel(row.alarm.abnormalType)}
                              </span>
                              <span
                                className="px-1.5 py-0.5 text-xs rounded font-semibold"
                                style={{
                                  backgroundColor: `${getAlarmStatusColor(
                                    row.alarm.status
                                  )}20`,
                                  color: getAlarmStatusColor(row.alarm.status),
                                }}
                              >
                                {getAlarmStatusLabel(row.alarm.status)}
                              </span>
                            </div>
                            <div
                              className={`px-2 py-1 rounded-md text-xs font-bold font-mono ${
                                overdue ? "bg-red-500/20" : "bg-slate-700"
                              } ${timeColor}`}
                            >
                              {formatMinutesRemaining(row.minutesRemaining)}
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
                            <span className="flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-500">责任人：</span>
                              <span className="text-slate-300">{row.owner}</span>
                            </span>
                            {tier.key === "qc_pending" && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span className="text-slate-500">质检：</span>
                                <span className="text-purple-300">{row.qcResponsible}</span>
                              </span>
                            )}
                          </div>

                          {row.alarm.remark && (
                            <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                              <span className="text-slate-500">最新说明：</span>
                              {row.alarm.remark}
                            </p>
                          )}

                          <div
                            className={`p-2 rounded-md text-xs ${tier.bg} ${tier.color} font-medium flex items-start gap-1.5`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 mt-0.5 flex-shrink-0 ${tier.color}`}
                            />
                            <span>建议下一步：{row.nextStep}</span>
                          </div>

                          <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-3">
                            <span>告警创建：{formatDateTime(row.alarm.createdAt)}</span>
                            {row.alarm.nextReminder &&
                              tier.key === "reminder_expired" && (
                                <span>
                                  提醒到期：{formatDateTime(row.alarm.nextReminder)}
                                </span>
                              )}
                            <span className="ml-auto text-blue-400">
                              点击 → 进入处置面板
                            </span>
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
