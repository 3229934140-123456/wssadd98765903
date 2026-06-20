import React from "react";
import { Search, Phone, Warehouse, Megaphone, CheckCircle2 } from "lucide-react";

export type PhaseKey = "discovery" | "contact" | "qc_transfer" | "urge" | "close";

export interface PhaseDef {
  key: PhaseKey;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  borderColor: string;
}

export const PHASE_DEFS: Record<PhaseKey, PhaseDef> = {
  discovery: {
    key: "discovery",
    label: "发现阶段",
    icon: <Search className="w-4 h-4 text-red-400" />,
    accentColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  contact: {
    key: "contact",
    label: "联系阶段",
    icon: <Phone className="w-4 h-4 text-blue-400" />,
    accentColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  qc_transfer: {
    key: "qc_transfer",
    label: "质控移交",
    icon: <Warehouse className="w-4 h-4 text-purple-400" />,
    accentColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  urge: {
    key: "urge",
    label: "催办阶段",
    icon: <Megaphone className="w-4 h-4 text-orange-400" />,
    accentColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  close: {
    key: "close",
    label: "关闭阶段",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    accentColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
};

export const PHASE_ORDER: PhaseKey[] = [
  "discovery",
  "contact",
  "qc_transfer",
  "urge",
  "close",
];

export const getPhaseForItem = (
  type: string,
  actionType?: string,
  subType?: string
): PhaseKey | null => {
  if (type === "door" || type === "temperature" || type === "location") {
    return "discovery";
  }
  if (type === "driver_report") return "contact";
  if (actionType === "CALL_DRIVER" || actionType === "SEND_MESSAGE") return "contact";
  if (actionType === "STATUS_CHANGE" && subType === "CONTACTED") return "contact";
  if (actionType === "NOTIFY_WAREHOUSE") return "qc_transfer";
  if (actionType === "STATUS_CHANGE" && subType === "NEED_QC") return "qc_transfer";
  if (actionType === "FOLLOW_UP" && subType === "URGED") return "urge";
  if (actionType === "REMINDER_CHANGE") return "urge";
  if (actionType === "FOLLOW_UP" && subType === "ON_SITE") return "urge";
  if (actionType === "FOLLOW_UP" && subType === "REPLIED") return "urge";
  if (actionType === "FOLLOW_UP" && subType === "CLOSED") return "close";
  if (
    actionType === "STATUS_CHANGE" &&
    (subType === "FALSE_ALARM" || subType === "TAKEOVER")
  )
    return "close";
  return null;
};
