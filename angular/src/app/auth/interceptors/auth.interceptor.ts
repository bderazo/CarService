import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // No interceptar la solicitud de login
  if (req.url.includes('/connect/token') || 
      req.url.includes('/api/account/login') ||
      req.url.includes('/api/TokenAuth/Authenticate')) {
    return next(req);
  }

  // Agregar token a las demás solicitudes
  const token = authService.getToken();
  
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};