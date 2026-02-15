import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service'; // ✅ Importar

interface Breadcrumb {
  label: string;
  url: string;
  icon: string;
  roles?: string[]; // ✅ Roles que pueden ver este breadcrumb
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav aria-label="breadcrumb" *ngIf="breadcrumbsFiltrados.length > 0">
      <ol class="breadcrumb mb-3">
        <li class="breadcrumb-item">
          <a routerLink="/dashboard">
            <i class="fas fa-home"></i> Inicio
          </a>
        </li>
        <li class="breadcrumb-item" *ngFor="let crumb of breadcrumbsFiltrados; let last = last" 
            [class.active]="last" [attr.aria-current]="last ? 'page' : null">
          <a *ngIf="!last" [routerLink]="crumb.url">
            <i *ngIf="crumb.icon" [class]="'fas fa-' + crumb.icon + ' me-1'"></i>
            {{ crumb.label }}
          </a>
          <span *ngIf="last">
            <i *ngIf="crumb.icon" [class]="'fas fa-' + crumb.icon + ' me-1'"></i>
            {{ crumb.label }}
          </span>
        </li>
      </ol>
    </nav>
  `
})
export class BreadcrumbsComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];
  breadcrumbsFiltrados: Breadcrumb[] = [];

  constructor(
    private router: Router,
    public authService: AuthService // ✅ Inyectar AuthService
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.buildBreadcrumbs();
        this.filtrarBreadcrumbs();
      });
    
    this.buildBreadcrumbs();
    this.filtrarBreadcrumbs();
  }

  // ✅ NUEVO: Filtrar breadcrumbs por roles
  private filtrarBreadcrumbs(): void {
    this.breadcrumbsFiltrados = this.breadcrumbs.filter(crumb => {
      if (!crumb.roles) return true;
      return this.authService.hasAnyRole(crumb.roles);
    });
  }

  private buildBreadcrumbs(): void {
    const url = this.router.url;
    const segments = url.split('/').filter(segment => segment);
    
    this.breadcrumbs = [];
    let accumulatedUrl = '';
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      accumulatedUrl += `/${segment}`;
      
      const breadcrumb = this.getBreadcrumb(segment, accumulatedUrl, i === segments.length - 1);
      if (breadcrumb) {
        this.breadcrumbs.push(breadcrumb);
      }
    }
  }

  // ✅ MAPPINGS ACTUALIZADOS CON ROLES
  private getBreadcrumb(segment: string, url: string, isLast: boolean): Breadcrumb | null {
    const mappings: { [key: string]: { label: string; icon: string; roles?: string[] } } = {
      'dashboard': { label: 'Dashboard', icon: 'tachometer-alt', roles: [] },
      'ordenes': { label: 'Órdenes', icon: 'clipboard-list', roles: ['admin', 'recepcionista'] },
      'nueva': { label: 'Nueva Orden', icon: 'plus-circle', roles: ['admin', 'recepcionista'] },
      'editar': { label: 'Editar Orden', icon: 'edit', roles: ['admin', 'recepcionista'] },
      'clientes': { label: 'Clientes', icon: 'users', roles: ['admin', 'recepcionista'] },
      'vehiculos': { label: 'Vehículos', icon: 'car', roles: ['admin', 'recepcionista', 'mecanico'] },
      'servicios': { label: 'Servicios', icon: 'tools', roles: ['admin', 'recepcionista', 'mecanico'] },
      'productos': { label: 'Productos', icon: 'box', roles: ['admin', 'recepcionista'] },
      'usuarios': { label: 'Usuarios', icon: 'user-cog', roles: ['admin'] },
      'roles': { label: 'Roles', icon: 'user-tag', roles: ['admin'] }
    };

    if (this.isUUID(segment)) {
      const segments = this.router.url.split('/').filter(s => s);
      const index = segments.indexOf(segment);
      
      if (index > 0 && segments[index - 1] === 'ordenes') {
        return { 
          label: 'Detalles Orden', 
          icon: 'eye', 
          url,
          roles: ['admin', 'recepcionista', 'mecanico', 'lavacoches']
        };
      }
      return { label: 'Detalles', icon: 'file-alt', url };
    }

    const mapping = mappings[segment];
    if (mapping) {
      return {
        label: mapping.label,
        icon: mapping.icon,
        url: isLast ? '' : url,
        roles: mapping.roles
      };
    }
    
    return null;
  }

  private isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}