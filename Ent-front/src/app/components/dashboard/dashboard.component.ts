import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DashboardTileComponent } from '../dashboard-tile/dashboard-tile.component';
import { AuthNewService } from '../../services/auth-new.service';

interface DashboardTile {
  title: string;
  iconPath: string;
  description: string;
  link: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DashboardTileComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userInfo: any = null;
  isAdmin = false;
  
  dashboardTiles: DashboardTile[] = [
    {
      title: 'Calendrier d\'Examens',
      iconPath: 'assets/icons/calendar.svg',
      description: 'Consultez vos examens et échéances à venir',
      link: '/calendar'
    },
    {
      title: 'Messagerie',
      iconPath: 'assets/icons/message.svg',
      description: 'Accédez à votre système de messagerie universitaire',
      link: '/messaging'
    },
    {
      title: 'Cours en Ligne',
      iconPath: 'assets/icons/courses.svg',
      description: 'Accédez à vos cours en ligne inscrits',
      link: '/courses'
    },
    {
      title: 'Assistance ENT',
      iconPath: 'assets/icons/assistance.svg',
      description: 'Obtenez de l\'aide avec la plateforme ENT',
      link: '/assistance'
    }
  ];

  constructor(private router: Router, private authService: AuthNewService) {}

  async ngOnInit() {
    try {
      if (!this.authService.isAuthenticated) {
        this.router.navigate(['/login']);
        return;
      }
      const userInfo = await this.authService.loadCurrentUser().toPromise();
      this.userInfo = userInfo;
    } catch (error) {
      console.error('Error in dashboard initialization:', error);
      this.router.navigate(['/login']);
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  trackByTile(index: number, tile: DashboardTile): string {
    return tile.title;
  }
}