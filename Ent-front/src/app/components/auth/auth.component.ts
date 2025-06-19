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
    <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
      <!-- Background avec motifs académiques -->
      <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full animate-pulse"></div>
        <div class="absolute top-40 right-20 w-24 h-24 border border-white rounded-lg rotate-45 animate-bounce"></div>
        <div class="absolute bottom-20 left-1/4 w-16 h-16 border-2 border-white rounded-full animate-pulse"></div>
        <div class="absolute bottom-40 right-1/3 w-20 h-20 border border-white rounded-lg rotate-12 animate-bounce"></div>
      </div>
      
      <!-- Particules flottantes -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="particle particle-1"></div>
        <div class="particle particle-2"></div>
        <div class="particle particle-3"></div>
        <div class="particle particle-4"></div>
        <div class="particle particle-5"></div>
      </div>

      <!-- Conteneur principal -->
      <div class="relative z-10 w-full max-w-md mx-4">
        <!-- Carte de connexion -->
        <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-500 hover:scale-105">
          
          <!-- En-tête avec logo et titre -->
          <div class="text-center mb-8">
            <!-- Logo universitaire stylisé -->
            <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9L12 15L21 12.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z"/>
              </svg>
            </div>
            
            <h1 class="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-700 bg-clip-text text-transparent mb-2">
              Portail Étudiant
            </h1>
            <p class="text-slate-600 font-medium">Connectez-vous à votre espace</p>
          </div>

          <!-- Formulaire -->
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="space-y-6">
            
            <!-- Message d'erreur -->
            <div *ngIf="error" class="error-message">
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <span>{{ error }}</span>
              </div>
            </div>

            <!-- Champ nom d'utilisateur -->
            <div class="input-group">
              <label for="username" class="input-label">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                [(ngModel)]="username"
                name="username"
                required
                [disabled]="isLoading"
                placeholder="Entrez votre nom d'utilisateur"
                class="input-field">
            </div>

            <!-- Champ mot de passe -->
            <div class="input-group">
              <label for="password" class="input-label">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                </svg>
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                required
                [disabled]="isLoading"
                placeholder="Entrez votre mot de passe"
                class="input-field">
            </div>

            <!-- Options supplémentaires -->
            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                <span class="text-slate-600">Se souvenir</span>
              </label>
              <a href="#" class="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Mot de passe oublié ?
              </a>
            </div>

            <!-- Bouton de connexion -->
            <button
              type="submit"
              [disabled]="!loginForm.form.valid || isLoading"
              class="login-button group">
              
              <div *ngIf="!isLoading" class="flex items-center justify-center space-x-2">
                <span>Se connecter</span>
                <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </div>
              
              <div *ngIf="isLoading" class="flex items-center justify-center space-x-2">
                <div class="loading-spinner"></div>
                <span>Connexion en cours...</span>
              </div>
            </button>
          </form>

          <!-- Pied de page -->
          <div class="mt-8 pt-6 border-t border-slate-200">
            <p class="text-center text-sm text-slate-500">
              Besoin d'aide ? 
              <a href="#" class="text-blue-600 hover:text-blue-800 font-medium ml-1">
                Contactez le support
              </a>
            </p>
          </div>
        </div>

        <!-- Informations supplémentaires -->
        <div class="mt-6 text-center">
          <p class="text-white/80 text-sm">
            🎓 Plateforme éducative sécurisée • Version 2.0
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Animations des particules */
    .particle {
      position: absolute;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      pointer-events: none;
    }
    
    .particle-1 {
      width: 4px;
      height: 4px;
      top: 20%;
      left: 10%;
      animation: float 6s ease-in-out infinite;
    }
    
    .particle-2 {
      width: 6px;
      height: 6px;
      top: 60%;
      right: 15%;
      animation: float 8s ease-in-out infinite reverse;
    }
    
    .particle-3 {
      width: 3px;
      height: 3px;
      bottom: 30%;
      left: 20%;
      animation: float 7s ease-in-out infinite;
    }
    
    .particle-4 {
      width: 5px;
      height: 5px;
      top: 80%;
      right: 30%;
      animation: float 9s ease-in-out infinite reverse;
    }
    
    .particle-5 {
      width: 4px;
      height: 4px;
      top: 40%;
      left: 80%;
      animation: float 5s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }

    /* Message d'erreur */
    .error-message {
      @apply bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl;
      animation: slideInDown 0.4s ease-out;
    }

    /* Groupes d'input */
    .input-group {
      @apply space-y-2;
    }

    .input-label {
      @apply flex items-center space-x-2 text-sm font-semibold text-slate-700;
    }

    .input-field {
      @apply w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl;
      @apply focus:outline-none focus:border-blue-500 focus:bg-white;
      @apply transition-all duration-300 ease-in-out;
      @apply placeholder-slate-400 text-slate-800;
      @apply disabled:bg-slate-100 disabled:cursor-not-allowed;
    }

    .input-field:focus {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      transform: translateY(-1px);
    }

    /* Bouton de connexion */
    .login-button {
      @apply w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600;
      @apply text-white font-bold rounded-xl shadow-lg;
      @apply hover:from-blue-700 hover:to-indigo-700;
      @apply transform transition-all duration-300 ease-in-out;
      @apply disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed;
      @apply focus:outline-none focus:ring-4 focus:ring-blue-300;
    }

    .login-button:hover:not(:disabled) {
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
      transform: translateY(-2px);
    }

    .login-button:active:not(:disabled) {
      transform: translateY(0);
    }

    /* Spinner de chargement */
    .loading-spinner {
      @apply w-5 h-5 border-2 border-white border-t-transparent rounded-full;
      animation: spin 1s linear infinite;
    }

    /* Animations */
    @keyframes slideInDown {
      0% {
        opacity: 0;
        transform: translateY(-10px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .login-button {
        @apply py-3 text-base;
      }
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
      this.error = error.error?.detail || 'Nom d\'utilisateur ou mot de passe incorrect';
    } finally {
      this.isLoading = false;
    }
  }
}