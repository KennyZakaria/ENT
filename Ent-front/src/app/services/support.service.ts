import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  userId: string;
  assignedTo?: string;
  comments: TicketComment[];
}

export interface TicketComment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: SupportTicket['priority'];
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private baseUrl = `${environment.uploadApiUrl}/support`;

  constructor(private http: HttpClient) {}

  /**
   * Get all support tickets for the current user
   */
  getTickets(): Observable<SupportTicket[]> {
    return this.http
      .get<SupportTicket[]>(this.baseUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new support ticket
   */
  createTicket(ticket: CreateTicketRequest): Observable<SupportTicket> {
    return this.http
      .post<SupportTicket>(this.baseUrl, ticket)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update ticket status
   */
  updateTicketStatus(ticketId: string, status: SupportTicket['status']): Observable<SupportTicket> {
    return this.http
      .patch<SupportTicket>(`${this.baseUrl}/${ticketId}/status`, { status })
      .pipe(catchError(this.handleError));
  }

  /**
   * Add comment to ticket
   */
  addComment(ticketId: string, content: string): Observable<TicketComment> {
    return this.http
      .post<TicketComment>(`${this.baseUrl}/${ticketId}/comments`, { content })
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
