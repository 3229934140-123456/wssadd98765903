import { useState, useMemo } from "react";
import {
  Handshake,
  ListChecks,
  History,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  MapPin,
  Truck,
  MessageSquare,
  Megaphone,
  UserCheck,
  DoorClosed,
  AlertCircle,
  CheckCircle2,
  ArrowRightLeft,
  Archive,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { HandoverForm } from "./HandoverForm";
import { formatDateTime } from "../../utils/dateUtils";
import {
  getAbnormalTypeLabel,
  getAbnormalTypeColor,
  getAlarmStatusLabel,
  getAlarmStatusColor,
} from "../../utils/statusUtils";

type CategoryKey = "unclosed" | "unreplied" | "on_site" | "closed_archive";

const CATEGORIES: { key: CategoryKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "unclosed", label: "未关闭告警", icon: <ListChecks className="w-3.5 h-3.5" />, color: "text-amber-400" },
  { key: "unreplied", label: "未回复催办", icon: <Megaphone className="w-3.5 h-3.5" />, color: "text-orange-400" },
  { key: "on_site", label: "已到场待确认", icon: <UserCheck className="w-3.5 h-3.5" />, color: "text-blue-400" },
  { key: "closed_archive", label: "已关闭待归档", icon: <Archive className="w-3.5 h-3.5" />, color: "text-emerald-400" },
];

