import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { VehicleList } from "@/components/vehicle-list/VehicleList";
import { DisposalPanel } from "@/components/disposal-panel/DisposalPanel";
import { AlarmDispatch } from "@/components/alarm-dispatch/AlarmDispatch";
import { SlaDashboard } from "@/components/alarm-dispatch/SlaDashboard";
import { HandoverPanel } from "@/components/handover/HandoverPanel";
import { AlertTriangle, Handshake, Ticket } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function Home() {
  const [rightPanel, setRightPanel] = useState<"alarm" | "sla" | "handover">("sla");
  const alarms = useStore((s) => s.alarms);
  const activeSlaCount = alarms.filter((a) => {
    if (a.status === "FALSE_ALARM") return false;
    const isPendingOverdue =
      a.status === "PENDING_VERIFY" &&
      Date.now() - new Date(a.createdAt).getTime() > 15 * 60 * 1000;
    const isReminderExpired =
      a.status !== "PENDING_VERIFY" &&
      !!a.nextReminder &&
      new Date(a.nextReminder).getTime() < Date.now();
    const isQcPending =
      a.status === "NEED_QC" &&
      Date.now() - new Date(a.createdAt).getTime() > 30 * 60 * 1000;
    return isPendingOverdue || isReminderExpired || isQcPending;
  }).length;

  return (
    <div className="h-screen flex flex-col bg-slate-950 grid-bg">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[28%] min-w-[320px] border-r border-slate-700 overflow-hidden">
          <VehicleList />
        </div>

        <div className="flex-1 border-r border-slate-700 overflow-hidden">
          <DisposalPanel />
        </div>

        <div className="w-[30%] min-w-[350px] flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-700 bg-slate-900/50">
            <button
              onClick={() => setRightPanel("sla")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 font-semibold text-sm transition-all relative ${
                rightPanel === "sla"
                  ? "text-white bg-slate-800 border-b-2 border-amber-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Ticket className="w-4 h-4" />
              SLA 升级
              {activeSlaCount > 0 && (
                <span
                  className={`ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    rightPanel === "sla"
                      ? "bg-red-500 text-white"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {activeSlaCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setRightPanel("alarm")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 font-semibold text-sm transition-all ${
                rightPanel === "alarm"
                  ? "text-white bg-slate-800 border-b-2 border-orange-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              告警分派
            </button>
            <button
              onClick={() => setRightPanel("handover")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 font-semibold text-sm transition-all ${
                rightPanel === "handover"
                  ? "text-white bg-slate-800 border-b-2 border-purple-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Handshake className="w-4 h-4" />
              班次交接
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {rightPanel === "alarm" && <AlarmDispatch />}
            {rightPanel === "sla" && <SlaDashboard />}
            {rightPanel === "handover" && <HandoverPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
