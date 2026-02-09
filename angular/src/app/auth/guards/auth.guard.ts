import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {
  private debugId = Math.random().toString(36).substring(7);
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    console.log(`🛡️ [GUARD ${this.debugId}] AuthGuard instanciado`);
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    console.log(`🛡️ [GUARD ${this.debugId}] canActivate llamado para: ${state.url}`);
    
    // 1. Verificar autenticación
    const isAuthenticated = this.authService.isAuthenticated();
    console.log(`🔐 isAuthenticated(): ${isAuthenticated}`);
    
    // 2. Verificar cookies (para debug)
    console.log(`🍪 Cookies: ${document.cookie}`);
    
    // 3. Verificar localStorage
    const user = localStorage.getItem('currentUser');
    console.log(`👤 User en localStorage: ${user ? 'PRESENTE' : 'AUSENTE'}`);
    
    if (isAuthenticated) {
      console.log(`✅ [GUARD ${this.debugId}] ACCESO PERMITIDO a ${state.url}`);
      return true;
    }

    console.log(`❌ [GUARD ${this.debugId}] ACCESO DENEGADO a ${state.url}`);
    console.log(`🔄 Redirigiendo a /login...`);
    
    // Redirigir al login
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    
    return false;
  }
}