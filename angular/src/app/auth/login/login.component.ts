// angular/src/app/auth/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid vh-100 bg-light">
      <div class="row h-100 justify-content-center align-items-center">
        <div class="col-md-4 col-lg-3">
          <div class="card shadow-lg border-0">
            <!-- Header -->
            <div class="card-header bg-gradient-primary text-white text-center py-4">
              <div class="d-flex justify-content-center mb-3">
                <div class="bg-white rounded-circle p-3">
                  <i class="fas fa-car fa-2x text-primary"></i>
                </div>
              </div>
              <h3 class="mb-1">Taller Mecánico</h3>
              <p class="mb-0 opacity-75">Sistema de Gestión</p>
            </div>

            <!-- Body -->
            <div class="card-body p-4">
              <h5 class="card-title text-center mb-4">Iniciar Sesión</h5>
              
              <!-- Mensajes de error -->
              <div *ngIf="error" class="alert alert-danger alert-dismissible fade show" role="alert">
                {{ error }}
                <button type="button" class="btn-close" (click)="error = ''"></button>
              </div>

              <!-- Formulario -->
              <form #loginForm="ngForm" (ngSubmit)="onSubmit()" novalidate>
                <div class="mb-3">
                  <label class="form-label fw-semibold">Usuario</label>
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="fas fa-user"></i>
                    </span>
                    <input type="text" 
                           class="form-control" 
                           [(ngModel)]="credentials.username" 
                           name="username" 
                           required
                           placeholder="Ingrese su usuario"
                           [class.is-invalid]="submitted && !credentials.username">
                  </div>
                  <div *ngIf="submitted && !credentials.username" class="invalid-feedback d-block">
                    El usuario es requerido
                  </div>
                </div>
                
                <div class="mb-4">
                  <label class="form-label fw-semibold">Contraseña</label>
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="fas fa-lock"></i>
                    </span>
                    <input type="password" 
                           class="form-control" 
                           [(ngModel)]="credentials.password" 
                           name="password" 
                           required
                           placeholder="Ingrese su contraseña"
                           [class.is-invalid]="submitted && !credentials.password">
                  </div>
                  <div *ngIf="submitted && !credentials.password" class="invalid-feedback d-block">
                    La contraseña es requerida
                  </div>
                </div>
                
                <!-- Botones -->
                <div class="d-grid gap-2 mb-3">
                  <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <i class="fas fa-sign-in-alt me-2"></i>
                    {{ loading ? 'Verificando...' : 'Ingresar al Sistema' }}
                  </button>
                  
                  <!-- Botón de desarrollo -->
                  <button type="button" class="btn btn-outline-secondary btn-sm" (click)="mockLogin()">
                    <i class="fas fa-bolt me-1"></i> Ingreso Rápido (Desarrollo)
                  </button>
                </div>
                
                <!-- Credenciales demo -->
                <div class="alert alert-info mt-3">
                  <div class="d-flex">
                    <i class="fas fa-info-circle me-2 mt-1"></i>
                    <div>
                      <small class="fw-bold">Credenciales para prueba:</small><br>
                      <small>Usuario: <code>admin</code> | Contraseña: <code>123456</code></small>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <!-- Footer -->
            <div class="card-footer text-center py-3">
              <small class="text-muted">
                <i class="fas fa-graduation-cap me-1"></i>
                Proyecto Universitario - Desarrollo Web Avanzado
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-gradient-primary {
      background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
    }
    .card {
      border-radius: 15px;
    }
    .card-header {
      border-radius: 15px 15px 0 0 !important;
    }
  `]
})
export class LoginComponent {
  credentials = { username: 'admin', password: '123456' };
  loading = false;
  error = '';
  submitted = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.submitted = true;
    
    if (!this.credentials.username || !this.credentials.password) {
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.loading = false;
        // La redirección se maneja en el servicio
      },
      error: (err) => {
        this.loading = false;
        this.error = this.getErrorMessage(err);
        console.error('Login error details:', err);
      }
    });
  }

  mockLogin(): void {
    this.authService.mockLogin();
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'No se puede conectar al servidor. Verifique que el backend esté ejecutándose.';
    }
    if (error.status === 400 || error.status === 401) {
      return 'Usuario o contraseña incorrectos';
    }
    if (error.error?.error_description) {
      return error.error.error_description;
    }
    if (error.error?.error) {
      return error.error.error;
    }
    return 'Error al iniciar sesión. Intente nuevamente.';
  }
}