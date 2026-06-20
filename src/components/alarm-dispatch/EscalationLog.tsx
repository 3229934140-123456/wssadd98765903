import {
  ScrollText,
  Filter,
  ChevronRight,
  User,
  Truck,
  Megaphone,
  UserCheck,
  MessageSquare,
  DoorClosed,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useStore } from "../../store/useStore";
import { FollowUpRecord } from "../../types";
import {
  getAbnormalTypeLabel,
  getAbnormalTypeColor,
} from "../../utils/statusUtils";
import { formatDateTime, formatMinutesRemaining, getSlaMinutesRemaining } from "../../utils/dateUtils";

const QC_RESPONSE_SLA_MINUTES = 30;

type FilterKey = "all" | "open" | "unreplied" | "current_shift";

const RESULT_META: Record<
  FollowUpRecord["result"],
  { label: string; icon: React.ReactNode; color: string }
> = {
  URGED: {
    label: "催办",
    icon: <Megaphone className="w-3.5 h-3.5" />,
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  ON_SITE: {
    label: "到场",
    icon: <UserCheck className="w-3.5 h-3.5" />,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  REPLIED: {
    label: "回复",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  CLOSED: {
    label: "关闭",
    icon: <DoorClosed className="w-3.5 h-3.5" />,
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "open", label: "未闭环" },
  { key: "unreplied", label: "未回复" },
  { key: "current_shift", label: "本班次" },
];

export const EscalationLog = () => {
  const {
    followUpRecords,
    alarms,
    vehicles,
    currentShift,
    setSelectedVehicleId,
  } = useStore();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedAlarm, setExpandedAlarm] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const byAlarm: Record<
      string,
      {
        alarm: (typeof alarms)[number];
        vehicle: (typeof vehicles)[number] | undefined;
        records: FollowUpRecord[];
        hasUnrepliedUrge: boolean;
        isClosed: boolean;
      }
    > = {};

    followUpRecords
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach((r) => {
        if (!byAlarm[r.alarmId]) {
          const alarm = alarms.find((a) => a.id === r.alarmId);
          if (!alarm || alarm.status === "FALSE_ALARM") return;
          byAlarm[r.alarmId] = {
            alarm,
            vehicle: vehicles.find((v) => v.id === r.vehicleId),
            records: [],
            hasUnrepliedUrge: false,
            isClosed: false,
          };
        }
        byAlarm[r.alarmId].records.push(r);
      });

    Object.values(byAlarm).forEach((g) => {
      const sorted = [...g.records].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const hasClosed = sorted.some((r) => r.result === "CLOSED");
      g.isClosed = hasClosed;
      const lastUrgeIdx = sorted.findIndex((r) => r.result === "URGED");
      if (lastUrgeIdx !== -1) {
        const hasReplyAfter = sorted
          .slice(0, lastUrgeIdx)
          .some((r) => r.result === "REPLIED" || r.result === "ON_SITE" || r.result === "CLOSED");
        g.hasUnrepliedUrge = !hasReplyAfter;
      }
    });

    let list = Object.values(byAlarm);

    if (filter === "open") {
      list = list.filter((g) => !g.isClosed);
    } else if (filter === "unreplied") {
      list = list.filter((g) => g.hasUnrepliedUrge && !g.isClosed);
    } else if (filter === "current_shift") {
      list = list.filter(
        (g) => !g.isClosed && g.records.some((r) => r.operator === currentShift.operator)
      );
    }

    list.sort((a, b) => {
      if (!a.isClosed && b.isClosed) return -1;
      if (a.isClosed && !b.isClosed) return 1;
      if (a.hasUnrepliedUrge && !b.hasUnrepliedUrge) return -1;
      if (!a.hasUnrepliedUrge && b.hasUnrepliedUrge) return 1;
      const ta = new Date(a.records[0]?.timestamp || 0).getTime();
      const tb = new Date(b.records[0]?.timestamp || 0).getTime();
      return tb - ta;
    });

    return list;
  }, [followUpRecords, alarms, vehicles, filter, currentShift.operator]);

  const unrepliedCount = grouped.filter((g) => g.hasUnrepliedUrge && !g.isClosed).length;
  const openCount = grouped.filter((g) => !g.isClosed).length;

  const pendingEscalationsForHandover = grouped.filter(
    (g) =>
      !g.isClosed &&
      (g.hasUnrepliedUrge ||
        (g.alarm.status === "NEED_QC" &&
          getSlaMinutesRemaining(g.alarm.createdAt, QC_RESPONSE_SLA_MINUTES) < 0))
  );

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-indigo-400" />
            升级记录
          </h2>
          {unrepliedCount > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 px-3 py-1 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-orange-400 font-bold text-sm">
                {unrepliedCount} 项待回复
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                filter === f.key
                  ? "bg-indigo-500/30 text-indigo-300 ring-1 ring-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {f.label}
              {f.key === "open" && openCount > 0 && (
                <span className="ml-1 text-indigo-400">({openCount})</span>
              )}
              {f.key === "unreplied" && unrepliedCount > 0 && (
                <span className="ml-1 text-orange-400">({unrepliedCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {pendingEscalationsForHandover.length > 0 && (
        <div className="px-4 pt-3 pb-1 bg-indigo-500/5 border-b border-indigo-500/10">
          <div className="flex items-start gap-1.5 text-[11px] text-indigo-300">
            <Filter className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              共 <b className="text-indigo-200">{pendingEscalationsForHandover.length}</b>{" "}
              项未闭环升级项将随下一次交接班带出
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {grouped.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            暂无升级催办记录
          </div>
        ) : (
          grouped.map((group) => {
            if (!group.vehicle) return null;
            const latest = group.records[0];
            const meta = RESULT_META[latest.result];
            const qcSlaRemaining =
              group.alarm.status === "NEED_QC"
                ? getSlaMinutesRemaining(group.alarm.createdAt, QC_RESPONSE_SLA_MINUTES)
                : null;
            const isExpanded = expandedAlarm === group.alarm.id;

            return (
              <div
                key={group.alarm.id}
                className={`rounded-lg border overflow-hidden transition-all ${
                  group.isClosed
                    ? "border-slate-700/50 bg-slate-800/30 opacity-60"
                    : group.hasUnrepliedUrge
                    ? "border-orange-500/30 bg-orange-500/5"
                    : "border-slate-700 bg-slate-800/50"
                }`}
              >
                <div
                  className="p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                  onClick={() =>
                    setExpandedAlarm(isExpanded ? null : group.alarm.id)
                  }
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div
                      className="flex items-center gap-2 flex-wrap cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVehicleId(group.vehicle!.id);
                      }}
                    >
                      <Truck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span
                        className="text-white font-bold text-sm font-mono"
                        style={{ fontFamily: "JetBrains Mono, monospace" }}
                      >
                        {group.vehicle.plateNumber}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/10 text-cyan-400 font-mono">
                        {group.vehicle.tripNo}
                      </span>
                      <span
                        className="px-1.5 py-0.5 text-[10px] rounded font-semibold"
                        style={{
                          backgroundColor: `${getAbnormalTypeColor(group.alarm.abnormalType)}20`,
                          color: getAbnormalTypeColor(group.alarm.abnormalType),
                        }}
                      >
                        {getAbnormalTypeLabel(group.alarm.abnormalType)}
                      </span>
                      {group.hasUnrepliedUrge && !group.isClosed && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-orange-500/20 text-orange-400 font-bold border border-orange-500/30 animate-pulse">
                          待回复
                        </span>
                      )}
                      {group.isClosed && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          已关闭
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {qcSlaRemaining !== null && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${
                            qcSlaRemaining < 0
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {qcSlaRemaining < 0
                            ? `已超时${formatMinutesRemaining(Math.abs(qcSlaRemaining)).replace("剩余 ", "")}`
                            : `SLA 剩余 ${formatMinutesRemaining(qcSlaRemaining)}`}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded border ${meta.color}`}>
                      <span className="flex items-center gap-1">
                        {meta.icon}
                        {meta.label}
                      </span>
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" />
                      {latest.operator}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-300">{latest.targetPerson}</span>
                    <span className="text-slate-500 font-mono">
                      {formatDateTime(latest.timestamp)}
                    </span>
                    {latest.detail && (
                      <span className="text-slate-300 truncate max-w-[200px]">
                        · {latest.detail}
                      </span>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1 border-t border-slate-700/50 pt-2">
                    <div className="text-[10px] text-slate-500 mb-1">
                      催办跟进链（共 {group.records.length} 条）
                    </div>
                    {group.records.map((r, idx) => {
                      const rm = RESULT_META[r.result];
                      const isLatest = idx === 0;
                      return (
                        <div
                          key={r.id}
                          className={`flex items-start gap-2 p-2 rounded text-[11px] ${
                            isLatest ? "bg-slate-900/50" : ""
                          }`}
                        >
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[10px] whitespace-nowrap ${rm.color}`}
                          >
                            <span className="flex items-center gap-1">
                              {rm.icon}
                              {rm.label}
                            </span>
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-400">{r.operator}</span>
                              <span className="text-slate-500">→</span>
                              <span className="text-slate-300">{r.targetPerson}</span>
                              <span className="text-slate-500 font-mono ml-auto">
                                <Clock className="w-3 h-3 inline mr-0.5" />
                                {formatDateTime(r.timestamp)}
                              </span>
                            </div>
                            {r.detail && (
                              <div className="text-slate-400 mt-0.5">{r.detail}</div>
                            )}
                          </div>
                          {isLatest && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
