// auth-debug.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthDebugService {
  
  debugAuthStatus(): void {
    console.log('🛠️ [AUTH DEBUG] Estado completo de autenticación:');
    
    // 1. Cookies
    console.log('🍪 COOKIES:');
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        const isAuthCookie = key.includes('Identity') || 
                            key.includes('Auth') || 
                            key.includes('token');
        const icon = isAuthCookie ? '🔐' : '🍪';
        console.log(`${icon} ${key}: ${value.substring(0, 50)}...`);
      }
    });
    
    // 2. LocalStorage
    console.log('💾 LOCALSTORAGE:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        const isAuthItem = key.includes('token') || key.includes('user') || key.includes('auth');
        const icon = isAuthItem ? '🔑' : '📦';
        console.log(`${icon} ${key}: ${value?.substring(0, 50)}...`);
      }
    }
    
    // 3. SessionStorage
    console.log('💼 SESSIONSTORAGE:');
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        console.log(`📦 ${key}: ${value?.substring(0, 50)}...`);
      }
    }
  }
}