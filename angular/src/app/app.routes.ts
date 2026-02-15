import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { OrdenesListComponent } from './components/ordenes-list/ordenes-list.component';
import { OrdenNuevaComponent } from './components/orden-nueva/orden-nueva.component';
import { OrdenDetailComponent } from './components/orden-detail/orden-detail.component';
import { ClientesListComponent } from './components/clientes-list/clientes-list.component';
import { UsersListComponent } from './components/usuarios-list/usuarios-list.component';
import { VehiculosListComponent } from './components/vehiculos-list/vehiculos-list.component';
import { ServiciosListComponent } from './components/servicios-list/servicios-list.component';
import { ProductosListComponent } from './components/productos-list/productos-list.component';
import { RolesListComponent } from './components/roles-list/roles-list.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { AccesoDenegadoComponent } from './components/acceso-denegado/acceso-denegado.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'acceso-denegado', component: AccesoDenegadoComponent },

  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // 🟢 Dashboard - Todos los autenticados
      { path: 'dashboard', component: DashboardComponent },

      // 🟢 Órdenes - Admin + Recepcionistas
      {
        path: 'ordenes',
        component: OrdenesListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'recepcionista', 'mecanico', 'lavacoches'] }, // ✅ TODOS
      },
      {
        path: 'ordenes/nueva',
        component: OrdenNuevaComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'recepcionista'] }, // ❌ SOLO RECEPCIÓN/ADMIN
      },
      {
        path: 'ordenes/:id',
        component: OrdenDetailComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'recepcionista', 'mecanico', 'lavacoches'] }, // ✅ TODOS
      },
      {
        path: 'ordenes/editar/:id',
        component: OrdenDetailComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'recepcionista'] }, // ❌ SOLO RECEPCIÓN/ADMIN
      },
      // 🟢 Clientes - Admin + Recepcionistas
      {
        path: 'clientes',
        component: ClientesListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'recepcionista'] },
      },

      // 🟢 Vehículos - Admin + Recepcionistas + Mecánicos
      {
        path: 'vehiculos',
        component: VehiculosListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'recepcionista', 'mecanico'] },
      },

      // 🟢 Servicios - Admin + Recepcionistas + Mecánicos
      {
        path: 'servicios',
        component: ServiciosListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'recepcionista', 'mecanico'] },
      },

      // 🟢 Productos - Admin + Recepcionistas
      {
        path: 'productos',
        component: ProductosListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'recepcionista'] },
      },

      // 🔵 Usuarios - SOLO ADMIN
      {
        path: 'usuarios',
        component: UsersListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
      },

      // 🔵 Roles - SOLO ADMIN
      {
        path: 'roles',
        component: RolesListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'reportes',
        component: ReportesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
