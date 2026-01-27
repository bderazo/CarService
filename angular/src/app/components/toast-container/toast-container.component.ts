import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Toast } from '../../services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1050">
      <div *ngFor="let toast of toasts" 
           class="toast show" 
           role="alert" 
           [ngClass]="getToastClass(toast)">
        <div class="toast-header">
          <i [class]="getToastIcon(toast) + ' me-2'"></i>
          <strong class="me-auto">{{ toast.title }}</strong>
          <small class="text-muted">ahora</small>
          <button type="button" class="btn-close" (click)="removeToast(toast.id)"></button>
        </div>
        <div class="toast-body">
          {{ toast.message }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast {
      min-width: 300px;
      margin-bottom: 10px;
    }
  `]
})
export class ToastContainerComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.toasts = this.notificationService.getToasts();
  }

  getToastClass(toast: Toast): string {
    switch (toast.type) {
      case 'success': return 'border-success';
      case 'error': return 'border-danger';
      case 'warning': return 'border-warning';
      case 'info': return 'border-info';
      default: return '';
    }
  }

  getToastIcon(toast: Toast): string {
    switch (toast.type) {
      case 'success': return 'fas fa-check-circle text-success';
      case 'error': return 'fas fa-exclamation-circle text-danger';
      case 'warning': return 'fas fa-exclamation-triangle text-warning';
      case 'info': return 'fas fa-info-circle text-info';
      default: return 'fas fa-bell';
    }
  }

  removeToast(id: number): void {
    this.notificationService.removeToast(id);
  }
}