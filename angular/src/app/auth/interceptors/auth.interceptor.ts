import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  console.log(`🔗 [INTERCEPTOR] Interceptando: ${req.method} ${req.url}`);
  
  // No interceptar solicitudes de login
  if (req.url.includes('/connect/token')) {
    console.log('🔗 [INTERCEPTOR] No interceptando request de login');
    return next(req);
  }

  // Obtener token de autenticación
  const token = authService.getToken();
  
  // Clonar la request para agregar headers
  let clonedReq = req.clone();
  
  // 1. Agregar Bearer token si existe
  if (token && token !== 'cookie-token') {
    console.log('🔗 [INTERCEPTOR] Agregando Bearer token');
    clonedReq = clonedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  // 2. Para métodos no-GET, agregar XSRF token header
  const method = req.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    console.log('🔗 [INTERCEPTOR] Método no-GET, agregando XSRF token');
    
    // Obtener XSRF token de las cookies
    const xsrfToken = getXsrfToken();
    
    if (xsrfToken) {
      console.log('🔗 [INTERCEPTOR] XSRF token encontrado en cookies');
      clonedReq = clonedReq.clone({
        setHeaders: {
          'X-XSRF-TOKEN': xsrfToken
        },
        withCredentials: true // Importante para enviar cookies
      });
    } else {
      console.warn('⚠️ [INTERCEPTOR] No se encontró XSRF token en cookies');
      clonedReq = clonedReq.clone({
        withCredentials: true
      });
    }
  } else {
    // Para GET requests, solo withCredentials
    clonedReq = clonedReq.clone({
      withCredentials: true
    });
  }
  
  return next(clonedReq).pipe(
    catchError(error => {
      console.error(`❌ [INTERCEPTOR] Error en ${req.method} ${req.url}:`, error.status);
      
      // Si el error es 400 por antiforgery, intentar obtener token primero
      if (error.status === 400 || error.status === 401) {
        console.log('🔄 [INTERCEPTOR] Error de autenticación/antiforgery, intentando obtener token...');
        
        // Para errores de antiforgery, podríamos intentar obtener un nuevo token
        // Pero por ahora solo redirigir si es 401 (no autorizado)
        if (error.status === 401) {
          console.log('🔐 [INTERCEPTOR] Error 401 - Redirigiendo a login');
          authService.logout();
          router.navigate(['/login']);
        }
      }
      
      return throwError(() => error);
    })
  );
};

// Función para obtener XSRF token de las cookies
function getXsrfToken(): string | null {
  try {
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo XSRF token:', error);
    return null;
  }
}