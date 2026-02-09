import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loginUrl = '/connect/token';
  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  // Para ABP con cookies, no necesitamos guardar token en localStorage
  // Solo guardamos user info

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: any,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredUser();
    }
  }

  private loadStoredUser(): void {
    try {
      // Buscar en sessionStorage primero
      let userStr = sessionStorage.getItem('currentUser');

      // Si no hay en sessionStorage, buscar en localStorage
      if (!userStr) {
        userStr = localStorage.getItem('currentUser');
      }

      if (userStr) {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        console.log('✅ [AUTH] Usuario cargado desde storage:', user.username);
      } else {
        console.log('ℹ️ [AUTH] No hay usuario en storage');
      }
    } catch (e) {
      console.error('Error cargando usuario:', e);
      this.clearAuth();
    }
  }

  login(credentials: any): Observable<any> {
    console.log('🔐 [AUTH] Login para usuario:', credentials.username);

    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);
    body.set('grant_type', 'password');
    body.set('scope', 'openid profile email roles offline_access MecanicApp');
    body.set('client_id', 'MecanicApp_App');

    return this.http
      .post(this.loginUrl, body.toString(), {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
      .pipe(
        tap((response: any) => {
          console.log('✅ [AUTH] Login API response recibida');
          if (isPlatformBrowser(this.platformId)) {
            this.handleLoginSuccess(response);
          }
        }),
        catchError(error => {
          console.error('❌ [AUTH] Login API error:', error);
          return throwError(() => error);
        }),
      );
  }

  private handleLoginSuccess(response: any): void {
    console.log('=== START handleLoginSuccess ===');

    const accessToken = response.access_token;

    if (!accessToken) {
      console.error('❌ No se recibió token del backend');
      throw new Error('No access token received');
    }

    // ⭐ USAR sessionStorage EN LUGAR DE localStorage
    // sessionStorage no es limpiado por ABP
    sessionStorage.setItem('access_token', accessToken);
    console.log('💾 Token guardado en SESSIONSTORAGE');

    // Decodificar token
    const userInfo = this.decodeJwt(accessToken);

    const user = {
      id: userInfo.sub || 'unknown',
      username: userInfo.name || userInfo.preferred_username || 'admin',
      email: userInfo.email || 'admin@abp.io',
      roles: Array.isArray(userInfo.role)
        ? userInfo.role
        : userInfo.role
          ? [userInfo.role]
          : ['admin'],
    };

    sessionStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    console.log('💾 Usuario guardado en SESSIONSTORAGE');

    // Navegar
    setTimeout(() => {
      this.router.navigateByUrl('/dashboard', {
        replaceUrl: true,
      });
    }, 50);

    console.log('=== END handleLoginSuccess ===');
  }

  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(''),
      );

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decodificando JWT:', e);
      return {};
    }
  }

  logout(): void {
    console.log('🚪 [AUTH] Logout llamado');
    if (isPlatformBrowser(this.platformId)) {
      this.clearAuth();
    }
    this.router.navigate(['/login']);
  }

  private clearAuth(): void {
    console.log('🧹 [AUTH] Limpiando datos de auth');
    // Limpiar de ambos storages
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): any {
    // Buscar en sessionStorage primero
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
      try {
        return JSON.parse(sessionUser);
      } catch (e) {
        console.error('Error parseando usuario de sessionStorage:', e);
      }
    }

    // Luego buscar en localStorage
    const localUser = localStorage.getItem('currentUser');
    if (localUser) {
      try {
        return JSON.parse(localUser);
      } catch (e) {
        console.error('Error parseando usuario de localStorage:', e);
      }
    }

    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    console.log('🔐 [AUTH] Verificación completa de autenticación:');

    // ⭐ BUSCAR EN SESSIONSTORAGE (donde lo guardas)
    const sessionToken = sessionStorage.getItem('access_token');
    const sessionUser = sessionStorage.getItem('currentUser');

    // También verificar localStorage por compatibilidad
    const localToken = localStorage.getItem('access_token');
    const localUser = localStorage.getItem('currentUser');

    console.log('- Token en sessionStorage:', sessionToken ? 'SÍ' : 'NO');
    console.log('- Usuario en sessionStorage:', sessionUser ? 'SÍ' : 'NO');
    console.log('- Token en localStorage:', localToken ? 'SÍ' : 'NO');
    console.log('- Usuario en localStorage:', localUser ? 'SÍ' : 'NO');

    // Usar sessionStorage primero, luego localStorage
    const token = sessionToken || localToken;
    const userStr = sessionUser || localUser;

    if (!token) {
      console.log('❌ [AUTH] No hay token en ningún storage');
      return false;
    }

    if (!userStr) {
      console.log('❌ [AUTH] No hay usuario en ningún storage');
      return false;
    }

    // Verificar si el token es válido (no expirado)
    try {
      const decoded = this.decodeJwt(token);
      const now = Date.now() / 1000;
      const isValid = decoded.exp > now;

      console.log('📅 [AUTH] Validación token:');
      console.log('- Token exp:', decoded.exp);
      console.log('- Now:', now);
      console.log('- Token válido (no expirado):', isValid);

      if (!isValid) {
        console.log('⚠️ Token expirado, limpiando...');
        this.clearAuth();
        return false;
      }

      console.log(`✅ [AUTH] Usuario AUTENTICADO`);
      return true;
    } catch (error) {
      console.error('Error decodificando token:', error);
      return false;
    }
  }

  // Nuevo método para verificar cookies de auth
  private hasAuthCookies(): boolean {
    try {
      const cookies = document.cookie;

      // Cookies específicas de ABP/ASP.NET Identity
      const authCookiePatterns = [
        '.AspNetCore.Identity.Application',
        '.MecanicApp.Auth',
        '.AspNetCore.Cookies',
        'access_token=',
        'id_token=',
      ];

      const hasAnyAuthCookie = authCookiePatterns.some(pattern => cookies.includes(pattern));

      if (hasAnyAuthCookie) {
        console.log('🍪 [AUTH] Cookies de autenticación encontradas');

        // Listar todas las cookies para debug
        const cookieList = cookies.split(';').map(c => c.trim());
        const authCookies = cookieList.filter(c =>
          authCookiePatterns.some(pattern => c.includes(pattern)),
        );
        console.log('🍪 [AUTH] Cookies de auth específicas:', authCookies);
      }

      return hasAnyAuthCookie;
    } catch (error) {
      console.error('Error verificando cookies:', error);
      return false;
    }
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    // Buscar en sessionStorage primero
    const sessionToken = sessionStorage.getItem('access_token');
    if (sessionToken) {
      console.log('🔑 [AUTH] Token obtenido de sessionStorage');
      return sessionToken;
    }

    // También verificar localStorage por compatibilidad
    const localToken = localStorage.getItem('access_token');
    if (localToken) {
      console.log('🔑 [AUTH] Token obtenido de localStorage');
      return localToken;
    }

    console.log('🔑 [AUTH] No hay token disponible');
    return null;
  }

  mockLogin(): void {
    console.log('🔄 [AUTH] Mock login llamado');
    if (!isPlatformBrowser(this.platformId)) return;

    const mockUser = {
      id: '1',
      username: 'admin',
      email: 'admin@taller.com',
      roles: ['admin'],
    };

    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    this.currentUserSubject.next(mockUser);
    console.log('✅ [AUTH] Mock user guardado');

    setTimeout(() => {
      this.router.navigateByUrl('/dashboard', {
        replaceUrl: true,
      });
    }, 50);
  }
}
