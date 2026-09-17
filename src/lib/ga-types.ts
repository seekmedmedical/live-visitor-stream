export type RealtimePayload = {
  configured: boolean;
  demo: boolean;
  activeUsers: number;
  pages: { path: string; users: number }[];
  countries: { name: string; users: number }[];
  devices: { name: string; users: number }[];
  minutes: { minutesAgo: number; users: number }[];
  today: { users: number; views: number; sessions: number };
  updatedAt: string;
  error?: string;
};
