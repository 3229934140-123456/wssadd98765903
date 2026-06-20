import { CheckSquare, Square, AlertTriangle, Truck } from "lucide-react";
import { Alarm, Vehicle } from "../../types";
import {
  getAbnormalTypeLabel,
  getAbnormalTypeColor,
  getAlarmStatusLabel,
  getAlarmStatusColor,
} from "../../utils/statusUtils";
import { getTimeAgo } from "../../utils/dateUtils";

interface HandoverItemData {
  alarm: Alarm;
  vehicle: Vehicle;
  isChecked: boolean;
  notes: string;
}

interface UnclosedListProps {
  items: HandoverItemData[];
  onToggleCheck: (alarmId: string) => void;
  onUpdateNotes: (alarmId: string, notes: string) => void;
}

export const UnclosedList = ({ items, onToggleCheck, onUpdateNotes }: UnclosedListProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>当前班次无未关闭事项</p>
        <p className="text-xs mt-1">所有异常已处理完毕</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(({ alarm, vehicle, isChecked, notes }) => (
        <div
          key={alarm.id}
          className={`p-4 rounded-lg border-2 transition-all ${
            isChecked
              ? "bg-slate-700/30 border-slate-600 opacity-70"
              : "bg-slate-800/50 border-slate-700"
          }`}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggleCheck(alarm.id)}
              className="mt-1 flex-shrink-0 transition-colors"
            >
              {isChecked ? (
                <CheckSquare className="w-5 h-5 text-emerald-400" />
              ) : (
                <Square className="w-5 h-5 text-slate-500 hover:text-slate-400" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-slate-400" />
                <span
                  className="font-mono font-bold text-white"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  {vehicle.plateNumber}
                </span>
                <span
                  className="px-2 py-0.5 text-xs rounded font-semibold"
                  style={{
                    backgroundColor: `${getAbnormalTypeColor(alarm.abnormalType)}20`,
                    color: getAbnormalTypeColor(alarm.abnormalType),
                  }}
                >
                  {getAbnormalTypeLabel(alarm.abnormalType)}
                </span>
                <span
                  className="px-2 py-0.5 text-xs rounded font-semibold"
                  style={{
                    backgroundColor: `${getAlarmStatusColor(alarm.status)}20`,
                    color: getAlarmStatusColor(alarm.status),
                  }}
                >
                  {getAlarmStatusLabel(alarm.status)}
                </span>
              </div>

              <p className="text-slate-300 text-sm mb-2">
                {alarm.remark || "暂无处置说明"}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                <span>司机：{vehicle.driverName}</span>
                <span>线路：{vehicle.route}</span>
                <span>{getTimeAgo(alarm.createdAt)}</span>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">
                  交班说明（可选）
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => onUpdateNotes(alarm.id, e.target.value)}
                  placeholder="输入交接说明..."
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <AlertTriangle
              className="w-5 h-5 flex-shrink-0"
              style={{ color: getAbnormalTypeColor(alarm.abnormalType) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
