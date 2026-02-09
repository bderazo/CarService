import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { TokenProtectorService } from './app/auth/services/token-protector.service';

bootstrapApplication(AppComponent, appConfig).then(appRef => {
  // Inicializar el protector de tokens
  const protector = appRef.injector.get(TokenProtectorService);
  console.log('🛡️ Token Protector inicializado');
}).catch(err => console.error(err));