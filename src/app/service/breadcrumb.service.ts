// breadcrumb.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<Breadcrumb[]>([]);
  breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  private previousRouteSubject = new BehaviorSubject<string>('');
  previousRoute$ = this.previousRouteSubject.asObservable();

  updateBreadcrumbs(breadcrumbs: Breadcrumb[]) {
    this.breadcrumbsSubject.next(breadcrumbs);
  }

  setPreviousRoute(route: string) {
    this.previousRouteSubject.next(route);
  }
}
