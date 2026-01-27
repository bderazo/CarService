import { withHttpErrorConfig } from '@abp/ng.theme.shared';
import { withValidationBluePrint, provideAbpThemeShared } from '@abp/ng.theme.shared';

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
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
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        APP_ROUTE_PROVIDER,
        provideAbpCore(withOptions({
            environment,
            registerLocaleFn: registerLocaleForEsBuild(),
        })),
        provideAbpOAuth(),
        provideSettingManagementConfig(),
        provideAccountConfig(),
        provideIdentityConfig(),
        provideTenantManagementConfig(),
        provideFeatureManagementConfig(),
        provideAnimations(),
        // provideLogo(),
        provideAbpThemeShared(withValidationBluePrint({
            wrongPassword: 'Please choose 1q2w3E*'
        })),
        provideThemeLeptonX(),
        provideSideMenuLayout(),
        provideHttpClient(
            withInterceptors([authInterceptor])
        )
    ],
};
