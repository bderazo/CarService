// auth.interceptor.ts - ACTUALIZADO
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // No interceptar la solicitud de login
  if (req.url.includes('/connect/token')) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');

  if (token && token !== 'cookie-token') {
    console.log('🔗 [INTERCEPTOR] Usando token de localStorage');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  console.log('🔗 [INTERCEPTOR] Usando cookies para autenticación');
  const cloned = req.clone({
    withCredentials: true, // Importante para enviar cookies
  });

  return next(cloned).pipe(
    catchError(error => {
      if (error.status === 401) {
        console.error('❌ [INTERCEPTOR] Error 401 - No autorizado');
        // Redirigir al login
        const router = inject(Router);
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
