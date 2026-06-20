import { useState } from "react";
import {
  Handshake,
  ListChecks,
  History,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { UnclosedList } from "./UnclosedList";
import { HandoverForm } from "./HandoverForm";
import { formatDateTime } from "../../utils/dateUtils";

export const HandoverPanel = () => {
  const { alarms, vehicles, handovers, handoverItems, currentShift, createHandover } = useStore();
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

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
      })),
      remarks
    );

    setHandoverItemsData((prev) =>
      prev.map((item) => ({ ...item, isChecked: true, notes: "" }))
    );
  };

  const checkedCount = handoverItemsData.filter((i) => i.isChecked).length;

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

                          <div className="mt-3 space-y-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="p-3 bg-slate-700/30 rounded-lg"
                              >
                                <div className="text-white text-sm font-medium">
                                  {item.description}
                                </div>
                                {item.notes && (
                                  <p className="text-slate-400 text-xs mt-1">
                                    备注：{item.notes}
                                  </p>
                                )}
                              </div>
                            ))}
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
