import { withHttpErrorConfig } from '@abp/ng.theme.shared';
import { withValidationBluePrint, provideAbpThemeShared } from '@abp/ng.theme.shared';

import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { APP_ROUTE_PROVIDER } from './route.provider';
import { provideAbpCore, withOptions } from '@abp/ng.core';
import { environment } from '../environments/environment';
import { registerLocaleForEsBuild } from '@abp/ng.core/locale';
import { provideAbpOAuth } from '@abp/ng.oauth';
import { provideSettingManagementConfig } from '@abp/ng.setting-management/config';
import { provideAccountConfig } from '@abp/ng.account/config';
import { provideIdentityConfig } from '@abp/ng.identity/config';
import { provideTenantManagementConfig } from '@abp/ng.tenant-management/config';
import { provideFeatureManagementConfig } from '@abp/ng.feature-management';
import { provideThemeLeptonX } from '@abp/ng.theme.lepton-x';
import { provideSideMenuLayout } from '@abp/ng.theme.lepton-x/layouts';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { authInterceptor } from 'src/app/auth/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // En providers, antes de cualquier cosa:
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        return () => {
          console.log('🔍 [APP INIT] Monitoreando localStorage...');

          // Monitorear todas las operaciones en localStorage
          const monitorLocalStorage = () => {
            const originalSetItem = Storage.prototype.setItem;
            const originalRemoveItem = Storage.prototype.removeItem;
            const originalClear = Storage.prototype.clear;

            Storage.prototype.setItem = function (key: string, value: string) {
              console.log(`📝 [STORAGE MONITOR] setItem: ${key} (${value.length} chars)`);
              if (key.includes('token') || key.includes('auth')) {
                console.trace(`📋 Stack trace para setItem de ${key}:`);
              }
              return originalSetItem.call(this, key, value);
            };

            Storage.prototype.removeItem = function (key: string) {
              console.log(`🗑️ [STORAGE MONITOR] removeItem: ${key}`);
              if (key.includes('token') || key.includes('auth') || key.includes('user')) {
                console.trace(`🚨🚨🚨 ALERTA: Alguien está eliminando ${key}`);
                console.trace('Stack trace completo:');

                // Pausar ejecución para debug
                debugger;
              }
              return originalRemoveItem.call(this, key);
            };

            Storage.prototype.clear = function () {
              console.log('🔥🔥🔥 [STORAGE MONITOR] CLEAR LLAMADO - ALGUIEN LIMPIA TODO');
              console.trace('STACK TRACE DEL CLEAR:');
              debugger; // Pausar aquí para ver quién llama
              return originalClear.call(this);
            };
          };

          monitorLocalStorage();
        };
      },
      multi: true,
    },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    APP_ROUTE_PROVIDER,
    provideAbpCore(
      withOptions({
        environment,
        registerLocaleFn: registerLocaleForEsBuild(),
      }),
    ),
    provideAbpOAuth(),
    provideSettingManagementConfig(),
    provideAccountConfig(),
    provideIdentityConfig(),
    provideTenantManagementConfig(),
    provideFeatureManagementConfig(),
    provideAnimations(),
    // provideLogo(),
    provideAbpThemeShared(
      withValidationBluePrint({
        wrongPassword: 'Please choose 1q2w3E*',
      }),
    ),
    provideThemeLeptonX(),
    provideSideMenuLayout(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
