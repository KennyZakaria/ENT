import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sector } from '../models/sector.model';
import { KeycloakUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class SectorService {
  private apiUrl = 'http://localhost:8003'; // Update with your actual API URL

  constructor(private http: HttpClient) { }

  getSectors(): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${this.apiUrl}/sectors/`);
  }

  createSector(sector: Sector): Observable<Sector> {
    return this.http.post<Sector>(`${this.apiUrl}/sectors/`, sector);
  }

  getSectorUsers(sectorId: string, role?: string): Observable<KeycloakUser[]> {
    let url = `${this.apiUrl}/sectors/${sectorId}/users`;
    if (role) {
      url += `?role=${role}`;
    }
    return this.http.get<KeycloakUser[]>(url);
  }
}
