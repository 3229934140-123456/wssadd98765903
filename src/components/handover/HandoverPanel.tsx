import { useState } from "react";
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
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { UnclosedList } from "./UnclosedList";
import { HandoverForm } from "./HandoverForm";
import { formatDateTime } from "../../utils/dateUtils";
import {
  getAbnormalTypeLabel,
  getAbnormalTypeColor,
  getAlarmStatusLabel,
  getAlarmStatusColor,
} from "../../utils/statusUtils";

export const HandoverPanel = () => {
  const {
    alarms,
    vehicles,
    handovers,
    handoverItems,
    currentShift,
    createHandover,
    addHandoverFollowUp,
  } = useStore();
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [followUpInputs, setFollowUpInputs] = useState<Record<string, string>>({});

  const unclosedAlarms = alarms.filter((a) => a.status !== "FALSE_ALARM");

  const [handoverItemsData, setHandoverItemsData] = useState(
    unclosedAlarms.map((alarm) => ({
      alarm,
      vehicle: vehicles.find((v) => v.id === alarm.vehicleId)!,
      isChecked: true,
      notes: "",
    }))
  );

  const handleToggleCheck = (alarmId: string) => {
    setHandoverItemsData((prev) =>
      prev.map((item) =>
        item.alarm.id === alarmId ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const handleUpdateNotes = (alarmId: string, notes: string) => {
    setHandoverItemsData((prev) =>
      prev.map((item) =>
        item.alarm.id === alarmId ? { ...item, notes } : item
      )
    );
  };

  const handleHandover = (incomingPerson: string, remarks: string) => {
    const checkedItems = handoverItemsData.filter((item) => item.isChecked);

    createHandover(
      currentShift.operator,
      incomingPerson,
      checkedItems.map((item) => ({
        alarmId: item.alarm.id,
        description: `${item.vehicle.plateNumber} - ${item.vehicle.driverName}`,
        notes: item.notes,
        tripNo: item.vehicle.tripNo,
        route: item.vehicle.route,
        estimatedArrival: item.vehicle.estimatedArrival,
        handler: item.alarm.handler || currentShift.operator,
      })),
      remarks
    );

    setHandoverItemsData((prev) =>
      prev.map((item) => ({ ...item, isChecked: true, notes: "" }))
    );
  };

  const handleAddFollowUp = (itemId: string) => {
    const note = followUpInputs[itemId]?.trim();
    if (!note) return;
    addHandoverFollowUp(itemId, currentShift.operator, note);
    setFollowUpInputs((prev) => ({ ...prev, [itemId]: "" }));
  };

  const checkedCount = handoverItemsData.filter((i) => i.isChecked).length;

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

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Handshake className="w-5 h-5 text-purple-400" />
            班次交接
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
              待交接
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
            <div>
              <h3 className="text-slate-400 text-sm mb-3 flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                未关闭事项清单
                <span className="text-blue-400 font-semibold">
                  ({checkedCount}/{handoverItemsData.length} 项已勾选)
                </span>
              </h3>
              <UnclosedList
                items={handoverItemsData}
                onToggleCheck={handleToggleCheck}
                onUpdateNotes={handleUpdateNotes}
              />
            </div>

            {handoverItemsData.length > 0 && (
              <div className="pt-4 border-t border-slate-700">
                <h3 className="text-slate-400 text-sm mb-3">交接确认</h3>
                <HandoverForm
                  outgoingPerson={currentShift.operator}
                  onSubmit={handleHandover}
                  itemCount={checkedCount}
                  disabled={checkedCount === 0}
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
