import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toasts: Toast[] = [];
  private nextId = 1;

  getToasts(): Toast[] {
    return this.toasts;
  }

  showSuccess(title: string, message: string, duration = 3000): void {
    this.showToast('success', title, message, duration);
  }

  showError(title: string, message: string, duration = 5000): void {
    this.showToast('error', title, message, duration);
  }

  showWarning(title: string, message: string, duration = 4000): void {
    this.showToast('warning', title, message, duration);
  }

  showInfo(title: string, message: string, duration = 3000): void {
    this.showToast('info', title, message, duration);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  private showToast(type: ToastType, title: string, message: string, duration: number): void {
    const toast: Toast = {
      id: this.nextId++,
      type,
      title,
      message,
      duration
    };

    this.toasts.push(toast);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(toast.id);
    }, duration);
  }
}