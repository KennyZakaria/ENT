import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Token } from '../models/auth.model';
import { KeycloakUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8003'; // Update with your actual API URL

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<Token> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return this.http.post<Token>(`${this.apiUrl}/auth/login`, formData);
  }

  refresh(refreshToken: string): Observable<Token> {
    const formData = new FormData();
    formData.append('refresh_token', refreshToken);
    return this.http.post<Token>(`${this.apiUrl}/auth/refresh`, formData);
  }

  getCurrentUser(): Observable<KeycloakUser> {
    return this.http.get<KeycloakUser>(`${this.apiUrl}/auth/me`);
  }
}
