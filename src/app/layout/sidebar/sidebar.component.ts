import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
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
