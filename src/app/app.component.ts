import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'smartAssists';
}


// import { Component, OnInit } from '@angular/core';
// import { Router, RouterOutlet } from '@angular/router';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [RouterOutlet], // RouterOutlet is needed for routing
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.css'],
// })
// export class AppComponent implements OnInit {
//   title = 'smartAssists';

//   constructor(private router: Router) {}
//   ngOnInit(): void {
//     // Only run in browser
//     if (typeof document !== 'undefined') {
//       const token = this.getCookie('token');

//       if (token) {
//         // Navigate to dashboard if token exists
//         this.router
//           .navigate(['/Admin/dashboard'])
//           .catch((err) => console.error(err));
//       } else {
//         // Navigate to login if no token
//         this.router.navigate(['/login']).catch((err) => console.error(err));
//       }
//     }
//   }

//   // Helper function to read a cookie
//   private getCookie(name: string): string | null {
//     if (typeof document === 'undefined') return null; // prevent SSR error

//     const nameEQ = name + '=';
//     const ca = document.cookie.split(';');
//     for (let i = 0; i < ca.length; i++) {
//       let c = ca[i].trim();
//       if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
//     }
//     return null;
//   }

//   // Helper function to read a cookie
  
// }
