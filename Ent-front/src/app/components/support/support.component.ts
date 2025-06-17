import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthNewService } from '../../services/auth-new.service';
import { SupportService, SupportTicket, CreateTicketRequest } from '../../services/support.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit {
  tickets: SupportTicket[] = [];
  isAdmin = false;
  isTeacher = false;
  showCreateForm = false;
  selectedTicket: SupportTicket | null = null;
  newComment = '';
  
  newTicket: CreateTicketRequest = {
    title: '',
    description: '',
    priority: 'medium'
  };
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private supportService: SupportService,
    private authService: AuthNewService
  ) {}

  ngOnInit() {
    this.checkTeacherRole();
    this.loadTickets();
  }

  private checkTeacherRole() {
    this.isTeacher = this.authService.isUserInRole('teacher');
  }

  private loadTickets() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.supportService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load tickets:', error);
        this.errorMessage = 'Failed to load support tickets. Please try again.';
        this.isLoading = false;
      }
    });
  }

  createTicket() {
    if (!this.newTicket.title || !this.newTicket.description) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.supportService.createTicket(this.newTicket).subscribe({
      next: (ticket) => {
        this.tickets.unshift(ticket);
        this.showCreateForm = false;
        this.newTicket = { title: '', description: '', priority: 'medium' };
        this.successMessage = 'Ticket created successfully!';
        this.isLoading = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Failed to create ticket:', error);
        this.errorMessage = 'Failed to create support ticket. Please try again.';
        this.isLoading = false;
      }
    });
  }
  updateTicketStatus(ticket: SupportTicket, event: Event) {
    if (!this.isAdmin) return;
    
    const select = event.target as HTMLSelectElement;
    const status = select.value as SupportTicket['status'];

    this.isLoading = true;
    this.errorMessage = '';

    this.supportService.updateTicketStatus(ticket.id, status).subscribe({
      next: (updatedTicket) => {
        const index = this.tickets.findIndex(t => t.id === updatedTicket.id);
        if (index !== -1) {
          this.tickets[index] = updatedTicket;
        }
        this.successMessage = 'Ticket status updated successfully!';
        this.isLoading = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Failed to update ticket status:', error);
        this.errorMessage = 'Failed to update ticket status. Please try again.';
        this.isLoading = false;
      }
    });
  }

  addComment(ticket: SupportTicket) {
    if (!this.newComment.trim()) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.supportService.addComment(ticket.id, this.newComment).subscribe({
      next: (comment) => {
        const index = this.tickets.findIndex(t => t.id === ticket.id);
        if (index !== -1) {
          this.tickets[index].comments.push(comment);
        }
        this.newComment = '';
        this.successMessage = 'Comment added successfully!';
        this.isLoading = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Failed to add comment:', error);
        this.errorMessage = 'Failed to add comment. Please try again.';
        this.isLoading = false;
      }
    });
  }

  selectTicket(ticket: SupportTicket) {
    this.selectedTicket = ticket;
    this.newComment = '';
  }

  cancelCreate() {
    this.showCreateForm = false;
    this.newTicket = { title: '', description: '', priority: 'medium' };
  }

  getStatusColor(status: SupportTicket['status']): string {
    switch (status) {
      case 'open': return '#f44336';
      case 'in-progress': return '#2196f3';
      case 'resolved': return '#4caf50';
      case 'closed': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
