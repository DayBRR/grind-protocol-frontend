import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe, DecimalPipe } from '@angular/common';
import { UserProfileService } from '../../core/auth/user-profile.service';

@Component({
  selector: 'gp-topbar',
  standalone: true,
  imports: [RouterLink, DatePipe, UpperCasePipe, DecimalPipe],
  template: `
    <header class="topbar">
      <span class="topbar__title">{{ pageTitle() }}</span>

      <div class="topbar__actions">
        <span class="topbar__date mono">{{ today | date:'EEE dd MMM yyyy' | uppercase }}</span>

        @if (profile()) {
          <div class="topbar__cp mono">
            <span class="topbar__cp-icon">🪙</span>
            {{ profile()!.corePoints | number }}
          </div>
        }

        <a routerLink="/alerts" class="topbar__bell" title="Alerts">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C8 2 4 4 4 9V12H12V9C12 4 8 2 8 2Z" fill="var(--text-muted)"/>
            <rect x="6.5" y="12" width="3" height="1.5" rx="0.75" fill="var(--text-muted)"/>
          </svg>
          <span class="topbar__bell-dot"></span>
        </a>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 56px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 16px;
      background: var(--bg-base);
      flex-shrink: 0;
    }

    .topbar__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      flex: 1;
    }

    .topbar__actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .topbar__date {
      font-size: 11px;
      color: var(--text-dim);
      background: var(--bg-elevated);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    .topbar__cp {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 500;
      color: var(--currency);
      background: var(--currency-glow);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid rgba(234,179,8,0.15);
    }

    .topbar__bell {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      text-decoration: none;
    }

    .topbar__bell:hover { background: var(--bg-input); }

    .topbar__bell-dot {
      position: absolute;
      top: 6px; right: 6px;
      width: 6px; height: 6px;
      background: var(--streak);
      border-radius: 50%;
      border: 1.5px solid var(--bg-elevated);
      box-shadow: 0 0 6px var(--streak);
    }
  `]
})
export class TopbarComponent {
  private readonly profileService = inject(UserProfileService);

  readonly profile  = this.profileService.profile;
  readonly today    = new Date();

  // In a real app this would come from the router or a title service
  readonly pageTitle = computed(() => 'Dashboard');
}
