import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CommonModule } from '@angular/common';
import { CalendarService, CalendarEvent } from '../../services/calendar.service';
import { FormsModule } from '@angular/forms';
import { AuthNewService } from '../../services/auth-new.service';
import { SectorService } from '../../services/sector.service';
import { UserManagementService, UserSectorInfo, Sector } from '../../services/user-management.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule],
  template: `
    <div class="calendar-container">
      <div class="calendar-header" *ngIf="isTeacher">
        <button class="add-event-btn" (click)="showAddEventForm()">Add Event</button>
      </div>
      <div class="event-form" *ngIf="showEventForm && isTeacher">
        <h3>Add Event</h3>
        <form (submit)="createEvent($event)">
          <div>
            <label>Title:</label>
            <input [(ngModel)]="newEvent.title" name="title" required>
          </div>
          <div>
            <label>Sector:</label>
            <select [(ngModel)]="newEvent.filier_id" name="filier_id" required>
              <option value="">Select a sector</option>
              <option *ngFor="let sector of sectors" [value]="sector.id">
                {{ sector.name }}
              </option>
            </select>
          </div>
          <div>
            <label>Start:</label>
            <input type="datetime-local" 
                   [ngModel]="newEvent.start | date:'yyyy-MM-ddTHH:mm'" 
                   (ngModelChange)="newEvent.start = $event"
                   name="start" required>
          </div>
          <div>
            <label>End:</label>
            <input type="datetime-local" 
                   [ngModel]="newEvent.end | date:'yyyy-MM-ddTHH:mm'" 
                   (ngModelChange)="newEvent.end = $event"
                   name="end" required>
          </div>
          <div>
            <label>Color:</label>
            <input type="color" [(ngModel)]="newEvent.color" name="color" required>
          </div>
          <button type="submit">Save</button>
          <button type="button" (click)="cancelEventForm()">Cancel</button>
        </form>
      </div>
      <full-calendar 
        [options]="calendarOptions"
        (eventClick)="handleEventClick($event)"
        (dateClick)="handleDateClick($event)">
      </full-calendar>
    </div>
  `,
  styles: [`
    .calendar-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
    }
    .calendar-header {
      margin-bottom: 20px;
      text-align: right;
    }
    .add-event-btn {
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .add-event-btn:hover {
      background-color: #45a049;
    }
    .event-form {
      position: absolute;
      top: 70px;
      right: 20px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
    }
    .event-form form > div {
      margin-bottom: 10px;
    }
    .event-form label {
      display: block;
      margin-bottom: 5px;
    }
    .event-form input, .event-form select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .event-form button {
      margin-right: 10px;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      background: #4CAF50;
      color: white;
      cursor: pointer;
    }
    .event-form button[type="button"] {
      background: #f44336;
    }
  `]
})
export class FullCalanderComponent implements OnInit {
  showEventForm = false;
  isTeacher = false;
  sectors: any[] = [];
  
