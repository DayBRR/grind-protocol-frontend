import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RewardService } from './reward.service';
import { UserProfileService } from '../auth/user-profile.service';
import { RewardResponse, RewardRedemptionResponse, UserProfileResponse } from '../models/domain.models';
import { environment } from '../../../environments/environment';
import { RewardStoreComponent } from '../../features/rewards/reward-store/reward-store.component';
import { DashboardComponent } from '../../features/dashboard/dashboard.component';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

describe('Reward eligibility', () => {
  const base = environment.apiUrl;
  const profile: UserProfileResponse = { userId: 1, username: 'qa', displayName: 'QA',
    dailyTaskGoal: 3, totalXp: 315, level: 4, corePoints: 24, currentStreak: 1,
    bestStreak: 1, lastEvaluatedDate: null };
  const reward: RewardResponse = { id: 1, name: 'QA reward', description: null,
    type: 'REAL', category: 'OTHER', costCorePoints: 19, enabled: true,
    repeatable: true, cooldownDays: null, requiredLevel: null, requiredCurrentStreak: null };
  let service: RewardService;
  let profiles: UserProfileService;
  let http: HttpTestingController;

  function loadProfile(overrides: Partial<UserProfileResponse> = {}) {
    profiles.refreshProfile().subscribe();
    http.expectOne(`${base}/me/profile`).flush({ ...profile, ...overrides });
  }
  function catalog(overrides: Partial<RewardResponse> = {}) {
    service.loadRewards().subscribe(items => expect(items[0].name).toBe(reward.name));
    http.expectOne(`${base}/me/rewards`).flush([{ ...reward, ...overrides }]);
  }
  function history(items: RewardRedemptionResponse[] = []) {
    service.loadRedemptions().subscribe();
    http.expectOne(`${base}/me/rewards/redemptions`).flush(items);
  }
  function redemption(status: string, redeemedAt = '2026-01-01T12:00:00'): RewardRedemptionResponse {
    return { id: 10, rewardId: 1, rewardName: reward.name, rewardDescription: null,
      rewardType: 'REAL', rewardCategory: 'OTHER', status, costPaid: 19,
      redeemedAt, expiresAt: null, usedAt: '2099-01-01T12:00:00', cancelledAt: null, notes: null };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      provideRouter([{ path: 'dashboard', component: DashboardComponent },
        { path: 'rewards', component: RewardStoreComponent }])] });
    TestBed.overrideComponent(DashboardComponent, { set: { template: '' } });
    service = TestBed.inject(RewardService);
    profiles = TestBed.inject(UserProfileService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  for (const fromDashboard of [false, true]) {
    it(`renders eligible cards after ${fromDashboard ? 'real Dashboard navigation' : 'fresh direct /rewards entry'}`, async () => {
      const harness = await RouterTestingHarness.create();
      if (fromDashboard) {
        const dashboard = await harness.navigateByUrl('/dashboard', DashboardComponent);
        const requests = http.match(() => true);
        for (const request of requests) {
          const url = request.request.url;
          request.flush(url.endsWith('/profile') ? profile
            : url.endsWith('/progression') ? { ...profile, xpForCurrentLevel: 300,
              xpForNextLevel: 400, xpProgressInCurrentLevel: 15 }
            : url.endsWith('/weekly-summary') ? { totalXp: 315, deltaPercent: 0, days: [] }
            : url.endsWith('/rewards') ? [reward]
            : url.endsWith('/category-focus') ? { categories: [] }
            : url.endsWith('/today') && url.includes('daily-progress') ? {} : []);
        }
        expect(dashboard.level()).toBe(4);
        expect(dashboard.totalXp()).toBe(315);
        expect(dashboard.corePoints()).toBe(24);
      }
      await harness.navigateByUrl('/rewards', RewardStoreComponent);
      http.expectOne(`${base}/me/rewards`).flush([{ ...reward, requiredLevel: 4, requiredCurrentStreak: 1 }]);
      http.expectOne(`${base}/me/rewards/redemptions`).flush([]);
      harness.detectChanges();
      expect(harness.routeNativeElement!.querySelector('gp-reward-card')).toBeNull();
      http.expectOne(`${base}/me/profile`).flush(profile);
      harness.detectChanges();
      expect(harness.routeNativeElement!.querySelector('gp-reward-card')!.textContent).toContain('Redeem');
      expect(harness.routeNativeElement!.textContent).not.toContain('Not enough CP');
    });
  }

  for (const profileFirst of [false, true]) {
    it(`handles ${profileFirst ? 'Profile before Rewards / Dashboard navigation' : 'Rewards before Profile / direct F5'}`, () => {
      if (profileFirst) loadProfile();
      catalog(); history();
      if (!profileFirst) {
        expect(service.rewards()[0].lockedReason).toBe('Loading eligibility...');
        loadProfile();
      }
      expect(service.rewards()[0].canRedeem).toBeTrue();
    });
  }

  it('updates balance, level and streak without reloading the catalog', () => {
    catalog({ requiredLevel: 4, requiredCurrentStreak: 1 }); history(); loadProfile();
    expect(service.rewards()[0].canRedeem).toBeTrue();
    loadProfile({ corePoints: 18 });
    expect(service.rewards()[0].lockedReason).toBe('Not enough CP');
    loadProfile({ level: 3 });
    expect(service.rewards()[0].lockedReason).toBe('Level 4+');
    loadProfile({ currentStreak: 0 });
    expect(service.rewards()[0].lockedReason).toBe('1 day streak');
  });

  for (const level of [3, 4, 5]) {
    it(`compares level 4 with requirement ${level}`, () => {
      loadProfile(); history(); catalog({ requiredLevel: level });
      expect(service.rewards()[0].canRedeem).toBe(level <= 4);
    });
  }
  for (const streak of [0, 1, 2]) {
    it(`compares streak 1 with requirement ${streak}`, () => {
      loadProfile(); history(); catalog({ requiredCurrentStreak: streak });
      expect(service.rewards()[0].canRedeem).toBe(streak <= 1);
    });
  }
  for (const cost of [23, 24, 25]) {
    it(`compares balance 24 with cost ${cost}`, () => {
      loadProfile(); history(); catalog({ costCorePoints: cost });
      expect(service.rewards()[0].canRedeem).toBe(cost <= 24);
    });
  }
  for (const status of ['REDEEMED', 'USED', 'EXPIRED', 'CANCELLED']) {
    it(`uses ${status} for single-use eligibility`, () => {
      loadProfile(); catalog({ repeatable: false }); history([redemption(status)]);
      expect(service.rewards()[0].canRedeem).toBe(status === 'CANCELLED');
    });
    it(`uses ${status} for cooldown and ignores usedAt`, fakeAsync(() => {
      const start = new Date(2026, 0, 1, 12).getTime();
      spyOn(Date, 'now').and.returnValue(start + 1000);
      loadProfile(); catalog({ cooldownDays: 1 }); history([redemption(status)]);
      expect(service.rewards()[0].isOnCooldown).toBe(status !== 'CANCELLED');
      TestBed.flushEffects();
      TestBed.resetTestingModule();
    }));
  }

  it('expires cooldown automatically at the exact boundary', fakeAsync(() => {
    const boundary = new Date(2026, 0, 2, 12).getTime();
    const now = spyOn(Date, 'now').and.returnValue(boundary - 1);
    loadProfile(); catalog({ cooldownDays: 1 }); history([redemption('REDEEMED')]);
    expect(service.rewards()[0].canRedeem).toBeFalse();
    TestBed.flushEffects();
    now.and.returnValue(boundary);
    tick(1);
    expect(service.rewards()[0].canRedeem).toBeTrue();
    TestBed.flushEffects();
  }));

  it('allows expired cooldown and ignores unrelated rewards and cancelled latest entries', () => {
    spyOn(Date, 'now').and.returnValue(new Date(2026, 0, 3, 12).getTime());
    loadProfile(); catalog({ cooldownDays: 1 });
    history([redemption('USED'), { ...redemption('REDEEMED', '2099-01-01T12:00:00'), rewardId: 2 },
      redemption('CANCELLED', '2099-01-01T12:00:00')]);
    expect(service.rewards()[0].canRedeem).toBeTrue();
  });

  it('keeps disabled rewards unavailable', () => {
    loadProfile(); catalog({ enabled: false }); history();
    expect(service.rewards()[0].lockedReason).toBe('Unavailable');
  });

  it('waits for history rather than assuming no earlier redemption', () => {
    loadProfile(); catalog({ repeatable: false });
    expect(service.rewards()[0].canRedeem).toBeFalse();
    history([redemption('USED')]);
    expect(service.rewards()[0].lockedReason).toBe('Already redeemed');
  });

  it('refreshes balance and history after redeem, without reloading rewards', () => {
    loadProfile(); catalog(); history();
    let completed = false;
    service.redeemReward(1).subscribe(() => completed = true);
    http.expectOne(`${base}/me/rewards/1/redeem`).flush({ remainingCorePoints: 5 });
    expect(service.rewards()[0].canRedeem).toBeFalse();
    http.expectOne(`${base}/me/profile`).flush({ ...profile, corePoints: 5 });
    http.expectOne(`${base}/me/rewards/redemptions`).flush([redemption('REDEEMED')]);
    expect(completed).toBeTrue();
    expect(service.rewards()[0].lockedReason).toBe('Not enough CP');
  });

  it('does not reactivate cooldown when redemption becomes USED', () => {
    spyOn(Date, 'now').and.returnValue(new Date(2026, 0, 1, 13).getTime());
    loadProfile(); catalog({ cooldownDays: 1 }); history([redemption('REDEEMED')]);
    service.useRedemption(10).subscribe();
    http.expectOne(`${base}/me/rewards/redemptions/10/use`).flush(redemption('USED'));
    expect(service.rewards()[0].lockedReason).toBe('Cooldown');
  });

  it('uses the latest effective redemption regardless of history order', () => {
    spyOn(Date, 'now').and.returnValue(new Date(2026, 0, 3, 13).getTime());
    loadProfile(); catalog({ cooldownDays: 1 });
    history([redemption('USED'), redemption('EXPIRED', '2026-01-03T12:00:00')]);
    expect(service.rewards()[0].lockedReason).toBe('Cooldown');
  });

  it('does not report a successful redemption as rejected when profile refresh fails', () => {
    loadProfile(); catalog(); history();
    let message = '';
    service.redeemReward(1).subscribe({ error: error => message = error.message });
    http.expectOne(`${base}/me/rewards/1/redeem`).flush({ remainingCorePoints: 5 });
    http.expectOne(`${base}/me/rewards/redemptions`).flush([redemption('REDEEMED')]);
    expect(service.rewards()[0].canRedeem).toBeFalse();
    http.expectOne(`${base}/me/profile`).flush({}, { status: 500, statusText: 'Failure' });
    expect(message).toContain('Reward redeemed, but');
    expect(service.rewards()[0].canRedeem).toBeFalse();
  });

  it('rechecks eligibility when confirming an already open modal', () => {
    const fixture = TestBed.createComponent(RewardStoreComponent);
    fixture.detectChanges();
    http.expectOne(`${base}/me/profile`).flush(profile);
    http.expectOne(`${base}/me/rewards`).flush([reward]);
    http.expectOne(`${base}/me/rewards/redemptions`).flush([]);
    fixture.componentInstance.onClaim(service.rewards()[0]);
    loadProfile({ corePoints: 0 });
    fixture.componentInstance.confirmClaim();
    http.expectNone(`${base}/me/rewards/1/redeem`);
  });

  for (const failing of ['profile', 'rewards', 'rewards/redemptions']) {
    it(`hides eligibility on ${failing} loading failure and supports retry`, () => {
      const fixture = TestBed.createComponent(RewardStoreComponent);
      fixture.detectChanges();
      const requests = http.match(request => request.url.startsWith(`${base}/me/`));
      requests.find(request => request.request.url === `${base}/me/${failing}`)!
        .flush({}, { status: 500, statusText: 'Failure' });
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('Not enough CP');
      expect(fixture.nativeElement.querySelector('gp-reward-card')).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Retry loading rewards');
      fixture.componentInstance.loadStore();
      http.expectOne(`${base}/me/profile`).flush(profile);
      http.expectOne(`${base}/me/rewards`).flush([reward]);
      http.expectOne(`${base}/me/rewards/redemptions`).flush([]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('gp-reward-card').textContent).toContain('Redeem');
    });
  }
});
