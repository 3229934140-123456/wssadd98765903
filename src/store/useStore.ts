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
  FollowUpRecord,
  ReminderChangeLog,
  ReminderChangeKind,
} from "../types";
import {
  mockVehicles,
  mockDoorEvents,
  mockTemperatureRecords,
  mockLocationPoints,
  mockDriverReports,
  mockAlarms,
} from "../data/mockData";
import { getCurrentShift, generateReminderTime, formatDateTime } from "../utils/dateUtils";
import { getAlarmStatusLabel } from "../utils/statusUtils";

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
  followUpRecords: FollowUpRecord[];
  reminderChangeLogs: ReminderChangeLog[];
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
  addFollowUp: (
    alarmId: string,
    result: FollowUpRecord["result"],
    detail: string,
    targetPerson: string
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

const makeActionId = () =>
  `da-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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
  followUpRecords: loadFromStorage("followUpRecords", []),
  reminderChangeLogs: loadFromStorage("reminderChangeLogs", []),
  currentShift: getCurrentShift(),
  soundEnabled: true,

  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),

  updateAlarmStatus: (alarmId, status, remark, remindMinutes) => {
    const existingAlarm = get().alarms.find((a) => a.id === alarmId);
    if (!existingAlarm) return;

    const vehicle = get().vehicles.find((v) => v.id === existingAlarm.vehicleId);
    const operator = get().currentShift.operator;
    const now = new Date().toISOString();

    let nextReminder: string | null = existingAlarm.nextReminder;
    let reminderKind: ReminderChangeKind | null = null;
    if (remindMinutes === null) {
      if (existingAlarm.nextReminder !== null) reminderKind = "CLEARED";
      nextReminder = null;
    } else if (remindMinutes !== undefined) {
      if (existingAlarm.nextReminder === null) {
        reminderKind = "CHANGED";
      } else {
        const newTime = generateReminderTime(remindMinutes);
        reminderKind = newTime === existingAlarm.nextReminder ? "KEPT" : "CHANGED";
      }
      nextReminder = generateReminderTime(remindMinutes);
    } else {
      reminderKind = "KEPT";
    }

    const alarms = get().alarms.map((alarm) =>
      alarm.id === alarmId
        ? {
            ...alarm,
            status,
            remark,
            nextReminder,
            handler: operator,
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

    const existingActions = get().disposalActions[existingAlarm.vehicleId] || [];
    const newActions: DisposalAction[] = [];

    if (existingAlarm.status !== status) {
      newActions.push({
        id: makeActionId(),
        vehicleId: existingAlarm.vehicleId,
        actionType: "STATUS_CHANGE",
        subType: status,
        alarmId,
        timestamp: now,
        detail: `告警状态由「${getAlarmStatusLabel(existingAlarm.status)}」变更为「${getAlarmStatusLabel(status)}」${remark ? `，备注：${remark}` : ""}`,
        operator,
      });
    } else if (remark && remark !== existingAlarm.remark) {
      newActions.push({
        id: makeActionId(),
        vehicleId: existingAlarm.vehicleId,
        actionType: "STATUS_CHANGE",
        subType: status,
        alarmId,
        timestamp: now,
        detail: `更新备注：${remark}（状态仍为「${getAlarmStatusLabel(status)}」）`,
        operator,
      });
    }

    if (reminderKind && reminderKind !== "KEPT") {
      const oldLabel = existingAlarm.nextReminder
        ? formatDateTime(existingAlarm.nextReminder)
        : "无";
      const newLabel = nextReminder ? formatDateTime(nextReminder) : "无";
      const kindLabel =
        reminderKind === "CLEARED" ? "清除提醒" : reminderKind === "CHANGED" ? "修改提醒" : "保留提醒";
      newActions.push({
        id: makeActionId(),
        vehicleId: existingAlarm.vehicleId,
        actionType: "REMINDER_CHANGE",
        subType: reminderKind,
        alarmId,
        timestamp: now,
        detail: `${kindLabel}：${oldLabel} → ${newLabel}`,
        operator,
      });

      const log: ReminderChangeLog = {
        id: `rcl-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        alarmId,
        vehicleId: existingAlarm.vehicleId,
        kind: reminderKind,
        fromValue: existingAlarm.nextReminder,
        toValue: nextReminder,
        operator,
        timestamp: now,
      };
      const reminderChangeLogs = [...get().reminderChangeLogs, log];
      set({ reminderChangeLogs });
      saveToStorage("reminderChangeLogs", reminderChangeLogs);
    }

    if (newActions.length > 0) {
      const updated = {
        ...get().disposalActions,
        [existingAlarm.vehicleId]: [...existingActions, ...newActions],
      };
      set({ disposalActions: updated });
      saveToStorage("disposalActions", updated);
    }
  },

  addDisposalAction: (vehicleId, action, detail) => {
    const newAction: DisposalAction = {
      id: makeActionId(),
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

  addFollowUp: (alarmId, result, detail, targetPerson) => {
    const alarm = get().alarms.find((a) => a.id === alarmId);
    if (!alarm) return;
    const operator = get().currentShift.operator;
    const now = new Date().toISOString();

    const resultLabel: Record<FollowUpRecord["result"], string> = {
      URGED: "已催办",
      ON_SITE: "已到场",
      CLOSED: "已关闭",
      REPLIED: "已回复",
    };

    const record: FollowUpRecord = {
      id: `fu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      alarmId,
      vehicleId: alarm.vehicleId,
      result,
      detail,
      targetPerson,
      operator,
      timestamp: now,
    };

    const followUpRecords = [...get().followUpRecords, record];
    set({ followUpRecords });
    saveToStorage("followUpRecords", followUpRecords);

    const existingActions = get().disposalActions[alarm.vehicleId] || [];
    const action: DisposalAction = {
      id: makeActionId(),
      vehicleId: alarm.vehicleId,
      actionType: "FOLLOW_UP",
      subType: result,
      alarmId,
      timestamp: now,
      detail: `跟进登记「${resultLabel[result]}」 → ${targetPerson}${detail ? `：${detail}` : ""}`,
      operator,
    };
    const updated = {
      ...get().disposalActions,
      [alarm.vehicleId]: [...existingActions, action],
    };
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
