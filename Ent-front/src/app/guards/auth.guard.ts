import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthNewService } from '../services/auth-new.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthNewService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
      return false;
    }

    // Get the roles required from the route
    const requiredRoles = route.data['roles'];

    // Allow the user to proceed if no additional roles are required to access the route
    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return true;
    }

    // Allow the user to proceed if any of the required roles are present
    const hasRequiredRole = requiredRoles.some(role => this.authService.isUserInRole(role));
    if (!hasRequiredRole) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}