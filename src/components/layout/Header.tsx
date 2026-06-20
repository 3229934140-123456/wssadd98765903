import { useEffect, useState } from "react";
import { Bell, BellOff, RefreshCw, Thermometer, Truck, AlertTriangle } from "lucide-react";
import { useStore } from "../../store/useStore";
import { formatDateTime } from "../../utils/dateUtils";

export const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { vehicles, currentShift, soundEnabled, toggleSound, refreshData } = useStore();

  const abnormalCount = vehicles.filter((v) => v.isAbnormal).length;
  const totalVehicles = vehicles.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(timer);
  }, [refreshData]);

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-700 px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              冷链运营中心
            </h1>
            <p className="text-xs text-slate-400">COLD CHAIN OPERATION CENTER</p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700" />

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">当前班次：</span>
            <span className="text-blue-400 font-semibold">{currentShift.name}</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-400">{currentShift.operator}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
            <Truck className="w-4 h-4 text-slate-400" />
            <span className="text-white font-semibold">{totalVehicles}</span>
            <span className="text-slate-400 text-sm">在途车辆</span>
          </div>

          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-bold">{abnormalCount}</span>
            <span className="text-red-400 text-sm">异常告警</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-white font-mono text-lg">{formatDateTime(currentTime.toISOString())}</div>
          <div className="text-slate-400 text-xs">系统实时时间</div>
        </div>

        <div className="h-8 w-px bg-slate-700" />

        <button
          onClick={refreshData}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="刷新数据"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <button
          onClick={toggleSound}
          className={`p-2 rounded-lg transition-all ${
            soundEnabled
              ? "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
          title={soundEnabled ? "关闭告警声音" : "开启告警声音"}
        >
          {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
          <Thermometer className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 text-sm">0-8℃</span>
          <span className="text-slate-400 text-xs">标准区间</span>
        </div>
      </div>
    </header>
  );
};
