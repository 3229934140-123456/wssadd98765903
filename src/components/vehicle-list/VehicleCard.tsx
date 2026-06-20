import { Thermometer, User, Phone, MapPin } from "lucide-react";
import { Vehicle } from "../../types";
import { useStore } from "../../store/useStore";
import { getAbnormalTypeLabel, getAbnormalTypeColor, getAbnormalTypeBgColor, getAbnormalTypeBorderColor } from "../../utils/statusUtils";
import { getTimeAgo } from "../../utils/dateUtils";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export const VehicleCard = ({ vehicle }: VehicleCardProps) => {
  const { selectedVehicleId, setSelectedVehicleId, alarms } = useStore();
  const isSelected = selectedVehicleId === vehicle.id;
  const alarm = alarms.find((a) => a.vehicleId === vehicle.id);

  const statusColor = getAbnormalTypeColor(vehicle.abnormalType);
  const statusBg = getAbnormalTypeBgColor(vehicle.abnormalType);
  const statusBorder = getAbnormalTypeBorderColor(vehicle.abnormalType);

  const tempColor = vehicle.currentTemp > 8 || vehicle.currentTemp < 0 ? "text-red-400" : "text-emerald-400";

  return (
    <div
      onClick={() => setSelectedVehicleId(vehicle.id)}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
        isSelected
          ? `border-blue-500 bg-blue-500/10 scale-[1.02] shadow-lg shadow-blue-500/20`
          : `${statusBorder} ${statusBg} hover:scale-[1.01] hover:shadow-md`
      } ${vehicle.isAbnormal ? "animate-pulse-slow" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-base" style={{ fontFamily: "JetBrains Mono, monospace" }}>
              {vehicle.plateNumber}
            </span>
            {vehicle.isAbnormal && (
              <span
                className="px-2 py-0.5 text-xs font-semibold rounded"
                style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
              >
                {getAbnormalTypeLabel(vehicle.abnormalType)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs">
            <MapPin className="w-3 h-3" />
            <span>{vehicle.route}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <Thermometer className={`w-4 h-4 ${tempColor}`} />
            <span className={`font-bold ${tempColor}`}>{vehicle.currentTemp}℃</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">{vehicle.status}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{vehicle.driverName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{vehicle.driverPhone}</span>
          </div>
        </div>
        <div className="text-slate-500">{getTimeAgo(vehicle.lastUpdate)}</div>
      </div>

      {alarm && alarm.remark && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-400 line-clamp-2">
            <span className="text-slate-500">最新处理：</span>
            {alarm.remark}
          </p>
        </div>
      )}

      {vehicle.isAbnormal && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{
            backgroundColor: statusColor,
            boxShadow: `0 0 12px ${statusColor}`,
            animation: "blink 1.5s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
};
