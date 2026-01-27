import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServicioService, Servicio } from '../../services/servicio.service';

@Component({
  selector: 'app-servicios-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Servicios del Taller</h2>
        <button class="btn btn-primary" (click)="mostrarFormulario()">
          <i class="fas fa-plus"></i> Nuevo Servicio
        </button>
      </div>

      <!-- Formulario para crear/editar -->
      <div class="card mb-4" *ngIf="mostrandoFormulario">
        <div class="card-header">
          <h5 class="mb-0">{{ servicioEditando ? 'Editar' : 'Nuevo' }} Servicio</h5>
        </div>
        <div class="card-body">
          <form #servicioForm="ngForm" (ngSubmit)="guardarServicio()">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Código *</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoServicio.codigo" 
                       name="codigo" 
                       required
                       placeholder="Ej: SER-001">
              </div>
              <div class="col-md-8">
                <label class="form-label">Nombre *</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoServicio.nombre" 
                       name="nombre" 
                       required
                       placeholder="Ej: Cambio de aceite">
              </div>
              <div class="col-12">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" 
                          [(ngModel)]="nuevoServicio.descripcion" 
                          name="descripcion" 
                          rows="3"
                          placeholder="Descripción detallada del servicio..."></textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label">Precio *</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" 
                         [(ngModel)]="nuevoServicio.precio" 
                         name="precio" 
                         required
                         min="0" 
                         step="0.01"
                         placeholder="0.00">
                </div>
              </div>
              <div class="col-12">
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-success" [disabled]="!servicioForm.valid">
                    <i class="fas fa-save"></i> Guardar
                  </button>
                  <button type="button" class="btn btn-secondary" (click)="cancelarFormulario()">
                    <i class="fas fa-times"></i> Cancelar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Búsqueda y filtros -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-8">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-search"></i>
                </span>
                <input type="text" class="form-control" 
                       placeholder="Buscar por nombre o código..." 
                       [(ngModel)]="terminoBusqueda"
                       (input)="filtrarServicios()">
              </div>
            </div>
            <div class="col-md-4">
              <select class="form-select" [(ngModel)]="ordenarPor" (change)="ordenarServicios()">
                <option value="nombre">Ordenar por: Nombre</option>
                <option value="codigo">Ordenar por: Código</option>
                <option value="precioAsc">Ordenar por: Precio (menor a mayor)</option>
                <option value="precioDesc">Ordenar por: Precio (mayor a menor)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de servicios -->
      <div *ngIf="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div class="card" *ngIf="!loading">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th class="text-end">Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let servicio of serviciosFiltrados">
                  <td>
                    <span class="badge bg-secondary">{{ servicio.codigo }}</span>
                  </td>
                  <td>
                    <strong>{{ servicio.nombre }}</strong>
                  </td>
                  <td>
                    <small class="text-muted">{{ servicio.descripcion || 'Sin descripción' | slice:0:50 }}{{ servicio.descripcion && servicio.descripcion.length > 50 ? '...' : '' }}</small>
                  </td>
                  <td class="text-end">
                    <span class="badge bg-success fs-6">{{ servicio.precio.toFixed(2) }}</span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-warning" (click)="editarServicio(servicio)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-outline-danger" (click)="eliminarServicio(servicio.id)">
                        <i class="fas fa-trash"></i>
                      </button>
                      <button class="btn btn-outline-info" (click)="usarEnOrden(servicio)">
                        <i class="fas fa-clipboard-list"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="serviciosFiltrados.length === 0">
                  <td colspan="5" class="text-center text-muted py-4">
                    {{ servicios.length === 0 ? 'No hay servicios registrados' : 'No se encontraron servicios con ese criterio' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Resumen -->
          <div class="mt-3 pt-3 border-top">
            <div class="row">
              <div class="col-md-6">
                <small class="text-muted">
                  Mostrando {{ serviciosFiltrados.length }} de {{ servicios.length }} servicios
                </small>
              </div>
              <div class="col-md-6 text-end">
                <small class="text-muted">
                  Precio promedio: {{ getPrecioPromedio().toFixed(2) }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ServiciosListComponent implements OnInit {
  servicios: Servicio[] = [];
  serviciosFiltrados: Servicio[] = [];
  loading = false;
  error: string | null = null;
  
  mostrandoFormulario = false;
  servicioEditando: Servicio | null = null;
  terminoBusqueda = '';
  ordenarPor = 'nombre';
  
  nuevoServicio = {
    codigo: '',
    nombre: '',
    descripcion: '',
    precio: 0
  };

  constructor(private servicioService: ServicioService) {}

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.loading = true;
    this.servicioService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.servicios = response.data;
          this.filtrarServicios();
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar servicios: ' + err.message;
        this.loading = false;
      }
    });
  }

  mostrarFormulario(): void {
    this.mostrandoFormulario = true;
    this.servicioEditando = null;
    this.resetFormulario();
  }

  editarServicio(servicio: Servicio): void {
    this.servicioEditando = servicio;
    this.nuevoServicio = { ...servicio };
    this.mostrandoFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrandoFormulario = false;
    this.servicioEditando = null;
    this.resetFormulario();
  }

  resetFormulario(): void {
    this.nuevoServicio = {
      codigo: '',
      nombre: '',
      descripcion: '',
      precio: 0
    };
  }

  guardarServicio(): void {
    if (this.servicioEditando) {
      // Actualizar
      this.servicioService.update(this.servicioEditando.id, this.nuevoServicio).subscribe({
        next: (response) => {
          if (response.success) {
            const index = this.servicios.findIndex(s => s.id === this.servicioEditando!.id);
            if (index !== -1) {
              this.servicios[index] = response.data;
            }
            this.filtrarServicios();
            this.cancelarFormulario();
            alert('Servicio actualizado correctamente');
          }
        },
        error: (err) => {
          alert('Error al actualizar servicio: ' + err.message);
        }
      });
    } else {
      // Crear nuevo
      this.servicioService.create(this.nuevoServicio).subscribe({
        next: (response) => {
          if (response.success) {
            this.servicios.push(response.data);
            this.filtrarServicios();
            this.cancelarFormulario();
            alert('Servicio creado correctamente');
          }
        },
        error: (err) => {
          alert('Error al crear servicio: ' + err.message);
        }
      });
    }
  }

  eliminarServicio(id: string): void {
    if (confirm('¿Está seguro de eliminar este servicio?')) {
      this.servicioService.delete(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.servicios = this.servicios.filter(s => s.id !== id);
            this.filtrarServicios();
            alert('Servicio eliminado correctamente');
          }
        },
        error: (err) => {
          alert('Error al eliminar servicio: ' + err.message);
        }
      });
    }
  }

  usarEnOrden(servicio: Servicio): void {
    // Esto podría redirigir a crear una nueva orden con este servicio pre-seleccionado
    const servicioData = {
      id: servicio.id,
      nombre: servicio.nombre,
      precio: servicio.precio
    };
    localStorage.setItem('servicioSeleccionado', JSON.stringify(servicioData));
    alert(`Servicio "${servicio.nombre}" listo para usar en nueva orden`);
  }

  filtrarServicios(): void {
    if (!this.terminoBusqueda.trim()) {
      this.serviciosFiltrados = [...this.servicios];
    } else {
      const termino = this.terminoBusqueda.toLowerCase();
      this.serviciosFiltrados = this.servicios.filter(servicio =>
        servicio.nombre.toLowerCase().includes(termino) ||
        servicio.codigo.toLowerCase().includes(termino) ||
        (servicio.descripcion && servicio.descripcion.toLowerCase().includes(termino))
      );
    }
    this.ordenarServicios();
  }

  ordenarServicios(): void {
    switch (this.ordenarPor) {
      case 'nombre':
        this.serviciosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'codigo':
        this.serviciosFiltrados.sort((a, b) => a.codigo.localeCompare(b.codigo));
        break;
      case 'precioAsc':
        this.serviciosFiltrados.sort((a, b) => a.precio - b.precio);
        break;
      case 'precioDesc':
        this.serviciosFiltrados.sort((a, b) => b.precio - a.precio);
        break;
    }
  }

  getPrecioPromedio(): number {
    if (this.serviciosFiltrados.length === 0) return 0;
    const total = this.serviciosFiltrados.reduce((sum, servicio) => sum + servicio.precio, 0);
    return total / this.serviciosFiltrados.length;
  }
}