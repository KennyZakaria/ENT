import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { UserListComponent } from './components/users/user-list/user-list.component';
import { UserFormComponent } from './components/users/user-form/user-form.component';
import { SectorListComponent } from './components/sectors/sector-list/sector-list.component';
import { SectorFormComponent } from './components/sectors/sector-form/sector-form.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'users', 
    component: UserListComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'users/new', 
    component: UserFormComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'sectors', 
    component: SectorListComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'sectors/new', 
    component: SectorFormComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/login' }
];
