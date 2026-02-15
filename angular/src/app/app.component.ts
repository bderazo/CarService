import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AuthService } from './auth/services/auth.service';
import { XsrfService } from './services/xsrf.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    BreadcrumbsComponent,
    ToastContainerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'MecanicApp';
  currentYear = new Date().getFullYear();
  currentUser: any = null;

  constructor(
    public authService: AuthService,
    private xsrfService: XsrfService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      if (user) {
        console.log('👤 [APP] Usuario autenticado, obteniendo XSRF token...');
        this.xsrfService.fetchXsrfToken().then(token => {
          if (token) {
            console.log('✅ [APP] XSRF token listo para requests');
          }
        });
      }
    });

    console.log('🔄 [APP] Iniciando, verificando cookies...');
    const cookies = this.xsrfService.listCookies();
    console.log('🍪 [APP] Cookies disponibles:', Object.keys(cookies));

    if (!this.xsrfService.hasXsrfToken()) {
      console.log('🔄 [APP] No hay XSRF token, solicitando...');
      this.xsrfService.fetchXsrfToken();
    }
  }

  logout(): void {
    this.authService.logout();
  }
  getRolPrincipal(): string {
    if (!this.currentUser?.roles) return 'Usuario';

    // Prioridad: admin > recepcionista > mecanico > lavacoches
    if (this.currentUser.roles.includes('admin')) return 'Administrador';
    if (this.currentUser.roles.includes('recepcionista')) return 'Recepcionista';
    if (this.currentUser.roles.includes('mecanico')) return 'Mecanico';
    if (this.currentUser.roles.includes('lavacoches')) return 'lavacoches';

    return 'Usuario';
  }
}
