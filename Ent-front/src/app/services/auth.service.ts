import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js';
import { from, Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = new BehaviorSubject<boolean>(false);
  private userProfile = new BehaviorSubject<KeycloakProfile | null>(null);

  constructor(private keycloakService: KeycloakService) {
    this.initializeAuthState();
  }

  private async initializeAuthState() {
    try {
      const authenticated = await this.keycloakService.isLoggedIn();
      this.isAuthenticated.next(authenticated);
      if (authenticated) {
        const profile = await this.loadUserProfile();
        this.userProfile.next(profile);
      }
    } catch (error) {
      console.error('Failed to initialize auth state', error);
      this.isAuthenticated.next(false);
      this.userProfile.next(null);
    }
  }

  public getLoggedUser(): KeycloakTokenParsed | undefined {
    try {
      return this.keycloakService.getKeycloakInstance().idTokenParsed;
    } catch (e) {
      console.error('Failed to get user', e);
      return undefined;
    }
  }

  public async isLoggedIn(): Promise<boolean> {
    try {
      const authenticated = await this.keycloakService.isLoggedIn();
      this.isAuthenticated.next(authenticated);
      return authenticated;
    } catch (error) {
      console.error('Failed to check login status', error);
      return false;
    }
  }

  public loadUserProfile(): Promise<KeycloakProfile> {
    return this.keycloakService.loadUserProfile();
  }

  public getUserProfile(): Observable<KeycloakProfile | null> {
    return this.userProfile.asObservable();
  }

  public async login(redirectUri?: string): Promise<void> {
    try {
      await this.keycloakService.login({
        redirectUri: redirectUri || window.location.origin + '/dashboard'
      });
      this.isAuthenticated.next(true);
      const profile = await this.loadUserProfile();
      this.userProfile.next(profile);
    } catch (error) {
      console.error('Login failed', error);
      this.isAuthenticated.next(false);
      this.userProfile.next(null);
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.keycloakService.logout(window.location.origin);
      this.isAuthenticated.next(false);
      this.userProfile.next(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  }

  public getToken(): Promise<string> {
    return this.keycloakService.getToken();
  }

  public isUserInRole(role: string): boolean {
    return this.keycloakService.isUserInRole(role);
  }
}