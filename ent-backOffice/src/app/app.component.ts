import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

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
    MatIconModule,
    MatSidenavModule,
    MatListModule
  ],
  template: `
    <div class="app-container">
      <ng-container *ngIf="isLoggedIn; else loginTemplate">
        <mat-sidenav-container class="sidenav-container">
          <!-- Side Navigation Drawer -->
          <mat-sidenav #sidenav mode="side" opened class="sidenav">
            <div class="sidenav-header">
              <span class="text-xl font-bold text-white">ENT Backoffice</span>
            </div>
            <mat-nav-list>
              <a mat-list-item routerLink="/users" routerLinkActive="active-link" class="nav-list-item">
                <mat-icon class="nav-icon">people</mat-icon>
                <span>Users</span>
              </a>
              <a mat-list-item routerLink="/sectors" routerLinkActive="active-link" class="nav-list-item">
                <mat-icon class="nav-icon">category</mat-icon>
                <span>Sectors</span>
              </a>
            </mat-nav-list>
          </mat-sidenav>

          <!-- Main Content -->
          <mat-sidenav-content>
            <nav class="bg-white shadow-md px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <button mat-icon-button (click)="toggleSidenav()" class="menu-button">
                    <mat-icon>menu</mat-icon>
                  </button>
                  <span class="text-xl font-bold text-blue-600 ml-2">ENT Backoffice</span>
                </div>
                <div class="flex items-center space-x-4">
                  <button (click)="logout()" class="logout-button">
                    <mat-icon>exit_to_app</mat-icon>
                  </button>
                </div>
              </div>
            </nav>

            <div class="content">
              <router-outlet></router-outlet>
            </div>
          </mat-sidenav-content>
        </mat-sidenav-container>
      </ng-container>

      <ng-template #loginTemplate>
        <router-outlet></router-outlet>
      </ng-template>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: #f9fafb;
    }
    .sidenav-container {
      flex: 1;
      height: 100vh;
    }
    .sidenav {
      width: 250px;
      background: linear-gradient(to bottom, #2563eb, #3b82f6);
      color: white;
      border-right: none;
    }
    .sidenav-header {
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 64px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .nav-list-item {
      color: white;
      margin: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .nav-list-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .nav-icon {
      margin-right: 8px;
      color: white;
    }
    .active-link {
      background-color: rgba(255, 255, 255, 0.2);
    }
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 0;
    }
    .menu-button {
      color: #4b5563;
    }
    .logout-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 9999px;
      background: linear-gradient(to right, #2563eb, #3b82f6);
      color: white;
      transition: all 0.2s;
    }
    .logout-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      background: linear-gradient(to right, #1d4ed8, #2563eb);
    }
  `]
})
export class AppComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  constructor(private router: Router) {}

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/login']);
  }
}
