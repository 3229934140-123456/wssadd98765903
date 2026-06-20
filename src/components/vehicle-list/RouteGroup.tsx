import { useState } from "react";
import { ChevronDown, ChevronRight, Route, AlertTriangle } from "lucide-react";
import { Vehicle } from "../../types";
import { CarrierGroup } from "./CarrierGroup";

interface RouteGroupProps {
  route: string;
  vehicles: Vehicle[];
  defaultExpanded?: boolean;
}

export const RouteGroup = ({ route, vehicles, defaultExpanded = true }: RouteGroupProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const abnormalCount = vehicles.filter((v) => v.isAbnormal).length;

  const groupedByCarrier = vehicles.reduce((acc, vehicle) => {
    if (!acc[vehicle.carrier]) {
      acc[vehicle.carrier] = [];
    }
    acc[vehicle.carrier].push(vehicle);
    return acc;
  }, {} as Record<string, Vehicle[]>);

  return (
    <div className="mb-4">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Route className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-white font-semibold">{route}</div>
            <div className="text-slate-400 text-xs">{Object.keys(groupedByCarrier).length} 家承运商</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-slate-400 text-sm">
            共 <span className="text-white font-semibold">{vehicles.length}</span> 辆车
          </div>
          {abnormalCount > 0 && (
            <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-bold">{abnormalCount}</span>
              <span className="text-red-400 text-sm">异常</span>
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-3 space-y-2 pl-4">
          {Object.entries(groupedByCarrier).map(([carrier, carrierVehicles]) => (
            <CarrierGroup key={carrier} carrier={carrier} vehicles={carrierVehicles} />
          ))}
        </div>
      )}
    </div>
  );
};
