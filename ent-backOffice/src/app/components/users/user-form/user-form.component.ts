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
  // template: `
  //   <div class="container">
  //     <mat-card>
  //       <mat-card-header>
  //         <mat-card-title>Create New User</mat-card-title>
  //       </mat-card-header>
  //       <mat-card-content>
  //         <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
  //           <mat-form-field>
  //             <mat-label>Username</mat-label>
  //             <input matInput formControlName="username" required>
  //           </mat-form-field>

  //           <mat-form-field>
  //             <mat-label>Email</mat-label>
  //             <input matInput type="email" formControlName="email" required>
  //           </mat-form-field>

  //           <mat-form-field>
  //             <mat-label>Password</mat-label>
  //             <input matInput type="password" formControlName="password" required>
  //           </mat-form-field>

  //           <mat-form-field>
  //             <mat-label>First Name</mat-label>
  //             <input matInput formControlName="first_name" required>
  //           </mat-form-field>

  //           <mat-form-field>
  //             <mat-label>Last Name</mat-label>
  //             <input matInput formControlName="last_name" required>
  //           </mat-form-field>

  //           <mat-form-field>
  //             <mat-label>Role</mat-label>
  //             <mat-select formControlName="role" required>
  //               <mat-option value="teacher">Teacher</mat-option>
  //               <mat-option value="student">Student</mat-option>
  //             </mat-select>
  //           </mat-form-field>

  //           <mat-form-field>
  //             <mat-label>Sectors</mat-label>
  //             <mat-select formControlName="sector_ids" multiple required>
  //               <mat-option *ngFor="let sector of sectors" [value]="sector.id">
  //                 {{sector.name}}
  //               </mat-option>
  //             </mat-select>
  //           </mat-form-field>

  //           <div class="button-row">
  //             <button mat-button type="button" (click)="cancel()">Cancel</button>
  //             <button mat-raised-button color="primary" type="submit" [disabled]="userForm.invalid">
  //               Create User
  //             </button>
  //           </div>
  //         </form>
  //       </mat-card-content>
  //     </mat-card>
  //   </div>
  // `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .button-row {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }
  `]
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
