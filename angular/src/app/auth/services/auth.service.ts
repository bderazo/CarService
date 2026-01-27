import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // PRUEBA PRIMERO CON ESTA URL (ABP estándar)
  private loginUrl = '/connect/token';
  // O si no funciona, prueba con:
  // private loginUrl = '/api/account/login';
  // private loginUrl = '/api/TokenAuth/Authenticate';

  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('currentUser');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.clearAuth();
      }
    }
  }

  login(credentials: LoginRequest): Observable<any> {
    // FormData para OAuth2 (estándar ABP)
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    formData.append('grant_type', 'password');
    formData.append('scope', 'MecanicApp');
    formData.append('client_id', 'MecanicApp_App');
    formData.append('client_secret', '1q2w3e*');

    return this.http.post(this.loginUrl, formData).pipe(
      tap((response: any) => {
        this.handleLoginSuccess(response);
      }),
      catchError(error => {
        console.error('Login error:', error);
        // Si falla OAuth2, prueba con endpoint simple
        if (this.loginUrl === '/connect/token') {
          return this.trySimpleLogin(credentials);
        }
        throw error;
      })
    );
  }

  private trySimpleLogin(credentials: LoginRequest): Observable<any> {
    const simpleUrl = '/api/account/login';
    return this.http.post(simpleUrl, credentials).pipe(
      tap((response: any) => {
        this.handleLoginSuccess(response);
      })
    );
  }

  private handleLoginSuccess(response: any): void {
    console.log('Login success:', response);
    
    // Extraer token (diferentes formatos posibles)
    const token = response.access_token || response.accessToken || response.token;
    const user = response.user || {
      id: response.userId || '1',
      username: response.userName || 'admin',
      email: response.emailAddress || 'admin@taller.com',
      roles: response.roles || ['admin']
    };

    if (!token) {
      throw new Error('No token received in response');
    }

    // Guardar en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);

    // Redirigir al dashboard
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  private clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  // Método de desarrollo: login simulado
  mockLogin(): void {
    const mockUser = {
      id: '1',
      username: 'admin',
      email: 'admin@taller.com',
      roles: ['admin']
    };
    
    localStorage.setItem('token', 'mock-jwt-token-for-development');
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    this.currentUserSubject.next(mockUser);
    this.router.navigate(['/dashboard']);
  }
}