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
  driverName: string;
  driverPhone: string;
  carrier: string;
  route: string;
  currentTemp: number;
  status: string;
  abnormalType: AbnormalType;
  isAbnormal: boolean;
  lastUpdate: string;
}

export interface DoorEvent {
  id: string;
  vehicleId: string;
  eventType: "OPEN" | "CLOSE" | "ABNORMAL";
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
  currentShift: {
    name: string;
    operator: string;
  };
}
