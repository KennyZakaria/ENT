import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthNewService } from '../../services/auth-new.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Login</h2>
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="error-message" *ngIf="error">
            {{ error }}
          </div>
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              [(ngModel)]="username" 
              name="username"
              required
              [disabled]="isLoading">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              [(ngModel)]="password" 
              name="password"
              required
              [disabled]="isLoading">
          </div>
          <button 
            type="submit" 
            [disabled]="!loginForm.form.valid || isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }

    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #666;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,.25);
    }

    button {
      width: 100%;
      padding: 0.75rem;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
  `]
})
export class AuthComponent {
  username = '';
  password = '';
  error = '';
  isLoading = false;

  constructor(
    private authService: AuthNewService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }
  }

  async onSubmit() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.error = '';

    try {
      await this.authService.login(this.username, this.password).toPromise();
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error = error.error?.detail || 'Invalid username or password';
    } finally {
      this.isLoading = false;
    }
  }
}
