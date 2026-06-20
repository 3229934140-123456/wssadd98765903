import { AbnormalType, AlarmStatus } from "../types";

export const getAbnormalTypeLabel = (type: AbnormalType): string => {
  const labels: Record<AbnormalType, string> = {
    NORMAL: "正常",
    DOOR_OPEN_WHILE_DRIVING: "行驶中开门",
    DOOR_OPEN_TOO_LONG: "长时间未关",
    SENSOR_OFFLINE: "门磁离线",
    FREQUENT_OPEN_CLOSE: "频繁开合",
  };
  return labels[type];
};

export const getAbnormalTypeColor = (type: AbnormalType): string => {
  const colors: Record<AbnormalType, string> = {
    NORMAL: "#10B981",
    DOOR_OPEN_WHILE_DRIVING: "#EF4444",
    DOOR_OPEN_TOO_LONG: "#F59E0B",
    SENSOR_OFFLINE: "#6B7280",
    FREQUENT_OPEN_CLOSE: "#A855F7",
  };
  return colors[type];
};

export const getAbnormalTypeBgColor = (type: AbnormalType): string => {
  const colors: Record<AbnormalType, string> = {
    NORMAL: "bg-emerald-500/10",
    DOOR_OPEN_WHILE_DRIVING: "bg-red-500/10",
    DOOR_OPEN_TOO_LONG: "bg-amber-500/10",
    SENSOR_OFFLINE: "bg-gray-500/10",
    FREQUENT_OPEN_CLOSE: "bg-purple-500/10",
  };
  return colors[type];
};

export const getAbnormalTypeBorderColor = (type: AbnormalType): string => {
  const colors: Record<AbnormalType, string> = {
    NORMAL: "border-emerald-500",
    DOOR_OPEN_WHILE_DRIVING: "border-red-500",
    DOOR_OPEN_TOO_LONG: "border-amber-500",
    SENSOR_OFFLINE: "border-gray-500",
    FREQUENT_OPEN_CLOSE: "border-purple-500",
  };
  return colors[type];
};

export const getAbnormalTypeTextColor = (type: AbnormalType): string => {
  const colors: Record<AbnormalType, string> = {
    NORMAL: "text-emerald-400",
    DOOR_OPEN_WHILE_DRIVING: "text-red-400",
    DOOR_OPEN_TOO_LONG: "text-amber-400",
    SENSOR_OFFLINE: "text-gray-400",
    FREQUENT_OPEN_CLOSE: "text-purple-400",
  };
  return colors[type];
};

export const getAlarmStatusLabel = (status: AlarmStatus): string => {
  const labels: Record<AlarmStatus, string> = {
    PENDING_VERIFY: "待核实",
    CONTACTED: "已联系",
    NEED_QC: "需质检介入",
    FALSE_ALARM: "误报",
  };
  return labels[status];
};

export const getAlarmStatusColor = (status: AlarmStatus): string => {
  const colors: Record<AlarmStatus, string> = {
    PENDING_VERIFY: "#3B82F6",
    CONTACTED: "#10B981",
    NEED_QC: "#F59E0B",
    FALSE_ALARM: "#6B7280",
  };
  return colors[status];
};

export const getAlarmStatusBgColor = (status: AlarmStatus): string => {
  const colors: Record<AlarmStatus, string> = {
    PENDING_VERIFY: "bg-blue-500/10",
    CONTACTED: "bg-emerald-500/10",
    NEED_QC: "bg-amber-500/10",
    FALSE_ALARM: "bg-gray-500/10",
  };
  return colors[status];
};

export const getAlarmStatusBorderColor = (status: AlarmStatus): string => {
  const colors: Record<AlarmStatus, string> = {
    PENDING_VERIFY: "border-blue-500",
    CONTACTED: "border-emerald-500",
    NEED_QC: "border-amber-500",
    FALSE_ALARM: "border-gray-500",
  };
  return colors[status];
};

export const getAlarmStatusTextColor = (status: AlarmStatus): string => {
  const colors: Record<AlarmStatus, string> = {
    PENDING_VERIFY: "text-blue-400",
    CONTACTED: "text-emerald-400",
    NEED_QC: "text-amber-400",
    FALSE_ALARM: "text-gray-400",
  };
  return colors[status];
};
