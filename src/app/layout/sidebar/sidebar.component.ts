import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SafeHtmlPipe } from '../../shared/pipes/safe-html.pipe';

interface NavItem {
  path: string;
  label: string;
  icon: string; // SVG path data
}

@Component({
  selector: 'gp-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SafeHtmlPipe],
  template: `
    <nav class="sidebar">
      <!-- Logo -->
      <a routerLink="/dashboard" class="sidebar__logo" title="Dashboard">
        <div class="logo-box">
          <div class="logo-icon"></div>
        </div>
      </a>

      <!-- Nav items -->
      <ul class="sidebar__nav">
        @for (item of navItems; track item.path) {
          <li>
            <a
              [routerLink]="item.path"
              routerLinkActive="sidebar__link--active"
              class="sidebar__link"
              [title]="item.label"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" [innerHTML]="item.icon | safeHtml"></svg>
            </a>
          </li>
        }
      </ul>

      <!-- Bottom: alerts + logout -->
      <div class="sidebar__bottom">
        <a routerLink="/alerts" routerLinkActive="sidebar__link--active" class="sidebar__link sidebar__link--alert" title="Alerts">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2C8 2 4 4 4 9V12H12V9C12 4 8 2 8 2Z" fill="currentColor"/>
            <rect x="6.5" y="12" width="3" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
          <span class="alert-badge"></span>
        </a>
        <button class="sidebar__link sidebar__logout" (click)="logout()" title="Logout">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      width: 64px;
      height: 100%;
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px 0;
      flex-shrink: 0;
    }

    .sidebar__logo { margin-bottom: 24px; }

    .logo-box {
      width: 36px;
      height: 36px;
      background: var(--primary);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px var(--primary-dim);
    }

    .logo-icon {
      width: 18px;
      height: 18px;
      border: 2.5px solid white;
      border-radius: 3px;
      position: relative;
    }

    .logo-icon::after {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 6px; height: 6px;
      background: white;
      border-radius: 1px;
    }

    .sidebar__nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      list-style: none;
      flex: 1;
    }

    .sidebar__link {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-dim);
      transition: background 0.15s, color 0.15s;
      text-decoration: none;
      border: none;
      background: transparent;
      position: relative;
    }

    .sidebar__link:hover {
      background: var(--bg-elevated);
      color: var(--text-muted);
    }

    .sidebar__link--active {
      background: var(--primary-glow) !important;
      color: var(--primary) !important;
    }

    .sidebar__link--active::before {
      content: '';
      position: absolute;
      left: -1px;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background: var(--primary);
      border-radius: 0 3px 3px 0;
      box-shadow: 0 0 8px var(--primary-dim);
    }

    .sidebar__link--alert { position: relative; }

    .alert-badge {
      position: absolute;
      top: 6px; right: 6px;
      width: 6px; height: 6px;
      background: var(--streak);
      border-radius: 50%;
      border: 1.5px solid var(--bg-surface);
      box-shadow: 0 0 4px var(--streak);
    }

    .sidebar__bottom {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
    }

    .sidebar__logout { cursor: pointer; }

    svg { display: block; }
  `]
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  readonly navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: `<rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
             <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
             <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
             <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>`
    },
    {
      path: '/tasks',
      label: 'Tasks',
      icon: `<rect x="2" y="3" width="12" height="1.5" rx="0.75" fill="currentColor"/>
             <rect x="2" y="7" width="8" height="1.5" rx="0.75" fill="currentColor"/>
             <rect x="2" y="11" width="10" height="1.5" rx="0.75" fill="currentColor"/>`
    },
    {
      path: '/rewards',
      label: 'Rewards',
      icon: `<path d="M8 2L9.5 5.5L13 6L10.5 8.5L11 12L8 10.5L5 12L5.5 8.5L3 6L6.5 5.5L8 2Z" fill="currentColor"/>`
    },
    {
      path: '/timeline',
      label: 'Timeline',
      icon: `<circle cx="4" cy="4" r="1.5" fill="currentColor"/>
             <rect x="7" y="3" width="7" height="2" rx="1" fill="currentColor"/>
             <circle cx="4" cy="8" r="1.5" fill="currentColor"/>
             <rect x="7" y="7" width="5" height="2" rx="1" fill="currentColor"/>
             <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
             <rect x="7" y="11" width="6" height="2" rx="1" fill="currentColor"/>`
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: `<circle cx="8" cy="5.5" r="2.5" fill="currentColor"/>
             <path d="M2 13.5C2 10.5 4.5 9 8 9C11.5 9 14 10.5 14 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
    }
  ];

  logout(): void {
    this.auth.logout();
  }
}
