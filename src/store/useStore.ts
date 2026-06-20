import { create } from "zustand";
import {
  Vehicle,
  DoorEvent,
  TemperatureRecord,
  LocationPoint,
  DriverReport,
  Alarm,
  Handover,
  HandoverItem,
  AlarmStatus,
  DisposalAction,
} from "../types";
import {
  mockVehicles,
  mockDoorEvents,
  mockTemperatureRecords,
  mockLocationPoints,
  mockDriverReports,
  mockAlarms,
} from "../data/mockData";
import { getCurrentShift, generateReminderTime } from "../utils/dateUtils";

interface AppStore {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  doorEvents: Record<string, DoorEvent[]>;
  temperatureRecords: Record<string, TemperatureRecord[]>;
  locationPoints: Record<string, LocationPoint[]>;
  driverReports: Record<string, DriverReport[]>;
  alarms: Alarm[];
  handovers: Handover[];
  handoverItems: HandoverItem[];
  disposalActions: Record<string, DisposalAction[]>;
  currentShift: {
    name: string;
    operator: string;
  };
  soundEnabled: boolean;
  setSelectedVehicleId: (id: string | null) => void;
  updateAlarmStatus: (
    alarmId: string,
    status: AlarmStatus,
    remark: string,
    remindMinutes: number | null | undefined
  ) => void;
  addDisposalAction: (
    vehicleId: string,
    action: "CALL_DRIVER" | "NOTIFY_WAREHOUSE" | "SEND_MESSAGE",
    detail: string
  ) => void;
  createHandover: (
    outgoingPerson: string,
    incomingPerson: string,
    items: {
      alarmId: string;
      description: string;
      notes: string;
      tripNo: string;
      route: string;
      estimatedArrival: string;
      handler: string;
    }[],
    remarks: string
  ) => void;
  addHandoverFollowUp: (itemId: string, person: string, note: string) => void;
  toggleSound: () => void;
  refreshData: () => void;
}

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const buildVehiclesFromAlarms = (baseVehicles: Vehicle[], alarms: Alarm[]): Vehicle[] => {
  const falseAlarmVehicleIds = alarms
    .filter((a) => a.status === "FALSE_ALARM")
    .map((a) => a.vehicleId);
  return baseVehicles.map((v) =>
    falseAlarmVehicleIds.includes(v.id)
      ? { ...v, isAbnormal: false, abnormalType: "NORMAL" as const }
      : v
  );
};

const initialAlarms = loadFromStorage("alarms", mockAlarms);
const initialVehicles = buildVehiclesFromAlarms(mockVehicles, initialAlarms);
const initialSelectedVehicleId = initialVehicles.find((v) => v.isAbnormal)?.id || null;

export const useStore = create<AppStore>((set, get) => ({
  vehicles: initialVehicles,
  selectedVehicleId: initialSelectedVehicleId,
  doorEvents: mockDoorEvents,
  temperatureRecords: mockTemperatureRecords,
  locationPoints: mockLocationPoints,
  driverReports: mockDriverReports,
  alarms: initialAlarms,
  handovers: loadFromStorage("handovers", []),
  handoverItems: loadFromStorage("handoverItems", []),
  disposalActions: loadFromStorage("disposalActions", {}),
  currentShift: getCurrentShift(),
  soundEnabled: true,

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),

  updateAlarmStatus: (alarmId, status, remark, remindMinutes) => {
    const existingAlarm = get().alarms.find((a) => a.id === alarmId);
    if (!existingAlarm) return;

    let nextReminder: string | null = existingAlarm.nextReminder;
    if (remindMinutes === null) {
      nextReminder = null;
    } else if (remindMinutes !== undefined) {
      nextReminder = generateReminderTime(remindMinutes);
    }

    const alarms = get().alarms.map((alarm) =>
      alarm.id === alarmId
        ? {
            ...alarm,
            status,
            remark,
            nextReminder,
            handler: get().currentShift.operator,
          }
        : alarm
    );
    set({ alarms });
    saveToStorage("alarms", alarms);

    if (status === "FALSE_ALARM") {
      const vehicles = get().vehicles.map((v) => {
        const alarm = alarms.find((a) => a.id === alarmId);
        if (alarm && alarm.vehicleId === v.id) {
          return { ...v, isAbnormal: false, abnormalType: "NORMAL" as const };
        }
        return v;
      });
      set({ vehicles });
      saveToStorage("vehicles", JSON.stringify(vehicles));
    }
  },

  addDisposalAction: (vehicleId, action, detail) => {
    const newAction: DisposalAction = {
      id: `da-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      vehicleId,
      actionType: action,
      timestamp: new Date().toISOString(),
      detail,
      operator: get().currentShift.operator,
    };
    const existing = get().disposalActions[vehicleId] || [];
    const updated = { ...get().disposalActions, [vehicleId]: [...existing, newAction] };
    set({ disposalActions: updated });
    saveToStorage("disposalActions", updated);
  },

  createHandover: (outgoingPerson, incomingPerson, items, remarks) => {
    const handoverId = `h${Date.now()}`;
    const newHandover: Handover = {
      id: handoverId,
      shiftName: get().currentShift.name,
      outgoingPerson,
      incomingPerson,
      handoverTime: new Date().toISOString(),
      remarks,
    };

    const newHandoverItems: HandoverItem[] = items.map((item, index) => ({
      id: `${handoverId}-i${index}`,
      handoverId,
      alarmId: item.alarmId,
      description: item.description,
      isChecked: true,
      notes: item.notes,
      tripNo: item.tripNo,
      route: item.route,
      estimatedArrival: item.estimatedArrival,
      handler: item.handler,
      followUpNotes: [],
    }));

    const handovers = [...get().handovers, newHandover];
    const handoverItems = [...get().handoverItems, ...newHandoverItems];

    set({ handovers, handoverItems });
    saveToStorage("handovers", handovers);
    saveToStorage("handoverItems", handoverItems);
  },

  addHandoverFollowUp: (itemId, person, note) => {
    const handoverItems = get().handoverItems.map((item) =>
      item.id === itemId
        ? {
            ...item,
            followUpNotes: [
              ...item.followUpNotes,
              `${new Date().toISOString()}|${person}|${note}`,
            ],
          }
        : item
    );
    set({ handoverItems });
    saveToStorage("handoverItems", handoverItems);
  },

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  refreshData: () => {
    const vehicles = get().vehicles.map((v) => ({
      ...v,
      currentTemp: Math.round((v.currentTemp + (Math.random() - 0.5) * 0.5) * 10) / 10,
      lastUpdate: new Date().toISOString(),
    }));
    set({ vehicles, currentShift: getCurrentShift() });
  },
}));
