import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // Check if `sessionStorage` is available
  private isSessionStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  }

  getItem(key: string): string | null {
    return this.isSessionStorageAvailable() ? sessionStorage.getItem(key) : null;
  }

  setItem(key: string, value: string): void {
    if (this.isSessionStorageAvailable()) {
      sessionStorage.setItem(key, value);
    }
  }

  removeItem(key: string): void {
    if (this.isSessionStorageAvailable()) {
      sessionStorage.removeItem(key);
    }
  }

  clear(): void {
    if (this.isSessionStorageAvailable()) {
      sessionStorage.clear();
    }
  }
}
