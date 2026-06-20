import { AlertTriangle, ListFilter } from "lucide-react";
import { useState } from "react";
import { useStore } from "../../store/useStore";
import { RouteGroup } from "./RouteGroup";
import { Vehicle } from "../../types";

export const VehicleList = () => {
  const { vehicles } = useStore();
  const [filter, setFilter] = useState<"all" | "abnormal">("all");

  const abnormalVehicles = vehicles.filter((v) => v.isAbnormal);
  const displayVehicles = filter === "abnormal" ? abnormalVehicles : vehicles;

  const sortedVehicles: Vehicle[] = [...displayVehicles].sort((a, b) => {
    if (a.isAbnormal && !b.isAbnormal) return -1;
    if (!a.isAbnormal && b.isAbnormal) return 1;
    return 0;
  });

  const groupedByRoute = sortedVehicles.reduce((acc, vehicle) => {
    if (!acc[vehicle.route]) {
      acc[vehicle.route] = [];
    }
    acc[vehicle.route].push(vehicle);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-blue-400" />
            车辆监控列表
          </h2>
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter("abnormal")}
              className={`px-3 py-1 text-sm rounded-md transition-all flex items-center gap-1 ${
                filter === "abnormal"
                  ? "bg-red-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              异常 ({abnormalVehicles.length})
            </button>
          </div>
        </div>

        {abnormalVehicles.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">
                当前有 <span className="font-bold">{abnormalVehicles.length}</span> 辆车存在门磁异常，请优先处置
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {Object.entries(groupedByRoute).map(([route, routeVehicles]) => (
          <RouteGroup key={route} route={route} vehicles={routeVehicles} />
        ))}

        {sortedVehicles.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无车辆数据</p>
          </div>
        )}
      </div>
    </div>
  );
};
