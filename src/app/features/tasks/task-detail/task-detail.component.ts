import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../../core/http/task.service';
import { UserProfileService } from '../../../core/auth/user-profile.service';
import { Task } from '../../../core/models/domain.models';
import { LowerCasePipe, DecimalPipe } from '@angular/common';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'gp-task-detail',
  standalone: true,
  imports: [ConfirmModalComponent, LowerCasePipe, DecimalPipe],
  template: `
    <div class="detail-page">
      @if (task(); as t) {
        <div class="detail-card">

          <!-- Header -->
          <div class="detail-header">
            <button class="btn btn-ghost btn--icon" (click)="router.navigate(['/tasks'])">←</button>
            <div class="detail-header__info">
              <div class="detail-badges">
                <span class="badge-cat">{{ t.category }}</span>
                <span class="badge-diff" [class]="'badge-diff--' + t.difficulty">{{ t.difficulty }}</span>
                <span class="badge-type">{{ t.taskType | lowercase }}</span>
                @if (t.mandatory) { <span class="badge-req">REQUIRED</span> }
              </div>
              <h1 class="detail-title">{{ t.title }}</h1>
            </div>
          </div>

          @if (t.description) {
            <p class="detail-desc">{{ t.description }}</p>
          }

          <!-- Stats row -->
          <div class="detail-stats">
            <div class="detail-stat">
              <span class="detail-stat__label">Base XP</span>
              <span class="detail-stat__val mono text-xp">{{ t.baseXp }}</span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat__label">Core Points</span>
              <span class="detail-stat__val mono text-gold">{{ t.baseXp / 10 | number:'1.0-0' }}</span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat__label">Completed today</span>
              <span class="detail-stat__val mono">{{ t.completedToday ?? 0 }} / {{ t.maxCompletionsPerDay }}</span>
            </div>
            <div class="detail-stat">
              <span class="detail-stat__label">Repeatable</span>
              <span class="detail-stat__val">{{ t.repeatable ? 'Yes' : 'No' }}</span>
            </div>
          </div>

          <!-- Complete button -->
          <button
            class="btn btn-primary complete-btn"
            [disabled]="!t.canCompleteToday || completing()"
            (click)="onComplete(t)"
          >
            @if (completing()) { Completing... }
            @else if (!t.canCompleteToday) { ✓ Completed for today }
            @else { Complete Task → +{{ t.baseXp }} XP }
          </button>

          <!-- Danger zone -->
          <div class="danger-zone">
            <button class="btn btn-ghost danger-btn" (click)="showDelete.set(true)">Delete task</button>
          </div>

        </div>
      } @else {
        <p class="loading">Loading task...</p>
      }
    </div>

    <gp-confirm-modal
      [open]="showDelete()"
      title="Delete task?"
      message="This task and its completion history will be permanently removed."
      confirmLabel="Delete"
      (confirm)="onDelete()"
      (cancel)="showDelete.set(false)"
    />
  `,
  styles: [`
    .detail-page { display: flex; justify-content: center; padding-bottom: 40px; }

    .detail-card {
      width: 100%; max-width: 560px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 28px 32px;
      display: flex; flex-direction: column; gap: 20px;
    }

    .detail-header { display: flex; gap: 14px; align-items: flex-start; }
    .detail-header__info { flex: 1; }
    .detail-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }

    .badge-cat, .badge-diff, .badge-type, .badge-req {
      font-size: 9px; font-weight: 700; padding: 3px 8px;
      border-radius: 4px; letter-spacing: 0.05em;
    }

    .badge-cat  { background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border); }
    .badge-type { background: var(--bg-input); color: var(--text-muted); border: 1px solid var(--border); }
    .badge-req  { background: var(--primary-glow); color: var(--primary); border: 1px solid rgba(217,70,168,0.15); }
    .badge-diff { background: var(--bg-input); border: 1px solid var(--border); }
    .badge-diff--S { color: var(--currency); }
    .badge-diff--A { color: var(--primary); }
    .badge-diff--B { color: var(--xp); }
    .badge-diff--C { color: var(--text-muted); }

    .detail-title { font-size: 22px; font-weight: 800; line-height: 1.2; }

    .detail-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

    .detail-stats {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .detail-stat {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 12px 14px;
    }

    .detail-stat__label { font-size: 10px; color: var(--text-dim); display: block; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .detail-stat__val   { font-size: 16px; font-weight: 700; }

    .complete-btn {
      width: 100%; justify-content: center;
      padding: 14px; font-size: 15px;
    }

    .complete-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .btn--icon { width: 34px; height: 34px; padding: 0; justify-content: center; flex-shrink: 0; }

    .danger-zone { border-top: 1px solid var(--border); padding-top: 16px; }

    .danger-btn { color: var(--danger); border-color: rgba(239,68,68,0.2); font-size: 12px; }
    .danger-btn:hover { background: rgba(239,68,68,0.08); }

    .loading { color: var(--text-dim); font-size: 13px; }
  `]
})
export class TaskDetailComponent implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly taskService    = inject(TaskService);
  private readonly profileService = inject(UserProfileService);
  readonly router                 = inject(Router);

  task       = signal<Task | null>(null);
  completing = signal(false);
  showDelete = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const found = this.taskService.allTasks().find(t => t.id === id)
               ?? this.taskService.todayTasks().find(t => t.id === id);
    if (found) { this.task.set(found); return; }
    // fallback: load all
    this.taskService.loadAllTasks().subscribe(() => {
      this.task.set(this.taskService.allTasks().find(t => t.id === id) ?? null);
    });
  }

  onComplete(t: Task): void {
    this.completing.set(true);
    this.taskService.completeTask(t.id).subscribe({
      next: () => {
        this.profileService.refreshProfile().subscribe();
        this.task.update(prev => prev ? { ...prev, completedToday: (prev.completedToday ?? 0) + 1, canCompleteToday: false } : prev);
        this.completing.set(false);
      },
      error: () => this.completing.set(false)
    });
  }

  onDelete(): void {
    const t = this.task();
    if (!t) return;
    this.taskService.deleteTask(t.id).subscribe(() => this.router.navigate(['/tasks']));
  }
}
