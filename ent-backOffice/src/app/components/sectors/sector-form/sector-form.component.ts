import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { SectorService } from '../../../services/sector.service';

@Component({
  selector: 'app-sector-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './sector-form.component.html',
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
export class SectorFormComponent {
  sectorForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private sectorService: SectorService,
    private router: Router
  ) {
    this.sectorForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  onSubmit() {
    if (this.sectorForm.valid) {
      this.sectorService.createSector(this.sectorForm.value).subscribe({
        next: () => {
          this.router.navigate(['/sectors']);
        },
        error: (error) => {
          console.error('Error creating sector:', error);
          // TODO: Add error handling UI
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/sectors']);
  }
}
