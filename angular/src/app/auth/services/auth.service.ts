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
      let userStr = sessionStorage.getItem('currentUser');
      if (!userStr) {
        userStr = localStorage.getItem('currentUser');
      }
      if (userStr) {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        console.log('✅ [AUTH] Usuario cargado:', user.username);
      }
    } catch (e) {
      console.error('Error cargando usuario:', e);
      this.clearAuth();
    }
  }

  login(credentials: any): Observable<any> {
    console.log('🔐 [AUTH] Login:', credentials.username);

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
          if (isPlatformBrowser(this.platformId)) {
            this.handleLoginSuccess(response);
          }
        }),
        catchError(error => throwError(() => error)),
      );
  }

  private handleLoginSuccess(response: any): void {
    const accessToken = response.access_token;
    if (!accessToken) throw new Error('No access token received');

    sessionStorage.setItem('access_token', accessToken);

    const userInfo = this.decodeJwt(accessToken);

    // 1. Extraer roles
    let roles = this.extractRoles(userInfo);

    // 2. SIEMPRE asegurar que sea ARRAY
    if (!Array.isArray(roles)) {
      roles = roles ? [roles] : [];
    }

    // 3. ✅ NORMALIZAR: minúsculas + TRIM (elimina espacios)
    roles = roles.map((rol: string) => rol.toLowerCase().trim());

    const user = {
      id: userInfo.sub || 'unknown',
      username: userInfo.name || userInfo.preferred_username || 'admin',
      email: userInfo.email || 'admin@abp.io',
      roles: roles, // ✅ AHORA ['recepcionista'] SIN ESPACIOS
    };

    console.log('✅ [AUTH] Usuario guardado con roles:', user.roles);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.router.navigateByUrl('/dashboard', { replaceUrl: true });
  }

  // ✅ MEJORAR extractRoles() para que SIEMPRE devuelva array
  private extractRoles(userInfo: any): string[] {
    // Intentar diferentes formatos que puede tener el token
    if (userInfo.role) {
      return Array.isArray(userInfo.role) ? userInfo.role : [userInfo.role];
    }
    if (userInfo.roles) {
      return Array.isArray(userInfo.roles) ? userInfo.roles : [userInfo.roles];
    }
    if (userInfo['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
      const roleClaim = userInfo['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      return Array.isArray(roleClaim) ? roleClaim : [roleClaim];
    }
    return []; // ✅ SIEMPRE array, aunque sea vacío
  }

  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decodificando JWT:', e);
      return {};
    }
  }

  // ✅ NUEVO: Métodos para roles
  getCurrentUser(): any {
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
      try {
        const user = JSON.parse(sessionUser);
        // ✅ ASEGURAR que roles sea array
        if (user.roles && !Array.isArray(user.roles)) {
          user.roles = [user.roles];
        }
        return user;
      } catch (e) {}
    }

    const localUser = localStorage.getItem('currentUser');
    if (localUser) {
      try {
        const user = JSON.parse(localUser);
        // ✅ ASEGURAR que roles sea array
        if (user.roles && !Array.isArray(user.roles)) {
          user.roles = [user.roles];
        }
        return user;
      } catch (e) {}
    }

    return this.currentUserSubject.value;
  }

  // ✅ MEJORAR getUserRoles() para que SIEMPRE devuelva array
  getUserRoles(): string[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    // Si es string, convertir a array
    if (typeof user.roles === 'string') {
      return [user.roles];
    }

    // Si es array, devolverlo
    if (Array.isArray(user.roles)) {
      return user.roles;
    }

    // Cualquier otro caso
    return [];
  }

  hasRole(rol: string): boolean {
    const roles = this.getUserRoles();
    // ✅ COMPARAR EN MINÚSCULAS SIEMPRE
    return roles.includes(rol.toLowerCase());
  }

  hasAnyRole(rolesPermitidos: string[]): boolean {
    const userRoles = this.getUserRoles();
    // ✅ NORMALIZAR AMBOS ARRAYS A MINÚSCULAS
    const userRolesLower = userRoles.map(r => r.toLowerCase());
    const rolesPermitidosLower = rolesPermitidos.map(r => r.toLowerCase());

    return rolesPermitidosLower.some(rol => userRolesLower.includes(rol));
  }

  hasAllRoles(rolesRequeridos: string[]): boolean {
    const userRoles = this.getUserRoles();
    const userRolesLower = userRoles.map(r => r.toLowerCase());
    const rolesRequeridosLower = rolesRequeridos.map(r => r.toLowerCase());

    return rolesRequeridosLower.every(rol => userRolesLower.includes(rol));
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isRecepcionista(): boolean {
    return this.hasRole('recepcionista');
  }

  isMecanico(): boolean {
    return this.hasRole('mecanico'); // ✅ CON ACENTO (viene del backend)
  }

  isLavador(): boolean {
    return this.hasRole('lavacoches');
  }

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;

    const token = this.getToken();
    const user = this.getCurrentUser();

    if (!token || !user) return false;

    try {
      const decoded = this.decodeJwt(token);
      const now = Date.now() / 1000;
      return decoded.exp > now;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
  }

  logout(): void {
    console.log('🚪 [AUTH] Logout');
    if (isPlatformBrowser(this.platformId)) {
      this.clearAuth();
    }
    this.router.navigate(['/login']);
  }

  private clearAuth(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  mockLogin(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const mockUser = {
      id: '1',
      username: 'admin',
      email: 'admin@taller.com',
      roles: ['admin'],
    };

    sessionStorage.setItem('currentUser', JSON.stringify(mockUser));
    this.currentUserSubject.next(mockUser);
    this.router.navigateByUrl('/dashboard', { replaceUrl: true });
  }
}
