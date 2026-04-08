import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { UserProfileService } from '../../core/auth/user-profile.service';

@Component({
  selector: 'gp-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="shell">
      <gp-sidebar />
      <div class="shell__main">
        <gp-topbar />
        <main class="shell__content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-base);
    }

    .shell__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    .shell__content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .shell__content::-webkit-scrollbar { width: 4px; }
    .shell__content::-webkit-scrollbar-track { background: transparent; }
    .shell__content::-webkit-scrollbar-thumb { background: var(--border-md); border-radius: 2px; }
  `]
})
export class ShellComponent implements OnInit {
  private readonly profileService = inject(UserProfileService);

  ngOnInit(): void {
    this.profileService.loadProfile().subscribe();
  }
}
