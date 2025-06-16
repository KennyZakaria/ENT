import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Course {
  id: string;
  title: string;
  description: string;
}

export interface DownloadResponse {
  download_url: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseDownloadService {
  private baseUrl = environment.downloadApiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Fetch list of available courses.
   */
  listCourses(): Observable<Course[]> {
    return this.http
      .get<Course[]>(`${this.baseUrl}/courses`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Generate a secure download URL for a course file.
   */
  getDownloadUrl(courseId: string, token?: string): Observable<DownloadResponse> {
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http
      .get<DownloadResponse>(`${this.baseUrl}/courses/${courseId}/download`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Health check for the backend.
   */
  healthCheck(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/health`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Generic error handler.
   */
  private handleError(error: HttpErrorResponse) {
    console.error('API error:', error);
    return throwError(() => error.error || 'Server error');
  }
}
