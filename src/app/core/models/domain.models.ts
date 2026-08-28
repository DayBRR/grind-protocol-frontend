/*
 * DTOs aligned with the real Grind Protocol backend.
 *
 * Rule for this file:
 * - Response/Request interfaces mirror backend DTOs.
 * - UI-only helpers are explicitly marked and kept optional.
 */

// ─────────────────────────────────────────────────────────────────────────────
// User / Profile / Progression
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfileResponse {
  userId: number;
  username: string;
  displayName: string;
  dailyTaskGoal: number;
  totalXp: number;
  level: number;
  corePoints: number;
  currentStreak: number;
  bestStreak: number;
  lastEvaluatedDate: string | null;
}

export interface UpdateUserProfileRequest {
  displayName: string;
  dailyTaskGoal: number;
}

export interface ProgressionSummaryResponse {
  totalXp: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgressInCurrentLevel: number;
  xpRemainingForNextLevel: number;
  corePoints: number;
  currentStreak: number;
  bestStreak: number;
}

export interface DailyProgressionSummaryResponse {
  date: string;
  dayOfWeek: string;
  xpEarned: number;
  corePointsEarned: number;
  taskCompletions: number;
  questClaims: number;
  achievementClaims: number;
  rewardRedemptions: number;
}

export interface WeeklyProgressionSummaryResponse {
  weekStart: string;
  weekEnd: string;
  totalXp: number;
  previousWeekTotalXp: number;
  deltaPercent: number | null;
  days: DailyProgressionSummaryResponse[];
}

export interface DailyProgressResponse {
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

// Backwards-compatible alias used by existing components/services.
export type DailyProgress = DailyProgressResponse;

// UI helper for level badge text. The level number still comes from backend.
export interface UserProfileView extends UserProfileResponse {
  levelTitle: string;
}

// Backwards-compatible alias used by existing components.
export type UserProfile = UserProfileView;

// ─────────────────────────────────────────────────────────────────────────────
// Tasks
// ─────────────────────────────────────────────────────────────────────────────

export type BackendTaskType = 'DAILY' | 'HABIT' | 'ONE_TIME';
export type BackendTaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
export type BackendTaskCategory = 'MIND' | 'BODY' | 'WORK' | 'PERSONAL';
export type CategoryFocusPeriod = 'DAY' | 'WEEK' | 'MONTH' | 'ALL_TIME';

// Legacy UI values are temporarily kept so existing task screens keep compiling.
// Services map these values to backend-native values before POSTing.
export type TaskType = BackendTaskType | 'WEEKLY' | 'LONG_TERM';
export type TaskDifficulty = 'S' | 'A' | 'B' | 'C';
export type TaskCategory = BackendTaskCategory | 'HEALTH' | 'LEARNING' | 'FINANCE' | 'OTHER';
export type CompletionSource = 'MANUAL' | 'SYSTEM' | string;

export interface TaskResponse {
  id: number;
  userId: number;
  templateId: number | null;
  title: string;
  description: string | null;
  category: BackendTaskCategory;
  difficulty: BackendTaskDifficulty;
  taskType: BackendTaskType;
  baseXp: number;
  mandatory: boolean;
  streakEligible: boolean;
  repeatable: boolean;
  maxCompletionsPerDay: number;
  diminishingReturnsEnabled: boolean;
  active: boolean;
  dueTime: string | null;
  weeklyClosingDay: number | null;
  traitCodes: string[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  category: BackendTaskCategory;
  difficulty: BackendTaskDifficulty;
  taskType: BackendTaskType;
  baseXp: number;
  mandatory: boolean;
  streakEligible: boolean;
  repeatable: boolean;
  maxCompletionsPerDay: number;
  diminishingReturnsEnabled: boolean;
  dueTime?: string | null;
  weeklyClosingDay?: number | null;
  traitCodes?: string[];
}

export interface CreateTaskCompletionRequest {
  taskId: number;
  notes?: string | null;
}

export interface TaskCompletionResponse {
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
  source: CompletionSource;
}

export interface TaskView extends Omit<TaskResponse, 'category' | 'difficulty' | 'taskType'> {
  category: TaskCategory;
  difficulty: TaskDifficulty | BackendTaskDifficulty;
  taskType: TaskType;

