import { Component, OnDestroy, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { UserProfileService } from '../../core/auth/user-profile.service';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  tasks: 'Tasks',
  rewards: 'Rewards',
  profile: 'Profile'
};

@Component({
  selector: 'gp-topbar',
  standalone: true,
  imports: [DatePipe, UpperCasePipe, DecimalPipe],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnDestroy {
  private readonly profileService = inject(UserProfileService);
  private readonly router = inject(Router);
  private readonly routerSub: Subscription;

  readonly profile = this.profileService.profile;
  readonly today = new Date();
  readonly pageTitle = signal(this.resolveTitle(this.router.url));

  constructor() {
    this.routerSub = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(event => {
      this.pageTitle.set(this.resolveTitle(event.urlAfterRedirects));
    });
  }

  ngOnDestroy(): void {
    this.routerSub.unsubscribe();
  }

  private resolveTitle(url: string): string {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const firstSegment = cleanUrl.split('/').filter(Boolean)[0] ?? 'dashboard';
    return PAGE_TITLES[firstSegment] ?? 'Grind Protocol';
  }
}
