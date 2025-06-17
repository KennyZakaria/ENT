import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthNewService } from '../../services/auth-new.service';
import { CalendarService, CalendarEvent } from '../../services/calendar.service';
import { UserManagementService, Sector } from '../../services/user-management.service';
import { SectorService } from '../../services/sector.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe]
})
export class CalendarComponent implements OnInit {
  events: CalendarEvent[] = [];
  loading = false;
  error: string | null = null;
  selectedFilierId: string = '';
  userSectors: Sector[] = [];
  showNewEventForm = false;
  
  newEvent = {
    title: '',
    start: '',
    end: '',
    sectorId: '',
    description: '',
    color: '#3788d8'
  };

  constructor(
    public authService: AuthNewService,
    private calendarService: CalendarService,
    private userManagementService: UserManagementService,
    private sectorService: SectorService
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated) {
      this.loadUserSectors();
    }
  }

  private loadUserSectors() {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      this.error = 'User information not available';
      return;
    }

    this.loading = true;
    this.userManagementService.getUserSectors(currentUser.id).subscribe({
      next: (userSectorInfo) => {
        this.userSectors = userSectorInfo.sectors;
        if (this.userSectors.length > 0) {
          this.selectedFilierId = this.userSectors[0].id || '';
          this.loadCalendarEvents();
        } else {
          this.error = 'No sectors available for this user';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user sectors:', error);
        this.error = 'Failed to load user sectors. Please try again later.';
        this.loading = false;
      }
    });
  }

  private loadCalendarEvents() {
    if (!this.selectedFilierId) {
      this.error = 'No sector selected';
      return;
    }

    this.loading = true;
    this.error = null;
    
    this.calendarService.getEventsByFilierId(this.selectedFilierId).subscribe({
      next: (events: CalendarEvent[]) => {
        this.events = events;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load calendar events. Please try again later.';
        this.loading = false;
        console.error('Error fetching calendar events:', error);
      }
    });
  }

  onSectorChange(sectorId: string) {
    this.selectedFilierId = sectorId;
    this.loadCalendarEvents();
  }

  refreshEvents() {
    this.loadCalendarEvents();
  }

  toggleNewEventForm() {
    this.showNewEventForm = !this.showNewEventForm;
    if (this.showNewEventForm && this.userSectors.length === 0) {
      this.loadAllSectors();
    }
  }

  private loadAllSectors() {
    this.loading = true;
    this.sectorService.getSectors().subscribe({
      next: (sectors) => {
        this.userSectors = sectors;
        if (this.userSectors.length > 0 && !this.newEvent.sectorId) {
          this.newEvent.sectorId = this.userSectors[0].id || '';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sectors:', error);
        this.error = 'Failed to load sectors. Please try again later.';
        this.loading = false;
      }
    });
  }

  createNewEvent() {
    if (!this.newEvent.title || !this.newEvent.start || !this.newEvent.end || !this.newEvent.sectorId) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.calendarService.createEvent({
      ...this.newEvent,
      start: new Date(this.newEvent.start).toISOString(),
      end: new Date(this.newEvent.end).toISOString()
    }).subscribe({
      next: () => {
        this.loading = false;
        this.showNewEventForm = false;
        this.resetNewEventForm();
        this.loadCalendarEvents();
      },
      error: (error) => {
        console.error('Error creating event:', error);
        this.error = 'Failed to create event. Please try again later.';
        this.loading = false;
      }
    });
  }

  resetNewEventForm() {
    this.newEvent = {
      title: '',
      start: '',
      end: '',
      sectorId: this.userSectors.length > 0 ? (this.userSectors[0].id || '') : '',
      description: '',
      color: '#3788d8'
    };
  }
}