import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { VehicleList } from "@/components/vehicle-list/VehicleList";
import { DisposalPanel } from "@/components/disposal-panel/DisposalPanel";
import { AlarmDispatch } from "@/components/alarm-dispatch/AlarmDispatch";
import { HandoverPanel } from "@/components/handover/HandoverPanel";
import { AlertTriangle, Handshake } from "lucide-react";

export default function Home() {
  const [rightPanel, setRightPanel] = useState<"alarm" | "handover">("alarm");

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
              onClick={() => setRightPanel("alarm")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-all ${
                rightPanel === "alarm"
                  ? "text-white bg-slate-800 border-b-2 border-orange-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              告警分派
            </button>
            <button
              onClick={() => setRightPanel("handover")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-all ${
                rightPanel === "handover"
                  ? "text-white bg-slate-800 border-b-2 border-purple-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Handshake className="w-5 h-5" />
              班次交接
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {rightPanel === "alarm" ? <AlarmDispatch /> : <HandoverPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