  newEvent: Partial<CalendarEvent> = {
    title: '',
    start: new Date(),
    end: new Date(Date.now() + 3600000), // Current time + 1 hour
    color: '#4CAF50',
    filier_id: ''
  };

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    events: this.fetchEvents.bind(this)
  };
  constructor(
    private calendarService: CalendarService,
    private authService: AuthNewService,
    private sectorService: SectorService,
    private userManagementService: UserManagementService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.checkTeacherRole();
    if (this.isTeacher) {
      this.loadSectors();
    }
  }

  private async checkTeacherRole() {
    this.isTeacher = this.authService.isUserInRole('teacher');
    console.log('Is user teacher:', this.isTeacher);
  }

  private loadSectors() {
    this.sectorService.getSectors().subscribe({
      next: (sectors) => {
        this.sectors = sectors;
      },
      error: (error) => {
        console.error('Failed to load sectors:', error);
      }
    });
  }

  showAddEventForm() {
    if (this.isTeacher) {
      this.showEventForm = true;
      // Initialize with current date
      const now = new Date();
      this.newEvent = {
        title: '',
        start: now.toISOString().slice(0, 16),
        end: new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
        color: '#4CAF50',
        filier_id: ''
      };
    }
  }

  cancelEventForm() {
    this.showEventForm = false;
    this.newEvent = {
      title: '',
      start: new Date(),
      end: new Date(Date.now() + 3600000),
      color: '#4CAF50',
      filier_id: ''
    };
  }
  fetchEvents(info: { start: Date; end: Date; timeZone: string }, 
              successCallback: (events: EventInput[]) => void,
              failureCallback: (error: Error) => void) {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      failureCallback(new Error('No user logged in'));
      return;
    }

    // First get user's sectors
    this.userManagementService.getUserSectors(currentUser.id).subscribe({
      next: (userSectorInfo: UserSectorInfo) => {
        if (userSectorInfo.sectors.length === 0) {
          successCallback([]); // No sectors, no events
          return;
        }

        // If user is a teacher, they can see events from all their sectors
        if (this.isTeacher) {
          // Create an array of observables for each sector
          const eventObservables = userSectorInfo.sectors.map((sector: Sector) => 
            this.calendarService.getEventsByFilierId(sector.id || '')
          );

          // Fetch events from all sectors
          Promise.all(eventObservables.map((obs: Observable<CalendarEvent[]>) => 
            new Promise<CalendarEvent[]>(resolve => obs.subscribe((events: CalendarEvent[]) => resolve(events)))
          )).then(sectorEvents => {
            // Combine all events
            const allEvents = sectorEvents.flat().map(event => ({
              id: event.id,
              title: event.title,
              start: event.start instanceof Date ? event.start : new Date(event.start),
              end: event.end instanceof Date ? event.end : new Date(event.end),
              color: event.color,
              filier_id: event.filier_id
            }));
            successCallback(allEvents);
          }).catch(error => {
            console.error('Failed to fetch events:', error);
            failureCallback(error);
          });
        } else {
          // For students, just show events from their primary sector
          const primarySector = userSectorInfo.sectors[0];
          this.calendarService.getEventsByFilierId(primarySector.id || '').subscribe({
            next: (events) => {
              const formattedEvents = events.map(event => ({
                id: event.id,
                title: event.title,
                start: event.start instanceof Date ? event.start : new Date(event.start),
                end: event.end instanceof Date ? event.end : new Date(event.end),
                color: event.color,
                filier_id: event.filier_id
              }));
              successCallback(formattedEvents);
            },
            error: (error) => {
              console.error('Failed to fetch events:', error);
              failureCallback(new Error('Failed to load events'));
            }
          });
        }
      },
      error: (error) => {
        console.error('Failed to fetch user sectors:', error);
        failureCallback(new Error('Failed to load user sectors'));
      }
    });
  }

  handleEventClick(clickInfo: any) {
    console.log('Event clicked:', clickInfo.event.title);
    // Add your event click handling logic here
  }

  handleDateClick(dateInfo: any) {
    console.log('Date clicked:', dateInfo.dateStr);
    this.showEventForm = true;
    this.newEvent.start = dateInfo.dateStr;
    this.newEvent.end = dateInfo.dateStr;
  }

  createEvent(event: Event) {
    event.preventDefault();
    if (!this.newEvent.title || !this.newEvent.start || !this.newEvent.end || !this.newEvent.filier_id) {
      console.error('Please fill in all required fields');
      return;
    }

    this.calendarService.createEvent({
      title: this.newEvent.title,
      start: new Date(this.newEvent.start),
      end: new Date(this.newEvent.end),
      color: this.newEvent.color,
      filier_id: this.newEvent.filier_id
    }).subscribe({
      next: () => {
        this.showEventForm = false;
        // Reset form
        this.cancelEventForm();
        // Refresh calendar events
        this.calendarOptions.events = this.fetchEvents.bind(this);
      },
      error: (error) => {
        console.error('Failed to create event:', error);
      }
    });
  }
}