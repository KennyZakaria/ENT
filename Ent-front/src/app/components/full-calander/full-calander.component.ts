import { Component, OnInit } from '@angular/core';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CommonModule } from '@angular/common';
import { CalendarService, CalendarEvent } from '../../services/calendar.service';
import { FormsModule } from '@angular/forms';
import { AuthNewService } from '../../services/auth-new.service';

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
          </div>          <div>
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
          <div>
            <label>Filière ID:</label>
            <input [(ngModel)]="newEvent.filier_id" name="filier_id" required>
          </div>
          <button type="submit">Save</button>
          <button type="button" (click)="showEventForm = false">Cancel</button>
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
    .event-form input {
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
  isTeacher = false;  newEvent: Partial<CalendarEvent> = {
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
    private authService: AuthNewService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.checkTeacherRole();
  }

  private async checkTeacherRole() {
    this.isTeacher = this.authService.isUserInRole('teacher');
    console.log('Is user teacher:', this.isTeacher);
  }

  showAddEventForm() {
    if (this.isTeacher) {
      this.showEventForm = true;
      // Initialize with current date
      const now = new Date();
      this.newEvent.start = now.toISOString().slice(0, 16);
      this.newEvent.end = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
    }
  }
  fetchEvents(info: { start: Date; end: Date; timeZone: string }, 
              successCallback: (events: EventInput[]) => void,
              failureCallback: (error: Error) => void) {
    // Get events for filier_id '0' (all events)
    this.calendarService.getEventsByFilierId('1').subscribe({
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
    if (this.newEvent.title && this.newEvent.start && this.newEvent.end && this.newEvent.filier_id) {
      this.calendarService.createEvent(this.newEvent as CalendarEvent).subscribe({
        next: (createdEvent) => {
          console.log('Event created:', createdEvent);
          this.showEventForm = false;
          // Reset form
          this.newEvent = {
            title: '',
            start: '',
            end: '',
            color: '#4CAF50',
            filier_id: ''
          };
          // Refresh calendar
          const calendarApi = (document.querySelector('full-calendar') as any)?.getApi();
          if (calendarApi) {
            calendarApi.refetchEvents();
          }
        },
        error: (error) => {
          console.error('Failed to create event:', error);
        }
      });
    }
  }
}