export type AbnormalType =
  | "NORMAL"
  | "DOOR_OPEN_WHILE_DRIVING"
  | "DOOR_OPEN_TOO_LONG"
  | "SENSOR_OFFLINE"
  | "FREQUENT_OPEN_CLOSE";

export type AlarmStatus =
  | "PENDING_VERIFY"
  | "CONTACTED"
  | "NEED_QC"
  | "FALSE_ALARM";

export interface Vehicle {
  id: string;
  plateNumber: string;
  tripNo: string;
  driverName: string;
  driverPhone: string;
  carrier: string;
  route: string;
  currentTemp: number;
  status: string;
  abnormalType: AbnormalType;
  isAbnormal: boolean;
  lastUpdate: string;
  estimatedArrival: string;
}

export interface DoorEvent {
  id: string;
  vehicleId: string;
  eventType: "OPEN" | "CLOSE" | "ABNORMAL" | "OFFLINE";
  timestamp: string;
  location: string;
  description: string;
}

export interface TemperatureRecord {
  id: string;
  vehicleId: string;
  temperature: number;
  timestamp: string;
}

export interface LocationPoint {
  id: string;
  vehicleId: string;
  lat: number;
  lng: number;
  timestamp: string;
  hasDoorEvent: boolean;
  locationName: string;
}

export interface DriverReport {
  id: string;
  vehicleId: string;
  content: string;
  imageUrl: string;
  timestamp: string;
  reporterName: string;
  abnormal: "YES" | "NO";
}

export interface Alarm {
  id: string;
  vehicleId: string;
  abnormalType: AbnormalType;
  status: AlarmStatus;
  remark: string;
  nextReminder: string | null;
  createdAt: string;
  handler: string;
}

export interface Handover {
  id: string;
  shiftName: string;
  outgoingPerson: string;
  incomingPerson: string;
  handoverTime: string;
  remarks: string;
}

export interface HandoverItem {
  id: string;
  handoverId: string;
  alarmId: string;
  description: string;
  isChecked: boolean;
  notes: string;
  tripNo: string;
  route: string;
  estimatedArrival: string;
  handler: string;
  followUpNotes: string[];
}

export interface AppState {
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
}

export interface DisposalAction {
  id: string;
  vehicleId: string;
  actionType:
    | "CALL_DRIVER"
    | "NOTIFY_WAREHOUSE"
    | "SEND_MESSAGE"
    | "STATUS_CHANGE"
    | "REMINDER_CHANGE"
    | "FOLLOW_UP";
  timestamp: string;
  detail: string;
  operator: string;
  subType?: string;
  alarmId?: string;
}

export interface FollowUpRecord {
  id: string;
  alarmId: string;
  vehicleId: string;
  result: "URGED" | "ON_SITE" | "CLOSED" | "REPLIED";
  detail: string;
  targetPerson: string;
  operator: string;
  timestamp: string;
}

export type ReminderChangeKind = "KEPT" | "CLEARED" | "CHANGED";

export interface ReminderChangeLog {
  id: string;
  alarmId: string;
  vehicleId: string;
  kind: ReminderChangeKind;
  fromValue: string | null;
  toValue: string | null;
  operator: string;
  timestamp: string;
}

export interface TakeoverRecord {
  id: string;
  alarmId: string;
  vehicleId: string;
  fromOperator: string;
  toOperator: string;
  timestamp: string;
}
