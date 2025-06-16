import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-tile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-tile.component.html',
  styleUrl: './dashboard-tile.component.css'
})
export class DashboardTileComponent {
  @Input() title: string = '';
  @Input() iconPath: string = '';
  @Input() description: string = '';
  @Input() link: string = '';
}
