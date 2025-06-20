import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Token {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

export interface KeycloakUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthNewService {
  private baseUrl = `${environment.authApiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<KeycloakUser | null>(null);
  private tokenSubject = new BehaviorSubject<Token | null>(null);

  constructor(private http: HttpClient) {
    // Try to restore session from localStorage
    const savedToken = localStorage.getItem('token');

   
    if (savedToken) {
      console.log("-----------saved token"+savedToken);
      const token = JSON.parse(savedToken);
      this.tokenSubject.next(token);
       this.loadCurrentUser();
    }
  }

  public get currentUser(): KeycloakUser | null {
    return this.currentUserSubject.value;
  }

  public get currentToken(): Token | null {
    return this.tokenSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  login(username: string, password: string): Observable<Token> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return this.http.post<Token>(`${this.baseUrl}/login`, formData.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    }).pipe(
      tap(token => {
        localStorage.setItem('token', JSON.stringify(token));
        this.tokenSubject.next(token);
       this.loadCurrentUser();
      })
    );
  }

  refresh(): Observable<Token> {
    const token = this.tokenSubject.value;
    if (!token) {
      throw new Error('No refresh token available');
    }

    const formData = new URLSearchParams();
    formData.append('refresh_token', token.refresh_token);

    return this.http.post<Token>(`${this.baseUrl}/refresh`, formData.toString(), {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    }).pipe(
      tap(newToken => {
        localStorage.setItem('token', JSON.stringify(newToken));
        this.tokenSubject.next(newToken);
      })
    );
  }

  loadCurrentUser(): Observable<KeycloakUser> {
    console.log("-----------loadin user");
    
    return this.http.get<KeycloakUser>(`${this.baseUrl}/me`).pipe(
      tap(user => {
        console.log('user---------- loaded:', user);
        
        this.currentUserSubject.next(user)
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  public isUserInRole(role: string): boolean {
    console.log('isUserInRole:', role, this.currentUser?.roles);
    
    return this.currentUser?.roles.includes(role) ?? false;
  }
}
