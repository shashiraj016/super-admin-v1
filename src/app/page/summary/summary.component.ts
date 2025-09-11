import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { SidebarService } from '../../service/sidebar.service';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators'; // ✅ make sure this is imported
import { HttpClient } from '@angular/common/http';
import {
  DealerDropdown,
  Kpi,
  Model,
  OtherKpi,
  ProductivityKpi,
  PSUser,
} from '../../model/interface/master';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

interface KPI {
  name: string;
  value: number;
  target: number;
  progress: number;
  achieved: boolean;
  growth: number;
}
@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [SharedModule, DashboardComponent, SidebarComponent, FormsModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css',
})
export class SummaryComponent implements OnInit {
  selectedTab: string = 'dashboard';
  isSidebarOpen = true;
  dropdownOpen = false;
  modelDropdownOpen = false;
  selectedModels: string[] = [];

  selectedDealer: string = 'all'; // default value
  selectedPS: string = 'all'; // default value
  models: any[] = [];
  selectedFilter: string = 'DAY';
  // efforts: EffortKPI[] = [];
  selectedDealers: string[] = [];
  allDealers: any[] = []; // full list for dropdown
  @ViewChild('dropdown') dropdown!: ElementRef;
  @ViewChild('modelDropdown') modelDropdown!: ElementRef;

