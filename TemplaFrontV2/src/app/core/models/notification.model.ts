export interface Notification {
  type: string;
  message: string;
  data: any;
  timestamp: string;
  read?: boolean;
}
