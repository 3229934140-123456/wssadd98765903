import { Clock, ChevronDown } from "lucide-react";
import { useState } from "react";

interface ReminderSetterProps {
  value: number | null;
  onChange: (minutes: number | null) => void;
}

export const ReminderSetter = ({ value, onChange }: ReminderSetterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { label: "不设置提醒", value: null },
    { label: "15分钟后", value: 15 },
    { label: "30分钟后", value: 30 },
    { label: "1小时后", value: 60 },
    { label: "2小时后", value: 120 },
    { label: "4小时后", value: 240 },
    { label: "明天同一时间", value: 1440 },
  ];

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700/50 hover:border-slate-500 transition-all"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-white font-medium">{selectedOption.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {options.map((option) => (
            <button
              key={option.label}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700 transition-colors ${
                value === option.value ? "bg-slate-700" : ""
              }`}
            >
              <span className="text-white">{option.label}</span>
              {value === option.value && (
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
