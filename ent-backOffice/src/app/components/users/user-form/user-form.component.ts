import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { UserService } from '../../../services/user.service';
import { SectorService } from '../../../services/sector.service';
import { Sector } from '../../../models/sector.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './user-form.component.html',

  // styles: [`
  //   .container {
  //     padding: 20px;
  //     max-width: 800px;
  //     margin: 0 auto;
  //   }
  //   form {
  //     display: flex;
  //     flex-direction: column;
  //     gap: 16px;
  //   }
  //   .button-row {
  //     display: flex;
  //     justify-content: flex-end;
  //     gap: 16px;
  //   }
  // `]
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  sectors: Sector[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private sectorService: SectorService,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      role: ['', Validators.required],
      sector_ids: [[], Validators.required]
    });
  }

  ngOnInit() {
    this.loadSectors();
  }

  loadSectors() {
    this.sectorService.getSectors().subscribe({
      next: (sectors) => {
        this.sectors = sectors;
      },
      error: (error) => {
        console.error('Error loading sectors:', error);
        // TODO: Add error handling UI
      }
    });
  }

  isTeacherRole(): boolean {
    return this.userForm.get('role')?.value === 'teacher';
  }
  
  onRoleChange() {
    const role = this.userForm.get('role')?.value;
  
    if (role === 'teacher') {
      this.userForm.get('sector_ids')?.setValue([]); // Reset
    } else if (role === 'student') {
      this.userForm.get('sector_ids')?.setValue(''); // Set to single string value
    }
  }
  
  onSectorCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const selectedSectors: any[] = this.userForm.value.sector_ids || [];
  
    if (checkbox.checked) {
      selectedSectors.push(checkbox.value);
    } else {
      const index = selectedSectors.indexOf(checkbox.value);
      if (index >= 0) {
        selectedSectors.splice(index, 1);
      }
    }
  
    this.userForm.get('sector_ids')?.setValue(selectedSectors);
  }
  onSubmit() {
    if (this.userForm.valid) {
      this.userService.createUser(this.userForm.value).subscribe({
        next: () => {
          this.router.navigate(['/users']);
        },
        error: (error) => {
          console.error('Error creating user:', error);
          // TODO: Add error handling UI
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/users']);
  }
}
