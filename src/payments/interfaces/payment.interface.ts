export enum PaymentStatus {
  INITIAL = 'INITIAL',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  FINISH = 'FINISH',
}

export interface PaymentServiceInfo {
  name: string;
  [key: string]: any;
}

export interface Payment {
  traceId: string;
  userId: string;
  cardId: string;
  service: PaymentServiceInfo;
  status: PaymentStatus;
  timestamp: string;
}
