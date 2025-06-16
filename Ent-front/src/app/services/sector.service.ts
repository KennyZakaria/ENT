import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Sector {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class SectorService {
  private baseUrl = `${environment.uploadApiUrl}/sectors`;

  constructor(private http: HttpClient) {}

  /**
   * Get all sectors
   */
  getSectors(): Observable<Sector[]> {
    return this.http
      .get<Sector[]>(this.baseUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Generic error handler
   */
  private handleError(error: HttpErrorResponse) {
    console.error('API error:', error);
    return throwError(() => error.error?.detail || 'Server error');
  }
}
