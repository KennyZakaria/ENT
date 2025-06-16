import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseDownloadService, Course } from '../../services/download.service';
import { UploadService } from '../../services/upload.service';
import { AuthService } from '../../services/auth.service';
import { Sector, SECTORS } from '../../constants/sectors';
import { environment } from '../../../environments/environment';

interface CourseUploadForm {
  title: string;
  description: string;
  sector_id: string;
  file: File | null;
}

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  sectors: Sector[] = SECTORS;
  isTeacher = false;
  showUploadForm = false;
  uploadForm: CourseUploadForm = {
    title: '',
    description: '',
    file: null,
    sector_id: SECTORS.length > 0 ? SECTORS[0].id.toString() : '',
  };
  isUploading = false;
  uploadMessage = '';
  uploadError = false;

  readonly maxFileSize = environment.maxUploadSize;

  constructor(
    private courseService: CourseDownloadService,
    private uploadService: UploadService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCourses();
    this.checkTeacherRole();
  }

  private async checkTeacherRole() {
    try {
      await this.authService.isLoggedIn();
      this.isTeacher = this.authService.isUserInRole('teacher');
      console.log('Is user teacher:', this.isTeacher);
    } catch (error: any) {
      console.error('Failed to check teacher role:', error);
      this.isTeacher = false;
    }
  }

  private loadCourses() {
    this.courseService.listCourses().subscribe({
      next: (courses: Course[]) => {
        this.courses = courses;
      },
      error: (error: any) => {
        console.error('Failed to load courses:', error);
      }
    });
  }

  async downloadCourse(courseId: string) {
    this.courseService.getDownloadUrl(courseId).subscribe({
      next: (response) => {
        window.open(response.download_url, '_blank');
      },
      error: (error: any) => {
        console.error('Failed to get download URL:', error);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadForm.file = input.files[0];
    }
  }

  cancelUpload() {
    if (!this.isUploading) {
      this.showUploadForm = false;
      this.uploadForm = { 
        title: '', 
        description: '', 
        sector_id: SECTORS.length > 0 ? SECTORS[0].id.toString() : '', 
        file: null 
      };
      this.uploadMessage = '';
    }
  }

  async uploadCourse(event: Event) {
    event.preventDefault();
    if (!this.uploadForm.file) return;

    this.isUploading = true;
    this.uploadMessage = '';
    this.uploadError = false;

    try {
      if (this.uploadForm.file.size > this.maxFileSize) {
        throw new Error(`File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`);
      }

      const token = await this.authService.getToken();
      await this.uploadService.uploadCourseFile(
        this.uploadForm.file,
        this.uploadForm.title,
        this.uploadForm.description,
        this.uploadForm.sector_id,
        token
      ).toPromise();

      this.uploadMessage = 'Course uploaded successfully!';
      setTimeout(() => {
        this.showUploadForm = false;
        this.uploadForm = { 
          title: '', 
          description: '', 
          sector_id: SECTORS.length > 0 ? SECTORS[0].id.toString() : '', 
          file: null 
        };
        this.uploadMessage = '';
      }, 2000);
      
      this.loadCourses();

    } catch (error: any) {
      console.error('Failed to upload course:', error);
      this.uploadMessage = error instanceof Error ? error.message : 'Failed to upload course. Please try again.';
      this.uploadError = true;
    } finally {
      this.isUploading = false;
    }
  }
}