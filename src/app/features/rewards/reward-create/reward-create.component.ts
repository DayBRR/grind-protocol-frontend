import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'gp-reward-create',
  standalone: true,
  templateUrl: './reward-create.component.html',
  styleUrls: ['./reward-create.component.scss']
})
export class RewardCreateComponent {
  readonly router = inject(Router);
}
