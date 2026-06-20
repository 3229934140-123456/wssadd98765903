import { AlertTriangle, ListFilter, Filter, X, Clock } from "lucide-react";
import { useState } from "react";
import { useStore } from "../../store/useStore";
import { RouteGroup } from "./RouteGroup";
import { Vehicle, AbnormalType } from "../../types";
import { getAbnormalTypeLabel, getAbnormalTypeColor } from "../../utils/statusUtils";

type FilterState = {
  abnormalType: AbnormalType | "ALL";
  carrier: string;
  route: string;
  reminderExpiring: boolean;
};

export const VehicleList = () => {
  const { vehicles, alarms } = useStore();
  const [filter, setFilter] = useState<"all" | "abnormal">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    abnormalType: "ALL",
    carrier: "ALL",
    route: "ALL",
    reminderExpiring: false,
  });

  const falseAlarmVehicleIds = alarms
    .filter((a) => a.status === "FALSE_ALARM")
    .map((a) => a.vehicleId);

  const abnormalVehicles = vehicles.filter(
    (v) => v.isAbnormal && !falseAlarmVehicleIds.includes(v.id)
  );

  const carriers = [...new Set(vehicles.map((v) => v.carrier))];
  const routes = [...new Set(vehicles.map((v) => v.route))];

  const reminderExpiringVehicleIds = alarms
    .filter((a) => {
      if (a.status === "FALSE_ALARM" || !a.nextReminder) return false;
      return new Date(a.nextReminder).getTime() < Date.now();
    })
    .map((a) => a.vehicleId);

  let displayVehicles = filter === "abnormal" ? abnormalVehicles : vehicles;

  displayVehicles = displayVehicles.filter((v) => {
    if (filters.abnormalType !== "ALL" && v.abnormalType !== filters.abnormalType) return false;
    if (filters.carrier !== "ALL" && v.carrier !== filters.carrier) return false;
    if (filters.route !== "ALL" && v.route !== filters.route) return false;
    if (filters.reminderExpiring && !reminderExpiringVehicleIds.includes(v.id)) return false;
    return true;
  });

  const sortedVehicles: Vehicle[] = [...displayVehicles].sort((a, b) => {
    const aIsAbnormal = a.isAbnormal && !falseAlarmVehicleIds.includes(a.id);
    const bIsAbnormal = b.isAbnormal && !falseAlarmVehicleIds.includes(b.id);
    if (aIsAbnormal && !bIsAbnormal) return -1;
    if (!aIsAbnormal && bIsAbnormal) return 1;

    if (filters.reminderExpiring) {
      const aAlarm = alarms.find((al) => al.vehicleId === a.id);
      const bAlarm = alarms.find((al) => al.vehicleId === b.id);
      const aTime = aAlarm?.nextReminder ? new Date(aAlarm.nextReminder).getTime() : Infinity;
      const bTime = bAlarm?.nextReminder ? new Date(bAlarm.nextReminder).getTime() : Infinity;
      if (aTime !== bTime) return aTime - bTime;
    }

    return 0;
  });

  const groupedByRoute = sortedVehicles.reduce((acc, vehicle) => {
    if (!acc[vehicle.route]) {
      acc[vehicle.route] = [];
    }
    acc[vehicle.route].push(vehicle);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  const activeFilterCount = [
    filters.abnormalType !== "ALL",
    filters.carrier !== "ALL",
    filters.route !== "ALL",
    filters.reminderExpiring,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      abnormalType: "ALL",
      carrier: "ALL",
      route: "ALL",
      reminderExpiring: false,
    });
  };

  const abnormalTypes: { value: AbnormalType; label: string; color: string }[] = [
    { value: "DOOR_OPEN_WHILE_DRIVING", label: "行驶中开门", color: getAbnormalTypeColor("DOOR_OPEN_WHILE_DRIVING") },
    { value: "DOOR_OPEN_TOO_LONG", label: "长时间未关", color: getAbnormalTypeColor("DOOR_OPEN_TOO_LONG") },
    { value: "SENSOR_OFFLINE", label: "门磁离线", color: getAbnormalTypeColor("SENSOR_OFFLINE") },
    { value: "FREQUENT_OPEN_CLOSE", label: "频繁开合", color: getAbnormalTypeColor("FREQUENT_OPEN_CLOSE") },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-blue-400" />
            车辆监控列表
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              筛选
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700 space-y-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">异常类型</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilters((f) => ({ ...f, abnormalType: "ALL" }))}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    filters.abnormalType === "ALL"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  全部
                </button>
                {abnormalTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFilters((f) => ({ ...f, abnormalType: type.value }))}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                      filters.abnormalType === type.value
                        ? "text-white"
                        : "bg-slate-700 text-slate-400 hover:text-white"
                    }`}
                    style={
                      filters.abnormalType === type.value
                        ? { backgroundColor: type.color }
                        : undefined
                    }
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">承运商</label>
                <select
                  value={filters.carrier}
                  onChange={(e) => setFilters((f) => ({ ...f, carrier: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">全部承运商</option>
                  {carriers.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">线路</label>
                <select
                  value={filters.route}
                  onChange={(e) => setFilters((f) => ({ ...f, route: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="ALL">全部线路</option>
                  {routes.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.reminderExpiring}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, reminderExpiring: e.target.checked }))
                  }
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-slate-300 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-400" />
                  仅显示提醒已到期
                </span>
                {reminderExpiringVehicleIds.length > 0 && (
                  <span className="text-orange-400 text-xs font-semibold">
                    ({reminderExpiringVehicleIds.length})
                  </span>
                )}
              </label>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
                清除筛选
              </button>
            )}
          </div>
        )}

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

        {abnormalVehicles.length > 0 && filter === "all" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-2">
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
            <p>
              {activeFilterCount > 0 ? "当前筛选条件下无车辆" : "暂无车辆数据"}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-400 text-sm hover:text-blue-300"
              >
                清除筛选
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
