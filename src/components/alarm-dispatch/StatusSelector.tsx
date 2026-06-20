import { CheckCircle, Clock, AlertTriangle, XCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { AlarmStatus } from "../../types";
import { getAlarmStatusLabel, getAlarmStatusColor, getAlarmStatusBgColor } from "../../utils/statusUtils";

interface StatusSelectorProps {
  value: AlarmStatus;
  onChange: (status: AlarmStatus) => void;
}

export const StatusSelector = ({ value, onChange }: StatusSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const statuses: { value: AlarmStatus; icon: React.ReactNode }[] = [
    { value: "PENDING_VERIFY", icon: <Clock className="w-4 h-4" /> },
    { value: "CONTACTED", icon: <CheckCircle className="w-4 h-4" /> },
    { value: "NEED_QC", icon: <AlertTriangle className="w-4 h-4" /> },
    { value: "FALSE_ALARM", icon: <XCircle className="w-4 h-4" /> },
  ];

  const currentStatus = statuses.find((s) => s.value === value) || statuses[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${getAlarmStatusBgColor(value)} border-slate-600 hover:border-slate-500`}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: getAlarmStatusColor(value) }}>
            {currentStatus.icon}
          </span>
          <span className="text-white font-medium">{getAlarmStatusLabel(value)}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => {
                onChange(status.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors ${
                value === status.value ? "bg-slate-700" : ""
              }`}
            >
              <span style={{ color: getAlarmStatusColor(status.value) }}>
                {status.icon}
              </span>
              <span className="text-white">{getAlarmStatusLabel(status.value)}</span>
              {value === status.value && (
                <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
