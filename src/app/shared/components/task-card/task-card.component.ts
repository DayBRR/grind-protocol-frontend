import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../../../core/models/domain.models';

const DIFFICULTY_COLOR: Record<string, string> = {
  S: 'var(--currency)',
  EPIC: 'var(--currency)',
  A: 'var(--primary)',
  HARD: 'var(--primary)',
  B: 'var(--xp)',
  MEDIUM: 'var(--xp)',
  C: 'var(--text-muted)',
  EASY: 'var(--text-muted)'
};

const CATEGORY_COLOR: Record<string, string> = {
  MIND: '#818cf8',
  BODY: '#22c55e',
  WORK: '#22d3ee',
  PERSONAL: '#f97316',
  HEALTH: '#22c55e',
  LEARNING: '#818cf8',
  FINANCE: '#eab308',
  OTHER: '#8b899a'
};

@Component({
  selector: 'gp-task-card',
  standalone: true,
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() completing = false;

  @Output() complete = new EventEmitter<Task>();
  @Output() cardClick = new EventEmitter<Task>();

  get isDone(): boolean {
    return (this.task.completedToday ?? 0) >= this.task.maxCompletionsPerDay;
  }

  get difficultyColor(): string {
    return DIFFICULTY_COLOR[this.task.difficulty] ?? 'var(--text-muted)';
  }

  get categoryColor(): string {
    return CATEGORY_COLOR[this.task.category] ?? 'var(--text-muted)';
  }

  get completionLabel(): string {
    const completed = this.task.completedToday ?? 0;
    return `${completed}/${this.task.maxCompletionsPerDay}`;
  }
}
