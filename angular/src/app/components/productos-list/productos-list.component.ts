import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductoService, Producto } from '../../services/producto.service';

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Productos / Repuestos</h2>
        <div class="btn-group">
          <button class="btn btn-primary" (click)="mostrarFormulario()">
            <i class="fas fa-plus"></i> Nuevo Producto
          </button>
          <button class="btn btn-warning" (click)="mostrarAjusteStock()">
            <i class="fas fa-exchange-alt"></i> Ajustar Stock
          </button>
        </div>
      </div>

      <!-- Formulario para crear/editar producto -->
      <div class="card mb-4" *ngIf="mostrandoFormulario">
        <div class="card-header">
          <h5 class="mb-0">{{ productoEditando ? 'Editar' : 'Nuevo' }} Producto</h5>
        </div>
        <div class="card-body">
          <form #productoForm="ngForm" (ngSubmit)="guardarProducto()">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Código *</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoProducto.codigo" 
                       name="codigo" 
                       required
                       placeholder="Ej: PROD-001">
              </div>
              <div class="col-md-8">
                <label class="form-label">Nombre *</label>
                <input type="text" class="form-control" 
                       [(ngModel)]="nuevoProducto.nombre" 
                       name="nombre" 
                       required
                       placeholder="Ej: Aceite motor 5W30">
              </div>
              <div class="col-12">
                <label class="form-label">Descripción</label>
                <textarea class="form-control" 
                          [(ngModel)]="nuevoProducto.descripcion" 
                          name="descripcion" 
                          rows="2"
                          placeholder="Descripción del producto..."></textarea>
              </div>
              
              <div class="col-md-4">
                <label class="form-label">Precio Compra *</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" 
                         [(ngModel)]="nuevoProducto.precioCompra" 
                         name="precioCompra" 
                         required
                         min="0" 
                         step="0.01">
                </div>
              </div>
              
              <div class="col-md-4">
                <label class="form-label">Precio Venta *</label>
                <div class="input-group">
                  <span class="input-group-text">$</span>
                  <input type="number" class="form-control" 
                         [(ngModel)]="nuevoProducto.precioVenta" 
                         name="precioVenta" 
                         required
                         min="0" 
                         step="0.01">
                </div>
              </div>
              
              <div class="col-md-2">
                <label class="form-label">Stock *</label>
                <input type="number" class="form-control" 
                       [(ngModel)]="nuevoProducto.stock" 
                       name="stock" 
                       required
                       min="0">
              </div>
              
              <div class="col-md-2">
                <label class="form-label">Stock Mínimo</label>
                <input type="number" class="form-control" 
                       [(ngModel)]="nuevoProducto.stockMinimo" 
                       name="stockMinimo"
                       min="0"
                       placeholder="10">
              </div>
              
              <div class="col-12">
                <div class="alert alert-info" *ngIf="calcularMargen() > 0">
                  <strong>Margen de ganancia:</strong> {{ calcularMargen().toFixed(2) }}% 
                  (Ganancia: {{ calcularGanancia().toFixed(2) }})
                </div>
              </div>
              
              <div class="col-12">
                <div class="d-flex gap-2">
                  <button type="submit" class="btn btn-success" [disabled]="!productoForm.valid">
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

      <!-- Modal para ajustar stock -->
      <div class="card mb-4" *ngIf="mostrandoAjusteStock">
        <div class="card-header">
          <h5 class="mb-0">Ajustar Stock</h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Producto</label>
              <select class="form-select" [(ngModel)]="productoAjusteId" (change)="seleccionarProductoAjuste()">
                <option value="">Seleccionar producto</option>
                <option *ngFor="let producto of productos" [value]="producto.id">
                  {{ producto.nombre }} (Stock: {{ producto.stock }})
                </option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Tipo</label>
              <select class="form-select" [(ngModel)]="tipoAjuste">
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Cantidad</label>
              <input type="number" class="form-control" 
                     [(ngModel)]="cantidadAjuste" 
                     min="1"
                     [max]="tipoAjuste === 'salida' ? productoAjusteSeleccionado?.stock || 0 : 1000">
            </div>
            <div class="col-12" *ngIf="productoAjusteSeleccionado">
              <div class="alert" [ngClass]="getStockAlertClass()">
                Stock actual: <strong>{{ productoAjusteSeleccionado.stock }}</strong> 
                | Stock mínimo: <strong>{{ productoAjusteSeleccionado.stockMinimo || 10 }}</strong>
                | Stock después: <strong>{{ calcularStockFuturo() }}</strong>
              </div>
            </div>
            <div class="col-12">
              <div class="d-flex gap-2">
                <button class="btn btn-primary" (click)="realizarAjusteStock()" 
                        [disabled]="!productoAjusteId || !cantidadAjuste || cantidadAjuste <= 0">
                  <i class="fas fa-check"></i> Aplicar Ajuste
                </button>
                <button type="button" class="btn btn-secondary" (click)="cancelarAjusteStock()">
                  <i class="fas fa-times"></i> Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros y búsqueda -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-search"></i>
                </span>
                <input type="text" class="form-control" 
                       placeholder="Buscar por nombre o código..." 
                       [(ngModel)]="terminoBusqueda"
                       (input)="filtrarProductos()">
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="filtroStock" (change)="filtrarProductos()">
                <option value="todos">Todos los productos</option>
                <option value="bajo">Stock bajo</option>
                <option value="sin">Sin stock</option>
                <option value="disponible">Disponible</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="ordenarPor" (change)="ordenarProductos()">
                <option value="nombre">Ordenar por: Nombre</option>
                <option value="stockAsc">Ordenar por: Stock (menor a mayor)</option>
                <option value="stockDesc">Ordenar por: Stock (mayor a menor)</option>
                <option value="precioAsc">Ordenar por: Precio (menor a mayor)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de productos -->
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
                  <th class="text-end">Precio Compra</th>
                  <th class="text-end">Precio Venta</th>
                  <th class="text-end">Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let producto of productosFiltrados" 
                    [ngClass]="getRowClass(producto)">
                  <td>
                    <span class="badge bg-secondary">{{ producto.codigo }}</span>
                  </td>
                  <td>
                    <strong>{{ producto.nombre }}</strong>
                    <small class="d-block text-muted">{{ producto.descripcion | slice:0:30 }}{{ producto.descripcion && producto.descripcion.length > 30 ? '...' : '' }}</small>
                  </td>
                  <td class="text-end">
                    <span class="text-muted">{{ producto.precioCompra.toFixed(2) }}</span>
                  </td>
                  <td class="text-end">
                    <strong class="text-success">{{ producto.precioVenta.toFixed(2) }}</strong>
                  </td>
                  <td class="text-end">
                    <span [ngClass]="getStockClass(producto)">
                      {{ producto.stock }}
                    </span>
                    <small class="d-block text-muted" *ngIf="producto.stockMinimo">
                      Mín: {{ producto.stockMinimo }}
                    </small>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="getEstadoBadgeClass(producto)">
                      {{ getEstadoTexto(producto) }}
                    </span>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-warning" (click)="editarProducto(producto)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn btn-outline-danger" (click)="eliminarProducto(producto.id)">
                        <i class="fas fa-trash"></i>
                      </button>
                      <button class="btn btn-outline-info" (click)="usarEnOrden(producto)">
                        <i class="fas fa-clipboard-list"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="productosFiltrados.length === 0">
                  <td colspan="7" class="text-center text-muted py-4">
                    {{ productos.length === 0 ? 'No hay productos registrados' : 'No se encontraron productos con ese criterio' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Resumen -->
          <div class="mt-3 pt-3 border-top">
            <div class="row">
              <div class="col-md-4">
                <small class="text-muted">
                  Mostrando {{ productosFiltrados.length }} de {{ productos.length }} productos
                </small>
              </div>
              <div class="col-md-4 text-center">
                <small class="text-muted">
                  Valor total inventario: <strong>{{ getValorTotalInventario().toFixed(2) }}</strong>
                </small>
              </div>
              <div class="col-md-4 text-end">
                <small class="text-muted">
                  Productos con stock bajo: <span class="badge bg-warning">{{ getProductosStockBajo().length }}</span>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-warning {
      background-color: rgba(255, 193, 7, 0.1);
    }
    .table-danger {
      background-color: rgba(220, 53, 69, 0.1);
    }
    .stock-bajo {
      color: #ffc107;
      font-weight: bold;
    }
    .stock-critico {
      color: #dc3545;
      font-weight: bold;
    }
    .stock-normal {
      color: #198754;
    }
  `]
})
export class ProductosListComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  loading = false;
  error: string | null = null;
  
  mostrandoFormulario = false;
  mostrandoAjusteStock = false;
  productoEditando: Producto | null = null;
  productoAjusteSeleccionado: Producto | null = null;
  
  terminoBusqueda = '';
  filtroStock = 'todos';
  ordenarPor = 'nombre';
  
  nuevoProducto = {
    codigo: '',
    nombre: '',
    descripcion: '',
    precioCompra: 0,
    precioVenta: 0,
    stock: 0,
    stockMinimo: 10
  };
  
  productoAjusteId = '';
  tipoAjuste = 'entrada';
  cantidadAjuste = 1;

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.loading = true;
    this.productoService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.productos = response.data;
          this.filtrarProductos();
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar productos: ' + err.message;
        this.loading = false;
      }
    });
  }

  mostrarFormulario(): void {
    this.mostrandoFormulario = true;
    this.mostrandoAjusteStock = false;
    this.productoEditando = null;
    this.resetFormulario();
  }

  mostrarAjusteStock(): void {
    this.mostrandoAjusteStock = true;
    this.mostrandoFormulario = false;
    this.resetAjusteStock();
  }

  editarProducto(producto: Producto): void {
    this.productoEditando = producto;
    this.nuevoProducto = { ...producto };
    this.mostrandoFormulario = true;
    this.mostrandoAjusteStock = false;
  }

  cancelarFormulario(): void {
    this.mostrandoFormulario = false;
    this.productoEditando = null;
    this.resetFormulario();
  }

  cancelarAjusteStock(): void {
    this.mostrandoAjusteStock = false;
    this.resetAjusteStock();
  }

  resetFormulario(): void {
    this.nuevoProducto = {
      codigo: '',
      nombre: '',
      descripcion: '',
      precioCompra: 0,
      precioVenta: 0,
      stock: 0,
      stockMinimo: 10
    };
  }

  resetAjusteStock(): void {
    this.productoAjusteId = '';
    this.tipoAjuste = 'entrada';
    this.cantidadAjuste = 1;
    this.productoAjusteSeleccionado = null;
  }

  guardarProducto(): void {
    if (this.productoEditando) {
      // Actualizar
      this.productoService.update(this.productoEditando.id, this.nuevoProducto).subscribe({
        next: (response) => {
          if (response.success) {
            const index = this.productos.findIndex(p => p.id === this.productoEditando!.id);
            if (index !== -1) {
              this.productos[index] = response.data;
            }
            this.filtrarProductos();
            this.cancelarFormulario();
            alert('Producto actualizado correctamente');
          }
        },
        error: (err) => {
          alert('Error al actualizar producto: ' + err.message);
        }
      });
    } else {
      // Crear nuevo
      this.productoService.create(this.nuevoProducto).subscribe({
        next: (response) => {
          if (response.success) {
            this.productos.push(response.data);
            this.filtrarProductos();
            this.cancelarFormulario();
            alert('Producto creado correctamente');
          }
        },
        error: (err) => {
          alert('Error al crear producto: ' + err.message);
        }
      });
    }
  }

  eliminarProducto(id: string): void {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.productoService.delete(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.productos = this.productos.filter(p => p.id !== id);
            this.filtrarProductos();
            alert('Producto eliminado correctamente');
          }
        },
        error: (err) => {
          alert('Error al eliminar producto: ' + err.message);
        }
      });
    }
  }

  usarEnOrden(producto: Producto): void {
    const productoData = {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precioVenta,
      stock: producto.stock
    };
    localStorage.setItem('productoSeleccionado', JSON.stringify(productoData));
    alert(`Producto "${producto.nombre}" listo para usar en nueva orden`);
  }

  seleccionarProductoAjuste(): void {
    this.productoAjusteSeleccionado = this.productos.find(p => p.id === this.productoAjusteId) || null;
  }

  realizarAjusteStock(): void {
    if (!this.productoAjusteId || !this.cantidadAjuste || this.cantidadAjuste <= 0) {
      alert('Complete todos los campos');
      return;
    }

    this.productoService.ajustarStock(this.productoAjusteId, this.cantidadAjuste, this.tipoAjuste as any).subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizar el producto en la lista
          const index = this.productos.findIndex(p => p.id === this.productoAjusteId);
          if (index !== -1) {
            this.productos[index] = response.data;
          }
          this.filtrarProductos();
          this.cancelarAjusteStock();
          alert('Stock ajustado correctamente');
        }
      },
      error: (err) => {
        alert('Error al ajustar stock: ' + err.message);
      }
    });
  }

  filtrarProductos(): void {
    let resultado = [...this.productos];
    
    // Filtrar por búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(producto =>
        producto.nombre.toLowerCase().includes(termino) ||
        producto.codigo.toLowerCase().includes(termino) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(termino))
      );
    }
    
    // Filtrar por stock
    switch (this.filtroStock) {
      case 'bajo':
        resultado = resultado.filter(p => 
          p.stockMinimo && p.stock <= p.stockMinimo && p.stock > 0
        );
        break;
      case 'sin':
        resultado = resultado.filter(p => p.stock === 0);
        break;
      case 'disponible':
        resultado = resultado.filter(p => p.stock > 0);
        break;
    }
    
    this.productosFiltrados = resultado;
    this.ordenarProductos();
  }

  ordenarProductos(): void {
    switch (this.ordenarPor) {
      case 'nombre':
        this.productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'stockAsc':
        this.productosFiltrados.sort((a, b) => a.stock - b.stock);
        break;
      case 'stockDesc':
        this.productosFiltrados.sort((a, b) => b.stock - a.stock);
        break;
      case 'precioAsc':
        this.productosFiltrados.sort((a, b) => a.precioVenta - b.precioVenta);
        break;
    }
  }

  calcularMargen(): number {
    if (this.nuevoProducto.precioCompra <= 0) return 0;
    return ((this.nuevoProducto.precioVenta - this.nuevoProducto.precioCompra) / this.nuevoProducto.precioCompra) * 100;
  }

  calcularGanancia(): number {
    return this.nuevoProducto.precioVenta - this.nuevoProducto.precioCompra;
  }

  calcularStockFuturo(): number {
    if (!this.productoAjusteSeleccionado) return 0;
    return this.tipoAjuste === 'entrada' 
      ? this.productoAjusteSeleccionado.stock + this.cantidadAjuste
      : this.productoAjusteSeleccionado.stock - this.cantidadAjuste;
  }

  getStockAlertClass(): string {
    const stockFuturo = this.calcularStockFuturo();
    const stockMinimo = this.productoAjusteSeleccionado?.stockMinimo || 10;
    
    if (stockFuturo <= 0) return 'alert alert-danger';
    if (stockFuturo <= stockMinimo) return 'alert alert-warning';
    return 'alert alert-success';
  }

  getRowClass(producto: Producto): string {
    if (producto.stock === 0) return 'table-danger';
    if (producto.stockMinimo && producto.stock <= producto.stockMinimo) return 'table-warning';
    return '';
  }

  getStockClass(producto: Producto): string {
    if (producto.stock === 0) return 'stock-critico';
    if (producto.stockMinimo && producto.stock <= producto.stockMinimo) return 'stock-bajo';
    return 'stock-normal';
  }

  getEstadoBadgeClass(producto: Producto): string {
    if (producto.stock === 0) return 'bg-danger';
    if (producto.stockMinimo && producto.stock <= producto.stockMinimo) return 'bg-warning';
    return 'bg-success';
  }

  getEstadoTexto(producto: Producto): string {
    if (producto.stock === 0) return 'Agotado';
    if (producto.stockMinimo && producto.stock <= producto.stockMinimo) return 'Stock Bajo';
    return 'Disponible';
  }

  getValorTotalInventario(): number {
    return this.productosFiltrados.reduce((total, producto) => 
      total + (producto.precioCompra * producto.stock), 0
    );
  }

  getProductosStockBajo(): Producto[] {
    return this.productos.filter(p => 
      p.stockMinimo && p.stock <= p.stockMinimo && p.stock > 0
    );
  }
}