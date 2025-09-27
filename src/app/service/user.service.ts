import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    const token = sessionStorage.getItem('token'); // or localStorage, based on your auth

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any>(
      'https://api.prod.smartassistapp.in/api/superAdmin/show-profile',
      { headers }
    );
    // 🔁 Replace with your real API URL
  }
}
