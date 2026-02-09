// cookie.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  
  getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  hasCookie(name: string): boolean {
    return this.getCookie(name) !== null;
  }

  getAllCookies(): { [key: string]: string } {
    const cookies: { [key: string]: string } = {};
    const ca = document.cookie.split(';');
    
    ca.forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        cookies[key] = decodeURIComponent(value);
      }
    });
    
    return cookies;
  }

  // Verificar cookies específicas de ABP/OAuth
  hasAuthCookies(): boolean {
    const cookies = this.getAllCookies();
    const authCookieKeys = Object.keys(cookies).filter(key => 
      key.includes('.AspNetCore.Identity.Application') ||
      key.includes('.AspNetCore.Cookies') ||
      key.includes('access_token') ||
      key.includes('.oidc.')
    );
    
    console.log('🔐 [COOKIE SERVICE] Cookies de auth encontradas:', authCookieKeys);
    return authCookieKeys.length > 0;
  }
}