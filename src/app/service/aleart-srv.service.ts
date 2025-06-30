import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AleartSrvService {
  private confirmationSubject = new Subject<boolean>();

  confirm(message: string): Observable<boolean> {
    const isConfirmed = window.confirm(message); // Replace with a custom modal for better UI
    this.confirmationSubject.next(isConfirmed);
    return this.confirmationSubject.asObservable();
  }

  showAlert(type: 'success' | 'danger' | 'info' | 'warning', message: string): void {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed-top m-3`;
    alertDiv.innerHTML = `
      <span class="alert-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
        </svg>
      </span>
      <strong>${type.charAt(0).toUpperCase() + type.slice(1)}!</strong> ${message}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span>&times;</span>
      </button>
    `;
    document.body.appendChild(alertDiv);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      alertDiv.classList.remove('show');
      alertDiv.remove();
    }, 1000);
  }
}
