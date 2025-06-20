import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KeycloakUser, NewUserRequest } from '../models/user.model';
import { UserSectorInfo } from '../models/sector.model';
import { environment } from '../../environement';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl; // Update with your actual API URL

  constructor(private http: HttpClient) { }

  getUsers(role?: string): Observable<KeycloakUser[]> {
    let url = `${this.apiUrl}/users/`;
    if (role) {
      url += `?role=${role}`;
    }
    return this.http.get<KeycloakUser[]>(url);
  }

  createUser(user: NewUserRequest): Observable<KeycloakUser> {
    return this.http.post<KeycloakUser>(`${this.apiUrl}/users/`, user);
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }

  getUserSectors(userId: string): Observable<UserSectorInfo> {
    return this.http.get<UserSectorInfo>(`${this.apiUrl}/users/${userId}/sectors`);
  }
}