  // UI helpers populated from today's completions.
  completedToday?: number;
  canCompleteToday?: boolean;
}

// Backwards-compatible aliases used by existing components.
export type Task = TaskView;
export type TaskCompletion = TaskCompletionResponse;

export interface CategoryFocusItemResponse {
  category: BackendTaskCategory;
  completedTasks: number;
  xpEarned: number;
  corePointsEarned: number;
  percentage: number;
}

export interface CategoryFocusResponse {
  period: CategoryFocusPeriod;
  startDate: string | null;
  endDate: string | null;
  categories: CategoryFocusItemResponse[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Rewards
// ─────────────────────────────────────────────────────────────────────────────

export type RewardType = 'REAL' | 'VIRTUAL';
export type RewardCategory = 'FOOD' | 'ENTERTAINMENT' | 'REST' | 'PURCHASE' | 'EXPERIENCE' | 'OTHER' | string;
export type RewardRedemptionStatus = 'AVAILABLE' | 'USED' | 'CANCELLED' | 'EXPIRED' | string;
export type AvailabilityType = 'UNLIMITED' | 'COOLDOWN' | 'LIMITED_PER_PERIOD';
export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface RewardResponse {
  id: number;
  name: string;
  description: string | null;
  type: RewardType;
  category: RewardCategory;
  costCorePoints: number;
  enabled: boolean;
  repeatable: boolean;
  cooldownDays: number | null;
  requiredLevel: number | null;
  requiredCurrentStreak: number | null;
}

export interface RewardRedeemResponse {
  redemptionId: number;
  rewardId: number;
  rewardName: string;
  costPaid: number;
  remainingCorePoints: number;
  status: RewardRedemptionStatus;
  redeemedAt: string;
}

export interface RewardRedemptionResponse {
  id: number;
  rewardId: number;
  rewardName: string;
  rewardDescription: string | null;
  rewardType: RewardType;
  rewardCategory: RewardCategory;
  status: RewardRedemptionStatus;
  costPaid: number;
  redeemedAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
}

export interface RewardView extends RewardResponse {
  // UI aliases/helpers used by existing cards while keeping backend fields intact.
  title: string;
  active: boolean;
  canAfford: boolean;
  isOnCooldown: boolean;
  nextAvailableAt: string | null;

  // Legacy UI fields kept temporarily until the rewards screens are migrated.
  availabilityType?: AvailabilityType;
  maxClaimsPerPeriod?: number | null;
  periodType?: PeriodType | null;
}

// Backwards-compatible aliases used by existing components.
export type Reward = RewardView;
export type RewardClaim = RewardRedeemResponse;

// ─────────────────────────────────────────────────────────────────────────────
// Achievements / Quests
// ─────────────────────────────────────────────────────────────────────────────

export type AchievementType =
  | 'TOTAL_XP'
  | 'LEVEL_REACHED'
  | 'CURRENT_STREAK'
  | 'BEST_STREAK'
  | 'TASK_COMPLETION_COUNT'
  | 'REWARD_REDEMPTION_COUNT'
  | 'CORE_POINTS_EARNED'
  | string;

export interface AchievementResponse {
  achievementId: number;
  code: string;
  name: string;
  description: string;
  type: AchievementType;
  targetValue: number;
  progressValue: number;
  xpReward: number;
  corePointsReward: number;
  hidden: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  claimed: boolean;
  claimedAt: string | null;
}

export interface AchievementClaimResponse {
  achievementId: number;
  code: string;
  name: string;
  xpReward: number;
  corePointsReward: number;
  claimed: boolean;
}

export type QuestType = 'TASK_COMPLETION_COUNT' | 'XP_GAINED' | 'CORE_POINTS_EARNED' | 'REWARD_REDEMPTION_COUNT' | string;
export type QuestFrequency = 'DAILY' | 'WEEKLY' | 'SPECIAL' | string;
export type QuestStatus = 'ACTIVE' | 'COMPLETED' | 'CLAIMED' | 'EXPIRED' | string;

export interface QuestResponse {
  questId: number;
  code: string;
  name: string;
  description: string;
  type: QuestType;
  frequency: QuestFrequency;
  targetValue: number;
  progressValue: number;
  xpReward: number;
  corePointsReward: number;
  status: QuestStatus;
  periodStart: string;
  periodEnd: string;
  completedAt: string | null;
  claimedAt: string | null;
}

export interface QuestClaimResponse {
  questId: number;
  code: string;
  name: string;
  xpReward: number;
  corePointsReward: number;
  status: QuestStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Frontend-only placeholder domains
// These do not have backend endpoints yet. Keep them isolated from dashboard MVP.
// ─────────────────────────────────────────────────────────────────────────────

export type AlertType = 'STREAK_AT_RISK' | 'TASK_EXPIRING' | 'LEVEL_CLOSE' | 'REWARD_UNLOCKED' | 'DAY_QUALIFIED' | 'GENERIC';
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
