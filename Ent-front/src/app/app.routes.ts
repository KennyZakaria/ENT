import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CoursesComponent } from './components/courses/courses.component';
import { NotesComponent } from './components/notes/notes.component';
import { SupportComponent } from './components/support/support.component';
import { AuthGuard } from './guards/auth.guard';
import { FullCalanderComponent } from './components/full-calander/full-calander.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AuthComponent } from './components/auth/auth.component';
import { MessagingComponent } from './components/messaging/messaging.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  },
  {
    path: 'login',
    component: AuthComponent
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard],
    data: { roles: [] }  // No specific roles required, but still protected by authentication
  },
  {
    path: 'courses',
    component: CoursesComponent,
    canActivate: [AuthGuard],
    data: { roles: [] }  // No specific roles required, but still protected by authentication
  },
  {
    path: 'notes',
    component: NotesComponent,
    canActivate: [AuthGuard],
    data: { roles: [] }  // No specific roles required, but still protected by authentication
  },
  {
    path: 'support',
    component: SupportComponent,
    canActivate: [AuthGuard],
    data: { roles: [] }  // No specific roles required, but still protected by authentication
  },  {
    path: 'calendar',
    component: FullCalanderComponent,
    // No AuthGuard - calendar is publicly viewable
  },
  {
    path: 'user-management',
    component: UserManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }  // Only admins can access user management
  },
  {
    path: 'messaging',
    component: MessagingComponent,
    canActivate: [AuthGuard],
    data: { roles: [] }  // No specific roles required, but still protected by authentication
  },
  { 
    path: '**', 
    redirectTo: 'dashboard' 
  }
];
