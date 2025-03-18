// import { Injectable } from '@angular/core';
// import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree,Router } from '@angular/router';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthGuard implements CanActivate {
//   constructor(private router: Router) { }
  
  
//   canActivate(
//     route: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
//       const token = localStorage.getItem('token');
//       console.log(token)
//       if (!token) {
//         this.router.navigate(['../']);
//         return false;
//       }
//     return true;
//   }
  
// }

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    // Check if running in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    // Safely access sessionStorage
    const token = this.getToken();

    if (!token) {
      this.router.navigate(['']);
      return false;
    }

    try {
      const tokenData = this.decodeToken(token);
      const isExpired = tokenData.exp * 1000 < Date.now();

      if (isExpired) {
        this.removeToken();
        this.router.navigate(['']);
        return false;
      }

     //  Optional: Role-based check if needed
      if (route.data['roles']) {
        const userRoles = tokenData.roles || [];
        const requiredRoles = route.data['roles'];

        if (!this.checkRoles(userRoles, requiredRoles)) {
          this.router.navigate(['']);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.removeToken();
      this.router.navigate(['']);
      return false;
    }
  }

  // Safely get token
  private getToken(): string | null {
    try {
      return typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('token')
        : null;
    } catch (error) {
      console.error('Error accessing token:', error);
      return null;
    }
  }

  // Safely remove token
  private removeToken(): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Token decoding error:', error);
      throw error;
    }
  }

  private checkRoles(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}