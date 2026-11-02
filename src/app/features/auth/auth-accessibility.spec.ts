import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

for (const component of [LoginComponent, RegisterComponent]) {
  describe(`${component.name} accessible fields`, () => {
    beforeEach(() => TestBed.configureTestingModule({
      imports: [component],
      providers: [provideRouter([]), { provide: AuthService, useValue: {} }]
    }));

    it('gives every input a unique, associated visible label', () => {
      const fixture = TestBed.createComponent<LoginComponent | RegisterComponent>(component);
      fixture.detectChanges();
      const inputs: HTMLInputElement[] = Array.from(fixture.nativeElement.querySelectorAll('input'));
      expect(inputs.length).toBe(component === LoginComponent ? 2 : 3);
      expect(new Set(inputs.map(input => input.id)).size).toBe(inputs.length);
      for (const input of inputs) {
        expect(input.id).toBeTruthy();
        expect(input.labels!.length).toBe(1);
        expect(input.labels![0].textContent!.trim()).toBeTruthy();
        input.labels![0].click();
        expect(document.activeElement).toBe(input);
      }
    });

    it('preserves validation messages without calling authentication for empty fields', () => {
      const fixture = TestBed.createComponent<LoginComponent | RegisterComponent>(component);
      fixture.componentInstance.submit();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.auth-card__error').textContent)
        .toContain(component === LoginComponent ? 'Please enter your username and password.' : 'Please fill in all fields.');
    });

    it('keeps all fields and the submit action disabled while loading', async () => {
      const fixture = TestBed.createComponent<LoginComponent | RegisterComponent>(component);
      fixture.componentInstance.loading.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const controls: Array<HTMLInputElement | HTMLButtonElement> = Array.from(fixture.nativeElement.querySelectorAll('input, button'));
      expect(controls.every(control => control.disabled)).toBeTrue();
      expect(fixture.nativeElement.querySelector('button').textContent)
        .toContain(component === LoginComponent ? 'Logging in...' : 'Creating account...');
    });
  });
}
