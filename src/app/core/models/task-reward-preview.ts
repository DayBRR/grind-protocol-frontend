import { Task } from './domain.models';

/** UI forecast only; granted rewards always come from the backend. */
export function nextTaskReward(task: Task): { xp: number; corePoints: number } | null {
  const completed = task.completedToday ?? 0;
  if (task.canCompleteToday === false || completed >= task.maxCompletionsPerDay) return null;
  const xp = completed > 0 && task.diminishingReturnsEnabled
    ? Math.max(1, Math.floor(task.baseXp / 2))
    : task.baseXp;
  return { xp, corePoints: Math.floor(xp / 10) };
}
