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
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userInfo: any = null;
  isAdmin = false;
  dashboardTiles: DashboardTile[] = [
    {
      title: 'Messages',
      iconPath: 'assets/icons/message.svg',
      description: 'Access your university messaging system',
      link: '/messaging'
    },
    {
      title: 'Notes',
      iconPath: 'assets/icons/notes.svg',
      description: 'View and manage your course notes',
      link: '/notes'
    },
    {
      title: 'Exam Calendar',
      iconPath: 'assets/icons/calendar.svg',
      description: 'Check your upcoming exams and deadlines',
      link: '/calendar'
    },
    {
      title: 'Support Requests',
      iconPath: 'assets/icons/support.svg',
      description: 'Submit and track support tickets',
      link: '/support'
    },
    {
      title: 'Online Courses',
      iconPath: 'assets/icons/courses.svg',
      description: 'Access your enrolled online courses',
      link: '/courses'
    },
    {
      title: 'ENT Assistance',
      iconPath: 'assets/icons/assistance.svg',
      description: 'Get help with the ENT platform',
      link: '/assistance'
    }
  ];

  adminTile: DashboardTile = {
    title: 'User Management',
    iconPath: 'assets/icons/message.svg', // You might want to add a proper icon for this
    description: 'Manage user accounts and permissions',
    link: '/user-management'
  };
  
  constructor(private router: Router, private authService: AuthNewService) {}
  
  async ngOnInit() {
    try {
      if (!this.authService.isAuthenticated) {
        this.router.navigate(['/login']);
        return;
      }

      // Get user info from the new auth service
      const userInfo = await this.authService.loadCurrentUser().toPromise();
      this.userInfo = userInfo;
      this.isAdmin = this.authService.isUserInRole('admin');
      
      // If user is admin, add the admin tile
      if (this.isAdmin) {
        this.dashboardTiles = [...this.dashboardTiles, this.adminTile];
      }
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
}
