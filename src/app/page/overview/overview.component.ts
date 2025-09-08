// import { Component } from '@angular/core';
// import { RouterModule } from '@angular/router';
// import { SharedModule } from '../../shared/shared.module';
// import { DashboardComponent } from '../dashboard/dashboard.component';
// import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
// import { SidebarService } from '../../service/sidebar.service';

// @Component({
//   selector: 'app-overview',
//   standalone: true,
//   imports: [SharedModule, DashboardComponent, SidebarComponent],
//   templateUrl: './overview.component.html',
//   styleUrl: './overview.component.css',
// })
// export class OverviewComponent {
//   selectedTab: string = 'dashboard';

//   constructor(private sidebarService: SidebarService) {}

//   ngOnInit(): void {
//     this.sidebarService.isOpen$.subscribe((open) => {
//       this.isSidebarOpen = open;
//     });
//   }

//   isSidebarOpen = true;

//   toggleSidebar() {
//     // this.isSidebarOpen = !this.isSidebarOpen;
//     this.sidebarService.toggleSidebar();
//   }

//   selectTab(tab: string) {
//     this.selectedTab = tab;
//   }
// }

// overview.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { SidebarService } from '../../service/sidebar.service';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators'; // ✅ make sure this is imported

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [SharedModule, DashboardComponent, SidebarComponent],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent implements OnInit {
  selectedTab: string = 'dashboard';
  isSidebarOpen = true;

  constructor(private sidebarService: SidebarService, private router: Router) {}

  ngOnInit(): void {
    // Sidebar toggle
    this.sidebarService.isOpen$.subscribe((open) => {
      this.isSidebarOpen = open;
    });

    // Initialize selectedTab based on current URL
    const url = this.router.url;
    if (url.includes('/Admin/dashboard')) {
      this.selectedTab = 'dashboard';
    } else if (url.includes('/Admin/summary')) {
      this.selectedTab = 'summary';
    }

    // Listen to router changes
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {
        if (event.urlAfterRedirects.includes('/Admin/dashboard')) {
          this.selectedTab = 'dashboard';
        } else if (event.urlAfterRedirects.includes('/Admin/summary')) {
          this.selectedTab = 'summary';
        }
      });
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }
  // Check if current route is active
  isActive(route: string): boolean {
    return this.router.url.includes(`/Admin/${route}`);
  }
  navigateTo(route: string) {
    this.router.navigate(['/Admin', route]);
  }

  // Navigate to single dealer (if needed)
  navigateToSingleDealer(dealerId: string) {
    this.router.navigate(['/Admin/singleDealer', dealerId]);
  }
}
