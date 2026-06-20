import { Phone, MessageSquare, Warehouse, Truck, User, PhoneCall } from "lucide-react";
import { useState } from "react";
import { useStore } from "../../store/useStore";
import { DoorTimeline } from "./DoorTimeline";
import { TemperatureChart } from "./TemperatureChart";
import { LocationTrack } from "./LocationTrack";
import { DriverReport } from "./DriverReport";
import { getAbnormalTypeLabel, getAbnormalTypeColor, getAbnormalTypeBgColor } from "../../utils/statusUtils";
import { getTimeAgo } from "../../utils/dateUtils";

export const DisposalPanel = () => {
  const {
    selectedVehicleId,
    vehicles,
    doorEvents,
    temperatureRecords,
    locationPoints,
    driverReports,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"timeline" | "temperature" | "location" | "report">("timeline");
  const [calling, setCalling] = useState<string | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  if (!selectedVehicle) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900/30">
        <div className="text-center">
          <Truck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-slate-400 text-lg mb-2">请选择一辆车</h3>
          <p className="text-slate-500 text-sm">点击左侧车辆列表查看详情</p>
        </div>
      </div>
    );
  }

  const events = doorEvents[selectedVehicle.id] || [];
  const tempRecords = temperatureRecords[selectedVehicle.id] || [];
  const locations = locationPoints[selectedVehicle.id] || [];
  const reports = driverReports[selectedVehicle.id] || [];

  const statusColor = getAbnormalTypeColor(selectedVehicle.abnormalType);
  const statusBg = getAbnormalTypeBgColor(selectedVehicle.abnormalType);

  const handleCall = (type: "driver" | "warehouse") => {
    setCalling(type);
    setTimeout(() => {
      setCalling(null);
    }, 3000);
  };

  const tabs = [
    { id: "timeline", label: "门磁时间线", icon: "⏱" },
    { id: "temperature", label: "温度曲线", icon: "🌡" },
    { id: "location", label: "定位轨迹", icon: "📍" },
    { id: "report", label: "司机上报", icon: "📝" },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-slate-900/30">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2
                className="text-xl font-bold text-white"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                {selectedVehicle.plateNumber}
              </h2>
              {selectedVehicle.isAbnormal && (
                <span
                  className="px-3 py-1 text-sm font-semibold rounded-lg"
                  style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                >
                  {getAbnormalTypeLabel(selectedVehicle.abnormalType)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-slate-400">
                <User className="w-4 h-4" />
                <span>{selectedVehicle.driverName}</span>
                <span className="text-slate-500">({selectedVehicle.driverPhone})</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Truck className="w-4 h-4" />
                <span>{selectedVehicle.carrier}</span>
              </div>
              <div className="text-slate-500">
                最后更新：{getTimeAgo(selectedVehicle.lastUpdate)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`px-4 py-2 rounded-lg ${statusBg} border ${selectedVehicle.isAbnormal ? "border-red-500/30" : "border-emerald-500/30"}`}
            >
              <div className="text-slate-400 text-xs mb-1">当前温度</div>
              <div
                className={`text-2xl font-bold ${
                  selectedVehicle.currentTemp > 8 || selectedVehicle.currentTemp < 0
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {selectedVehicle.currentTemp}℃
              </div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700">
              <div className="text-slate-400 text-xs mb-1">运行状态</div>
              <div className="text-white font-semibold">{selectedVehicle.status}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCall("driver")}
            disabled={calling !== null}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              calling === "driver"
                ? "bg-emerald-500 text-white animate-pulse"
                : "bg-blue-500 hover:bg-blue-600 text-white active:scale-95"
            }`}
          >
            {calling === "driver" ? (
              <>
                <PhoneCall className="w-5 h-5 animate-bounce" />
                正在拨打司机电话...
              </>
            ) : (
              <>
                <Phone className="w-5 h-5" />
                一键拨打司机
              </>
            )}
          </button>
          <button
            onClick={() => handleCall("warehouse")}
            disabled={calling !== null}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              calling === "warehouse"
                ? "bg-emerald-500 text-white animate-pulse"
                : "bg-purple-500 hover:bg-purple-600 text-white active:scale-95"
            }`}
          >
            {calling === "warehouse" ? (
              <>
                <PhoneCall className="w-5 h-5 animate-bounce" />
                正在通知仓库值班人...
              </>
            ) : (
              <>
                <Warehouse className="w-5 h-5" />
                通知仓库值班人
              </>
            )}
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all active:scale-95">
            <MessageSquare className="w-5 h-5" />
            发送消息
          </button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-slate-700">
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "timeline" && <DoorTimeline events={events} />}
        {activeTab === "temperature" && <TemperatureChart records={tempRecords} />}
        {activeTab === "location" && <LocationTrack points={locations} />}
        {activeTab === "report" && <DriverReport reports={reports} />}
      </div>
    </div>
  );
};
