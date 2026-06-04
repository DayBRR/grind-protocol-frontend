import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { UserProfileService } from '../../core/auth/user-profile.service';

@Component({
  selector: 'gp-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {
  private readonly profileService = inject(UserProfileService);

  ngOnInit(): void {
    this.profileService.loadProfile().subscribe();
  }
}
