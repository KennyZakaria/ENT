import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserManagementService, NewUserRequest, Sector } from '../../services/user-management.service';
import { KeycloakUser } from '../../services/auth-new.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-management-container">
      <div class="section">
        <h2>Create New User</h2>
        <form (ngSubmit)="createUser()" #userForm="ngForm">
          <div class="form-group">
            <label for="username">Username:</label>
            <input id="username" type="text" [(ngModel)]="newUser.username" name="username" required>
          </div>
          <div class="form-group">
            <label for="email">Email:</label>
            <input id="email" type="email" [(ngModel)]="newUser.email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input id="password" type="password" [(ngModel)]="newUser.password" name="password" required>
          </div>
          <div class="form-group">
            <label for="firstName">First Name:</label>
            <input id="firstName" type="text" [(ngModel)]="newUser.first_name" name="firstName" required>
          </div>
          <div class="form-group">
            <label for="lastName">Last Name:</label>
            <input id="lastName" type="text" [(ngModel)]="newUser.last_name" name="lastName" required>
          </div>
          <div class="form-group">
            <label for="role">Role:</label>
            <select id="role" [(ngModel)]="newUser.role" name="role" required>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div class="form-group">
            <label>Sectors:</label>
            <div class="checkbox-group">
              <div *ngFor="let sector of sectors">
                <label>
                  <input type="checkbox" 
                         [value]="sector.id"
                         (change)="onSectorChange($event, sector.id)"
                         [checked]="newUser.sector_ids.includes(sector.id || '')">
                  {{ sector.name }}
                </label>
              </div>
            </div>
          </div>
          <button type="submit" [disabled]="!userForm.form.valid">Create User</button>
        </form>
        <div *ngIf="message" [class]="'alert ' + (error ? 'alert-error' : 'alert-success')">
          {{ message }}
        </div>
      </div>

      <div class="section" *ngIf="selectedSector">
        <h2>Users in {{ selectedSector.name }}</h2>
        <div class="role-filter">
          <button (click)="loadSectorUsers(selectedSector.id || '', 'teacher')">Show Teachers</button>
          <button (click)="loadSectorUsers(selectedSector.id || '', 'student')">Show Students</button>
          <button (click)="loadSectorUsers(selectedSector.id || '')">Show All</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of sectorUsers">
              <td>{{ user.username }}</td>
              <td>{{ user.firstName }} {{ user.lastName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.roles.join(', ') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    .form-group input, .form-group select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .checkbox-group {
      border: 1px solid #ddd;
      padding: 10px;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
    }
    .checkbox-group label {
      display: block;
      margin: 5px 0;
    }
    .alert {
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .alert-success {
      background: #d4edda;
      color: #155724;
    }
    .alert-error {
      background: #f8d7da;
      color: #721c24;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
    }
    .role-filter {
      margin-bottom: 15px;
    }
    .role-filter button {
      margin-right: 10px;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: #007bff;
      color: white;
      cursor: pointer;
    }
    .role-filter button:hover {
      background: #0056b3;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  sectors: Sector[] = [];
  sectorUsers: KeycloakUser[] = [];
  selectedSector: Sector | null = null;
  message = '';
  error = false;

  newUser: NewUserRequest = {
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student',
    sector_ids: []
  };

  constructor(private userService: UserManagementService) {}

  ngOnInit(): void {
    this.loadSectors();
  }

  loadSectors(): void {
    this.userService.listSectors().subscribe({
      next: (sectors) => {
        this.sectors = sectors;
        if (sectors.length > 0) {
          this.selectedSector = sectors[0];
          this.loadSectorUsers(sectors[0].id || '');
        }
      },
      error: (error) => {
        console.error('Failed to load sectors:', error);
        this.message = 'Failed to load sectors';
        this.error = true;
      }
    });
  }

  loadSectorUsers(sectorId: string, role?: string): void {
    this.userService.getSectorUsers(sectorId, role).subscribe({
      next: (users) => {
        this.sectorUsers = users;
      },
      error: (error) => {
        console.error('Failed to load users:', error);
      }
    });
  }

  onSectorChange(event: any, sectorId: string | undefined): void {
    if (!sectorId) return;
    
    if (event.target.checked) {
      this.newUser.sector_ids.push(sectorId);
    } else {
      this.newUser.sector_ids = this.newUser.sector_ids.filter(id => id !== sectorId);
    }
  }

  createUser(): void {
    this.userService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.message = `User ${user.username} created successfully`;
        this.error = false;
        // Reset form
        this.newUser = {
          username: '',
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          role: 'student',
          sector_ids: []
        };
        // Refresh user list if we're viewing the sector the new user was added to
        if (this.selectedSector && this.newUser.sector_ids.includes(this.selectedSector.id || '')) {
          this.loadSectorUsers(this.selectedSector.id || '');
        }
      },
      error: (error) => {
        console.error('Failed to create user:', error);
        this.message = error.error?.detail || 'Failed to create user';
        this.error = true;
      }
    });
  }
}
