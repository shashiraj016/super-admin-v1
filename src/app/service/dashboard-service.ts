// // import { Injectable } from '@angular/core';
// // import { HttpClient, HttpHeaders } from '@angular/common/http';
// // import { Observable } from 'rxjs';

// // @Injectable({ providedIn: 'root' })
// // export class DashboardService {
// //   private baseUrl = 'https://uat.smartassistapp.in/api/superAdmin/dashboard';

// //   constructor(private http: HttpClient) {}

// //   getDealerActivities(type: 'MTD' | 'QTD' | 'YTD'): Observable<any> {
// //     // Get token from session storage
// //     const sessionToken = sessionStorage.getItem('token'); // Replace 'token' with your actual key
// //     console.log('Session Token:', sessionToken);

// //     // Set headers with Authorization Bearer token
// //     const headers = new HttpHeaders({
// //       Authorization: `Bearer ${sessionToken}`,
// //     });

// //     // Send GET request with headers
// //     return this.http.get(`${this.baseUrl}/view-activities?type=${type}`, {
// //       headers,
// //     });
// //   }
// // }

// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class DashboardService {
//   private baseUrl = 'https://uat.smartassistapp.in/api/superAdmin/dashboard';

//   constructor(private http: HttpClient) {}

//   // Existing method for MTD/QTD/YTD
//   getDealerActivities(type: 'MTD' | 'QTD' | 'YTD'): Observable<any> {
//     const sessionToken = sessionStorage.getItem('token');
//     console.log('Session Token:', sessionToken);

//     const headers = new HttpHeaders({
//       Authorization: `Bearer ${sessionToken}`,
//     });

//     return this.http.get(`${this.baseUrl}/view-activities?type=${type}`, {
//       headers,
//     });
//   }

//   // ✅ New method for custom date range
//   getDealerActivitiesCustom(
//     startDate: string,
//     endDate: string,
//     type?: 'MTD' | 'QTD' | 'YTD' // optional, no default
//   ): Observable<any> {
//     const sessionToken = sessionStorage.getItem('token');
//     const headers = new HttpHeaders({
//       Authorization: `Bearer ${sessionToken}`,
//     });

//     // Use the passed type or default to 'MTD' if nothing is passed
//     const filterType = type || 'MTD';

//     const url = `${this.baseUrl}/view-activities?type=${filterType}&start_date=${startDate}&end_date=${endDate}`;
//     return this.http.get(url, { headers });
//   }
// }

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private baseUrl = 'https://uat.smartassistapp.in/api/superAdmin/dashboard';

  constructor(private http: HttpClient) {}

  // Updated method for MTD/QTD/YTD using NoSM API
  getDealerActivities(type: 'MTD' | 'QTD' | 'YTD'): Observable<any> {
    const sessionToken = sessionStorage.getItem('token');
    // console.log('Session Token:', sessionToken);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionToken}`,
    });

    // Use NoSM API for MTD/QTD/YTD
    let url = `${this.baseUrl}/NoSM?type=${type}`;
    return this.http.get(url, { headers });
  }

  // Updated method for custom date range using NoSM API
  getDealerActivitiesCustom(
    startDate: string,
    endDate: string,
    type?: 'MTD' | 'QTD' | 'YTD'
  ): Observable<any> {
    const sessionToken = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionToken}`,
    });

    const filterType = type || 'MTD';
    // Use NoSM API with custom date range
    const url = `${this.baseUrl}/NoSM?type=${filterType}&start_date=${startDate}&end_date=${endDate}`;
    return this.http.get(url, { headers });
  }
  getNoSMUsers(
    dealerId: string,
    type: 'MTD' | 'QTD' | 'YTD' = 'MTD'
  ): Observable<any> {
    const sessionToken = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionToken}`,
    });

    return this.http.get(
      `${this.baseUrl}/NoSM?dealer_id=${dealerId}&type=${type}`,
      { headers }
    );
  }
}
