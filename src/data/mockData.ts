import {
  Vehicle,
  DoorEvent,
  TemperatureRecord,
  LocationPoint,
  DriverReport,
  Alarm,
  AbnormalType,
} from "../types";
import { generateDateTime } from "../utils/dateUtils";

const vehicleIds = ["v001", "v002", "v003", "v004", "v005", "v006", "v007", "v008"];

export const mockVehicles: Vehicle[] = [
  {
    id: "v001",
    plateNumber: "京A·88888",
    tripNo: "CC-20260621-001",
    driverName: "刘师傅",
    driverPhone: "138****1234",
    carrier: "顺丰冷链",
    route: "北京-上海",
    currentTemp: 4.2,
    status: "行驶中",
    abnormalType: "DOOR_OPEN_WHILE_DRIVING",
    isAbnormal: true,
    lastUpdate: generateDateTime(0.1),
    estimatedArrival: generateDateTime(-2),
  },
  {
    id: "v002",
    plateNumber: "沪B·66666",
    tripNo: "CC-20260621-002",
    driverName: "陈师傅",
    driverPhone: "139****5678",
    carrier: "顺丰冷链",
    route: "北京-上海",
    currentTemp: 12.5,
    status: "停靠中",
    abnormalType: "DOOR_OPEN_TOO_LONG",
    isAbnormal: true,
    lastUpdate: generateDateTime(0.5),
    estimatedArrival: generateDateTime(-1),
  },
  {
    id: "v003",
    plateNumber: "粤C·33333",
    tripNo: "CC-20260621-003",
    driverName: "赵师傅",
    driverPhone: "137****9012",
    carrier: "京东物流",
    route: "北京-上海",
    currentTemp: 2.8,
    status: "行驶中",
    abnormalType: "SENSOR_OFFLINE",
    isAbnormal: true,
    lastUpdate: generateDateTime(1.2),
    estimatedArrival: generateDateTime(-3),
  },
  {
    id: "v004",
    plateNumber: "津D·22222",
    tripNo: "CC-20260621-004",
    driverName: "孙师傅",
    driverPhone: "136****3456",
    carrier: "京东物流",
    route: "广州-深圳",
    currentTemp: 5.1,
    status: "行驶中",
    abnormalType: "FREQUENT_OPEN_CLOSE",
    isAbnormal: true,
    lastUpdate: generateDateTime(0.3),
    estimatedArrival: generateDateTime(-0.5),
  },
  {
    id: "v005",
    plateNumber: "苏E·11111",
    tripNo: "CC-20260621-005",
    driverName: "周师傅",
    driverPhone: "135****7890",
    carrier: "中通冷链",
    route: "广州-深圳",
    currentTemp: 3.5,
    status: "行驶中",
    abnormalType: "NORMAL",
    isAbnormal: false,
    lastUpdate: generateDateTime(0.2),
    estimatedArrival: generateDateTime(-4),
  },
  {
    id: "v006",
    plateNumber: "浙F·99999",
    tripNo: "CC-20260621-006",
    driverName: "吴师傅",
    driverPhone: "134****2345",
    carrier: "中通冷链",
    route: "广州-深圳",
    currentTemp: 4.8,
    status: "装卸货",
    abnormalType: "NORMAL",
    isAbnormal: false,
    lastUpdate: generateDateTime(0.1),
    estimatedArrival: generateDateTime(0),
  },
  {
    id: "v007",
    plateNumber: "鲁G·77777",
    tripNo: "CC-20260621-007",
    driverName: "郑师傅",
    driverPhone: "133****6789",
    carrier: "圆通冷链",
    route: "成都-重庆",
    currentTemp: 2.1,
    status: "行驶中",
    abnormalType: "NORMAL",
    isAbnormal: false,
    lastUpdate: generateDateTime(0.4),
    estimatedArrival: generateDateTime(-5),
  },
  {
    id: "v008",
    plateNumber: "川H·55555",
    tripNo: "CC-20260621-008",
    driverName: "冯师傅",
    driverPhone: "132****0123",
    carrier: "圆通冷链",
    route: "成都-重庆",
    currentTemp: 3.9,
    status: "行驶中",
    abnormalType: "NORMAL",
    isAbnormal: false,
    lastUpdate: generateDateTime(0.2),
    estimatedArrival: generateDateTime(-6),
  },
];

