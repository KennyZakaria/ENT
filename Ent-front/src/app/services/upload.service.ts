import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UploadResponse {
  title: string;
  description: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private baseUrl = environment.uploadApiUrl;
  
  // File type mapping to match backend
  private readonly FILE_TYPE_MAP: { [key: string]: string[] } = {
    'pdf': ['application/pdf'],
    'zip': ['application/zip', 'application/x-zip-compressed'],
    'rar': ['application/x-rar-compressed'],
    'mp4': ['video/mp4'],
    'webm': ['video/webm'],
    'avi': ['video/x-msvideo'],
    'mov': ['video/quicktime']
  };

  constructor(private http: HttpClient) {}

  private isAllowedFileType(file: File): boolean {
    const allowedMimeTypes = Object.values(this.FILE_TYPE_MAP).flat();
    return allowedMimeTypes.includes(file.type);
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Upload course file with optional token
   */
  uploadCourseFile(
    file: File,
    title: string,
    description: string,
    sector_id: string , // Default to 1 if not provided
    token?: string
  ): Observable<UploadResponse> {
    // Validate file size
    if (file.size > environment.maxUploadSize) {
      return throwError(() => new Error(`File size exceeds ${environment.maxUploadSize / (1024 * 1024)}MB limit`));
    }

    // Validate file type
    if (!this.isAllowedFileType(file)) {
      const allowedTypes = Object.keys(this.FILE_TYPE_MAP).join(', ').toUpperCase();
      return throwError(() => new Error(`File type not allowed. Allowed types: ${allowedTypes}`));
    }

    const formData = new FormData();
    // Use the exact field names that FastAPI expects
    formData.append('file', file, file.name);  // FastAPI's UploadFile expects 'file'
    formData.append('title', title);
    formData.append('sector_id', sector_id.toString()); // FastAPI expects 'sector_id' as a string
    formData.append('description', description);

    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http
      .post<UploadResponse>(`${this.baseUrl}/courses/upload`, formData, {
        headers
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Upload error:', error);
          
          // Handle specific error cases from your FastAPI backend
          if (error.status === 413) {
            return throwError(() => new Error('File is too large for the server'));
          }
          
          if (error.status === 400) {
            return throwError(() => new Error(error.error?.detail || 'Invalid file type or format'));
          }
          
          if (error.status === 500) {
            const errorDetail = error.error?.detail || '';
            if (errorDetail.includes('Error uploading to storage')) {
              return throwError(() => new Error('Storage service error. Please try again later.'));
            }
            return throwError(() => new Error(errorDetail || 'Server error during upload'));
          }

          // Handle any other errors
          const errorMessage = error.error?.detail || error.message || 'Upload failed. Please try again.';
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Check the health status of the backend
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`).pipe(catchError(this.handleError));
  }

  /**
   * Load the index.html (optional)
   */
  loadRoot(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/`, { responseType: 'blob' }).pipe(catchError(this.handleError));
  }

  /**
   * Error handler
   */
  private handleError(error: HttpErrorResponse) {
    console.error('Backend returned error:', error);
    return throwError(() => error.error || 'Server error');
  }
}
