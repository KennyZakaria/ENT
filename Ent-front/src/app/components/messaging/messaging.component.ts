import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagingService, Message, ChatRoom, RoomParticipant } from '../../services/messaging.service';
import { AuthNewService } from '../../services/auth-new.service';
import { UserManagementService } from '../../services/user-management.service';
import { KeycloakUser } from '../../services/auth-new.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.css']
})
export class MessagingComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  rooms: ChatRoom[] = [];
  participants: RoomParticipant[] = [];
  selectedRoom: ChatRoom | null = null;
  newMessage = '';
  newRoomName = '';
  showCreateRoom = false;
  currentUserId: string = '';
  isConnected = false;
  availableUsers: KeycloakUser[] = [];
  selectedParticipants: string[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private messagingService: MessagingService,
    private authService: AuthNewService,
    private userService: UserManagementService
  ) {}

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user) {
      this.currentUserId = user.id;
      this.loadUsers();
      this.loadRooms();
      this.connectToWebSocket();
      this.setupConnectionStatus();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.messagingService.closeWebSocket();
  }

  private setupConnectionStatus() {
    this.messagingService.getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.isConnected = status;
          if (status && this.selectedRoom) {
            // Resubscribe to room on reconnection
            this.messagingService.sendWebSocketMessage({
              type: 'subscribe',
              room_id: this.selectedRoom.room_id
            });
          }
        },
        error: (error) => console.error('Connection status error:', error)
      });
  }

  private loadRooms() {
    this.messagingService.getRooms().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        if (rooms.length > 0) {
          this.selectRoom(rooms[0]);
        }
      },
      error: (error) => console.error('Error loading rooms:', error)
    });
  }

  private loadMessages(roomId: string) {
    this.messagingService.getMessages(roomId).subscribe({
      next: (messages) => {
        this.messages = messages.sort((a, b) => 
          new Date(a.timestamp || '').getTime() - new Date(b.timestamp || '').getTime()
        );
      },
      error: (error) => console.error('Error loading messages:', error)
    });
  }

  private loadRoomParticipants(roomId: string) {
    this.messagingService.getRoomParticipants(roomId).subscribe({
      next: (participants) => this.participants = participants,
      error: (error) => console.error('Error loading participants:', error)
    });
  }

  private connectToWebSocket() {
    this.messagingService.connectToWebSocket()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          if (this.selectedRoom && message.room_id === this.selectedRoom.room_id) {
            this.messages = [...this.messages, message];
          }
        },
        error: (error) => console.error('WebSocket error:', error)
      });
  }

  selectRoom(room: ChatRoom) {
    this.selectedRoom = room;
    this.loadRoomParticipants(room.room_id);
    this.loadMessages(room.room_id);
    
    if (this.isConnected) {
      // Subscribe to room messages
      this.messagingService.sendWebSocketMessage({
        type: 'subscribe',
        room_id: room.room_id
      });
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedRoom || !this.isConnected) return;

    const message = {
      recipient_id: this.selectedRoom.room_id,
      content: this.newMessage.trim()
    };

    this.messagingService.createMessage(message).subscribe({
      next: () => {
        this.newMessage = '';
      },
      error: (error) => console.error('Error sending message:', error)
    });
  }

  private loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users: KeycloakUser[]) => {
        // Filter out current user from the list
        this.availableUsers = users.filter(user => user.id !== this.currentUserId);
      },
      error: (error: unknown) => console.error('Error loading users:', error)
    });
  }

  toggleParticipant(userId: string) {
    const index = this.selectedParticipants.indexOf(userId);
    if (index === -1) {
      this.selectedParticipants.push(userId);
    } else {
      this.selectedParticipants.splice(index, 1);
    }
  }

  createRoom() {
    if (!this.newRoomName.trim()) return;

    const room = {
      name: this.newRoomName.trim(),
      is_group: this.selectedParticipants.length > 1,
      participants: this.selectedParticipants
    };

    this.messagingService.createRoom(room).subscribe({
      next: () => {
        this.newRoomName = '';
        this.selectedParticipants = [];
        this.showCreateRoom = false;
        this.loadRooms();
      },
      error: (error) => console.error('Error creating room:', error)
    });
  }

  retryConnection() {
    if (!this.isConnected) {
      this.connectToWebSocket();
    }
  }

  formatTimestamp(timestamp: string | undefined): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  }
}