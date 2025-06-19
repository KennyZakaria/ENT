// ent-assistance.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ChatMessage {
  text: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

@Component({
  selector: 'app-ent-assistance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ent-assistance.component.html',
  styleUrls: ['./ent-assistance.component.css']
})
export class EntAssistanceComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  currentMessage: string = '';
  isLoading: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.addWelcomeMessage();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private addWelcomeMessage() {
    this.messages.push({
      text: 'Hello! I am your ENT Assistant. How can I help you today?',
      type: 'assistant',
      timestamp: new Date()
    });
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) {}
  }

  handleEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!this.isLoading && this.currentMessage.trim()) {
        this.sendMessage();
      }
    }
  }

  async sendMessage() {
    if (this.isLoading || !this.currentMessage.trim()) return;

    const userMessage = this.currentMessage.trim();
    this.currentMessage = '';

    this.messages.push({
      text: userMessage,
      type: 'user',
      timestamp: new Date()
    });

    this.isLoading = true;

    try {
      const response = await this.http.post<{status: string, response: string}>(
        `${environment.chatApiUrl}/api/chat`,
        { message: userMessage }
      ).toPromise();

      if (response && response.status === 'success') {
        this.messages.push({
          text: response.response,
          type: 'assistant',
          timestamp: new Date()
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.messages.push({
        text: 'Sorry, I encountered an error. Please try again later.',
        type: 'assistant',
        timestamp: new Date()
      });
    } finally {
      this.isLoading = false;
      setTimeout(() => {
        this.messageInput.nativeElement.focus();
      });
    }
  }
}
