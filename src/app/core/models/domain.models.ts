// User auth identity
export interface User {
  id: number;
  username: string;
  email: string;
  emailVerified: boolean;
  role: string;
  enabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

// Gamified profile state
export interface UserProfile {
  id: number;
  userId: number;
  displayName: string;
  dailyTaskGoal: number;
  totalXp: number;
  corePoints: number;
  currentStreak: number;
  bestStreak: number;
  lastEvaluatedDate: string | null;
  level: number;        // derived client-side from totalXp
  levelTitle: string;   // derived client-side
  xpToNextLevel: number;
  xpProgress: number;   // 0–1 fraction
}

export type TaskType       = 'DAILY' | 'WEEKLY' | 'ONE_TIME' | 'LONG_TERM';
export type TaskDifficulty = 'S' | 'A' | 'B' | 'C';
export type TaskCategory   = 'HEALTH' | 'LEARNING' | 'WORK' | 'PERSONAL' | 'FINANCE' | 'OTHER';

export interface Task {
  id: number;
  userId: number;
  templateId: number | null;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  taskType: TaskType;
  baseXp: number;
  mandatory: boolean;
  streakEligible: boolean;
  repeatable: boolean;
  maxCompletionsPerDay: number;
  diminishingReturnsEnabled: boolean;
  active: boolean;
  dueTime: string | null;
  weeklyClosingDay: number | null;
  createdAt: string;
  updatedAt: string;
  // UI helpers (populated from today's completions)
  completedToday?: number;
  canCompleteToday?: boolean;
}

export interface TaskCompletion {
  id: number;
  taskId: number;
  userId: number;
  completedAt: string;
  completionDate: string;
  completionIndexForDay: number;
  countedForDailyGoal: boolean;
  countedForStreak: boolean;
  baseXp: number;
  awardedXp: number;
  awardedCorePoints: number;
  notes: string | null;
}

export interface DailyProgress {
  id: number;
  userId: number;
  progressDate: string;
  requiredTaskCount: number;
  completedValidTaskCount: number;
  mandatoryTasksRequired: number;
  mandatoryTasksCompleted: number;
  dayQualified: boolean;
  evaluatedAt: string | null;
}

export type AvailabilityType = 'UNLIMITED' | 'COOLDOWN' | 'LIMITED_PER_PERIOD';
export type PeriodType       = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface Reward {
  id: number;
  userId: number;
  templateId: number | null;
  title: string;
  description: string;
  costCorePoints: number;
  requiredLevel: number | null;
  availabilityType: AvailabilityType;
  cooldownDays: number | null;
  maxClaimsPerPeriod: number | null;
  periodType: PeriodType | null;
  active: boolean;
  // UI helpers
  canAfford?: boolean;
  isOnCooldown?: boolean;
  nextAvailableAt?: string | null;
}

export interface RewardClaim {
  id: number;
  rewardId: number;
  userId: number;
  claimedAt: string;
  costPaid: number;
  notes: string | null;
}

export type AlertType     = 'STREAK_AT_RISK' | 'TASK_EXPIRING' | 'LEVEL_CLOSE' | 'REWARD_UNLOCKED' | 'DAY_QUALIFIED' | 'GENERIC';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: number;
  userId: number;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: number | null;
  triggeredAt: string;
  readAt: string | null;
  dismissedAt: string | null;
  active: boolean;
}

export type TimelineEventType =
  | 'TASK_COMPLETED'
  | 'DAY_QUALIFIED'
  | 'STREAK_EXTENDED'
  | 'STREAK_BROKEN'
  | 'LEVEL_UP'
  | 'REWARD_CLAIMED'
  | 'REWARD_UNLOCKED'
  | 'XP_EARNED';

export interface TimelineEvent {
  id: number;
  userId: number;
  eventType: TimelineEventType;
  title: string;
  description: string;
  sourceType: string | null;
  sourceId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
