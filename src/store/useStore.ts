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
    remindMinutes: number | null
  ) => void;
  createHandover: (
    outgoingPerson: string,
    incomingPerson: string,
    items: { alarmId: string; description: string; notes: string }[],
    remarks: string
  ) => void;
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

export const useStore = create<AppStore>((set, get) => ({
  vehicles: mockVehicles,
  selectedVehicleId: mockVehicles.find((v) => v.isAbnormal)?.id || null,
  doorEvents: mockDoorEvents,
  temperatureRecords: mockTemperatureRecords,
  locationPoints: mockLocationPoints,
  driverReports: mockDriverReports,
  alarms: loadFromStorage("alarms", mockAlarms),
  handovers: loadFromStorage("handovers", []),
  handoverItems: loadFromStorage("handoverItems", []),
  currentShift: getCurrentShift(),
  soundEnabled: true,

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),

  updateAlarmStatus: (alarmId, status, remark, remindMinutes) => {
    const alarms = get().alarms.map((alarm) =>
      alarm.id === alarmId
        ? {
            ...alarm,
            status,
            remark,
            nextReminder: remindMinutes ? generateReminderTime(remindMinutes) : null,
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
    }
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
    }));

    const handovers = [...get().handovers, newHandover];
    const handoverItems = [...get().handoverItems, ...newHandoverItems];

    set({ handovers, handoverItems });
    saveToStorage("handovers", handovers);
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
