import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private baseUrl = `${environment.uploadApiUrl}/notes`;

  constructor(private http: HttpClient) {}

  /**
   * Get all notes for the current user.
   */
  getNotes(): Observable<Note[]> {
    return this.http
      .get<Note[]>(this.baseUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new note.
   */
  createNote(title: string, content: string): Observable<Note> {
    return this.http
      .post<Note>(this.baseUrl, { title, content })
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing note.
   */
  updateNote(id: string, title: string, content: string): Observable<Note> {
    return this.http
      .put<Note>(`${this.baseUrl}/${id}`, { title, content })
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete a note.
   */
  deleteNote(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Generic error handler.
   */
  private handleError(error: HttpErrorResponse) {
    console.error('API error:', error);
    return throwError(() => error.error?.detail || 'Server error');
  }
}
