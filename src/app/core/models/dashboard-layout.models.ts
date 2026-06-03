export enum WIDGET_ID {
  TODAY_PROGRESS     = 'today-progress',
  STREAK             = 'streak',
  REWARDS            = 'rewards',
  XP_PERFORMANCE     = 'xp-performance',
  FOCUS_DISTRIBUTION = 'focus-distribution',
  RECENT_ACTIVITY    = 'recent-activity',
}

export interface DashboardWidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  draggable?: boolean;
  resizable?: boolean;
  minW?: number;
  minH?: number;
}
