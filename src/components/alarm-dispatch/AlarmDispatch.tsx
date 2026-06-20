import { useState } from "react";
import { AlertTriangle, Send, History, User, Clock } from "lucide-react";
import { useStore } from "../../store/useStore";
import { StatusSelector } from "./StatusSelector";
import { ReminderSetter } from "./ReminderSetter";
import { AlarmStatus } from "../../types";
import {
  getAbnormalTypeLabel,
  getAbnormalTypeColor,
  getAlarmStatusLabel,
  getAlarmStatusBgColor,
  getAlarmStatusBorderColor,
} from "../../utils/statusUtils";
import { formatDateTime, getTimeAgo } from "../../utils/dateUtils";

export const AlarmDispatch = () => {
  const { selectedVehicleId, vehicles, alarms, updateAlarmStatus, currentShift } = useStore();
  const [status, setStatus] = useState<AlarmStatus>("PENDING_VERIFY");
  const [remark, setRemark] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const alarm = alarms.find((a) => a.vehicleId === selectedVehicleId);

  const handleSubmit = () => {
    if (!alarm) return;

    updateAlarmStatus(alarm.id, status, remark, reminderMinutes);
    setShowSuccess(true);
    setRemark("");

    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
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
            <div className="mt-2 flex items-center gap-2 text-blue-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>下次提醒：{formatDateTime(alarm.nextReminder)}</span>
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
          <ReminderSetter value={reminderMinutes} onChange={setReminderMinutes} />
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
          <h3 className="text-slate-400 text-sm mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            处理记录
          </h3>
          <div className="space-y-2">
            <div className="text-xs text-slate-500">
              {formatDateTime(alarm.createdAt)} - 系统自动创建告警
            </div>
            {alarm.handler && (
              <div className="text-xs text-slate-400">
                {formatDateTime(alarm.createdAt)} - {alarm.handler} 标记为{" "}
                {getAlarmStatusLabel(alarm.status)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
