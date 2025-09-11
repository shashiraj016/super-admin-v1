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
import { HttpClient } from '@angular/common/http';
import { DealerDropdown, Kpi, PSUser } from '../../model/interface/master';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [SharedModule, DashboardComponent, SidebarComponent, FormsModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.css',
})
export class OverviewComponent implements OnInit {
  selectedTab: string = 'dashboard';
  isSidebarOpen = true;
  selectedDealer: string = 'all'; // default value
  selectedPS: string = 'all'; // default value
  models: any[] = [];
  isUserDropdownOpen = false;
  mobileMenuOpen = false;

  selectedFilter: string = 'DAY';
  newInquiryKpi: Kpi | null = null; // <-- declare it here
  aggregatedMetrics: any = null;
  efforts: any = {};
  productivity: any = {};
  activePS: any = {};
  otherKpis: any = {};
  overallEfforts = 0;
  showLogoutConfirm = false;

  overallProductivity = 0;
  selectedModel: string = 'all';
  showUserDropdown = false;

  dealers: DealerDropdown[] = [];
  users: PSUser[] = []; // ✅ use PSUser[]
  menuOpen = false;

  constructor(
    private sidebarService: SidebarService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadDealers();
    // this.fetchSummary();

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
    } else if (url.includes('/Admin/trend-chart')) {
      this.selectedTab = 'trend-chart';
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
        } else if (event.urlAfterRedirects.includes('/Admin/trend-chart')) {
          this.selectedTab = 'trend-chart';
        }
      });
  }

  onFilterChange(filter: string) {
    console.log('Filter selected:', filter);
    this.loadDealers(filter); // 🔹 reload API with selected filter
    this.selectedFilter = filter;
    // this.fetchSummary();
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
  resetFilters(): void {
    // reset UI selections
    this.selectedFilter = 'all';
    this.selectedDealer = 'all';
    this.selectedPS = 'all';
    this.selectedModel = 'all';

    console.log('Filters reset ->', {
      filter: this.selectedFilter,
      dealer: this.selectedDealer,
      ps: this.selectedPS,
      model: this.selectedModel,
    });

    // reload data using API default (if you want to call API)
    // use defaultApiType because backend may not accept 'all'
    // this.loadDealers(this.defaultApiType);
    // OR if your API accepts a "no filter" mode, use:
    // this.loadDealers(this.selectedFilter);
  }
  // getKpiByName(
  //   dealer: any,
  //   category: 'efforts' | 'productivity' | 'otherKpis',
  //   kpiName: string
  // ): Kpi | null {
  //   const kpisObj = dealer.aggregatedMetrics?.[category] || dealer[category];
  //   if (!kpisObj) return null;

  //   return kpisObj[kpiName] || null;
  // }
  getKpiByName(
    dealer: any,
    category: 'efforts' | 'productivity' | 'otherKpis',
    kpiName: string
  ): Kpi | null {
    if (!dealer) return null;

    // Prioritize dealer-level KPI first
    const kpisObj = dealer[category] || dealer.aggregatedMetrics?.[category];

    if (!kpisObj) {
      console.warn(`No KPIs found for category "${category}"`, dealer);
      return null;
    }

    const kpi = kpisObj[kpiName];
    if (!kpi) {
      console.warn(
        `KPI "${kpiName}" not found in category "${category}"`,
        kpisObj
      );
      return null;
    }

    return kpi;
  }

  // 🔹 Load dealers and extract New Inquiry KPI
  loadDealers(type: string = 'DAY') {
    const apiUrl =
      'https://uat.smartassistapp.in/api/superAdmin/dashboard/summary';
    const token = localStorage.getItem('token');

    this.http
      .get<any>(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
        params: { type },
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            // 🔹 Dealers
            if (res.data.dealers) {
              this.dealers = res.data.dealers.map((d: any) => ({
                dealer_id: d.dealer_id,
                dealer_name: d.dealer_name,
                efforts: d.efforts,
                productivity: d.productivity, // <-- add this
                otherKpis: d.otherKpis, // <-- add this
                aggregatedMetrics: d.aggregatedMetrics,
              }));
              console.log('Dealers loaded:', this.dealers);
            }

            // 🔹 Users (PS)
            this.users = res.data.dealers.flatMap(
              (d: any) =>
                d.users?.map((u: any) => ({
                  user_id: u.user_id,
                  name: u.name,
                  dealer_id: d.dealer_id,
                })) || []
            );
            console.log('Users (PS) loaded:', this.users);

            // 🔹 Models
            if (res.data.models) {
              this.models = res.data.models
                .filter((m: any) => m.model_name)
                .map((m: any) => ({
                  model: m.model,
                  model_name: m.model_name,
                }));
              console.log('Models loaded:', this.models);
            }

            // 🔹 Extract aggregated New Inquiry KPI (first dealer or aggregatedMetrics)
            if (res.data.aggregatedMetrics?.efforts?.['New Inquiry']) {
              this.newInquiryKpi =
                res.data.aggregatedMetrics.efforts['New Inquiry'];
            } else if (this.dealers.length > 0) {
              // fallback: take first dealer's New Inquiry
              this.newInquiryKpi = this.getKpiByName(
                this.dealers[0],
                'efforts',
                'New Inquiry'
              );
            }

            console.log('New Inquiry KPI:', this.newInquiryKpi);
          }
        },
        error: (err) =>
          console.error('Error fetching dealers/users/models', err),
      });
  }
  loadDashboard(type: string) {
    const apiUrl =
      'https://uat.smartassistapp.in/api/superAdmin/dashboard/summary';
    const token = localStorage.getItem('token');

    this.http
      .get<any>(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
        params: { type },
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data?.aggregatedMetrics) {
            const metrics = res.data.aggregatedMetrics;

            // Assign to cards
            this.efforts = metrics.efforts || {};
            this.productivity = metrics.productivity || {};
            this.activePS = metrics.activePS || {};
            this.otherKpis = metrics.otherKpis || {};

            // Example: calculate average overall %
            if (this.efforts) {
              const vals = Object.values(this.efforts) as any[];
              this.overallEfforts = vals.length
                ? Math.round(
                    vals.reduce((s, e) => s + e.progress, 0) / vals.length
                  )
                : 0;
            }
            if (this.productivity) {
              const vals = Object.values(this.productivity) as any[];
              this.overallProductivity = vals.length
                ? Math.round(
                    vals.reduce((s, e) => s + e.progress, 0) / vals.length
                  )
                : 0;
            }
          }
        },
        error: (err) => console.error('Error loading dashboard', err),
      });
  }
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleUserDropdown(event: Event) {
    event.stopPropagation();
    console.log('Dropdown toggled');
    this.showUserDropdown = !this.showUserDropdown;
  }

  confirmLogout(event: Event) {
    event.stopPropagation();
    console.log('Logout clicked'); // should appear first
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      console.log('Logging out...');
      this.logout();
    }
  }

  logout() {
    // Optional: Show confirm before logging out
    // if (!window.confirm('Are you sure you want to logout?')) return;

    localStorage.removeItem('token'); // remove auth token
    console.log('Logged out');
    this.router.navigate(['/login']); // redirect to login page
  }
}
