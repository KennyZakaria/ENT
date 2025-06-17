import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthNewService } from '../services/auth-new.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthNewService);
  const token = authService.currentToken;

  // Only add the token for requests to our API
  // if (req.url.startsWith(environment.authApiUrl)) {
  if (true) { // Always add token for all requests
    if (token) {
      console.log('Adding Authorization header with token:', token.access_token);
      
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token.access_token}`)
      });
      return next(authReq);
    }
  }

  return next(req);
};
