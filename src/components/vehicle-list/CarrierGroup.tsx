import { useState } from "react";
import { ChevronDown, ChevronRight, Building2, AlertTriangle } from "lucide-react";
import { Vehicle } from "../../types";
import { VehicleCard } from "./VehicleCard";

interface CarrierGroupProps {
  carrier: string;
  vehicles: Vehicle[];
  defaultExpanded?: boolean;
}

export const CarrierGroup = ({ carrier, vehicles, defaultExpanded = true }: CarrierGroupProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const abnormalCount = vehicles.filter((v) => v.isAbnormal).length;

  const sortedVehicles = [...vehicles].sort((a, b) => {
    if (a.isAbnormal && !b.isAbnormal) return -1;
    if (!a.isAbnormal && b.isAbnormal) return 1;
    return 0;
  });

  return (
    <div className="mb-2">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-800 rounded cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <Building2 className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-200 font-medium text-sm">{carrier}</span>
          <span className="text-slate-500 text-xs">({vehicles.length}辆)</span>
        </div>
        {abnormalCount > 0 && (
          <div className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-red-400 text-xs font-semibold">{abnormalCount}</span>
          </div>
        )}
      </div>
      {expanded && (
        <div className="mt-2 space-y-2 pl-4">
          {sortedVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
};