  @ViewChild('psDropdown') psDropdown!: ElementRef; // PS dropdown
  aggregatedMetrics: any;
  efforts: Kpi[] = [];
  productivity: ProductivityKpi[] = []; // ✅ Added this property
  otherKpis: OtherKpi[] = []; // ✅ corrected casing
  activePSKpis: OtherKpi[] = []; // For "By Test Drive" KPI
  selectedPSs: string[] = []; // for multiple PS selection
  dropdownPSOpen: boolean = false;
  selectedModel: string = 'all';
  dealers: DealerDropdown[] = [];
  users: PSUser[] = []; // ✅ use PSUser[]
  categoryPercentages: {
    Efforts: number;
    Productivity: number;
    'Other KPIs': number;
  } = { Efforts: 0, Productivity: 0, 'Other KPIs': 0 };
  constructor(
    private sidebarService: SidebarService,
    private router: Router,
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize efforts as empty
    this.efforts = [];

    // Load dealers and fetch KPI data dynamically
    this.loadDealers();

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

  // onFilterChange(filter: string) {
  //   console.log('Filter selected:', filter);
  //   this.loadDealers(filter); // 🔹 reload API with selected filter
  // }
  getOverallProgress(): number {
    if (!this.efforts || this.efforts.length === 0) return 0;
    const totalProgress = this.efforts.reduce(
      (sum, kpi) => sum + kpi.achieved,
      0
    );
    return Math.round(totalProgress / this.efforts.length);
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
    this.selectedFilter = 'DAY'; // Reset filter to default DAY
    this.selectedDealers = []; // Unselect all dealers
    this.selectedPSs = []; // Unselect all PS
    this.selectedModels = []; // Unselect all models

    // Load dealers with default filter and all dealers

    this.loadDealers(this.selectedFilter, this.selectedDealer);
  }
  getKpis(dealer: any): Kpi[] {
    if (!dealer.aggregatedMetrics) return [];

    const { efforts, productivity, otherKpis } = dealer.aggregatedMetrics;

    const allKpis: Kpi[] = [
      ...(Object.values(efforts || {}) as Kpi[]),
      ...(Object.values(productivity || {}) as Kpi[]),
      ...(Object.values(otherKpis || {}) as Kpi[]),
    ];

    return allKpis;
  }
  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    console.log('Filter changed:', filter);
    this.loadDealers(this.selectedFilter, this.selectedDealer);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  onDealerToggle(dealer_id: string, event: Event) {
    event.stopPropagation(); // prevent dropdown from closing on click

    if (this.selectedDealers.includes(dealer_id)) {
      this.selectedDealers = this.selectedDealers.filter(
        (d) => d !== dealer_id
      );
    } else {
      this.selectedDealers.push(dealer_id);
    }

    // Call API with selected dealers
    const dealerIds = this.selectedDealers.length
      ? this.selectedDealers.join(',')
      : 'all';
    this.loadDealers(this.selectedFilter, dealerIds);
  }

  // onDealerChange(dealer_id: string, event: any) {
  //   if (event.target.checked) {
  //     this.selectedDealers.push(dealer_id);
  //   } else {
  //     this.selectedDealers = this.selectedDealers.filter(
  //       (id) => id !== dealer_id
  //     );
  //   }

  //   // Pass array directly
  //   const dealersToSend = this.selectedDealers.length
  //     ? [...this.selectedDealers]
  //     : 'all';
  //   this.loadDealers(this.selectedFilter, dealersToSend);
  // }
  onDealerChange(dealer_id: string, event: any) {
    if (event.target.checked) {
      this.selectedDealers.push(dealer_id);
    } else {
      this.selectedDealers = this.selectedDealers.filter(
        (id) => id !== dealer_id
      );
    }

    const dealerParam =
      this.selectedDealers.length > 0 ? this.selectedDealers.join(',') : 'all';

    const psParam =
      this.selectedPSs.length > 0 ? this.selectedPSs.join(',') : 'all';

    const modelParam =
      this.selectedModel && this.selectedModel !== 'all'
        ? this.selectedModel
        : '';

    this.loadDealers(this.selectedFilter, dealerParam, psParam, modelParam);
  }

  // loadDealers(
  //   type: string = 'DAY',
  //   dealer_ids: string | string[] = 'all', // accept array or string
  //   user_id: string = 'all',
  //   model: string = ''
  // ) {
  //   const apiUrl =
  //     'https://uat.smartassistapp.in/api/superAdmin/dashboard/summary';
  //   const token = localStorage.getItem('token');

  //   let query = '';

  //   // Handle multiple dealer IDs
  //   if (dealer_ids && dealer_ids !== 'all') {
  //     if (Array.isArray(dealer_ids)) {
  //       query += `dealer_ids=${dealer_ids.join(',')}&`;
  //     } else {
  //       query += `dealer_ids=${dealer_ids}&`;
  //     }
  //   }

  //   if (user_id && user_id !== 'all') query += `user_id=${user_id}&`;
  //   if (model) query += `model=${encodeURIComponent(model)}&`;
  //   query += `type=${type}`;

  //   console.log('API call URL:', `${apiUrl}?${query}`);

  //   this.http
  //     .get<any>(`${apiUrl}?${query}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     })
  //     .subscribe({
  //       next: (res) => {
  //         console.log('Full API response:', res);

  //         this.allDealers = res.data?.dealers || [];

  //         // Filter dealers if single or multiple selected
  //         if (dealer_ids === 'all') {
  //           this.dealers = [...this.allDealers];
  //         } else {
  //           const selectedIds = Array.isArray(dealer_ids)
  //             ? dealer_ids
  //             : [dealer_ids];
  //           this.dealers = this.allDealers.filter((d) =>
  //             selectedIds.includes(d.dealer_id)
  //           );
  //         }

  //         this.users = this.dealers.flatMap((d: any) => d.users || []) || [];
  //         this.models = res.data?.models || [];

  //         // KPI updates
  //         if (user_id && user_id !== 'all' && this.users[0]) {
  //           const user = this.users.find((u) => u.user_id === user_id);
  //           this.efforts = Object.values(user?.efforts || {});
  //           this.productivity = Object.values(user?.productivity || {});
  //           const otherKpisArray = Object.values(user?.otherKpis || {});
  //           this.activePSKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name === 'By Test Drive'
  //           );
  //           this.otherKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name !== 'By Test Drive'
  //           );
  //         } else if (this.dealers[0]) {
  //           this.efforts = Object.values(this.dealers[0].efforts || {});
  //           this.productivity = Object.values(
  //             this.dealers[0].productivity || {}
  //           );
  //           const otherKpisArray = Object.values(
  //             this.dealers[0].otherKpis || {}
  //           );
  //           this.activePSKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name === 'By Test Drive'
  //           );
  //           this.otherKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name !== 'By Test Drive'
  //           );
  //         }

  //         this.cd.detectChanges();
  //       },
  //       error: (err) => {
  //         console.error('Error fetching data', err);
  //         this.efforts = [];
  //         this.productivity = [];
  //         this.activePSKpis = [];
  //         this.otherKpis = [];
  //       },
  //     });
  // }
  // loadDealers(
  //   type: string = 'DAY',
  //   dealer_ids: string | string[] = 'all', // accept array or string
  //   user_id: string | string[] | null = null, // allow null for PS
  //   model: string = '' // car model
  // ) {
  //   const apiUrl =
  //     'https://uat.smartassistapp.in/api/superAdmin/dashboard/summary';
  //   const token = localStorage.getItem('token');

  //   let query = '';

  //   // Only add dealer_ids if provided
  //   if (dealer_ids && dealer_ids !== 'all') {
  //     if (Array.isArray(dealer_ids)) {
  //       query += `dealer_ids=${dealer_ids.join(',')}&`;
  //     } else {
  //       query += `dealer_ids=${dealer_ids}&`;
  //       dealer_ids = dealer_ids.split(','); // convert string to array for filtering later
  //     }
  //   }

  //   // Only add user_id if provided
  //   if (user_id && user_id !== 'all') {
  //     if (Array.isArray(user_id)) {
  //       query += `user_id=${user_id.join(',')}&`;
  //     } else {
  //       query += `user_id=${user_id}&`;
  //       user_id = user_id.split(','); // convert string to array for filtering later
  //     }
  //   }

  //   // Type parameter (always required)
  //   query += `type=${type}`;

  //   // Only add modal if provided
  //   if (model && model !== 'all') {
  //     query += `&modal=${encodeURIComponent(model)}`;
  //   }

  //   console.log('API call URL:', `${apiUrl}?${query}`);

  //   this.http
  //     .get<any>(`${apiUrl}?${query}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     })
  //     .subscribe({
  //       next: (res) => {
  //         console.log('Full API response:', res);

  //         // Keep allDealers untouched for the dropdown
  //         if (!this.allDealers || this.allDealers.length === 0) {
  //           this.allDealers = res.dealers || [];
  //         }

  //         const apiModels = res.models || [];
  //         this.models = apiModels.map((m: Model) => ({
  //           ...m,
  //           selected: this.selectedModels.includes(m.model),
  //         }));

  //         const selectedDealerIds = Array.isArray(dealer_ids)
  //           ? dealer_ids
  //           : [dealer_ids];
  //         const selectedPSIds =
  //           !user_id || user_id === 'all'
  //             ? []
  //             : Array.isArray(user_id)
  //             ? user_id
  //             : user_id.split(',');

  //         // Filter dealers only for metrics/calculations
  //         const filteredDealers =
  //           dealer_ids === 'all'
  //             ? [...this.allDealers]
  //             : this.allDealers.filter((d) =>
  //                 selectedDealerIds.includes(d.dealerId || d.dealer_id)
  //               );

  //         this.dealers = filteredDealers;

  //         // Build PS list dynamically
  //         this.users =
  //           dealer_ids === 'all'
  //             ? this.allDealers.flatMap((d: any) => d.users || [])
  //             : filteredDealers.flatMap((d: any) => d.users || []);

  //         // ✅ Case 0: If no dealer/user filter applied → use dealerAggregatedMetrics directly
  //         if (
  //           (dealer_ids === 'all' || selectedDealerIds.length === 0) &&
  //           (user_id === null ||
  //             user_id === 'all' ||
  //             selectedPSIds.length === 0) &&
  //           res.dealerAggregatedMetrics
  //         ) {
  //           const agg = res.dealerAggregatedMetrics;

  //           this.efforts = Object.values(agg.efforts || {}) as Kpi[];
  //           this.productivity = Object.values(
  //             agg.productivity || {}
  //           ) as ProductivityKpi[];

  //           const otherKpisArray = Object.values(
  //             agg.otherKpis || {}
  //           ) as OtherKpi[];

  //           this.activePSKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name === 'By Test Drive'
  //           );
  //           this.otherKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name !== 'By Test Drive'
  //           );
  //           this.categoryPercentages = agg.categoryPercentages || {
  //             Efforts: 0,
  //             Productivity: 0,
  //             'Other KPIs': 0,
  //           };
  //         }

  //         const dealerSums = res.data?.dealerSums || {};

  //         // Case 1: Multiple dealers selected
  //         if (selectedDealerIds.length > 1 && dealerSums?.aggregatedMetrics) {
  //           const agg = dealerSums.aggregatedMetrics;
  //           this.efforts = Object.values(agg.efforts || {}) as any[];
  //           this.productivity = Object.values(agg.productivity || []) as any[];
  //           const otherKpisArray = Object.values(agg.otherKpis || []) as any[];
  //           this.activePSKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name === 'By Test Drive'
  //           );
  //           this.otherKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name !== 'By Test Drive'
  //           );
  //           this.categoryPercentages = agg.categoryPercentages || {
  //             Efforts: 0,
  //             Productivity: 0,
  //             'Other KPIs': 0,
  //           };
  //         }
  //         // Case 2: Multiple PS selected
  //         // else if (
  //         //   selectedPSIds.length > 1 &&
  //         //   dealerSums?.aggregatedMetricsForPS
  //         // ) {
  //         //   const agg = dealerSums.aggregatedMetricsForPS;
  //         //   this.efforts = Object.values(agg.efforts || {}) as any[];
  //         //   this.productivity = Object.values(agg.productivity || []) as any[];
  //         //   const otherKpisArray = Object.values(agg.otherKpis || []) as any[];
  //         //   this.activePSKpis = otherKpisArray.filter(
  //         //     (kpi) => kpi.name === 'By Test Drive'
  //         //   );
  //         //   this.otherKpis = otherKpisArray.filter(
  //         //     (kpi) => kpi.name !== 'By Test Drive'
  //         //   );
  //         //   this.categoryPercentages = agg.categoryPercentages || {
  //         //     Efforts: 0,
  //         //     Productivity: 0,
  //         //     'Other KPIs': 0,
  //         //   };
  //         // }
  //         else if (selectedPSIds.length >= 1) {
  //           const agg = res.userAggregatedMetrics;

  //           this.efforts = Object.values(agg.efforts || {}) as Kpi[];
  //           this.productivity = Object.values(
  //             agg.productivity || {}
  //           ) as ProductivityKpi[];
  //           const otherKpisArray = Object.values(
  //             agg.otherKpis || {}
  //           ) as OtherKpi[];

  //           this.activePSKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name === 'By Test Drive'
  //           );
  //           this.otherKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name !== 'By Test Drive'
  //           );

  //           this.categoryPercentages = agg.categoryPercentages || {
  //             Efforts: 0,
  //             Productivity: 0,
  //             'Other KPIs': 0,
  //           };
  //         }
  //         // Case 3: Single PS selected
  //         else if (selectedPSIds.length === 1 && this.users[0]) {
  //           const user = this.users.find((u) => u.user_id === selectedPSIds[0]);
  //           this.efforts = Object.values(user?.efforts || {});
  //           this.productivity = Object.values(user?.productivity || {});
  //           const otherKpisArray = Object.values(user?.otherKpis || {});
  //           this.activePSKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name === 'By Test Drive'
  //           );
  //           this.otherKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name !== 'By Test Drive'
  //           );
  //         }
  //         // Case 4: Single dealer fallback
  //         else if (this.dealers[0]) {
  //           this.efforts = Object.values(this.dealers[0].efforts || {});
  //           this.productivity = Object.values(
  //             this.dealers[0].productivity || {}
  //           );
  //           const otherKpisArray = Object.values(
  //             this.dealers[0].otherKpis || {}
  //           );
  //           this.activePSKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name === 'By Test Drive'
  //           );
  //           this.otherKpis = otherKpisArray.filter(
  //             (kpi) => kpi.name !== 'By Test Drive'
  //           );
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Error fetching data', err);
  //         this.efforts = [];
  //         this.productivity = [];
  //         this.activePSKpis = [];
  //         this.otherKpis = [];
  //       },
  //     });
  // }
  loadDealers(
    type: string = 'DAY',
    dealer_ids: string | string[] = 'all',
    user_id: string | string[] | null = null,
    model: string = ''
  ) {
    const apiUrl =
      'https://uat.smartassistapp.in/api/superAdmin/dashboard/summary';
    const token = localStorage.getItem('token');

    let query = '';

    // Dealer IDs
    if (dealer_ids && dealer_ids !== 'all') {
      if (Array.isArray(dealer_ids)) {
        query += `dealer_ids=${dealer_ids.join(',')}&`;
      } else {
        query += `dealer_ids=${dealer_ids}&`;
        dealer_ids = dealer_ids.split(',');
      }
    }

    // User IDs (PS)
    if (user_id && user_id !== 'all') {
      if (Array.isArray(user_id)) {
        query += `user_id=${user_id.join(',')}&`;
      } else {
        query += `user_id=${user_id}&`;
        user_id = user_id.split(',');
      }
    }

    // Type
    query += `type=${type}`;

    // Model
    if (model && model !== 'all') {
      query += `&modal=${encodeURIComponent(model)}`;
    }

    console.log('API call URL:', `${apiUrl}?${query}`);

    this.http
      .get<any>(`${apiUrl}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (res) => {
          console.log('Full API response:', res);

          if (!this.allDealers || this.allDealers.length === 0) {
            this.allDealers = res.dealers || [];
          }

          const apiModels = res.models || [];
          this.models = apiModels.map((m: Model) => ({
            ...m,
            selected: this.selectedModels.includes(m.model),
          }));

          const selectedDealerIds = Array.isArray(dealer_ids)
            ? dealer_ids
            : [dealer_ids];
          const selectedPSIds =
            !user_id || user_id === 'all'
              ? []
              : Array.isArray(user_id)
              ? user_id
              : user_id.split(',');

          const filteredDealers =
            dealer_ids === 'all'
              ? [...this.allDealers]
              : this.allDealers.filter((d) =>
                  selectedDealerIds.includes(d.dealerId || d.dealer_id)
                );

          this.dealers = filteredDealers;

          this.users =
            dealer_ids === 'all'
              ? this.allDealers.flatMap((d: any) => d.users || [])
              : filteredDealers.flatMap((d: any) => d.users || []);

          // Determine which aggregated metrics to use
          let aggMetrics: any = null;

          const hasSelectedDealers =
            selectedDealerIds.length > 0 && selectedDealerIds[0] !== 'all';
          const hasSelectedPS = selectedPSIds.length > 0;
          const hasSelectedModel = model && model !== 'all';

          if (!hasSelectedDealers && !hasSelectedPS && !hasSelectedModel) {
            // Only type filter applied → dealerAggregatedMetrics
            aggMetrics = res.dealerAggregatedMetrics;
          } else if (hasSelectedDealers && !hasSelectedPS) {
            // Single or multiple dealers → selectedDealerAggregatedMetrics
            aggMetrics = res.selectedDealerAggregatedMetrics;
          } else if (hasSelectedPS) {
            // Single or multiple PS (with or without dealers) → selectedUserAggregatedMetrics
            aggMetrics = res.selectedUserAggregatedMetrics;
          } else if (
            !hasSelectedDealers &&
            !hasSelectedPS &&
            hasSelectedModel
          ) {
            // Only model selected → dealerAggregatedMetrics
            aggMetrics = res.dealerAggregatedMetrics;
          }

          if (!aggMetrics && this.dealers[0]) {
            aggMetrics = this.dealers[0]; // fallback
          }

          if (aggMetrics) {
            this.efforts = Object.values(aggMetrics.efforts || {}) as Kpi[];
            this.productivity = Object.values(
              aggMetrics.productivity || {}
            ) as ProductivityKpi[];
            const otherKpisArray = Object.values(
              aggMetrics.otherKpis || {}
            ) as OtherKpi[];
            this.activePSKpis = otherKpisArray.filter(
              (kpi) => kpi.name === 'By Test Drive'
            );
            this.otherKpis = otherKpisArray.filter(
              (kpi) => kpi.name !== 'By Test Drive'
            );
            this.categoryPercentages = aggMetrics.categoryPercentages || {
              Efforts: 0,
              Productivity: 0,
              'Other KPIs': 0,
            };
          }
        },
        error: (err) => {
          console.error('Error fetching data', err);
          this.efforts = [];
          this.productivity = [];
          this.activePSKpis = [];
          this.otherKpis = [];
          this.categoryPercentages = {
            Efforts: 0,
            Productivity: 0,
            'Other KPIs': 0,
          };
        },
      });
  }

  // onPSChange(ps_id: string, event: any) {
  //   if (event.target.checked) {
  //     this.selectedPSs.push(ps_id);
  //   } else {
  //     this.selectedPSs = this.selectedPSs.filter((id) => id !== ps_id);
  //   }

  //   // Convert arrays to comma-separated strings for API
  //   const dealerParam =
  //     this.selectedDealers.length > 0 ? this.selectedDealers.join(',') : 'all';
  //   const psParam =
  //     this.selectedPSs.length > 0 ? this.selectedPSs.join(',') : 'all';

  //   this.loadDealers(
  //     this.selectedFilter,
  //     dealerParam,
  //     psParam,
  //     this.selectedModel || ''
  //   );
  // }
  onPSChange(user_id: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedPSs.includes(user_id)) {
        this.selectedPSs.push(user_id);
      }
    } else {
      this.selectedPSs = this.selectedPSs.filter((id) => id !== user_id);
    }

    // mirror exactly onDealerChange logic
    const dealerParam =
      this.selectedDealers.length > 0 ? this.selectedDealers.join(',') : 'all';

    const psParam =
      this.selectedPSs.length > 0 ? this.selectedPSs.join(',') : 'all';

    const modelParam =
      this.selectedModel && this.selectedModel !== 'all'
        ? this.selectedModel
        : '';

    // call API
    this.loadDealers(this.selectedFilter, dealerParam, psParam, modelParam);
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const target = event.target as HTMLElement;

    // Close Model dropdown
    if (
      this.modelDropdownOpen &&
      this.modelDropdown &&
      !this.modelDropdown.nativeElement.contains(target)
    ) {
      this.modelDropdownOpen = false;
    }

    // Close Dealers dropdown
    if (
      this.dropdownOpen &&
      this.dropdown &&
      !this.dropdown.nativeElement.contains(target)
    ) {
      this.dropdownOpen = false;
    }

    // Close PS dropdown
    if (
      this.dropdownPSOpen &&
      this.psDropdown &&
      !this.psDropdown.nativeElement.contains(target)
    ) {
      this.dropdownPSOpen = false;
    }
  }
  // getProgressColor(value: number): string {
  //   if (value <= 50) return 'red';
  //   if (value <= 80) return 'amber'; // amber
  //   return 'green';
  // }
  getProgressColor(value: number): string {
    if (value <= 50) return '#fecaca'; // light red (like bg-red-200)
    if (value <= 80) return '#fde68a'; // light amber (like bg-amber-200)
    return '#bbf7d0'; // light green (like bg-green-200)
  }
  // For values 0 → 50%, it returns #fecaca
  // For values 51 → 80%, it returns #fde68a
  // For values 81% and above, it returns #bbf7d0

  getKpiColor(value: number): string {
    if (value <= 50) return 'red';
    if (value <= 80) return 'amber'; // amber
    return 'green';
  }
  //  You need to re-use the same logic:

  // onModelChange(model: string) {
  //   const selectedModel = model === 'all' ? '' : model;

  //   // Dealers array or 'all'
  //   const dealersToSend =
  //     Array.isArray(this.selectedDealers) && this.selectedDealers.length
  //       ? this.selectedDealers
  //       : 'all';

  //   // PS array or null if none selected
  //   const psToSend =
  //     Array.isArray(this.selectedPS) && this.selectedPS.length
  //       ? this.selectedPS
  //       : null; // ✅ Pass null instead of 'all'

  //   console.log(
  //     'onModelChange → dealerIds:',
  //     dealersToSend,
  //     'psIds:',
  //     psToSend,
  //     'model:',
  //     selectedModel
  //   );

  //   this.loadDealers(
  //     this.selectedFilter,
  //     dealersToSend,
  //     psToSend, // ✅ now correctly omitted if null
  //     selectedModel
  //   );
  // }
  // When an individual model checkbox is toggled
  onModelChange(modelName: string) {
    const index = this.selectedModels.indexOf(modelName);

    if (index > -1) {
      // Remove the model if already selected
      this.selectedModels.splice(index, 1);
    } else {
      // Add the model if not selected
      this.selectedModels.push(modelName);
    }

    // Update the `selected` property in models array
    this.models = this.models.map((m) => ({
      ...m,
      selected: this.selectedModels.includes(m.model),
    }));

    // Call API with updated selection
    this.callAPI();
  }
  getSelectedDealerNames(): string {
    if (!this.selectedDealers || this.selectedDealers.length === 0) {
      return 'All Dealers';
    }
    return this.selectedDealers.map((d) => this.getDealerName(d)).join(', ');
  }
  abs(val: number): number {
    return Math.abs(val);
  }
  // Keep your existing getDealerName
  toggleModelDropdown() {
    this.modelDropdownOpen = !this.modelDropdownOpen;
  }
  toggleAllModels(event: any) {
    if (event.target.checked) {
      this.selectedModels = this.models.map((m) => m.model);
    } else {
      this.selectedModels = [];
    }

    this.callAPI();
  }

  // callAPI() {
  //   const modelParam = this.selectedModels.length
  //     ? this.selectedModels.join(',')
  //     : 'all';
  //   this.loadDealers('DAY', 'all', null, modelParam);
  // }
  callAPI() {
    const modelParam = this.selectedModels.length
      ? this.selectedModels.join(',')
      : 'all';

    const dealerParam =
      this.selectedDealers.length > 0 ? this.selectedDealers.join(',') : 'all';

    const psParam =
      this.selectedPSs.length > 0 ? this.selectedPSs.join(',') : 'all';

    this.loadDealers(this.selectedFilter, dealerParam, psParam, modelParam);
  }
  onCheckboxChange(event: any) {
    const dealerId = event.target.value;
    if (event.target.checked) {
      this.selectedDealers.push(dealerId);
    } else {
      this.selectedDealers = this.selectedDealers.filter((d) => d !== dealerId);
    }

    // Reload data for selected dealers
    const dealerParam =
      this.selectedDealers.length === 0
        ? 'all'
        : this.selectedDealers.join(',');
    this.loadDealers(this.selectedFilter, dealerParam);
  }
  getDealerName(id: string): string {
    const dealer = this.allDealers.find((d) => d.dealer_id === id);
    return dealer ? dealer.dealer_name : '';
  }
  isDealerSelected(dealer: any): boolean {
    return this.selectedDealers.includes(dealer.dealer_id);
  }
  toggleDealerSelection(dealer: any) {
    const dealerId = dealer.dealer_id;
    if (this.selectedDealers.includes(dealerId)) {
      // Remove if already selected
      this.selectedDealers = this.selectedDealers.filter((d) => d !== dealerId);
    } else {
      // Add if not selected
      this.selectedDealers.push(dealerId);
    }

    // Reload KPI data for selected dealers
    const dealerParam =
      this.selectedDealers.length === 0
        ? 'all'
        : this.selectedDealers.join(',');
    this.loadDealers(this.selectedFilter, dealerParam);
  }
  togglePSDropdown() {
    this.dropdownPSOpen = !this.dropdownPSOpen;
  }
}
