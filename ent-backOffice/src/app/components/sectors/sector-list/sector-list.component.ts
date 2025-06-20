import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SectorService } from '../../../services/sector.service';
import { Sector } from '../../../models/sector.model';

@Component({
  selector: 'app-sector-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './sector-list.component.html',

  styles: [`
    .container {
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .table-container {
      overflow-x: auto;
    }
    .sectors-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    .sectors-table th,
    .sectors-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .sectors-table th {
      background-color: #f5f5f5;
      font-weight: 500;
    }
    .sectors-table tr:hover {
      background-color: #f8f8f8;
    }
    .actions-column {
      width: 80px;
      text-align: center;
    }
    mat-card {
      margin-bottom: 20px;
    }
  `]
})
export class SectorListComponent implements OnInit {
  sectors: Sector[] = [];

  constructor(
    private sectorService: SectorService,
    private router: Router
  ) {}

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

  createSector() {
    this.router.navigate(['/sectors/new']);
  }

  viewUsers(sector: Sector) {
    // TODO: Implement user list dialog for the sector
    this.sectorService.getSectorUsers(sector.id || '', '').subscribe({
      next: (users) => {
        console.log('Sector users:', users);
        // TODO: Show users in a dialog
      },
      error: (error) => {
        console.error('Error loading sector users:', error);
        // TODO: Add error handling UI
      }
    });
  }
}
