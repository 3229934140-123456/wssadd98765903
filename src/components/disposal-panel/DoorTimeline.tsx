import { Clock, DoorOpen, DoorClosed, AlertTriangle } from "lucide-react";
import { DoorEvent } from "../../types";
import { formatDateTime } from "../../utils/dateUtils";

interface DoorTimelineProps {
  events: DoorEvent[];
}

export const DoorTimeline = ({ events }: DoorTimelineProps) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "OPEN":
        return <DoorOpen className="w-4 h-4 text-amber-400" />;
      case "CLOSE":
        return <DoorClosed className="w-4 h-4 text-emerald-400" />;
      case "ABNORMAL":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEventBg = (eventType: string) => {
    switch (eventType) {
      case "OPEN":
        return "bg-amber-500/20 border-amber-500/30";
      case "CLOSE":
        return "bg-emerald-500/20 border-emerald-500/30";
      case "ABNORMAL":
        return "bg-red-500/20 border-red-500/30";
      default:
        return "bg-slate-500/20 border-slate-500/30";
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case "OPEN":
        return "车门打开";
      case "CLOSE":
        return "车门关闭";
      case "ABNORMAL":
        return "异常事件";
      default:
        return "未知事件";
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-400" />
        门磁事件时间线
      </h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-10">
              <div
                className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${getEventBg(event.eventType)} ${
                  event.eventType === "ABNORMAL" ? "animate-pulse" : ""
                }`}
              >
                {getEventIcon(event.eventType)}
              </div>
              <div
                className={`p-3 rounded-lg border ${getEventBg(event.eventType)} ${
                  index === 0 ? "ring-2 ring-blue-500/50" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium text-sm">
                    {getEventLabel(event.eventType)}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-1">{event.description}</p>
                <p className="text-slate-500 text-xs">📍 {event.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
