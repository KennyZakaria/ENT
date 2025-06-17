import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { KeycloakUser } from './auth-new.service';

export interface NewUserRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  sector_ids: string[];
}

export interface Sector {
  id?: string;
  name: string;
  description?: string;
}

export interface UserSectorInfo {
  user_id: string;
  sectors: Sector[];
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private baseUrl = `${environment.authApiUrl}`;

  constructor(private http: HttpClient) {}

  createUser(user: NewUserRequest): Observable<KeycloakUser> {
    return this.http.post<KeycloakUser>(`${this.baseUrl}/users/`, user);
  }

  listSectors(): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${this.baseUrl}/sectors/`);
  }

  createSector(sector: Sector): Observable<Sector> {
    return this.http.post<Sector>(`${this.baseUrl}/sectors/`, sector);
  }

  getUserSectors(userId: string): Observable<UserSectorInfo> {
    return this.http.get<UserSectorInfo>(`${this.baseUrl}/users/${userId}/sectors`);
  }

  getSectorUsers(sectorId: string, role?: string): Observable<KeycloakUser[]> {
    let url = `${this.baseUrl}/sectors/${sectorId}/users`;
    if (role) {
      url += `?role=${role}`;
    }
    return this.http.get<KeycloakUser[]>(url);
  }

  getAllUsers(): Observable<KeycloakUser[]> {
    return this.http.get<KeycloakUser[]>(`${this.baseUrl}/users`);
  }
}
