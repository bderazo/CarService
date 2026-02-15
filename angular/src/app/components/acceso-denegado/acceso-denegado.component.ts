import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 text-center">
          <div class="card shadow-lg border-danger">
            <div class="card-header bg-danger text-white">
              <h2 class="mb-0"><i class="fas fa-shield-alt"></i> Acceso Denegado</h2>
            </div>
            <div class="card-body p-5">
              <div class="display-1 text-danger mb-4">
                <i class="fas fa-lock"></i>
              </div>
              <h3 class="text-danger mb-4">No tienes permisos para acceder</h3>

              <div class="alert alert-info" *ngIf="authService.getCurrentUser() as user">
                <p class="mb-1"><strong>Usuario:</strong> {{ user.username }}</p>
                <p class="mb-0">
                  <strong>Tus roles:</strong>
                  <span class="badge bg-secondary ms-2" *ngFor="let rol of rolesArray">
                    {{ rol }}
                  </span>
                </p>
              </div>

              <p class="text-muted mb-4">
                No tienes los permisos necesarios para visualizar esta página.
                <br />Si crees que esto es un error, contacta al administrador.
              </p>

              <div class="d-grid gap-2">
                <a routerLink="/dashboard" class="btn btn-primary btn-lg">
                  <i class="fas fa-home"></i> Ir al Dashboard
                </a>
                <button class="btn btn-outline-secondary" onclick="history.back()">
                  <i class="fas fa-arrow-left"></i> Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        border-radius: 15px;
        border: none;
      }
      .card-header {
        border-radius: 15px 15px 0 0 !important;
      }
    `,
  ],
})
export class AccesoDenegadoComponent {
  constructor(public authService: AuthService) {}
  get rolesArray(): string[] {
    const user = this.authService.getCurrentUser();
    if (!user) return [];

    if (Array.isArray(user.roles)) {
      return user.roles;
    }

    if (typeof user.roles === 'string') {
      return [user.roles];
    }

    return [];
  }
}
