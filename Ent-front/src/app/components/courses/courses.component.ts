import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseDownloadService, Course } from '../../services/download.service';
import { UploadService } from '../../services/upload.service';
import { AuthNewService } from '../../services/auth-new.service';
import { environment } from '../../../environments/environment';
import { Sector, UserManagementService } from '../../services/user-management.service';

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
  sectors: Sector[] = [];
  isTeacher = false;
  showUploadForm = false;
  uploadForm: CourseUploadForm = {
    title: '',
    description: '',
    file: null,
    sector_id: this.sectors.length > 0 ? this.sectors[0]!.id!.toString() : '',
  };
  isUploading = false;
  uploadMessage = '';
  uploadError = false;

  readonly maxFileSize = environment.maxUploadSize;

  constructor(
    private courseService: CourseDownloadService,
    private uploadService: UploadService,
    private authService: AuthNewService,
    private userService: UserManagementService,
  ) {}

  ngOnInit() {
    this.loadCourses();
    this.checkTeacherRole();

    this.loadSectors();
  }

  async  checkTeacherRole() {
    const userInfo = await this.authService.loadCurrentUser().toPromise();
    this.isTeacher = this.authService.isUserInRole('teacher');
    console.log('Is user teacher:', this.isTeacher);
  }

  loadSectors(): void {
    this.userService.listSectors().subscribe({
      next: (sectors) => {
        this.sectors = sectors;
 
      },
      error: (error) => {
        console.error('Failed to load sectors:', error);
   
      }
    });
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
        sector_id: this.sectors.length > 0 ? this.sectors[0].id!.toString() || '' : '', 
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

      const token = this.authService.currentToken?.access_token;
      if (!token) {
        throw new Error('Not authenticated');
      }

      await this.uploadService.uploadCourseFile(
        this.uploadForm.file,
        this.uploadForm.title,
        this.uploadForm.description,
        this.uploadForm.sector_id.toString(),
        token
      ).toPromise();

      this.uploadMessage = 'Course uploaded successfully!';
      setTimeout(() => {
        this.showUploadForm = false;
        this.uploadForm = { 
          title: '', 
          description: '', 
          sector_id: this.sectors.length > 0 ? this.sectors[0].id!.toString() || '' : '', 
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