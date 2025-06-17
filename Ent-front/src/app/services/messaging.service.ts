import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthNewService } from './auth-new.service';

// Message interfaces
export interface Message {
  id?: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  timestamp?: string;
  read?: boolean;
}

export interface MessageCreate {
  recipient_id: string;
  content: string;
}

export interface ChatRoom {
  room_id: string;
  name: string;
  created_at: string;
  created_by: string;
  is_group: boolean;
}

export interface ChatRoomCreate {
  name: string;
  is_group?: boolean;
  participants?: string[];
}

export interface RoomParticipant {
  room_id: string;
  user_id: string;
  joined_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  private baseUrl = `${environment.messagingApiUrl}`;  // Updated to use messaging API URL
  private ws: WebSocket | null = null;
  private messageSubject = new Subject<any>();
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: any;

  constructor(
    private http: HttpClient,
    private authService: AuthNewService
  ) {}

  // Message Methods - Updated to match OpenAPI spec
  getMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/messages/${userId}`);
  }

  createMessage(message: MessageCreate): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/messages`, message);
  }

  // Chat Room Methods - Updated to match OpenAPI spec
  getRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.baseUrl}/rooms`);
  }

  createRoom(room: ChatRoomCreate): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/rooms`, room);
  }

  getRoomParticipants(roomId: string): Observable<RoomParticipant[]> {
    return this.http.get<RoomParticipant[]>(`${this.baseUrl}/rooms/${roomId}/participants`);
  }

  // WebSocket Methods
  private getAuthenticatedWsUrl(): string {
    const token = this.authService.currentToken?.access_token;
    const baseWsUrl = environment.wsUrl;
    return `${baseWsUrl}?token=${token}`;
  }

  private getReconnectDelay(): number {
    return Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
  }

  connectToWebSocket(): Observable<any> {
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      try {
        const wsUrl = this.getAuthenticatedWsUrl();
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.connectionStatus.next(true);
          this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.messageSubject.next(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.connectionStatus.next(false);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionStatus.next(false);
          this.ws?.close();
        };

      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.connectionStatus.next(false);
        this.attemptReconnect();
      }
    }

    return this.messageSubject.asObservable();
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
        this.reconnectAttempts++;
        this.connectToWebSocket();
      }, this.getReconnectDelay());
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  sendWebSocketMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      if (!this.connectionStatus.value) {
        this.connectToWebSocket();
      }
    }
  }

  closeWebSocket(): void {
    clearTimeout(this.reconnectTimeoutId);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.connectionStatus.next(false);
  }
}