// token-protector.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class TokenProtectorService {
  private backupToken: string | null = null;
  private backupUser: string | null = null;
  
  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeProtection();
    }
  }
  
  private initializeProtection(): void {
    console.log('🛡️ [TOKEN PROTECTOR] Inicializando protección de token');
    
    // 1. Hacer backup del token actual
    this.backupToken = localStorage.getItem('access_token');
    this.backupUser = localStorage.getItem('currentUser');
    
    console.log('💾 [TOKEN PROTECTOR] Backup inicial:', {
      token: this.backupToken ? 'PRESENTE' : 'AUSENTE',
      user: this.backupUser ? 'PRESENTE' : 'AUSENTE'
    });
    
    // 2. Monitorear cambios en localStorage
    this.setupLocalStorageMonitoring();
    
    // 3. Restaurar automáticamente si desaparece
    this.setupAutoRestore();
  }
  
  private setupLocalStorageMonitoring(): void {
    // Interceptar localStorage.clear()
    const originalClear = localStorage.clear;
    localStorage.clear = () => {
      console.log('🚨 [TOKEN PROTECTOR] Alguien intentó localStorage.clear()');
      console.trace('Stack trace del clear:');
      
      // Hacer backup antes del clear
      this.backupToken = localStorage.getItem('access_token');
      this.backupUser = localStorage.getItem('currentUser');
      
      // Solo limpiar items que NO sean de autenticación
      const keysToKeep = ['access_token', 'refresh_token', 'currentUser'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ [TOKEN PROTECTOR] Clear parcial ejecutado (items de auth preservados)');
      return;
    };
    
    // Interceptar localStorage.removeItem()
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = (key: string) => {
      if (key === 'access_token' || key === 'refresh_token' || key === 'currentUser') {
        console.log(`🚨 [TOKEN PROTECTOR] Intento de eliminar ${key}`);
        console.trace('Stack trace del removeItem:');
        
        // Hacer backup
        if (key === 'access_token') {
          this.backupToken = localStorage.getItem('access_token');
        } else if (key === 'currentUser') {
          this.backupUser = localStorage.getItem('currentUser');
        }
        
        // NO permitir eliminar items de auth
        console.log(`❌ [TOKEN PROTECTOR] Prevenida eliminación de ${key}`);
        return;
      }
      
      return originalRemoveItem.call(localStorage, key);
    };
  }
  
  private setupAutoRestore(): void {
    // Verificar cada segundo si el token desapareció
    setInterval(() => {
      const currentToken = localStorage.getItem('access_token');
      const currentUser = localStorage.getItem('currentUser');
      
      // Si el token desapareció pero tenemos backup, restaurar
      if (!currentToken && this.backupToken) {
        console.log('🔄 [TOKEN PROTECTOR] Token desapareció, restaurando desde backup...');
        localStorage.setItem('access_token', this.backupToken);
      }
      
      if (!currentUser && this.backupUser) {
        console.log('🔄 [TOKEN PROTECTOR] User desapareció, restaurando desde backup...');
        localStorage.setItem('currentUser', this.backupUser);
      }
    }, 1000);
  }
  
  // Método para forzar backup
  forceBackup(): void {
    this.backupToken = localStorage.getItem('access_token');
    this.backupUser = localStorage.getItem('currentUser');
    console.log('💾 [TOKEN PROTECTOR] Backup forzado realizado');
  }
  
  // Método para restaurar manualmente
  restoreTokens(): void {
    if (this.backupToken && !localStorage.getItem('access_token')) {
      console.log('🔄 [TOKEN PROTECTOR] Restaurando token manualmente');
      localStorage.setItem('access_token', this.backupToken);
    }
    if (this.backupUser && !localStorage.getItem('currentUser')) {
      console.log('🔄 [TOKEN PROTECTOR] Restaurando user manualmente');
      localStorage.setItem('currentUser', this.backupUser);
    }
  }
}