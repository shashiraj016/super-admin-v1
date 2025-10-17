import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private toastr = inject(ToastrService);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');

    // Skip adding token for login or forgot password routes
    const isAuthRequest =
      req.url.includes('/login') ||
      req.url.includes('/forgot-pwd') ||
      req.url.includes('/verify-email') ||
      req.url.includes('/verify-otp');

    const authReq =
      !isAuthRequest && token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('❌ HTTP Error caught:', err.status, err.message);

        // Handle ONLY real 401s for logged-in users
        if (err.status === 401 && !isAuthRequest && token) {
          console.log('🚨 401 detected (Session Expired) → Logging out...');

          localStorage.clear();
          sessionStorage.clear();

          this.toastr.error(
            'Session expired. Please log in again.',
            'Session Expired',
            {
              timeOut: 3000,
              closeButton: true,
              progressBar: true,
            }
          );

          setTimeout(() => {
            this.router.navigate(['/login']).then(() => {
              window.location.reload();
            });
          }, 2000);
        }

        return throwError(() => err);
      })
    );
  }
}