export const HandoverPanel = () => {
  const {
    alarms,
    vehicles,
    followUpRecords,
    handovers,
    handoverItems,
    currentShift,
    takeoverRecords,
    createHandover,
    addHandoverFollowUp,
    addTakeover,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("unclosed");
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [followUpInputs, setFollowUpInputs] = useState<Record<string, string>>({});
  const [checkedAlarms, setCheckedAlarms] = useState<Set<string>>(new Set());
  const [handoverNotes, setHandoverNotes] = useState<Record<string, string>>({});

  const categorizeAlarms = useMemo(() => {
    const result: Record<CategoryKey, { alarm: typeof alarms[number]; vehicle: typeof vehicles[number] | undefined }[]> = {
      unclosed: [],
      unreplied: [],
      on_site: [],
      closed_archive: [],
    };

    const byAlarm: Record<string, typeof followUpRecords> = {};
    followUpRecords.forEach((r) => {
      if (!byAlarm[r.alarmId]) byAlarm[r.alarmId] = [];
      byAlarm[r.alarmId].push(r);
    });

    alarms.forEach((alarm) => {
      if (alarm.status === "FALSE_ALARM") return;
      const vehicle = vehicles.find((v) => v.id === alarm.vehicleId);
      const records = byAlarm[alarm.id] || [];
      const sorted = [...records].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const hasClosed = sorted.some((r) => r.result === "CLOSED");
      const hasOnSite = sorted.some((r) => r.result === "ON_SITE");
      const lastUrgeIdx = sorted.findIndex((r) => r.result === "URGED");
      const hasReplyAfterUrge =
        lastUrgeIdx !== -1 &&
        sorted.slice(0, lastUrgeIdx).some(
          (r) => r.result === "REPLIED" || r.result === "ON_SITE" || r.result === "CLOSED"
        );

      if (hasClosed) {
        result.closed_archive.push({ alarm, vehicle });
      } else {
        result.unclosed.push({ alarm, vehicle });
      }

      if (lastUrgeIdx !== -1 && !hasReplyAfterUrge && !hasClosed) {
        result.unreplied.push({ alarm, vehicle });
      }

      if (hasOnSite && !hasClosed) {
        result.on_site.push({ alarm, vehicle });
      }
    });

    return result;
  }, [alarms, vehicles, followUpRecords]);

  const categoryCounts = useMemo(
    () => ({
      unclosed: categorizeAlarms.unclosed.length,
      unreplied: categorizeAlarms.unreplied.length,
      on_site: categorizeAlarms.on_site.length,
      closed_archive: categorizeAlarms.closed_archive.length,
    }),
    [categorizeAlarms]
  );

  const toggleCheck = (alarmId: string) => {
    setCheckedAlarms((prev) => {
      const next = new Set(prev);
      if (next.has(alarmId)) next.delete(alarmId);
      else next.add(alarmId);
      return next;
    });
  };

  const handleTakeover = (alarmId: string) => {
    addTakeover(alarmId, currentShift.operator);
  };

  const handleHandover = (incomingPerson: string, remarks: string) => {
    const itemsToHandover = categorizeAlarms.unclosed
      .filter(({ alarm }) => checkedAlarms.has(alarm.id))
      .map(({ alarm, vehicle }) => ({
        alarmId: alarm.id,
        description: `${vehicle?.plateNumber || "未知"} - ${vehicle?.driverName || "未知"}`,
        notes: handoverNotes[alarm.id] || "",
        tripNo: vehicle?.tripNo || "",
        route: vehicle?.route || "",
        estimatedArrival: vehicle?.estimatedArrival || "",
        handler: alarm.handler || currentShift.operator,
      }));

    if (itemsToHandover.length === 0) return;

    createHandover(currentShift.operator, incomingPerson, itemsToHandover, remarks);
    setCheckedAlarms(new Set());
    setHandoverNotes({});
  };

  const handleAddFollowUp = (itemId: string) => {
    const note = followUpInputs[itemId]?.trim();
    if (!note) return;
    addHandoverFollowUp(itemId, currentShift.operator, note);
    setFollowUpInputs((prev) => ({ ...prev, [itemId]: "" }));
  };

  const groupedHistoryItems = (handoverId: string) => {
    const items = handoverItems.filter((i) => i.handoverId === handoverId);
    const grouped: Record<string, typeof items> = {};
    items.forEach((item) => {
      const key = item.tripNo || "unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return grouped;
  };

  const currentItems = categorizeAlarms[activeCategory];

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Handshake className="w-5 h-5 text-purple-400" />
            交接指挥台
          </h2>
          <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("current")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                activeTab === "current"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              指挥台
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                activeTab === "history"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              历史记录
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-800/50 rounded flex items-center gap-2">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">班次：</span>
            <span className="text-white font-medium">{currentShift.name}</span>
          </div>
          <div className="p-2 bg-slate-800/50 rounded flex items-center gap-2">
            <User className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">值班：</span>
            <span className="text-white font-medium">{currentShift.operator}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "current" ? (
          <div className="space-y-4">
            <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-semibold rounded-md transition-all ${
                    activeCategory === cat.key
                      ? `bg-slate-700 ${cat.color} ring-1 ring-slate-600`
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  {categoryCounts[cat.key] > 0 && (
                    <span className="ml-0.5 px-1 py-0.5 text-[9px] rounded-full bg-slate-600 text-white font-bold">
                      {categoryCounts[cat.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {currentItems.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                <ListChecks className="w-10 h-10 mx-auto mb-2 opacity-40" />
                本分类下暂无事项
              </div>
            ) : (
              <div className="space-y-2">
                {currentItems.map(({ alarm, vehicle }) => {
                  if (!vehicle) return null;
                  const takeover = takeoverRecords
                    .filter((t) => t.alarmId === alarm.id)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                  const isChecked = checkedAlarms.has(alarm.id);

                  return (
                    <div
                      key={alarm.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isChecked
                          ? "bg-purple-500/5 border-purple-500/30"
                          : "bg-slate-800/50 border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {activeCategory === "unclosed" && (
                          <button
                            onClick={() => toggleCheck(alarm.id)}
                            className="mt-1 flex-shrink-0"
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-4 h-4 text-purple-400" />
                            ) : (
                              <div className="w-4 h-4 rounded border-2 border-slate-500" />
                            )}
                          </button>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Truck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            <span className="text-white font-bold text-sm font-mono">
                              {vehicle.plateNumber}
                            </span>
                            <span className="px-1 py-0.5 text-[10px] rounded bg-cyan-500/10 text-cyan-400 font-mono">
                              {vehicle.tripNo}
                            </span>
                            <span
                              className="px-1 py-0.5 text-[10px] rounded font-semibold"
                              style={{
                                backgroundColor: `${getAbnormalTypeColor(alarm.abnormalType)}20`,
                                color: getAbnormalTypeColor(alarm.abnormalType),
                              }}
                            >
                              {getAbnormalTypeLabel(alarm.abnormalType)}
                            </span>
                            <span
                              className="px-1 py-0.5 text-[10px] rounded font-semibold"
                              style={{
                                backgroundColor: `${getAlarmStatusColor(alarm.status)}20`,
                                color: getAlarmStatusColor(alarm.status),
                              }}
                            >
                              {getAlarmStatusLabel(alarm.status)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mb-1.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {vehicle.route}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-500" />
                              {vehicle.driverName}
                            </span>
                          </div>

                          {alarm.remark && (
                            <div className="text-[11px] text-slate-300 mb-1.5">
                              {alarm.remark}
                            </div>
                          )}

                          {takeover && (
                            <div className="text-[10px] text-purple-300 flex items-center gap-1 mb-1.5 bg-purple-500/10 px-2 py-1 rounded">
                              <ArrowRightLeft className="w-3 h-3" />
                              {takeover.fromOperator} → {takeover.toOperator}
                              <span className="text-slate-500 font-mono ml-1">
                                {formatDateTime(takeover.timestamp)}
                              </span>
                            </div>
                          )}

                          {activeCategory === "unclosed" && (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={handoverNotes[alarm.id] || ""}
                                onChange={(e) =>
                                  setHandoverNotes((prev) => ({
                                    ...prev,
                                    [alarm.id]: e.target.value,
                                  }))
                                }
                                placeholder="交班说明..."
                                className="flex-1 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-[11px] placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                              />
                              <button
                                onClick={() => handleTakeover(alarm.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                一键接手
                              </button>
                            </div>
                          )}

                          {activeCategory === "closed_archive" && (
                            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <DoorClosed className="w-3 h-3" />
                              该车辆催办已关闭，可归档归入历史
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeCategory === "unclosed" && categoryCounts.unclosed > 0 && (
              <div className="pt-4 border-t border-slate-700">
                <HandoverForm
                  outgoingPerson={currentShift.operator}
                  onSubmit={handleHandover}
                  itemCount={checkedAlarms.size}
                  disabled={checkedAlarms.size === 0}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {handovers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无交接历史记录</p>
              </div>
            ) : (
              handovers
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.handoverTime).getTime() - new Date(a.handoverTime).getTime()
                )
                .map((handover) => {
                  const items = handoverItems.filter(
                    (i) => i.handoverId === handover.id
                  );
                  const isExpanded = expandedHistory === handover.id;

                  return (
                    <div
                      key={handover.id}
                      className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden"
                    >
                      <div
                        onClick={() =>
                          setExpandedHistory(isExpanded ? null : handover.id)
                        }
                        className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium mb-1">
                              {handover.outgoingPerson} → {handover.incomingPerson}
                            </div>
                            <div className="text-slate-500 text-xs flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(handover.handoverTime)}
                              <span className="text-slate-600">|</span>
                              <span>{handover.shiftName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-sm">
                              {items.length} 项
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-700">
                          {handover.remarks && (
                            <div className="mt-3 p-3 bg-slate-700/30 rounded-lg">
                              <div className="text-slate-400 text-xs mb-1">
                                交接备注
                              </div>
                              <p className="text-slate-300 text-sm">
                                {handover.remarks}
                              </p>
                            </div>
                          )}

                          <div className="mt-3 space-y-3">
                            {Object.entries(groupedHistoryItems(handover.id)).map(
                              ([tripNo, tripItems]) => {
                                const isTripExpanded = expandedTrip === `${handover.id}-${tripNo}`;
                                const firstItem = tripItems[0];
                                const vehicle = vehicles.find((v) => v.tripNo === tripNo);
                                const alarm = alarms.find((a) => a.id === firstItem?.alarmId);

                                return (
                                  <div
                                    key={tripNo}
                                    className="bg-slate-700/20 rounded-lg border border-slate-600/30 overflow-hidden"
                                  >
                                    <div
                                      onClick={() =>
                                        setExpandedTrip(
                                          isTripExpanded
                                            ? null
                                            : `${handover.id}-${tripNo}`
                                        )
                                      }
                                      className="p-3 cursor-pointer hover:bg-slate-700/20 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Truck className="w-4 h-4 text-cyan-400" />
                                          <span className="font-mono font-semibold text-cyan-400 text-sm">
                                            {tripNo}
                                          </span>
                                          {vehicle && (
                                            <>
                                              <span className="text-slate-400 text-xs">
                                                {vehicle.plateNumber}
                                              </span>
                                              <span className="text-slate-500 text-xs flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {firstItem.route}
                                              </span>
                                            </>
                                          )}
                                          {alarm && (
                                            <span
                                              className="px-1.5 py-0.5 text-xs rounded"
                                              style={{
                                                backgroundColor: `${getAlarmStatusColor(alarm.status)}20`,
                                                color: getAlarmStatusColor(alarm.status),
                                              }}
                                            >
                                              {getAlarmStatusLabel(alarm.status)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-500 text-xs">
                                            {tripItems.length} 事项
                                          </span>
                                          {isTripExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-slate-400" />
                                          ) : (
                                            <ChevronDown className="w-4 h-4 text-slate-400" />
                                          )}
                                        </div>
                                      </div>
                                      {firstItem.estimatedArrival && (
                                        <div className="text-slate-500 text-xs mt-1 ml-6 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          预计到仓：{formatDateTime(firstItem.estimatedArrival)}
                                          <span className="text-slate-600 mx-1">·</span>
                                          责任人：{firstItem.handler}
                                        </div>
                                      )}
                                    </div>

                                    {isTripExpanded && (
                                      <div className="px-3 pb-3 border-t border-slate-600/20">
                                        <div className="mt-2 space-y-2">
                                          {tripItems.map((item) => (
                                            <div
                                              key={item.id}
                                              className="p-3 bg-slate-700/30 rounded-lg"
                                            >
                                              <div className="text-white text-sm font-medium">
                                                {item.description}
                                              </div>
                                              {item.notes && (
                                                <p className="text-slate-400 text-xs mt-1">
                                                  交班说明：{item.notes}
                                                </p>
                                              )}

                                              {item.followUpNotes.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-slate-600/30">
                                                  <div className="text-slate-400 text-xs mb-1">
                                                    后续跟进：
                                                  </div>
                                                  {item.followUpNotes.map((note, idx) => {
                                                    const parts = note.split("|");
                                                    const time = parts[0] || "";
                                                    const person = parts[1] || "";
                                                    const content = parts.slice(2).join("|") || note;
                                                    return (
                                                      <div
                                                        key={idx}
                                                        className="text-xs text-slate-300 ml-2 mb-1"
                                                      >
                                                        <span className="text-slate-500">
                                                          {formatDateTime(time)}
                                                        </span>
                                                        <span className="text-blue-400 mx-1">
                                                          {person}
                                                        </span>
                                                        {content}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}

                                              <div className="mt-2 flex items-center gap-2">
                                                <input
                                                  type="text"
                                                  value={followUpInputs[item.id] || ""}
                                                  onChange={(e) =>
                                                    setFollowUpInputs((prev) => ({
                                                      ...prev,
                                                      [item.id]: e.target.value,
                                                    }))
                                                  }
                                                  placeholder="添加跟进说明..."
                                                  className="flex-1 px-2 py-1 bg-slate-600/30 border border-slate-500/30 rounded text-white text-xs placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddFollowUp(item.id);
                                                  }}
                                                  className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                  <MessageSquare className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
