// // import { Injectable } from '@angular/core';
// // import { HttpClient, HttpHeaders } from '@angular/common/http';
// // import { Observable } from 'rxjs';

// // @Injectable({ providedIn: 'root' })
// // export class DashboardService {
// //   private baseUrl = 'https://uat.smartassistapp.in/api/

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
//   private baseUrl = 'https://uat.smartassistapp.in/api/

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
type ApiFilter =
  | 'DAY'
  | 'Yesterday'
  | 'Last Week'
  | 'This Week'
  | 'This month'
  | 'Last month'
  | 'This Quarter '
  | 'Last Quarter'
  | 'Last 6 Months'
  | 'This Year'
  | 'Lifetime'
  | 'CUSTOM';
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
  // getNoSMUsers(
  //   dealerId: string,
  //   type: 'DAY' | 'MTD' | 'QTD' | 'YTD' = 'MTD'
  // ): Observable<any> {
  //   const sessionToken = sessionStorage.getItem('token');
  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${sessionToken}`,
  //   });

  //   return this.http.get(
  //     `${this.baseUrl}/NoSM?dealer_id=${dealerId}&type=${type}`,
  //     { headers }
  //   );
  // }
  // getNoSMUsers(
  //   dealerId: string,
  //   type: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM' = 'MTD',
  //   startDate?: string,
  //   endDate?: string
  // ): Observable<any> {
  //   const sessionToken = sessionStorage.getItem('token');
  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${sessionToken}`,
  //   });

  //   let url = `${this.baseUrl}/NoSM?dealer_id=${dealerId}&type=${type}`;

  //   // Append custom date range if type is CUSTOM
  //   if (type === 'CUSTOM' && startDate && endDate) {
  //     url += `&start_date=${startDate}&end_date=${endDate}`;
  //   }

  //   return this.http.get(url, { headers });
  // }
  getNoSMUsers(
    dealerId: string,
    type:
      | 'TODAY'
      | 'YESTERDAY'
      | 'LAST_WEEK'
      | 'WEEK'
      | 'MTD'
      | 'LAST_MONTH'
      | 'QTD'
      | 'LAST_QUARTER'
      | 'SIX_MONTH'
      | 'YTD'
      | 'LIFETIME'
      | 'CUSTOM' = 'MTD',
    startDate?: string,
    endDate?: string
  ): Observable<any> {
    const sessionToken = sessionStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionToken}`,
    });

    let url = `${this.baseUrl}/NoSM?dealer_id=${dealerId}&type=${type}`;

    if (type === 'CUSTOM' && startDate && endDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    }

    return this.http.get(url, { headers });
  }

  getDealers(
    filter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM',
    token: string
  ) {
    return this.http.get(
      `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?type=${filter}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }
  // getDealersByCustomDate(startDate: string, endDate: string, token: string) {
  //   return this.http.get(
  //     `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?start_date=${startDate}&end_date=${endDate}`,
  //     { headers: { Authorization: `Bearer ${token}` } }
  //   );
  // }
  getDealersByCustomDate(
    startDate: string,
    endDate: string,
    token: string,
    dealerId?: string
  ) {
    let url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?start_date=${startDate}&end_date=${endDate}`;

    if (dealerId) {
      url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?dealer_id=${dealerId}&start_date=${startDate}&end_date=${endDate}`;
    }

    return this.http.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  getDealerUsers(dealerId: string, type: string, token: string) {
    const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?dealer_id=${dealerId}&type=${type}`;
    return this.http.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  getCustomUsers(
    dealerId: string,

    startDate: string,
    endDate: string,
    token: string
  ) {
    const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?dealer_id=${dealerId}&start_date=${startDate}&end_date=${endDate}`;
    return this.http.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  getKpiData(token: string, type: string = 'MTD') {
    const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?type=${type}`;
    return this.http.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
