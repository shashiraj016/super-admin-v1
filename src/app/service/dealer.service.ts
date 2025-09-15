// dealer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DealerService {
  private apiUrl =
    'https://api.prod.smartassistapp.in/api/superAdmin/dashboard/summary?type=DAY';

  constructor(private http: HttpClient) {}

  getDealers(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}
