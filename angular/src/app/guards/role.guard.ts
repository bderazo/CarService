import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('🔥 PUNTO 4 - RoleGuard.canActivate()');
    console.log('  - URL:', state.url);
    console.log('  - route.data:', JSON.stringify(route.data));

    const rolesRequeridos = route.data['roles'] as Array<string>;
    console.log('🔥 PUNTO 4.1 - rolesRequeridos:', rolesRequeridos);

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      console.log('🔥 PUNTO 4.2 - No hay roles requeridos, acceso concedido');
      return true;
    }

    console.log('🔥 PUNTO 4.3 - Llamando a authService.getUserRoles()');
    const userRoles = this.authService.getUserRoles();
    console.log('🔥 PUNTO 4.4 - userRoles recibido:', userRoles);
    console.log('  - ¿Es array?', Array.isArray(userRoles));
    console.log('  - Tipo:', typeof userRoles);
    console.log('  - Longitud:', userRoles?.length);
    console.log('  - Valores:', userRoles);

    // Normalizar para comparación
    const userRolesLower = userRoles.map(r => {
      console.log(`  - Normalizando rol: "${r}" → "${r.toLowerCase()}"`);
      return r.toLowerCase();
    });

    const rolesRequeridosLower = rolesRequeridos.map(r => {
      console.log(`  - Normalizando requerido: "${r}" → "${r.toLowerCase()}"`);
      return r.toLowerCase();
    });

    console.log('🔥 PUNTO 4.5 - userRolesLower:', userRolesLower);
    console.log('🔥 PUNTO 4.6 - rolesRequeridosLower:', rolesRequeridosLower);

    const tieneAcceso = rolesRequeridosLower.some(rol => {
      const existe = userRolesLower.includes(rol);
      console.log(`  - ¿Tiene rol "${rol}"?`, existe);
      return existe;
    });

    console.log('🔥 PUNTO 4.7 - ¿Tiene acceso?', tieneAcceso);

    if (!tieneAcceso) {
      console.warn(`🚫 Acceso denegado a ${state.url}`);
      this.router.navigate(['/acceso-denegado']);
      return false;
    }

    console.log('✅ Acceso concedido');
    return true;
  }
}
