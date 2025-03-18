import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

 

@Injectable({
  providedIn: 'root',
})
export class RouteTrackingServiceService {
  private previousIdSubject = new BehaviorSubject<string | null>(null);

  previousId$ = this.previousIdSubject.asObservable();

  // Store the current ID before navigation
  private currentId: string | null = null;

  constructor(private router: Router) {
    this.initRouteTracking();
  }

  private initRouteTracking() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const currentUrl = this.router.url;
        const pathSegments = currentUrl.split('/');

        // Adjust the index based on your route structure
        const currentId = pathSegments[3] || null;

        // Set the previous ID to the current ID before updating
        if (this.currentId) {
          this.setPreviousId(this.currentId);
        }

        // Update current ID
        this.currentId = currentId;
      });
  }

  setPreviousId(id: string) {
    localStorage.setItem('previousId', id);
    this.previousIdSubject.next(id);
  }

  getPreviousId(): string | null {
    return localStorage.getItem('previousId');
  }

  clearPreviousId() {
    localStorage.removeItem('previousId');
    this.previousIdSubject.next(null);
  }
}
