import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  color: string;
  filier_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private baseUrl = `${environment.calenderApiUrl}/events`;

  constructor(private http: HttpClient) {}

  // Create a new event
  createEvent(event: Partial<CalendarEvent>): Observable<CalendarEvent> {
    // Format dates to ISO string for the API
    const formattedEvent = {
      ...event,
      start: event.start instanceof Date ? event.start.toISOString() : new Date(event.start as string).toISOString(),
      end: event.end instanceof Date ? event.end.toISOString() : new Date(event.end as string).toISOString()
    };

    return this.http.post<CalendarEvent>(`${this.baseUrl}/`, formattedEvent).pipe(
      map(response => ({
        ...response,
        // Convert string dates back to Date objects
        start: new Date(response.start),
        end: new Date(response.end)
      }))
    );
  }

  // Get events by filier
  getEventsByFilierId(filierId: string): Observable<CalendarEvent[]> {
    return this.http.get<CalendarEvent[]>(`${this.baseUrl}/${filierId}`).pipe(
      map(events => events.map(event => ({
        ...event,
        // Convert string dates to Date objects
        start: new Date(event.start),
        end: new Date(event.end)
      })))
    );
  }
}
