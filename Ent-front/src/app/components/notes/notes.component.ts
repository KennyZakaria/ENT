import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService, Note } from '../../services/notes.service';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css']
})
export class NotesComponent implements OnInit {
  notes: Note[] = [];
  showCreateForm = false;
  selectedNote: Note | null = null;
  
  newNote = {
    title: '',
    content: ''
  };
  
  isLoading = false;
  errorMessage = '';

  constructor(private notesService: NotesService) {}

  ngOnInit() {
    this.loadNotes();
  }

  private loadNotes() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.notesService.getNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load notes:', error);
        this.errorMessage = 'Failed to load notes. Please try again.';
        this.isLoading = false;
      }
    });
  }

  createNote() {
    if (!this.newNote.title || !this.newNote.content) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.notesService.createNote(this.newNote.title, this.newNote.content).subscribe({
      next: (note) => {
        this.notes.unshift(note);
        this.showCreateForm = false;
        this.newNote = { title: '', content: '' };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to create note:', error);
        this.errorMessage = 'Failed to create note. Please try again.';
        this.isLoading = false;
      }
    });
  }

  updateNote() {
    if (!this.selectedNote) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.notesService.updateNote(this.selectedNote.id, this.selectedNote.title, this.selectedNote.content).subscribe({
      next: (updatedNote) => {
        const index = this.notes.findIndex(n => n.id === updatedNote.id);
        if (index !== -1) {
          this.notes[index] = updatedNote;
        }
        this.selectedNote = null;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to update note:', error);
        this.errorMessage = 'Failed to update note. Please try again.';
        this.isLoading = false;
      }
    });
  }

  deleteNote(id: string) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.notesService.deleteNote(id).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.id !== id);
        if (this.selectedNote?.id === id) {
          this.selectedNote = null;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to delete note:', error);
        this.errorMessage = 'Failed to delete note. Please try again.';
        this.isLoading = false;
      }
    });
  }

  selectNote(note: Note) {
    this.selectedNote = { ...note };
  }

  cancelEdit() {
    this.selectedNote = null;
  }

  cancelCreate() {
    this.showCreateForm = false;
    this.newNote = { title: '', content: '' };
  }
}