const generateDoorEvents = (vehicleId: string, abnormalType: AbnormalType): DoorEvent[] => {
  const baseEvents: DoorEvent[] = [
    {
      id: `${vehicleId}-d1`,
      vehicleId,
      eventType: "CLOSE",
      timestamp: generateDateTime(8),
      location: "北京大兴冷链仓库",
      description: "车门关闭，开始运输",
    },
    {
      id: `${vehicleId}-d2`,
      vehicleId,
      eventType: "OPEN",
      timestamp: generateDateTime(4),
      location: "济南服务区",
      description: "临时停靠开门检查",
    },
    {
      id: `${vehicleId}-d3`,
      vehicleId,
      eventType: "CLOSE",
      timestamp: generateDateTime(3.8),
      location: "济南服务区",
      description: "车门关闭",
    },
  ];

  if (abnormalType === "DOOR_OPEN_WHILE_DRIVING") {
    baseEvents.push({
      id: `${vehicleId}-d4`,
      vehicleId,
      eventType: "ABNORMAL",
      timestamp: generateDateTime(0.5),
      location: "徐州段（行驶中）",
      description: "异常：车辆行驶速度65km/h时检测到车门打开",
    });
  } else if (abnormalType === "DOOR_OPEN_TOO_LONG") {
    baseEvents.push({
      id: `${vehicleId}-d4`,
      vehicleId,
      eventType: "OPEN",
      timestamp: generateDateTime(2.5),
      location: "上海虹桥配送中心",
      description: "车门打开，开始卸货",
    });
    baseEvents.push({
      id: `${vehicleId}-d5`,
      vehicleId,
      eventType: "ABNORMAL",
      timestamp: generateDateTime(0.1),
      location: "上海虹桥配送中心",
      description: "异常：车门开启已超过2小时30分钟未关闭",
    });
  } else if (abnormalType === "FREQUENT_OPEN_CLOSE") {
    baseEvents.push(
      {
        id: `${vehicleId}-d4`,
        vehicleId,
        eventType: "OPEN",
        timestamp: generateDateTime(1.5),
        location: "东莞配送点",
        description: "车门打开",
      },
      {
        id: `${vehicleId}-d5`,
        vehicleId,
        eventType: "CLOSE",
        timestamp: generateDateTime(1.4),
        location: "东莞配送点",
        description: "车门关闭",
      },
      {
        id: `${vehicleId}-d6`,
        vehicleId,
        eventType: "OPEN",
        timestamp: generateDateTime(1.2),
        location: "深圳配送点",
        description: "车门打开",
      },
      {
        id: `${vehicleId}-d7`,
        vehicleId,
        eventType: "CLOSE",
        timestamp: generateDateTime(1.1),
        location: "深圳配送点",
        description: "车门关闭",
      },
      {
        id: `${vehicleId}-d8`,
        vehicleId,
        eventType: "ABNORMAL",
        timestamp: generateDateTime(0.3),
        location: "香港边界",
        description: "异常：30分钟内车门开合已达8次",
      }
    );
  } else if (abnormalType === "SENSOR_OFFLINE") {
    baseEvents.push(
      {
        id: `${vehicleId}-d4`,
        vehicleId,
        eventType: "CLOSE",
        timestamp: generateDateTime(3.5),
        location: "天津段",
        description: "最后一次正常关门信号",
      },
      {
        id: `${vehicleId}-d5`,
        vehicleId,
        eventType: "OFFLINE",
        timestamp: generateDateTime(1.2),
        location: "徐州段",
        description: "门磁设备信号丢失，最后心跳时间1小时前",
      }
    );
  }

  return baseEvents.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

const generateTemperatureRecords = (
  vehicleId: string,
  abnormalType: AbnormalType
): TemperatureRecord[] => {
  const records: TemperatureRecord[] = [];
  const baseTemp = abnormalType === "DOOR_OPEN_TOO_LONG" ? 10 : 3;

  for (let i = 24; i >= 0; i--) {
    let temp = baseTemp + Math.random() * 2 - 1;
    if (abnormalType === "DOOR_OPEN_TOO_LONG" && i < 3) {
      temp = 8 + Math.random() * 5;
    }
    if (abnormalType === "DOOR_OPEN_WHILE_DRIVING" && i < 1) {
      temp = 6 + Math.random() * 3;
    }
    records.push({
      id: `${vehicleId}-t${i}`,
      vehicleId,
      temperature: Math.round(temp * 10) / 10,
      timestamp: generateDateTime(i),
    });
  }

  return records;
};

const generateLocationPoints = (vehicleId: string): LocationPoint[] => {
  const routePoints: LocationPoint[] = [
    {
      id: `${vehicleId}-l1`,
      vehicleId,
      lat: 39.9042,
      lng: 116.4074,
      timestamp: generateDateTime(8),
      hasDoorEvent: true,
      locationName: "北京起点",
    },
    {
      id: `${vehicleId}-l2`,
      vehicleId,
      lat: 39.1422,
      lng: 117.1767,
      timestamp: generateDateTime(6),
      hasDoorEvent: false,
      locationName: "天津",
    },
    {
      id: `${vehicleId}-l3`,
      vehicleId,
      lat: 36.6683,
      lng: 116.9972,
      timestamp: generateDateTime(4),
      hasDoorEvent: true,
      locationName: "济南",
    },
    {
      id: `${vehicleId}-l4`,
      vehicleId,
      lat: 34.3416,
      lng: 117.1253,
      timestamp: generateDateTime(2.5),
      hasDoorEvent: false,
      locationName: "徐州",
    },
    {
      id: `${vehicleId}-l5`,
      vehicleId,
      lat: 32.0603,
      lng: 118.7969,
      timestamp: generateDateTime(1),
      hasDoorEvent: true,
      locationName: "南京",
    },
    {
      id: `${vehicleId}-l6`,
      vehicleId,
      lat: 31.2304,
      lng: 121.4737,
      timestamp: generateDateTime(0.5),
      hasDoorEvent: false,
      locationName: "上海终点",
    },
  ];
  return routePoints;
};

const generateDriverReports = (vehicleId: string): DriverReport[] => {
  return [
    {
      id: `${vehicleId}-r1`,
      vehicleId,
      content: "车辆正常行驶中，未发现异常情况。车厢温度保持在2-4℃范围内。",
      imageUrl:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=refrigerated%20truck%20interior%20with%20crates%20of%20fresh%20vegetables&image_size=square",
      timestamp: generateDateTime(3),
      reporterName: "刘师傅",
    },
    {
      id: `${vehicleId}-r2`,
      vehicleId,
      content: "济南服务区临时停靠，检查车厢制冷设备运行正常。",
      imageUrl:
        "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=truck%20driver%20checking%20temperature%20control%20panel&image_size=square",
      timestamp: generateDateTime(1.5),
      reporterName: "刘师傅",
    },
  ];
};

export const mockDoorEvents: Record<string, DoorEvent[]> = {};
export const mockTemperatureRecords: Record<string, TemperatureRecord[]> = {};
export const mockLocationPoints: Record<string, LocationPoint[]> = {};
export const mockDriverReports: Record<string, DriverReport[]> = {};

vehicleIds.forEach((id) => {
  const vehicle = mockVehicles.find((v) => v.id === id);
  if (vehicle) {
    mockDoorEvents[id] = generateDoorEvents(id, vehicle.abnormalType);
    mockTemperatureRecords[id] = generateTemperatureRecords(id, vehicle.abnormalType);
    mockLocationPoints[id] = generateLocationPoints(id);
    mockDriverReports[id] = generateDriverReports(id);
  }
});

export const mockAlarms: Alarm[] = [
  {
    id: "a001",
    vehicleId: "v001",
    abnormalType: "DOOR_OPEN_WHILE_DRIVING",
    status: "PENDING_VERIFY",
    remark: "",
    nextReminder: null,
    createdAt: generateDateTime(0.5),
    handler: "",
  },
  {
    id: "a002",
    vehicleId: "v002",
    abnormalType: "DOOR_OPEN_TOO_LONG",
    status: "CONTACTED",
    remark: "已联系司机，正在卸货中，预计30分钟后关门",
    nextReminder: generateDateTime(-30),
    createdAt: generateDateTime(2.5),
    handler: "张明",
  },
  {
    id: "a003",
    vehicleId: "v003",
    abnormalType: "SENSOR_OFFLINE",
    status: "NEED_QC",
    remark: "门磁设备无信号已超过1小时，可能设备故障，需质检人员现场检查",
    nextReminder: generateDateTime(-60),
    createdAt: generateDateTime(1.2),
    handler: "李强",
  },
  {
    id: "a004",
    vehicleId: "v004",
    abnormalType: "FREQUENT_OPEN_CLOSE",
    status: "PENDING_VERIFY",
    remark: "",
    nextReminder: null,
    createdAt: generateDateTime(0.3),
    handler: "",
  },
];
