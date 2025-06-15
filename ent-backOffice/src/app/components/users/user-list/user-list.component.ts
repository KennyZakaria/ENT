import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { KeycloakUser } from '../../../models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Users</h1>
        <div class="actions">
          <mat-form-field>
            <mat-label>Filter by Role</mat-label>
            <mat-select [(ngModel)]="selectedRole" (selectionChange)="loadUsers()">
              <mat-option [value]="''">All</mat-option>
              <mat-option value="teacher">Teachers</mat-option>
              <mat-option value="student">Students</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="createUser()">
            <mat-icon>add</mat-icon>
            New User
          </button>
        </div>
      </div>

      <table mat-table [dataSource]="users" class="mat-elevation-z8">
        <ng-container matColumnDef="username">
          <th mat-header-cell *matHeaderCellDef>Username</th>
          <td mat-cell *matCellDef="let user">{{user.username}}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let user">{{user.email}}</td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let user">{{user.firstName}} {{user.lastName}}</td>
        </ng-container>

        <ng-container matColumnDef="roles">
          <th mat-header-cell *matHeaderCellDef>Roles</th>
          <td mat-cell *matCellDef="let user">{{user.roles?.join(', ')}}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let user">
            <button mat-icon-button color="warn" (click)="deleteUser(user)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    table {
      width: 100%;
    }
  `]
})
export class UserListComponent implements OnInit {
  users: KeycloakUser[] = [];
  selectedRole: string = '';
  displayedColumns: string[] = ['username', 'email', 'name', 'roles', 'actions'];

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers(this.selectedRole).subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        // TODO: Add error handling UI
      }
    });
  }

  createUser() {
    this.router.navigate(['/users/new']);
  }

  deleteUser(user: KeycloakUser) {
    if (confirm(`Are you sure you want to delete user ${user.username}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          // TODO: Add error handling UI
        }
      });
    }
  }
}
