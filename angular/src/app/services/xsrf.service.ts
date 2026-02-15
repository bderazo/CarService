// xsrf.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class XsrfService {
  
  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}
  
  // Obtener XSRF token del backend
  fetchXsrfToken(): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve(null);
    }
    
    console.log('🔄 [XSRF] Solicitando token antiforgery al backend...');
    
    return new Promise((resolve) => {
      // Hacer una request GET a cualquier endpoint protegido
      // para que el backend establezca las cookies antiforgery
      this.http.get('/api/abp/application-configuration', {
        withCredentials: true
      }).subscribe({
        next: () => {
          const token = this.getXsrfTokenFromCookie();
          if (token) {
            console.log('✅ [XSRF] Token antiforgery obtenido:', token.substring(0, 20) + '...');
          } else {
            console.warn('⚠️ [XSRF] No se pudo obtener token antiforgery después de la solicitud');
          }
          resolve(token);
        },
        error: (error) => {
          console.error('❌ [XSRF] Error obteniendo token:', error);
          resolve(null);
        }
      });
    });
  }
  
  // Obtener token de las cookies
  getXsrfTokenFromCookie(): string | null {
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
      console.error('Error obteniendo XSRF token de cookie:', error);
      return null;
    }
  }
  
  // Verificar si tenemos token
  hasXsrfToken(): boolean {
    return this.getXsrfTokenFromCookie() !== null;
  }
  
  // Listar todas las cookies (para debug)
  listCookies(): { [key: string]: string } {
    const cookies: { [key: string]: string } = {};
    
    if (!isPlatformBrowser(this.platformId)) {
      return cookies;
    }
    
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    
    ca.forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        cookies[key] = value;
      }
    });
    
    return cookies;
  }
}