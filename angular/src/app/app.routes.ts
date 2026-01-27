import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { LoginComponent } from './auth/login/login.component';

import { DashboardComponent } from './components/dashboard/dashboard.component';
import { OrdenesListComponent } from './components/ordenes-list/ordenes-list.component';
import { OrdenNuevaComponent } from './components/orden-nueva/orden-nueva.component';
import { OrdenDetailComponent } from './components/orden-detail/orden-detail.component';
import { ClientesListComponent } from './components/clientes-list/clientes-list.component';
import { VehiculosListComponent } from './components/vehiculos-list/vehiculos-list.component';
import { ServiciosListComponent } from './components/servicios-list/servicios-list.component';
import { ProductosListComponent } from './components/productos-list/productos-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  
  { 
    path: '', 
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'ordenes', component: OrdenesListComponent },
      { path: 'ordenes/nueva', component: OrdenNuevaComponent },
      { path: 'ordenes/:id', component: OrdenDetailComponent },
      { path: 'ordenes/editar/:id', component: OrdenDetailComponent },
      { path: 'clientes', component: ClientesListComponent },
      { path: 'vehiculos', component: VehiculosListComponent },
      { path: 'servicios', component: ServiciosListComponent },
      { path: 'productos', component: ProductosListComponent },
    ]
  },
  
  // Redirección por defecto
  { path: '**', redirectTo: 'dashboard' }
];