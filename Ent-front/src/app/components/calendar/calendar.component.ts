import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthNewService } from '../../services/auth-new.service';
import { CalendarService, CalendarEvent } from '../../services/calendar.service';
import { UserManagementService, Sector } from '../../services/user-management.service';

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

  constructor(
    public authService: AuthNewService,
    private calendarService: CalendarService,
    private userManagementService: UserManagementService
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
}