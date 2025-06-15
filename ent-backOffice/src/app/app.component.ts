import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="app-container">
      <mat-toolbar color="primary" *ngIf="isLoggedIn">
        <span>ENT Backoffice</span>
        <span class="spacer"></span>
        <button mat-button routerLink="/users" routerLinkActive="active">
          <mat-icon>people</mat-icon>
          Users
        </button>
        <button mat-button routerLink="/sectors" routerLinkActive="active">
          <mat-icon>category</mat-icon>
          Sectors
        </button>
        <button mat-icon-button (click)="logout()">
          <mat-icon>exit_to_app</mat-icon>
        </button>
      </mat-toolbar>

      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .active {
      background-color: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class AppComponent {
  constructor(private router: Router) {}

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/login']);
  }
}
