import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthNewService } from '../services/auth-new.service';
import { environment } from '../../environments/environment';

export const messagingInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthNewService);

  // Only intercept requests to the messaging service
  if (req.url.startsWith(environment.messagingApiUrl)) {
    const token = authService.currentToken?.access_token;
    
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next(authReq);
    }
  }

  return next(req);
};