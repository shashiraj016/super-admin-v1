import { CommonModule } from '@angular/common';
import {
  Component,
  AfterViewInit,
  OnInit,
  signal,
  WritableSignal,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { Router } from '@angular/router';

import { Chart, ChartType, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms'; // Add this import
import { NgCircleProgressModule } from 'ng-circle-progress'; // Import the circle progress module
import { Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
} from 'chart.js';
import { SidebarComponent } from '../../layout/sidebar/sidebar.component';
import { HeaderComponent } from '../../layout/header/header.component';
import { ContextService } from '../../service/context.service';
import { ApiResponse, Dealer } from '../../model/interface/master';
import { DashboardService } from '../../service/dashboard-service';
import { SharedService } from '../../service/shared.service';
// Register all chart components
Chart.register(...registerables);
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip
);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    NgCircleProgressModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements AfterViewInit, OnInit {
  // dashboardData: any;
  // displayedData = [
  //   {
  //     dealer_name: 'Sonali',
  //     dealer_code: 28,
  //     MTD: { value: 5 },
  //     QTD: { value: 8 },
  //     YTD: { value: 12 },
  //     value: 5,
  //     rank: 1,
  //   },
  //   {
  //     dealer_name: 'Mastafa',
  //     dealer_code: 30,
  //     MTD: { value: 3 },
  //     QTD: { value: 7 },
  //     YTD: { value: 10 },
  //     value: 3,
  //     rank: 2,
  //   },
  // ];

  dashboardMetrics: any = {
    totalLeads: 0,
    totalTestDrives: 0,
    totalOrders: 0,
    lostLeads: 0,
    cancellations: 0,
    netOrders: 0,
    retail: 0,
  };
  // activeAccordion: number | null = null; // store which accordion is open
  // dealers = [
  //   {
  //     dealer_name: 'Dealer 1',
  //     sms: [
  //       {
  //         sm_name: 'SM 1',
  //         ps: [{ ps_name: 'PS 1' }, { ps_name: 'PS 2' }],
  //       },
  //       {
  //         sm_name: 'SM 2',
  //         ps: [{ ps_name: 'PS 3' }],
  //       },
  //     ],
  //   },
  //   {
  //     dealer_name: 'Dealer 2',
  //     sms: [
  //       {
  //         sm_name: 'SM 3',
  //         ps: [{ ps_name: 'PS 4' }],
  //       },
  //     ],
  //   },
  // ];

  // NEW DESIGN CODE
  expandedDealer: any | null = null; // or better, create an interface for Dealer
  dealerUsers: any = {
    'Dealer One': [
      { name: 'User A', leads: 10, testDrives: 5, followups: 2 },
      { name: 'User B', leads: 15, testDrives: 7, followups: 3 },
    ],
    'Dealer Two': [
      { name: 'User C', leads: 8, testDrives: 4, followups: 2 },
      { name: 'User D', leads: 10, testDrives: 3, followups: 1 },
    ],
    'Dealer Three': [
      { name: 'User E', leads: 12, testDrives: 6, followups: 2 },
      { name: 'User F', leads: 18, testDrives: 9, followups: 4 },
    ],
  };
  currentPageMap: { [dealerId: string]: number } = {}; // track current page per dealer
  showAllSMs: { [dealerId: string]: boolean } = {};
  showCustomDatePicker = false;
  customStartDate: string = '';
  customEndDate: string = '';
  displayedDealers: any[] = [];
  itemsToShow: number = 10;
  expandedRow: string | null = null;

  totalLeads = signal<number>(0);
  totalTestDrives = signal<number>(0);
  totalOrders = signal<number>(0);
  prevLeads = signal<number>(0);
  prevTestDrives = signal<number>(0);
  prevOrders = signal<number>(0);
  selectedOption: string = 'leads-MTD'; // Default filter option
  testDrives: number = 0;
  displayedData: any[] = []; // To hold the data to display in the table
  filteredData: any[] = []; // Initially set as an empty array to avoid errors
  mtdTestDrives = signal<number>(0);
  qtdTestDrives = signal<number>(0);
  hoveredSM: string | null = null;
  loading = false; // Declare this in your component
  selectedDealer: any = null;
  ps1Data: any[] = [];
  ps2Data: any[] = [];
  pageSize = 20; // or any number you want
  selectedSection: 'activities' | 'callAnalysis' = 'activities';
  ytdTestDrives = signal<number>(0);
  loadingSM: boolean = false;
  psData: { [smId: string]: any[] } = {};
  showDetails = false;
  paginatedDealers: any[] = [];
  // dealerUsers: { [dealerId: string]: any[] } = {}; // store users per dealer
  dealerPSL: any = null;
  callLogsItemsToShow = 10;
  displayedCallLogs: any[] = [];
  showMoreCallLogsVisible = true;
  mtdOrders = signal<number>(0);
  qtdOrders = signal<number>(0);
  ytdOrders = signal<number>(0);
  selectedFilter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM' = 'MTD';
  dealerColors: string[] = [
    '#e6f2ff', // light blue
    '#f9f2ec', // light peach
    '#eaf7ea', // light green
    '#f3e8ff', // light purple
  ];
  // showAllSMs: { [dealerId: string]: boolean } = {};
  appliedStartDate: string | null = null;
  appliedEndDate: string | null = null;
  usersItemsToShow: number = 10;
  userItemsToShow: number = 10; // Initial number of users to show

  // Users to actually display
  displayedUsers: any[] = [];

  // Show More button visibility
  showMoreUsersVisible: boolean = false;
  mtdLeads = signal<number>(0);
  qtdLeads = signal<number>(0);
  currentLeads: number = 0;
  previousLeads: number = 0;
  changeLeads: number = 0;
  testDriveChange: number = 0;
  testDriveProgressValue: number = 0;
  testDriveStrokeColor: string = '#4CAF50';
  selectedCategory: string = 'leads';
  selectedDuration: string = 'MTD';
  // selectedOption: string = '';
  orderChange: number = 0;
  orderProgressValue: number = 0;
  loadingPS = false; // Add this property in your component class
  activeAccordion: string | null = null;
  // dealerUsers: { [dealerId: string]: any[] } = {}; // store users per dealer
  showAll = false;

  orderStrokeColor: string = '#4CAF50';
  currentTestDrives: number = 0;
  previousTestDrives: number = 0;
  selectedDealerId: string | null = null;
  dealerSMS: { [key: string]: any[] } = {};
  salesManagers: { [dealerId: string]: any[] } = {}; // Store SMs by dealer ID
  loadingSMs: { [dealerId: string]: boolean } = {}; // Loading state for SMs
  // expandedRow: number | null = null;
  Math = Math;
  itemsPerPagedeal: number = 10; // or 4
  currentDisplayCount: number = 10; // Track current number of items shown (initialize in ngOnInit)

  orders: number = 0;
  currentOrders: number = 0;
  previousOrders: number = 0;
  ytdLeads = signal<number>(0);
  selectedPeriod: string = 'MTD'; // default selected period
  dashboardData: any = {}; // empty at start
  leads: number = 0;
  selectedSM: any = null;
  isSidebarOpen = true;
  paginatedDealerskpis: any[] = [];
  currentIndex = 0;
  // selectedDealerId: number | null = null;   // 👈 NEW
  displayedDealerUsers: any[] = [];

  // loadingPS: boolean = false;
  // Current page tracking properties
  currentDealerPage: number = 1;
  // totalDealerPages: number = 5;
  dealersPerPage: number = 5;
  expandedItems: { [key: string]: boolean } = {};
  // In your component
  filterOptions = ['MTD', 'QTD', 'YTD'] as const; // 'as const' makes type readonly ['MTD','QTD','YTD']
  expandedRows: boolean[] = [false, false, false, false, false, false];
  showMoreActive = false; // Button toggle state

  // testDrives: number = 0;
  // orders: number = 0;
  rankings: any = {};
  sidebarTestDrives = signal<number>(0);
  sidebarOrders = signal<number>(0);
  sidebarLeads = signal<number>(0);
  private pieChartInstance: any;
  leadsData: any = {}; // Holds your backend data
  chart: any; // Reference to the chart
  miniChart: any;
  hoveredPS: number | null = null;
  activeDealer: string | null = null;
  activeSM: string | null = null;
  activePS: string | null = null;
  incrementSize = 10; // Items to add/remove each time
  selectedTime: string = '1M'; // 👈 default selected

  graphPath: string = ''; // To store the SVG path data
  leadsChange: number = 0;
  testDrivesChange: number = 0;
  ordersChange: number = 0;
  // currentLeads: number = 0; // Dynamically set this from your API
  // previousLeads: number = 0; // Dynamically set this from your API
  change: number = 0; // Initialize with a default value, such as 0
  doughnutChart: any;
  // progressValue: number = 75; // Set a default value (e.g., 75 for 75%)
  animatedValue: number = 0; // Initial value
  // itemsPerPage: number = 10;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  paginatedData: any[] = [];
  activeFilter: 'MTD' | 'QTD' | 'YTD' = 'MTD'; // set default selection
  dealers: any[] = []; // Full dealer list from API
  currentdealerPage: number = 1;
  itemsPerdealerPage: number = 5;
  // selectedOption: string = 'leads'; // Default selected option to show 'leads' data
  maxValue: number = 0;
  selectedFilterPS: 'MTD' | 'QTD' | 'YTD' = 'MTD'; // default
  // customStartDate: string | null = null;
  // customEndDate: string | null = null;
  // currentLeads: number = 0;
  // previousLeads: number = 0;
  changeDisplay: number = 0;
  progressValue: number = 0;
  strokeColor: string = 'red'; // green by default
  // selectedPeriod: string = 'MTD'; // for MTD, QTD, YTD dropdown
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private context: ContextService,
    private router: Router,
    private dashboardService: DashboardService,
    private sharedService: SharedService,
    private ngZone: NgZone
  ) {}
  data: any; // To hold your data
  apiUrl: string = 'https://uat.smartassistapp.in/api/superAdmin/dashbaordNew';

  // dealersData: any[] = []; // Array to hold the dealer data
  // ngOnInit() {
  //   this.selectedFilter = 'MTD';
  //   this.fetchDashboardData('MTD');

  //   this.maxValue =
  //     Math.max(...this.displayedData.map((item) => item.value)) || 1;
  //   this.fetchData();
  //   this.updateDataBasedOnSelection();
  //   this.applyFilter(this.selectedFilter);

  //   setTimeout(() => {
  //     this.animatedValue = this.progressValue;
  //   }, 100);
  // }
  ngOnInit() {
    this.updateDisplayedDealers();

    this.currentDisplayCount = this.itemsPerPage;

    this.loadInitialDealers();
    this.selectedFilter = 'MTD';
    this.fetchDealers(this.selectedFilter); // this.updatePaginatedDealers();
    this.fetchSuperAdminDashboard('MTD'); // or 'QTD', 'MTD' based on dropdown

    this.fetchDashboardDataForTopCards(this.selectedFilter);

    this.onDropdownChange(); // Auto-trigger on page load with default values

    this.context.onSideBarClick$.next({
      role: 'dashboard',
      pageTitle: 'Dashboard',
    });

    this.selectedFilter = 'MTD';
    this.fetchDashboardData('MTD');

    // this.updateDataBasedOnSelection();
    this.applyFilter(this.selectedFilter);

    setTimeout(() => {
      this.animatedValue = this.progressValue;
    }, 100);
  }

  initializeDisplay() {
    this.currentDisplayCount = this.itemsPerPage;
    this.updatePaginatedDealers();
  }
  toggleShow() {
    if (this.currentDisplayCount >= this.dealers.length) {
      // Show Less → reset to first 10
      this.currentDisplayCount = this.itemsPerPage;
    } else {
      // Show More → show next 10
      this.currentDisplayCount = Math.min(
        this.dealers.length,
        this.currentDisplayCount + this.incrementSize
      );
    }
    this.updatePaginatedDealers();
  }

  showLess() {
    this.currentDisplayCount = this.itemsPerPage;
    this.updateDisplayedDealers();
  }

  // Getter methods for template conditions
  get canShowMore(): boolean {
    return this.currentDisplayCount < this.dealers.length;
  }

  get canShowLess(): boolean {
    return this.currentDisplayCount > this.itemsPerPage;
  }

  get isShowingAll(): boolean {
    return this.currentDisplayCount >= this.dealers.length;
  }
  // Helper to determine button text
  get showButtonText() {
    return this.currentDisplayCount >= this.dealers.length
      ? 'Show Less'
      : 'Show More';
  }

  toggleExpand(index: number): void {
    this.expandedRows[index] = !this.expandedRows[index];
    console.log(`Order ${index + 1} expanded:`, this.expandedRows[index]);
  }
  getStrokeColor(change: number): string {
    const value = Number(change); // Ensure type
    if (value > 0) return '#4CAF50'; // green
    if (value < 0) return '#F44336'; // red
    return '#9E9E9E'; // grey
  }

  // toggleDealer(dealer: any) {
  //   if (dealer) {
  //     this.expandedDealer = dealer.dealer_name;
  //     this.dealerUsers[dealer.dealer_id] = dealer.users || [];
  //   } else {
  //     this.expandedDealer = null;
  //   }
  // }
  // toggleDealer(
  //   dealer: any | null,
  //   filter: 'MTD' | 'QTD' | 'YTD' = this.selectedFilter
  // ): void {
  //   if (dealer) {
  //     this.expandedDealer = dealer; // store selected dealer
  //     this.selectedDealerId = dealer.dealer_id;

  //     if (this.selectedDealerId) {
  //       // Fetch users for selected dealer
  //       this.dashboardService
  //         .getNoSMUsers(this.selectedDealerId, filter)
  //         .subscribe({
  //           next: (res: any) => {
  //             if (res.status === 200 && res.data?.dealers?.length > 0) {
  //               // Extract the users from the selected dealer
  //               this.dealerUsers = res.data.dealers[0].user_list || [];
  //             } else {
  //               this.dealerUsers = [];
  //             }
  //           },
  //           error: (err: any) => {
  //             console.error('Error fetching dealer users:', err);
  //             this.dealerUsers = [];
  //           },
  //         });
  //     }
  //   } else {
  //     // Back to dealer list
  //     this.expandedDealer = null;
  //     this.selectedDealerId = null;
  //     this.dealerUsers = [];
  //   }
  // }
  // toggleCustomDatePicker(): void {
  //   this.showCustomDatePicker = !this.showCustomDatePicker;
  // }
  toggleCustomDatePicker() {
    if (!this.showCustomDatePicker) {
      // Picker is opening → reset inputs
      this.customStartDate = '';
      this.customEndDate = '';
    }
    this.showCustomDatePicker = !this.showCustomDatePicker;
  }

  // toggleDealer(
  //   dealer: any | null,
  //   filter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM' = this
  //     .selectedFilter
  // ): void {
  //   if (dealer) {
  //     this.expandedDealer = dealer; // store selected dealer
  //     this.selectedDealerId = dealer.dealer_id;

  //     // 🔹 Notify shared service about selected dealer
  //     this.sharedService.setSelectedDealer(dealer);

  //     if (this.selectedDealerId) {
  //       // Fetch users for selected dealer with the selected filter
  //       this.dashboardService
  //         .getNoSMUsers(this.selectedDealerId, filter)
  //         .subscribe({
  //           next: (res: any) => {
  //             if (res.status === 200 && res.data?.dealers?.length > 0) {
  //               // Extract the users from the selected dealer
  //               this.dealerUsers = res.data.dealers[0].user_list || [];
  //             } else {
  //               this.dealerUsers = [];
  //             }
  //           },
  //           error: (err: any) => {
  //             console.error('Error fetching dealer users:', err);
  //             this.dealerUsers = [];
  //           },
  //         });
  //     }
  //   } else {
  //     // Back to dealer list
  //     this.expandedDealer = null;
  //     this.selectedDealerId = null;
  //     this.dealerUsers = [];

  //     // 🔹 Reset shared service when going back
  //     this.sharedService.setSelectedDealer(null);
  //   }
  // }

  // toggleShowSMs(dealerId: string) {
  //   this.showAllSMs[dealerId] = !this.showAllSMs[dealerId];
  // }
  // Add this method to your component class
  toggleDealer(
    dealer: any | null,
    filter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM' = this
      .selectedFilter
  ): void {
    if (dealer) {
      this.expandedDealer = dealer; // store selected dealer
      this.selectedDealerId = dealer.dealer_id;

      // Notify shared service about selected dealer
      this.sharedService.setSelectedDealer(dealer);

      if (this.selectedDealerId) {
        // Fetch users for selected dealer with the selected filter
        this.dashboardService
          .getNoSMUsers(this.selectedDealerId, filter)
          .subscribe({
            next: (res: any) => {
              if (res.status === 200 && res.data?.dealers?.length > 0) {
                // ✅ Find the dealer matching selectedDealerId
                const selectedDealer = res.data.dealers.find(
                  (d: any) => d.dealer_id === this.selectedDealerId
                );

                // Populate users for the selected dealer
                this.dealerUsers = selectedDealer?.user_list || [];
              } else {
                this.dealerUsers = [];
              }
            },
            error: (err: any) => {
              console.error('Error fetching dealer users:', err);
              this.dealerUsers = [];
            },
          });
      }
    } else {
      // Back to dealer list
      this.expandedDealer = null;
      this.selectedDealerId = null;
      this.dealerUsers = [];

      // Reset shared service when going back
      this.sharedService.setSelectedDealer(null);
    }
  }

  getDealerBackground(index: number): string {
    const backgrounds = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple to Blue
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink to Red
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Light Blue to Cyan
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green to Turquoise
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink to Yellow
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Mint to Pink
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Coral to Light Pink
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple (repeats)
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink (repeats)
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue (repeats)
    ];

    return backgrounds[index % backgrounds.length];
  }

  // get progressValue(): number {
  //   return Math.min(Math.abs(this.changeLeads), 100);
  // }
  private mapTimeToApi(time: string): 'MTD' | 'QTD' | 'YTD' {
    switch (time) {
      case '1M':
        return 'MTD'; // Month-To-Date
      case 'QTD':
        return 'QTD'; // Quarter-To-Date
      case '1Y':
        return 'YTD'; // Year-To-Date
      default:
        return 'MTD'; // fallback
    }
  }
  onTimeChange(time: string) {
    this.selectedTime = time;

    const token = sessionStorage.getItem('authToken');
    if (!token) {
      console.error('No token found in sessionStorage!');
      return;
    }

    // map UI value -> API value
    const apiType = this.mapTimeToApi(time);

    this.dashboardService.getDealers(apiType, token).subscribe((res: any) => {
      console.log('API Response:', res);
      if (res.status === 200 && res.data?.dealers) {
        this.dealers = res.data.dealers;
        this.expandedDealer = null;
        this.selectedDealerId = null;
      } else {
        this.dealers = [];
      }
    });
  }

  ngAfterViewInit() {
    // Ensure pie chart is created only once on initial load or when data changes
    if (this.totalTestDrives() && this.totalOrders()) {
      this.createDoughnutChart(this.totalTestDrives(), this.totalOrders()); // 👈 changed
    }
    this.initLineChart();
  }
  onFilterClick(filter: 'MTD' | 'QTD' | 'YTD') {}
  // ✅ Dynamically updates values
  // onFilterChange(filter: string): void {
  //   this.selectedFilter = filter;

  //   // Fetch top cards (KPI data)
  //   this.fetchDashboardDataForTopCards(filter);

  //   // Fetch dealer KPIs
  //   this.fetchSuperAdminDashboard(filter);
  //   this.fetchDealers('MTD');
  // }
  toggleShowAllSMs(dealerId: string) {
    this.showAllSMs[dealerId] = !this.showAllSMs[dealerId];
  }
  // onFilterChange(
  //   filter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM'
  // ): void {
  //   this.selectedFilter = filter;
  //   this.fetchDealers(filter);
  //   const activeSMId = this.activeSM; // remember the currently active SM

  //   // Fetch top cards (KPI data)
  //   this.fetchDashboardDataForTopCards(filter);

  //   // Fetch dealer KPIs
  //   this.fetchSuperAdminDashboard(filter);

  //   // Refresh SMs for any open dealer divs
  //   // if (this.selectedDealerId) {
  //   //   this.fetchDealerSMs(this.selectedDealerId, filter);

  //   //   // Restore previously active SM if it still exists
  //   //   const smList = this.dealerSMS[this.selectedDealerId] || [];
  //   //   if (!smList.some((s) => s.sm_id === activeSMId)) {
  //   //     this.activeSM = null; // previously active SM no longer exists
  //   //   } else {
  //   //     this.activeSM = activeSMId; // keep it open
  //   //   }
  //   // }
  // }
  // Updated fetchDealerSMs to accept previous active SM
  // onFilterChange(
  //   filter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM'
  // ): void {
  //   this.selectedFilter = filter;
  //   const activeSMId = this.activeSM; // remember the currently active SM

  //   if (this.selectedDealerId) {
  //     // ✅ We are on a dealer user page → fetch only that dealer's users
  //     this.dashboardService
  //       .getNoSMUsers(this.selectedDealerId, filter)
  //       .subscribe({
  //         next: (res: any) => {
  //           const selectedDealer = res.data.dealers.find(
  //             (d: any) => d.dealer_id === this.selectedDealerId
  //           );
  //           this.dealerUsers = selectedDealer?.user_list || [];
  //           this.displayedDealerUsers = this.dealerUsers.slice(0, 10); // for pagination

  //           // Restore previously active SM if it still exists
  //           const smList = this.selectedDealerId
  //             ? this.dealerSMS[this.selectedDealerId] || []
  //             : [];
  //           if (!smList.some((s) => s.sm_id === activeSMId)) {
  //             this.activeSM = null;
  //           } else {
  //             this.activeSM = activeSMId;
  //           }
  //         },
  //         error: (err: any) => {
  //           console.error('Error fetching dealer users:', err);
  //           this.dealerUsers = [];
  //           this.displayedDealerUsers = [];
  //         },
  //       });
  //   } else {
  //     // ✅ We are on the main dealer dashboard → fetch all dealers
  //     this.fetchDealers(filter);
  //     this.fetchDashboardDataForTopCards(filter);
  //     this.fetchSuperAdminDashboard(filter);
  //   }
  // }
  onFilterChange(
    filter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM'
  ): void {
    this.selectedFilter = filter;
    const activeSMId = this.activeSM; // remember the currently active SM

    if (filter === 'CUSTOM') {
      // Do nothing immediately, wait for Apply button to call fetchCustomDate()
      return;
    }

    if (this.selectedDealerId) {
      // ✅ Dealer user page → fetch only that dealer's users
      this.dashboardService
        .getNoSMUsers(this.selectedDealerId, filter)
        .subscribe({
          next: (res: any) => {
            const selectedDealer = res.data.dealers.find(
              (d: any) => d.dealer_id === this.selectedDealerId
            );
            this.dealerUsers = selectedDealer?.user_list || [];
            this.displayedDealerUsers = this.dealerUsers.slice(0, 10); // for pagination

            // Restore previously active SM if it still exists
            const smList = this.selectedDealerId
              ? this.dealerSMS[this.selectedDealerId] || []
              : [];
            if (!smList.some((s) => s.sm_id === activeSMId)) {
              this.activeSM = null;
            } else {
              this.activeSM = activeSMId;
            }
          },
          error: (err: any) => {
            console.error('Error fetching dealer users:', err);
            this.dealerUsers = [];
            this.displayedDealerUsers = [];
          },
        });
    } else {
      // ✅ Main dealer dashboard → fetch all dealers
      this.fetchDealers(filter);
      this.fetchDashboardDataForTopCards(filter);
      this.fetchSuperAdminDashboard(filter);
    }
  }
  fetchDealerSMs(
    dealerId: string,
    type: 'MTD' | 'QTD' | 'YTD',
    activeSMId?: string
  ) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?dealer_id=${dealerId}&type=${type}`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        this.dealerSMS[dealerId] =
          res?.status === 200 && res.data?.dealers?.[0]?.user_list
            ? res.data.dealers[0].user_list
            : [];

        // Restore previously active SM if it still exists
        if (
          activeSMId &&
          this.dealerSMS[dealerId].some((s) => s.user_id === activeSMId)
        ) {
          this.activeSM = activeSMId;
        } else {
          this.activeSM = null;
        }
      },
      error: (err) => {
        console.error('Failed to fetch SM data:', err);
        this.dealerSMS[dealerId] = [];
        this.activeSM = null;
      },
    });
  }
  fetchPS(smId: string, dealerId: string) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${this.selectedFilter}&dealer_id=${dealerId}&sm_id=${smId}`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        this.psData[smId] = res?.data?.ps || [];
      },
      error: (err) => {
        console.error('Failed to fetch PS data:', err);
        this.psData[smId] = [];
      },
    });
  }

  // loadInitialDealers() {
  //   this.paginatedDealers = this.dealers.slice(0, this.itemsPerPage);
  //   this.showAll = false;
  // }

  // toggleShow() {
  //   if (this.showAll) {
  //     // Show less
  //     this.paginatedDealers = this.dealers.slice(0, this.itemsPerPage);
  //     this.showAll = false;
  //   } else {
  //     // Show all
  //     this.paginatedDealers = [...this.dealers];
  //     this.showAll = true;
  //   }
  // }
  // toggleDetails(i: number) {
  //   this.expandedRow = this.expandedRow === i ? null : i;
  // }
  // toggleDetails(i: number, dealer: any) {
  //   if (this.expandedRow === i) {
  //     this.expandedRow = null; // Close if already open
  //     return;
  //   }

  //   this.expandedRow = i;

  //   // Fetch users only if not already fetched
  //   if (!this.dealerUsers[dealer.dealer_id]) {
  //     this.dashboardService.getNoSMUsers(dealer.dealer_id, 'MTD').subscribe({
  //       next: (res: any) => {
  //         if (res.status === 200) {
  //           const users = res.data?.dealers?.[0]?.user_list || [];
  //           this.dealerUsers[dealer.dealer_id] = users;
  //         } else {
  //           this.dealerUsers[dealer.dealer_id] = [];
  //         }
  //       },
  //       error: () => {
  //         this.dealerUsers[dealer.dealer_id] = [];
  //       },
  //     });
  //   }
  // }

  updateProgressAndColor(change: number) {
    this.changeDisplay = change;
    this.progressValue = this.getProgressFromChange(change);
    this.strokeColor = this.getStrokeColor(change);
    this.cdr.detectChanges(); // ✅ trigger update
  }
  selectSection(section: 'activities' | 'callAnalysis'): void {
    this.selectedSection = section;
  }
  // ✅ Maps change to 0–100%
  getProgressFromChange(change: number): number {
    const maxValue = 500;
    return Math.min((Math.abs(change) / maxValue) * 100, 100);
  }
  isDealerDataAvailable(dealer: any): boolean {
    return dealer?.dealer_id && this.dealerSMS[dealer.dealer_id]?.length > 0;
  }
  getDashOffset(progressValue: number): number {
    return 100 - progressValue;
  }
  // get paginatedDealers(): any[] {
  //   const start = (this.currentdealerPage - 1) * this.itemsPerdealerPage;
  //   return this.dealers.slice(start, start + this.itemsPerdealerPage);
  // }

  get totalDealerPages(): number {
    return Math.ceil(this.dealers.length / this.itemsPerdealerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalDealerPages) {
      this.currentdealerPage = page;
    }
  }

  getShowingRange(): string {
    const start = (this.currentdealerPage - 1) * this.itemsPerdealerPage + 1;
    const end = Math.min(
      this.currentdealerPage * this.itemsPerdealerPage,
      this.dealers.length
    );
    return `Showing ${start} – ${end} of ${this.dealers.length} dealers`;
  }
  goBack() {
    this.selectedSM = null;
    this.selectedDealer = null;
    this.selectedDealerId = null; // Also reset this if you're using it
  }
  // onDropdownChange() {
  //   if (this.selectedCategory && this.selectedDuration) {
  //     this.selectedOption = `${this.selectedCategory}-${this.selectedDuration}`;
  //     this.updateDataBasedOnSelection();
  //   }
  // }
  getDealerColor(index: number): string {
    return this.dealerColors[index % this.dealerColors.length];
  }
  toggleAccordion(id: string): void {
    if (this.activeAccordion === id) {
      this.activeAccordion = null; // close if same accordion clicked
    } else {
      this.activeAccordion = id; // open new one
    }
  }
  // toggleDealer(id: string): void {
  //   this.activeDealer = this.activeDealer === id ? null : id;
  // }

  // DEALER PAGIANTOON
  get totalPagesdealer(): number {
    return Math.ceil(this.dealers.length / this.dealersPerPage);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
  get paginatedDealerskpi(): Dealer[] {
    const start = (this.currentPage - 1) * this.dealersPerPage;
    return this.dealers.slice(start, start + this.dealersPerPage);
  }
  get startEntry(): number {
    return (this.currentPage - 1) * this.dealersPerPage + 1;
  }

  get endEntry(): number {
    return Math.min(
      this.currentPage * this.dealersPerPage,
      this.dealers.length
    );
  }

  nextPage() {
    if (this.currentPage < this.totalPagesdealer) {
      // ✅ works now
      this.currentPage++;
    }
  }
  //   applyCustomDateFilter() {
  //   if (!this.customStartDate || !this.customEndDate) {
  //     alert('Please select both start and end dates');
  //     return;
  //   }

  //   this.dashboardService.getDealerActivitiesCustom(this.customStartDate, this.customEndDate)
  //     .subscribe((res: any) => {
  //       if (res.status === 200) {
  //         this.dealers = res.data.dealers || [];
  //       }
  //     });
  // }
  // applyCustomDateFilter() {
  //   if (this.customStartDate && this.customEndDate) {
  //     // Temporarily clear table to show refresh
  //     const tempDealers = this.dealers;
  //     this.dealers = [];
  //     this.paginatedDealers = [];

  //     this.dashboardService
  //       .getDealerActivitiesCustom(
  //         this.customStartDate,
  //         this.customEndDate,
  //         this.selectedFilter
  //       )
  //       .subscribe((res: any) => {
  //         if (res.status === 200) {
  //           // Update the main dealers array
  //           this.dealers = res.data.dealers || [];

  //           // Reset pagination to first page
  //           this.currentPage = 1;
  //           this.paginateDealers();

  //           // Collapse any expanded rows
  //           this.expandedRow = null;
  //         }
  //       });
  //   } else {
  //     alert('Please select both start and end dates.');
  //   }
  // }
  // applyCustomDateFilter() {
  //   if (this.customStartDate && this.customEndDate) {
  //     // First, set the applied dates so the UI shows them immediately
  //     this.appliedStartDate = this.customStartDate;
  //     this.appliedEndDate = this.customEndDate;

  //     // Temporarily clear table to show refresh
  //     this.dealers = [];
  //     this.paginatedDealers = [];
  //     this.expandedRow = null;

  //     // Call API
  //     this.dashboardService
  //       .getDealerActivitiesCustom(
  //         this.customStartDate,
  //         this.customEndDate,
  //         this.selectedFilter
  //       )
  //       .subscribe((res: any) => {
  //         if (res.status === 200) {
  //           // Update the main dealers array
  //           this.dealers = res.data.dealers || [];

  //           // Reset pagination to first page
  //           this.currentPage = 1;
  //           this.paginateDealers();

  //           // Collapse any expanded rows (already done)
  //           this.expandedRow = null;
  //         }
  //       });
  //   } else {
  //     alert('Please select both start and end dates.');
  //   }
  // }

  // toggleSM(id: string): void {
  //   this.activeSM = this.activeSM === id ? null : id;
  // }
  // toggleSM(smId: string, dealerId: string): void {
  //   if (this.activeSM === smId) {
  //     // Closing SM
  //     this.activeSM = null;
  //     this.activePS = null; // <-- Reset PS when SM closes
  //   } else {
  //     // Opening new SM
  //     this.activeSM = smId;
  //     this.activePS = null; // <-- Optionally reset PS when switching SMs

  //     // Fetch PS data only if not fetched yet
  //     if (!this.psData[smId]) {
  //       const token = sessionStorage.getItem('token');
  //       if (!token) return;

  //       const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  //       const url = `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${this.selectedFilter}&dealer_id=${dealerId}&sm_id=${smId}`;

  //       this.http.get<any>(url, { headers }).subscribe({
  //         next: (res) => {
  //           this.psData[smId] = res?.data?.ps || [];
  //         },
  //         error: (err) => {
  //           console.error('Failed to fetch PS data:', err);
  //           this.psData[smId] = [];
  //         },
  //       });
  //     }
  //   }
  // }
  // toggleSM(smId: string, dealerId: string): void {
  //   if (this.activeSM === smId) {
  //     // Closing SM
  //     this.activeSM = null;
  //     this.activePS = null;
  //   } else {
  //     // Opening SM
  //     this.activeSM = smId;
  //     this.activePS = null;

  //     // Fetch dealer SMs if not already fetched
  //     if (!this.dealerSMS[dealerId]) {
  //       const token = sessionStorage.getItem('token');
  //       if (!token) return;

  //       const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  //       const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?dealer_id=${dealerId}&type=${this.selectedFilter}`;

  //       this.http.get<any>(url, { headers }).subscribe({
  //         next: (res) => {
  //           // const dealer = res?.data?.dealers?.find(
  //           //   (d) => d.dealer_id === dealerId
  //           // );
  //           const dealer = res?.data?.dealers?.find(
  //             (d: any) => d.dealer_id === dealerId
  //           );

  //           this.dealerSMS[dealerId] = dealer?.sm_list || [];

  //           // Set PS data for the clicked SM
  //           const sm = this.dealerSMS[dealerId].find((s) => s.sm_id === smId);
  //           this.psData[smId] = sm?.ps_list || [];
  //         },
  //         error: (err) => {
  //           console.error('Failed to fetch SMs and PS:', err);
  //           this.dealerSMS[dealerId] = [];
  //           this.psData[smId] = [];
  //         },
  //       });
  //     } else {
  //       // Already fetched: just load PS for this SM
  //       const sm = this.dealerSMS[dealerId].find((s) => s.sm_id === smId);
  //       this.psData[smId] = sm?.ps_list || [];
  //     }
  //   }
  // }

  onPageChange(page: number): void {
    const totalPages = Math.ceil(this.dealers.length / this.itemsPerPage);

    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.updatePaginatedDealers();
    }
  }

  // updatePaginatedDealers() {
  //   if (!this.dealers || !this.dealers.length) {
  //     this.paginatedDealers = [];
  //     return;
  //   }
  //   const start = (this.currentPage - 1) * this.itemsPerPagedeal;
  //   const end = start + this.itemsPerPagedeal;
  //   this.paginatedDealers = this.dealers.slice(start, end);
  // }

  toggleSM(smId: string, dealerId: string): void {
    if (this.activeSM === smId) {
      // Closing SM
      this.activeSM = null;
      this.activePS = null;
    } else {
      // Opening SM
      this.activeSM = smId;
      this.activePS = null;

      const token = sessionStorage.getItem('token');
      if (!token) return;

      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      // Fetch PS for this SM
      const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?dealer_id=${dealerId}&sm_id=${smId}&type=${this.selectedFilter}`;

      this.http.get<any>(url, { headers }).subscribe({
        next: (res) => {
          // Find the dealer
          const dealer = res?.data?.dealers?.find(
            (d: Dealer) => d.dealer_id === dealerId
          );
          this.dealerSMS[dealerId] = dealer?.sm_list || [];

          // Find the SM and set its PS data
          const sm = this.dealerSMS[dealerId].find((s) => s.sm_id === smId);
          this.psData[smId] = sm?.ps_list || [];
        },
        error: (err) => {
          console.error('Failed to fetch SMs and PS:', err);
          this.dealerSMS[dealerId] = [];
          this.psData[smId] = [];
        },
      });
    }
  }

  togglePS(id: string): void {
    this.activePS = this.activePS === id ? null : id;
  }
  onDropdownChange() {
    console.log('Dropdown changed:');
    console.log('selectedCategory:', this.selectedCategory);
    console.log('selectedDuration:', this.selectedDuration);

    if (this.selectedCategory && this.selectedDuration) {
      console.log('✅ Both dropdowns selected. Proceeding to fetch data...');
      this.selectedOption = `${this.selectedCategory}-${this.selectedDuration}`;
      // this.updateDataBasedOnSelection(); // Fetch data
    } else {
      console.warn('⚠️ One or both dropdowns not selected. Skipping fetch.');
    }
  }
  // onSMClick(sm: any) {
  //   this.selectedSM = sm;

  //   setTimeout(() => {
  //     const section = document.querySelector('.ps-cards-page');
  //     if (section) {
  //       section.scrollIntoView({ behavior: 'smooth' });
  //     }
  //   }, 100);

  //   this.selectedDealer = null;

  //   this.fetchPS1Data();
  //  }
  // Your existing onSMClick method with PS data fetching added
  onSMClick(sm: any): void {
    this.selectedSM = sm;
    this.selectedDealer = null;
    this.currentPage = 1;
    this.ps1Data = []; // Clear old PS data immediately

    this.fetchPS1Data(); // no argument
  }
  // Toggle accordion functionality
  // toggleAccordion(id: string): void {
  //   const content = document.getElementById(`content-${id}`) as HTMLElement;
  //   const toggle = document.getElementById(`toggle-${id}`) as HTMLElement;
  //   const header = toggle?.parentElement as HTMLElement;

  //   if (content && toggle && header) {
  //     // Toggle current accordion
  //     const isActive = content.classList.contains('active');
  //     content.classList.toggle('active');
  //     header.classList.toggle('active');
  //     toggle.textContent = isActive ? '▼' : '▲';
  //   }
  // }

  // Dealer pagination functions
  changeDealerPage(direction: number): void {
    const newPage = this.currentDealerPage + direction;
    if (newPage >= 1 && newPage <= this.totalDealerPages) {
      this.goToDealerPage(newPage);
    }
  }

  goToDealerPage(page: number): void {
    if (page >= 1 && page <= this.totalDealerPages) {
      this.currentDealerPage = page;
      this.updateDealerPagination();
      this.loadDealersForPage(page);
    }
  }

  updateDealerPagination(): void {
    // Update pagination info
    const startDealer = (this.currentDealerPage - 1) * this.dealersPerPage + 1;
    const endDealer = Math.min(
      this.currentDealerPage * this.dealersPerPage,
      23
    );

    const dealerRangeElement = document.getElementById(
      'dealer-range'
    ) as HTMLElement;
    if (dealerRangeElement) {
      dealerRangeElement.textContent = `${startDealer}-${endDealer}`;
    }

    // Update pagination buttons
    const paginationButtons = document.querySelectorAll(
      '.pagination-btn'
    ) as NodeListOf<HTMLButtonElement>;
    paginationButtons.forEach((btn: HTMLButtonElement, index: number) => {
      if (btn.textContent === 'Previous') {
        btn.disabled = this.currentDealerPage === 1;
      } else if (btn.textContent === 'Next') {
        btn.disabled = this.currentDealerPage === this.totalDealerPages;
      } else if (btn.textContent && !isNaN(parseInt(btn.textContent))) {
        btn.classList.toggle(
          'active',
          parseInt(btn.textContent) === this.currentDealerPage
        );
      }
    });
  }

  loadDealersForPage(page: number): void {
    // In a real application, this would make an API call to load dealers for the specific page
    console.log(`Loading dealers for page ${page}`);

    // Simulate loading with a brief delay
    const accordions = document.querySelectorAll(
      '.accordion.level-1'
    ) as NodeListOf<HTMLElement>;
    accordions.forEach((acc: HTMLElement) => {
      acc.style.opacity = '0.5';
    });

    setTimeout(() => {
      accordions.forEach((acc: HTMLElement) => {
        acc.style.opacity = '1';
      });
    }, 300);
  }

  // Table pagination function
  changeTablePage(tableId: string, direction: number): void {
    console.log(`Changing page for ${tableId} by ${direction}`);
    // In a real application, this would load new data for the table
  }

  // Add search functionality
  searchDealer(searchTerm: string): void {
    console.log('Searching for:', searchTerm);
    // Filter dealers based on search term
  }

  // Auto-collapse other sections when opening a new one (optional)
  autoCollapseOthers(currentId: string): void {
    const activeContents = document.querySelectorAll(
      '.accordion-content.active'
    ) as NodeListOf<HTMLElement>;
    activeContents.forEach((content: HTMLElement) => {
      if (content.id !== `content-${currentId}`) {
        const toggleId = content.id.replace('content-', 'toggle-');
        const toggle = document.getElementById(toggleId) as HTMLElement;
        if (toggle && toggle.parentElement) {
          content.classList.remove('active');
          toggle.parentElement.classList.remove('active');
          toggle.textContent = '▼';
        }
      }
    });
  }

  // Initialize filters after view is ready
  private initializeFilters(): void {
    // Add some interactive functionality for filters
    const filterElements = document.querySelectorAll(
      'select, input[type="date"]'
    ) as NodeListOf<HTMLElement>;
    filterElements.forEach((element: HTMLElement) => {
      element.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        console.log('Filter changed:', target.value);
        // Here you would make API calls to filter the data
        this.handleFilterChange(target.value);
      });
    });
  }

  // Handle filter changes
  private handleFilterChange(value: string): void {
    // Implement your filter logic here
    console.log('Handling filter change:', value);
    // You can make API calls or filter local data here
  }

  // Method to handle search input changes (if you have a search input)
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchDealer(target.value);
  }

  // fetchSuperAdminDashboard(type: string = 'MTD'): void {
  //   const url = `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${type}`;
  //   const token = sessionStorage.getItem('token');

  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${token}`,
  //   });

  //   this.http.get<any>(url, { headers }).subscribe({
  //     next: (res) => {
  //       if (res?.status === 200) {
  //         this.dealers = res.data?.dealers || [];
  //       } else {
  //         console.error('Unexpected response format:', res);
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Super Admin Dashboard API failed:', err);
  //     },
  //   });
  // }
  fetchSuperAdminDashboard(type: string = 'MTD'): void {
    // const url = `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${type}`;
    const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?type=${type}`;

    const token = sessionStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        this.loading = false; // ✅ Stop loading

        if (res?.status === 200) {
          this.dealers = res.data?.dealers || [];

          const allSMs = res.data?.sms || [];
          this.dealerSMS = {};

          // ✅ Group SMS by team_id (assumed to match dealer_id)
          allSMs.forEach((sm: any) => {
            const teamId = sm.team_id;
            if (!this.dealerSMS[teamId]) {
              this.dealerSMS[teamId] = [];
            }
            this.dealerSMS[teamId].push(sm);
          });
          this.ps1Data = res.data?.ps || []; // ✅ Add this

          this.hoveredSM = null;

          console.log('Grouped dealerSMS:', this.dealerSMS);
        } else {
          console.error('Unexpected response format:', res);
        }
      },
      error: (err) => {
        console.error('Super Admin Dashboard API failed:', err);
      },
    });
  }
  // THIS CODE FOR DEALER DIV CLICK  AND THIS IS COMING RIGHT DONT TOUCH THIS

  // toggleDealerSMs(dealerId: string): void {
  //   if (this.selectedDealerId === dealerId) {
  //     this.selectedDealerId = null; // toggle off
  //     return;
  //   }

  //   this.selectedDealerId = dealerId;

  //   const token = sessionStorage.getItem('token');
  //   const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  //   const url = `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${this.selectedFilter}&dealer_id=${dealerId}`;

  //   this.http.get<any>(url, { headers }).subscribe({
  //     next: (res) => {
  //       if (res?.status === 200 && res.data?.sms) {
  //         this.dealerSMS[dealerId] = res.data.sms;
  //       } else {
  //         this.dealerSMS[dealerId] = [];
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Failed to fetch SMs for dealer:', err);
  //       this.dealerSMS[dealerId] = [];
  //     },
  //   });
  // }

  // onDealerClick(dealerId: string): void {
  //   if (this.selectedDealerId === dealerId) {
  //     this.selectedDealerId = null; // collapse if already open
  //     return;
  //   }

  //   this.selectedDealerId = dealerId;

  //   // Fetch SM data only if not already fetched
  //   if (!this.dealerSMS[dealerId]) {
  //     const url = `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${this.selectedFilter}&dealer_id=${dealerId}`;
  //     const token = sessionStorage.getItem('token');

  //     const headers = new HttpHeaders({
  //       Authorization: `Bearer ${token}`,
  //     });

  //     this.http.get<any>(url, { headers }).subscribe({
  //       next: (res) => {
  //         if (res?.status === 200 && res.data?.sms) {
  //           this.dealerSMS[dealerId] = res.data.sms;
  //         } else {
  //           this.dealerSMS[dealerId] = [];
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Failed to fetch SM data:', err);
  //         this.dealerSMS[dealerId] = [];
  //       },
  //     });
  //   }
  // }
  // fetchDealers() {
  //   this.http
  //     .get<any>(
  //       'https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=MTD'
  //     )
  //     .subscribe({
  //       next: (res) => {
  //         if (res.status === 200 && res.data && res.data.dealerData) {
  //           this.dealers = res.data.dealerData;
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Error fetching dealers:', err);
  //       },
  //     });
  // }
  // loadDealers() {
  //   this.http
  //     .get<any>(
  //       'https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=MTD'
  //     )
  //     .subscribe((res) => {
  //       this.dealers = res.dealers || [];
  //     });
  // }
  // Fetch all dealers for the selected filter
  // fetchDealers(filter: 'MTD' | 'QTD' | 'YTD') {
  //   const token = sessionStorage.getItem('token');
  //   const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  //   this.http
  //     .get<any>(
  //       // `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${filter}`,
  //       `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?type=${type}`;

  //       { headers }
  //     )
  //     .subscribe((res) => {
  //       if (res?.status === 200 && res.data?.dealerData) {
  //         this.dealers = res.data.dealerData;
  //       }
  //     });
  // }
  // fetchDealers(filter: 'MTD' | 'QTD' | 'YTD') {
  //   const token = sessionStorage.getItem('token');
  //   const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  //   const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?type=${filter}`;

  //   this.http.get<any>(url, { headers }).subscribe(
  //     (res) => {
  //       if (res?.status === 200 && res.data?.dealerData) {
  //         this.dealers = res.data.dealerData;
  //       } else {
  //         this.dealers = []; // clear if no data
  //       }
  //     },
  //     (err) => {
  //       console.error('Error fetching dealers:', err);
  //       this.dealers = []; // clear on error
  //     }
  //   );
  // }
  // fetchDealers(filter: 'MTD' | 'QTD' | 'YTD') {
  //   const token = sessionStorage.getItem('token');
  //   const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  //   const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?type=${filter}`;

  //   this.http.get<any>(url, { headers }).subscribe(
  //     (res) => {
  //       if (res?.status === 200 && res.data?.dealerData) {
  //         this.dealers = res.data.dealerData;

  //         // Initialize dealerSMS for each dealer
  //         this.dealers.forEach((dealer) => {
  //           if (!this.dealerSMS[dealer.dealer_id]) {
  //             this.dealerSMS[dealer.dealer_id] = [];
  //           }
  //         });
  //       } else {
  //         this.dealers = []; // clear if no data
  //       }
  //     },
  //     (err) => {
  //       console.error('Error fetching dealers:', err);
  //       this.dealers = []; // clear on error
  //     }
  //   );
  // }
  // applyCustomDate() {
  //   if (!this.customStartDate || !this.customEndDate) {
  //     alert('Please select both start and end dates');
  //     return;
  //   }

  //   // Keep dropdown selected as CUSTOM
  //   this.selectedFilter = 'CUSTOM';

  //   // Trigger change detection by updating variables first
  //   const start = this.customStartDate;
  //   const end = this.customEndDate;

  //   // Call API
  //   this.fetchDealersWithCustomDate(start, end);
  // }
  applyCustomDate() {
    if (!this.customStartDate || !this.customEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    this.selectedFilter = 'CUSTOM';

    // Assign local variables to avoid stale ngModel values
    const start = this.customStartDate;
    const end = this.customEndDate;

    // Call API
    this.fetchDealersWithCustomDate(start, end);

    // Optional: add a CSS class for applied effect
    const inputs = document.querySelector('.custom-inputs');
    if (inputs) {
      inputs.classList.add('applied');
    }
  }
  resetCustomDate() {
    // Clear custom dates
    this.customStartDate = '';
    this.customEndDate = '';

    // Reset dropdown to default filter (e.g., Today)
    this.selectedFilter = 'DAY';

    // Fetch default data
    this.onFilterChange(this.selectedFilter);

    // Remove applied visual effect
    const inputs = document.querySelector('.custom-inputs');
    if (inputs) {
      inputs.classList.remove('applied');
    }
  }

  //  toggleRow(button: HTMLButtonElement, rowId: string): void {
  //   const subRow = document.getElementById(rowId) as HTMLElement;
  //   const icon = button.querySelector('i') as HTMLElement;

  //   if (subRow.classList.contains('visible')) {
  //     subRow.classList.remove('visible');
  //     button.classList.remove('expanded');
  //   } else {
  //     subRow.classList.add('visible');
  //     button.classList.add('expanded');
  //   }
  // }
  //  toggleRow(button: any, rowId: string): void {
  //     const subRow = document.getElementById(rowId) as HTMLElement;

  //     if (subRow.classList.contains('visible')) {
  //       subRow.classList.remove('visible');
  //       button.classList.remove('expanded');
  //     } else {
  //       subRow.classList.add('visible');
  //       button.classList.add('expanded');
  //     }
  //   }

  // toggleRow(button: any, rowId: string): void {
  //   const subRow = document.getElementById(rowId) as HTMLElement;
  //   const expandBtn = button.closest('.expand-btn'); // Get the button element

  //   if (subRow.classList.contains('visible')) {
  //     subRow.classList.remove('visible');
  //     expandBtn.classList.remove('expanded');
  //   } else {
  //     subRow.classList.add('visible');
  //     expandBtn.classList.add('expanded');
  //   }
  // }
  toggleRow(event: Event, dealer: any, rowId: string): void {
    const id = dealer.dealer_id || dealer.dealerId;

    if (!id) {
      console.error('Dealer object missing id', dealer);
      return;
    }

    if (this.expandedRow === rowId) {
      this.expandedRow = null;
    } else {
      this.expandedRow = rowId;

      if (!this.dealerUsers[id]) {
        const token = sessionStorage.getItem('token');
        this.dashboardService
          .getDealerUsers(id, this.selectedFilter, token!)
          .subscribe({
           next: (res: any) => {
  console.log('API success:', res);

  const dealerData = res?.data?.dealers?.find((d: any) =>
    d.dealerId === id || d.dealer_id === id
  );

  this.dealerUsers[id] = dealerData?.users || [];
  console.log('Mapped Users for', id, ':', this.dealerUsers[id]);
},

            error: (err) => {
              console.error('Failed to fetch users', err);
              this.dealerUsers[id] = [];
            },
          });
      }
    }
  }

  // applyCustomDate() {
  //   if (this.customStartDate && this.customEndDate) {
  //     console.log(
  //       'Custom date range:',
  //       this.customStartDate,
  //       this.customEndDate
  //     );
  //     this.fetchDealersWithCustomDate(this.customStartDate, this.customEndDate);
  //     this.showCustomDatePicker = false;
  //     this.selectedFilter = 'CUSTOM'; // mark as custom filter
  //   } else {
  //     alert('Please select both start and end dates');
  //   }
  // }
  // applyCustomDate() {
  //   if (this.customStartDate && this.customEndDate) {
  //     console.log(
  //       'Custom date range:',
  //       this.customStartDate,
  //       this.customEndDate
  //     );

  //     // Fetch filtered data
  //     this.fetchDealersWithCustomDate(this.customStartDate, this.customEndDate);

  //     // Close the picker
  //     this.showCustomDatePicker = false;
  //     this.selectedFilter = 'CUSTOM'; // mark as custom filter

  //     // Normal page refresh
  //     window.location.reload();
  //   } else {
  //     alert('Please select both start and end dates');
  //   }
  // }

  // fetchDealersWithCustomDate(start: string, end: string) {
  //   const token = sessionStorage.getItem('token');
  //   this.dashboardService.getDealersByCustomDate(start, end, token!).subscribe({
  //     next: (res: any) => {
  //       this.dealers = res?.data?.dealers || [];
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.dealers = [];
  //     },
  //   });
  // }
  fetchDealersWithCustomDate(start: string, end: string) {
    const token = sessionStorage.getItem('token');
    this.dashboardService.getDealersByCustomDate(start, end, token!).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          this.dealers = res?.data?.dealers || [];
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error(err);
        this.ngZone.run(() => {
          this.dealers = [];
        });
      },
    });
  }
  // fetchDealers(filter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM') {
  //   const token = sessionStorage.getItem('token');
  //   if (!token) {
  //     console.error('No token found in sessionStorage!');
  //     this.dealers = [];
  //     this.displayedDealers = [];
  //     return;
  //   }

  //   this.dashboardService.getDealers(filter, token).subscribe({
  //     next: (res: any) => {
  //       console.log('API Response:', res);

  //       const dealers = res?.data?.dealers || res?.dealers || [];

  //       if (dealers.length > 0) {
  //         this.dealers = dealers;

  //         // initialize dealerSMS
  //         this.dealers.forEach((dealer: any) => {
  //           if (!this.dealerSMS[dealer.dealer_id]) {
  //             this.dealerSMS[dealer.dealer_id] = [];
  //           }
  //         });

  //         // update first 10 dealers for display
  //         this.itemsToShow = 10; // reset to 10 each time you fetch
  //         this.updateDisplayedDealers();
  //       } else {
  //         console.warn('No dealers found in response');
  //         this.dealers = [];
  //         this.displayedDealers = [];
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error fetching dealers:', err);
  //       this.dealers = [];
  //       this.displayedDealers = [];
  //     },
  //   });
  // }

  // updatePaginatedDealers() {
  //   const start = (this.currentPage - 1) * this.itemsPerPage;
  //   const end = start + this.itemsPerPage;
  //   this.paginatedDealers = this.dealers.slice(start, end);
  // }
  // fetchDealers(filter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM') {
  //   const token = sessionStorage.getItem('token');
  //   if (!token) {
  //     console.error('No token found in sessionStorage!');
  //     this.dealers = [];
  //     this.displayedDealers = [];
  //     return;
  //   }

  //   this.dashboardService.getDealers(filter, token).subscribe({
  //     next: (res: any) => {
  //       console.log('API Response:', res);

  //       const dealers = res?.data?.dealers || res?.dealers || [];

  //       if (dealers.length > 0) {
  //         this.dealers = dealers;

  //         // initialize dealerSMS
  //         this.dealers.forEach((dealer: any) => {
  //           if (!this.dealerSMS[dealer.dealer_id]) {
  //             this.dealerSMS[dealer.dealer_id] = [];
  //           }
  //         });

  //         // Reset to show first 10
  //         this.itemsToShow = 10;
  //         this.updateDisplayedDealers();
  //       } else {
  //         console.warn('No dealers found in response');
  //         this.dealers = [];
  //         this.displayedDealers = [];
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error fetching dealers:', err);
  //       this.dealers = [];
  //       this.displayedDealers = [];
  //     },
  //   });
  // }
  updateDisplayedUsers() {
    if (!this.dealerUsers) {
      this.displayedDealerUsers = [];
      this.showMoreUsersVisible = false;
      return;
    }

    // Optional: filter out users whose all counts are zero
    const filteredUsers = this.dealerUsers.filter((user: any) => {
      return (
        user.enquiries ||
        user.followUps ||
        user.overdueFollowups ||
        user.testDrives ||
        user.overdueTestDrives
      );
    });

    this.displayedDealerUsers = filteredUsers.slice(0, this.userItemsToShow);
    this.showMoreUsersVisible = this.userItemsToShow < filteredUsers.length;
  }

  // Toggle Show More / Less
  toggleShowMoreUsers() {
    if (this.usersItemsToShow >= this.dealerUsers.length) {
      this.usersItemsToShow = 10; // Show Less
    } else {
      this.usersItemsToShow = this.dealerUsers.length; // Show More
    }
    this.updateDisplayedUsers();
  }
  // fetchDealers(filter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM') {
  //   const token = sessionStorage.getItem('token');
  //   if (!token) {
  //     console.error('No token found in sessionStorage!');
  //     this.dealers = [];
  //     this.displayedDealers = [];
  //     this.displayedCallLogs = [];
  //     // this.displayedUsers = [];
  //     return;
  //   }

  //   this.dashboardService.getDealers(filter, token).subscribe({
  //     next: (res: any) => {
  //       console.log('API Response:', res);

  //       const dealers = res?.data?.dealers || res?.dealers || [];

  //       if (dealers.length > 0) {
  //         this.dealers = dealers;

  //         // Initialize dealerSMS
  //         this.dealers.forEach((dealer: any) => {
  //           if (!this.dealerSMS[dealer.dealer_id]) {
  //             this.dealerSMS[dealer.dealer_id] = [];
  //           }
  //         });

  //         // Reset to show first 10 for all tables
  //         this.itemsToShow = 10;
  //         this.callLogsItemsToShow = 10;
  //         // this.userItemsToShow = 10;

  //         this.updateDisplayedDealers();
  //         this.updateDisplayedCallLogs();
  //         // this.updateDisplayedUsers();
  //       } else {
  //         console.warn('No dealers found in response');
  //         this.dealers = [];
  //         this.displayedDealers = [];
  //         this.displayedCallLogs = [];
  //         // this.displayedUsers = [];
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error fetching dealers:', err);
  //       this.dealers = [];
  //       this.displayedDealers = [];
  //       this.displayedCallLogs = [];
  //       // this.displayedUsers = [];
  //     },
  //   });
  // }
  fetchDealers(filter: 'DAY' | 'WEEK' | 'MTD' | 'QTD' | 'YTD' | 'CUSTOM') {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('No token found in sessionStorage!');
      this.dealers = [];
      this.displayedDealers = [];
      this.displayedCallLogs = [];
      return;
    }

    this.dashboardService.getDealers(filter, token).subscribe({
      next: (res: any) => {
        console.log('API Response:', res);

        const dealers = res?.data?.dealers || res?.dealers || [];

        if (dealers.length > 0) {
          this.dealers = dealers;

          // Initialize dealerSMS
          this.dealers.forEach((dealer: any) => {
            if (!this.dealerSMS[dealer.dealer_id]) {
              this.dealerSMS[dealer.dealer_id] = [];
            }
          });

          // --- POPULATE dealerUsers ---
          this.dealerUsers = [];
          this.dealers.forEach((dealer: any) => {
            // Case 1: dealer has 'users' array
            if (dealer.users && dealer.users.length) {
              dealer.users.forEach((user: any) => {
                this.dealerUsers.push({
                  user_name: user.user_name || 'N/A',
                  callLogs: user.callLogs || {
                    connected: 0,
                    incoming: 0,
                    outgoing: 0,
                    missed: 0,
                    declined: 0,
                    duration: 0,
                  },
                });
              });
            }
            // Case 2: callLogs directly under dealer
            else if (dealer.callLogs) {
              this.dealerUsers.push({
                user_name: dealer.dealer_name || 'N/A',
                callLogs: dealer.callLogs,
              });
            }
            // Case 3: no users or callLogs
            else {
              this.dealerUsers.push({
                user_name: dealer.dealer_name || 'N/A',
                callLogs: {
                  connected: 0,
                  incoming: 0,
                  outgoing: 0,
                  missed: 0,
                  declined: 0,
                  duration: 0,
                },
              });
            }
          });

          // Initialize pagination
          this.itemsToShow = 10;
          this.callLogsItemsToShow = 10;
          this.displayedDealerUsers = this.dealerUsers.slice(
            0,
            this.itemsToShow
          );
          // ------------------------------------------

          this.updateDisplayedDealers();
          this.updateDisplayedCallLogs();
        } else {
          console.warn('No dealers found in response');
          this.dealers = [];
          this.displayedDealers = [];
          this.displayedCallLogs = [];
          this.dealerUsers = [];
          this.displayedDealerUsers = [];
        }
      },
      error: (err) => {
        console.error('Error fetching dealers:', err);
        this.dealers = [];
        this.displayedDealers = [];
        this.displayedCallLogs = [];
        this.dealerUsers = [];
        this.displayedDealerUsers = [];
      },
    });
  }

  updatePaginatedDealers() {
    this.paginatedDealers = this.dealers.slice(0, this.currentDisplayCount);
  }
  // Called when user clicks a dealer div
  // toggleDealerSMs(dealerId: string) {
  //   if (this.selectedDealerId === dealerId) {
  //     this.selectedDealerId = null; // collapse
  //     return;
  //   }

  //   this.selectedDealerId = dealerId;

  //   const token = sessionStorage.getItem('token');
  //   const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  //   this.http
  //     .get<any>(
  //       `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${this.selectedFilter}&dealer_id=${dealerId}`,
  //       { headers }
  //     )
  //     .subscribe((res) => {
  //       this.dealerSMS[dealerId] =
  //         res?.status === 200 && res.data?.sms ? res.data.sms : [];
  //     });
  // }

  // this is aslo DEALER DIV CODE API COMING PROPER DOTN TOCUH
  // onDealerClick(dealerId: string): void {
  //   if (this.selectedDealerId === dealerId) {
  //     this.selectedDealerId = null; // collapse if already open
  //     return;
  //   }

  //   this.selectedDealerId = dealerId;

  //   // Fetch SM data only if not already fetched
  //   if (!this.dealerSMS[dealerId]) {
  //     this.loadingSM = true; // Set loading state to true

  //     const url = `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${this.selectedFilter}&dealer_id=${dealerId}`;
  //     const token = sessionStorage.getItem('token');

  //     const headers = new HttpHeaders({
  //       Authorization: `Bearer ${token}`,
  //     });

  //     this.http.get<any>(url, { headers }).subscribe({
  //       next: (res) => {
  //         if (res?.status === 200 && res.data?.sms) {
  //           this.dealerSMS[dealerId] = res.data.sms;
  //         } else {
  //           this.dealerSMS[dealerId] = [];
  //         }
  //         this.loadingSM = false; // Set loading state to false
  //       },
  //       error: (err) => {
  //         console.error('Failed to fetch SM data:', err);
  //         this.dealerSMS[dealerId] = [];
  //         this.loadingSM = false; // Set loading state to false on error
  //       },
  //     });
  //   }
  // }
  onDealerClick(dealerId: string): void {
    if (this.selectedDealerId === dealerId) {
      this.selectedDealerId = null; // collapse if already open
      return;
    }

    this.selectedDealerId = dealerId;

    // Fetch SM data only if not already fetched
    if (!this.dealerSMS[dealerId]) {
      this.loadingSM = true; // Set loading state to true

      const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?type=${this.selectedFilter}&dealer_id=${dealerId}`;
      const token = sessionStorage.getItem('token');

      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      this.http.get<any>(url, { headers }).subscribe({
        next: (res) => {
          if (res?.status === 200 && res.data?.sms) {
            this.dealerSMS[dealerId] = res.data.sms;
          } else {
            this.dealerSMS[dealerId] = [];
          }
          this.loadingSM = false; // Set loading state to false
        },
        error: (err) => {
          console.error('Failed to fetch SM data:', err);
          this.dealerSMS[dealerId] = [];
          this.loadingSM = false; // Set loading state to false on error
        },
      });
    }
  }

  avatarColors = [
    { background: '#E2E0F5', color: '#4B3C9B' },
    { background: '#D1F8F2', color: '#008B7F' },
    { background: '#FFD6D6', color: '#C62828' },
    { background: '#D6FFD6', color: '#2E7D32' },
    { background: '#D6E6FF', color: '#2962FF' },
    { background: '#FFE6FF', color: '#AD1457' },
  ];
  getAvatarStyle(index: number) {
    const style = this.avatarColors[index % this.avatarColors.length];
    return {
      width: '60px',
      height: '60px',
      margin: '0 auto 12px auto',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '24px',
      background: style.background,
      color: style.color,
    };
  }
  isLastRow(index: number): boolean {
    const itemsPerRow = Math.floor(window.innerWidth / 160); // 120px + 20px gap approx
    const totalRows = Math.ceil(this.ps1Data.length / itemsPerRow);
    const currentRow = Math.floor(index / itemsPerRow) + 1;
    return currentRow === totalRows;
  }

  // Alternative method with solid colors (simpler approach)
  getAvatarColor(index: number): { background: string; text: string } {
    const colors = [
      { background: '#E2E0F5', text: '#4B3C9B' }, // Lavender bg, dark purple
      { background: '#C4FEFB', text: '#007A78' }, // Aqua bg, teal
      { background: '#FED1CF', text: '#C9302C' }, // Light red bg, deep red
      { background: '#E3FFDF', text: '#3E8E41' }, // Light green bg, green
      { background: '#CFDFFE', text: '#2C4DB2' }, // Blue bg, navy
      { background: '#FFEDFE', text: '#AF4C96' }, // Peach bg, deep pink
      { background: '#EAD1DC', text: '#9C2550' }, // Pink bg, magenta
      { background: '#FFF2CC', text: '#B58900' }, // Yellow bg, gold
      { background: '#D9EAD3', text: '#3B7A2A' }, // Mint green, green
      { background: '#F4CCCC', text: '#990000' }, // Coral bg, dark red
      { background: '#F3F3F3', text: '#4D4D4D' }, // Grey bg, dark grey
      { background: '#FFE6F0', text: '#C2185B' }, // Rose bg, berry pink
    ];

    return colors[index % colors.length];
  }
  onPSCardClick(psId: number): void {
    console.log('Clicked PS ID:', psId);
    // You can add navigation or other logic here
  }

  // fetchPS1Data(): void {
  //   if (!this.selectedSM || !this.selectedDealerId) {
  //     console.warn('SM or Dealer not selected');
  //     return;
  //   }

  //   const baseUrl = 'https://uat.smartassistapp.in/api/superAdmin/dashbaordNew';
  //   const type = 'YTD';
  //   const dealerId = this.selectedDealerId;
  //   const smId = this.selectedSM.sm_id;

  //   const url = `${baseUrl}?type=${type}&dealer_id=${dealerId}&sm_id=${smId}`;
  //   const token = sessionStorage.getItem('token');

  //   if (!token) {
  //     console.error('No token found in sessionStorage');
  //     return;
  //   }

  //   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  //   this.http.get<any>(url, { headers }).subscribe({
  //     next: (res) => {
  //       const psList = res?.data?.ps;

  //       if (Array.isArray(psList)) {
  //         this.ps1Data = psList.map((ps: any) => ({
  //           ps_id: ps.ps_id,
  //           ps_name: `${ps.ps_fname} ${ps.ps_lname}`,
  //           enquiries: ps.enquiries,
  //           testDrives: ps.testDrives,
  //           orders: ps.orders,
  //           cancellations: ps.cancellation,
  //           netOrders: ps.net_orders,
  //           retail: ps.retail,
  //         }));
  //       } else {
  //         console.warn('No PS data found in API response');
  //         this.ps1Data = [];
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error fetching PS1 data:', err);
  //     },
  //   });
  // }

  // fetchPS1Data(): void {
  //   if (!this.selectedSM || !this.selectedDealerId) {
  //     console.warn('SM or Dealer not selected');
  //     return;
  //   }

  //   // Always take the filter from the main page selection
  //   const type = this.selectedFilter;

  //   const baseUrl = 'https://uat.smartassistapp.in/api/superAdmin/dashbaordNew';
  //   const dealerId = this.selectedDealerId;
  //   const smId = this.selectedSM.sm_id;

  //   const url = `${baseUrl}?type=${type}&dealer_id=${dealerId}&sm_id=${smId}`;
  //   const token = sessionStorage.getItem('token');

  //   if (!token) {
  //     console.error('No token found in sessionStorage');
  //     return;
  //   }

  //   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  //   this.http.get<any>(url, { headers }).subscribe({
  //     next: (res) => {
  //       const psList = res?.data?.ps;

  //       if (Array.isArray(psList)) {
  //         this.ps1Data = psList.map((ps: any) => ({
  //           ps_id: ps.ps_id,
  //           ps_name: `${ps.ps_fname} ${ps.ps_lname}`,
  //           enquiries: ps.enquiries,
  //           testDrives: ps.testDrives,
  //           orders: ps.orders,
  //           cancellations: ps.cancellation,
  //           netOrders: ps.net_orders,
  //           retail: ps.retail,
  //         }));
  //       } else {
  //         console.warn('No PS data found in API response');
  //         this.ps1Data = [];
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Error fetching PS1 data:', err);
  //     },
  //   });
  // }
  fetchPS1Data(): void {
    if (!this.selectedSM || !this.selectedDealerId) {
      console.warn('SM or Dealer not selected');
      return;
    }

    this.loadingPS = true; // start loading

    const type = this.selectedFilter;
    const baseUrl = 'https://uat.smartassistapp.in/api/superAdmin/dashbaordNew';
    const dealerId = this.selectedDealerId;
    const smId = this.selectedSM.sm_id;
    const url = `${baseUrl}?type=${type}&dealer_id=${dealerId}&sm_id=${smId}`;
    const token = sessionStorage.getItem('token');

    if (!token) {
      console.error('No token found in sessionStorage');
      this.loadingPS = false; // stop loading on error
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        const psList = res?.data?.ps;

        if (Array.isArray(psList)) {
          this.ps1Data = psList.map((ps: any) => ({
            ps_id: ps.ps_id,
            ps_name: `${ps.ps_fname} ${ps.ps_lname}`,
            enquiries: ps.enquiries,
            testDrives: ps.testDrives,
            orders: ps.orders,
            cancellations: ps.cancellation,
            netOrders: ps.net_orders,
            retail: ps.retail,
          }));
        } else {
          console.warn('No PS data found in API response');
          this.ps1Data = [];
        }

        this.loadingPS = false; // stop loading after success
      },
      error: (err) => {
        console.error('Error fetching PS1 data:', err);
        this.ps1Data = [];
        this.loadingPS = false; // stop loading after error
      },
    });
  }
  get paginatedPs1Data() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.ps1Data.slice(start, end);
  }

  get totalPs1Pages() {
    return Math.ceil(this.ps1Data.length / this.pageSize);
  }

  // getStrokeColor(change: number): string {
  //   if (change > 0) return '#4CAF50'; // Green
  //   if (change < 0) return '#F44336'; // Red
  //   return '#9E9E9E'; // Grey
  // }
  // applyFilter(filter: string) {
  //   this.selectedFilter.set(filter);
  //   // this.fetchDashboardDataForTable(filter); // fetch table data if needed

  //   this.fetchDashboardDataForTopCards(filter); // This updates only the top cards.
  // }

  // fetchDashboardData(filter: string = 'MTD') {
  //   const token =
  //     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZTlkNjU5ZC02MDJmLTQwOWMtODY4Yi1iZTk2ZmM2MWEzZDEiLCJyb2xlIjoiU3VwZXJBZG1pbiIsInVzZXJFbWFpbCI6InNvbmFtLmNoYXVkaGFyeUBhcmlhbnRlY2hzb2x1dGlvbnMuY29tIiwiaWF0IjoxNzQ1MTM2NDM3LCJleHAiOjE3NDUxNDAwMzd9.hHojG8I2jM23yYCDUdqadkbsxC8A5OgrVWkh0uKAFmM';
  //   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  //   this.http
  //     .get(
  //       `https://uat.smartassistapp.in/api/superAdmin/superAdmin-dashboardd?filter=${filter}`,
  //       { headers }
  //     )
  //     .subscribe(
  //       (response: any) => {
  //         if (response && response.status === 200) {
  //           const data = response.data;

  //           // Get filtered values based on selected filter (e.g., MTD, QTD, YTD)
  //           const testDrivesForFilter = data.testDrives[filter]?.value || 0;
  //           const leadsForFilter = data.leads[filter]?.value || 0;
  //           const ordersForFilter = data.orders[filter]?.value || 0;

  //           // Update the signals with filtered data
  //           this.totalLeads.set(leadsForFilter);
  //           this.totalTestDrives.set(testDrivesForFilter);
  //           this.totalOrders.set(ordersForFilter);

  //           // Update the pie chart with new values
  //           this.createPieChart(testDrivesForFilter, ordersForFilter);

  //           // Prepare the data for table display (simulating)
  //           this.displayedData = data.tableData || []; // Assuming `tableData` is part of the response
  //         } else {
  //           console.error(
  //             'Error fetching data:',
  //             response.message || 'Unknown error'
  //           );
  //         }
  //       },
  //       (error) => {
  //         console.error('Error fetching data:', error);
  //       }
  //     );
  // }
  // Inside your fetchDashboardData method
  // Fetch the MTD values and total values properly
  // fetchDashboardData(filter: string = 'leads', period: string = 'MTD') {
  //   const token = sessionStorage.getItem('token');

  //   if (!token) {
  //     console.error('No token found!');
  //     return;
  //   }

  //   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  //   this.http
  //     .get(
  //       `https://uat.smartassistapp.in/api/superAdmin/superAdmin-dashboardd?filter=${filter}&period=${period}`,
  //       { headers }
  //     )
  //     .subscribe(
  //       (response: any) => {
  //         console.log('API Response:', response);
  //         console.log('Leads:', response.leads); // To ensure the data structure is correct

  //         // Assign correct values from the API response
  //         this.currentLeads = response.leads.current; // 5 from the API response
  //         this.previousLeads = response.leads.previous; // 0 from the API response

  //         if (response && response.status === 200 && response.data) {
  //           const data = response.data;
  //           const rankings = data.rankings || {};

  //           // Set all MTD, QTD, YTD values correctly
  //           this.mtdLeads.set(data.leads?.MTD?.value || 0);
  //           this.qtdLeads.set(data.leads?.QTD?.value || 0);
  //           this.ytdLeads.set(data.leads?.YTD?.value || 0);

  //           this.mtdTestDrives.set(data.testDrives?.MTD?.value || 0);
  //           this.qtdTestDrives.set(data.testDrives?.QTD?.value || 0);
  //           this.ytdTestDrives.set(data.testDrives?.YTD?.value || 0);

  //           this.mtdOrders.set(data.orders?.MTD?.value || 0);
  //           this.qtdOrders.set(data.orders?.QTD?.value || 0);
  //           this.ytdOrders.set(data.orders?.YTD?.value || 0);

  //           this.prevLeads.set(data.leads?.previous || 0);
  //           this.prevTestDrives.set(data.testDrives?.previous || 0);
  //           this.prevOrders.set(data.orders?.previous || 0);

  //           // Total Values for sidebar & pie
  //           const totalTestDrives = data.totalTestDrives || 0;
  //           const totalOrders = data.totalOrders || 0;
  //           const totalLeads = data.leads?.current || 0;

  //           this.sidebarTestDrives.set(totalTestDrives);
  //           this.sidebarOrders.set(totalOrders);
  //           this.sidebarLeads.set(totalLeads);

  //           this.updatePieChart(totalTestDrives, totalOrders);

  //           // Update table
  //           if (filter === 'testDrives') {
  //             this.displayedData = rankings.testDrives || [];
  //           } else if (filter === 'leads') {
  //             this.displayedData = rankings.leads || [];
  //           } else if (filter === 'orders') {
  //             this.displayedData = rankings.orders || [];
  //           } else {
  //             this.displayedData = data.tableData || [];
  //           }

  //           console.log('Displayed Data:', this.displayedData);

  //           // Max Value
  //           this.maxValue = Math.max(
  //             ...this.displayedData.map((item) => item.value)
  //           );

  //           console.log('Max Value:', this.maxValue);

  //           // Render chart
  //           this.renderChart(data);

  //           // Force change detection
  //           this.cdr.detectChanges();
  //         } else {
  //           console.error(
  //             'Error fetching data:',
  //             response.message || 'Unknown error'
  //           );
  //         }
  //       },
  //       (error) => {
  //         console.error('Error fetching data:', error);
  //       }
  //     );
  // }
  formatChangeValue(change: number): string {
    if (change === 0 || Object.is(change, -0)) {
      return '0%'; // Always show -0%
    } else if (change > 0) {
      return `+${change}%`;
    } else {
      return `${change}%`;
    }
  }

  getChangeColor(change: number): string {
    if (change > 0) {
      return 'text-success'; // green
    } else if (change < 0) {
      return 'text-danger'; // red
    } else {
      return 'text-danger'; // grey
    }
  }

  // fetchDashboardData(type: string = 'MTD') {
  //   const token = sessionStorage.getItem('token');
  //   if (!token) {
  //     console.error('Token not found!');
  //     return;
  //   }
  // showMore() {
  //   const nextIndex = this.currentIndex + this.itemsPerPage;
  //   this.paginatedDealers = this.paginatedDealers.concat(
  //     this.dealers.slice(this.currentIndex, nextIndex)
  //   );
  //   this.currentIndex = this.paginatedDealers.length;
  // }
  showMore() {
    this.currentDisplayCount += this.itemsPerPage;
    this.updateDisplayedDealers();
  }
  showMoreVisible: boolean = true;

  // updateDisplayedDealers() {
  //   this.displayedDealers = this.dealers.slice(0, this.itemsToShow);
  //   this.showMoreVisible = this.itemsToShow < this.dealers.length;
  // }
  updateDisplayedDealers() {
    this.displayedDealers = this.dealers.slice(0, this.itemsToShow);
    this.showMoreVisible = this.itemsToShow < this.dealers.length;
  }
  //   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  //   this.http
  //     .get<any>(
  //       `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${type}`,
  //       { headers }
  //     )
  //     .subscribe({
  //       next: (res) => {
  //         console.log(`API response for type=${type}:`, res);
  //         const data = res?.data || {};

  //         const cleanChange = (val: any): number => {
  //           if (typeof val === 'string') {
  //             return parseFloat(val.replace('%', '').trim());
  //           }
  //           return Number(val) || 0;
  //         };

  //         this.currentLeads = Number(data.current) || 0;
  //         this.previousLeads = Number(data.previous) || 0;
  //         this.changeDisplay = cleanChange(data.change);

  //         this.currentTestDrives = Number(data.currentTestDrives) || 0;
  //         this.previousTestDrives = Number(data.previousTestDrives) || 0;
  //         this.testDriveChange = cleanChange(data.testDriveChange);

  //         this.currentOrders = Number(data.currentOrders) || 0;
  //         this.previousOrders = Number(data.previousOrders) || 0;
  //         this.orderChange = cleanChange(data.orderChange);

  //         this.progressValue = Math.abs(this.changeDisplay);
  //         this.strokeColor = this.getStrokeColor(this.changeDisplay);

  //         this.testDriveProgressValue = Math.abs(this.testDriveChange);
  //         this.testDriveStrokeColor = this.getStrokeColor(this.testDriveChange);

  //         this.orderProgressValue = Math.abs(this.orderChange);
  //         this.orderStrokeColor = this.getStrokeColor(this.orderChange);

  //         console.log('✅ Final Parsed Data:', {
  //           leads: {
  //             current: this.currentLeads,
  //             previous: this.previousLeads,
  //             change: this.changeDisplay,
  //           },
  //           testDrives: {
  //             current: this.currentTestDrives,
  //             previous: this.previousTestDrives,
  //             change: this.testDriveChange,
  //           },
  //           orders: {
  //             current: this.currentOrders,
  //             previous: this.previousOrders,
  //             change: this.orderChange,
  //           },
  //         });
  //       },
  //       error: (err) => {
  //         console.error('Dashboard API error:', err);
  //       },
  //     });
  // }
  // fetchDashboardData(type: string = 'MTD') {
  //   const token = sessionStorage.getItem('token');
  //   if (!token) {
  //     console.error('Token not found!');
  //     return;
  //   }

  //   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  //   this.http
  //     .get<any>(
  //       `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?type=${filter};`,
  //       { headers }
  //     )
  //     .subscribe({
  //       next: (res) => {
  //         console.log(`API response for type=${type}:`, res);
  //         const data = res?.data || {};

  //         const cleanChange = (val: any): number => {
  //           if (typeof val === 'string') {
  //             return parseFloat(val.replace('%', '').trim());
  //           }
  //           return Number(val) || 0;
  //         };

  //         this.currentLeads = Number(data.current) || 0;
  //         this.previousLeads = Number(data.previous) || 0;
  //         this.changeDisplay = cleanChange(data.change);

  //         this.currentTestDrives = Number(data.currentTestDrives) || 0;
  //         this.previousTestDrives = Number(data.previousTestDrives) || 0;
  //         this.testDriveChange = cleanChange(data.testDriveChange);

  //         this.currentOrders = Number(data.currentOrders) || 0;
  //         this.previousOrders = Number(data.previousOrders) || 0;
  //         this.orderChange = cleanChange(data.orderChange);

  //         this.progressValue = Math.abs(this.changeDisplay);
  //         this.strokeColor = this.getStrokeColor(this.changeDisplay);

  //         this.testDriveProgressValue = Math.abs(this.testDriveChange);
  //         this.testDriveStrokeColor = this.getStrokeColor(this.testDriveChange);

  //         this.orderProgressValue = Math.abs(this.orderChange);
  //         this.orderStrokeColor = this.getStrokeColor(this.orderChange);

  //         console.log('✅ Final Parsed Data:', {
  //           leads: {
  //             current: this.currentLeads,
  //             previous: this.previousLeads,
  //             change: this.changeDisplay,
  //           },
  //           testDrives: {
  //             current: this.currentTestDrives,
  //             previous: this.previousTestDrives,
  //             change: this.testDriveChange,
  //           },
  //           orders: {
  //             current: this.currentOrders,
  //             previous: this.previousOrders,
  //             change: this.orderChange,
  //           },
  //         });

  //         // ✅ Add Doughnut Chart logic here:
  //         if (data.kpi) {
  //           const totalTestDrives = Number(data.kpi.totalTestDrives) || 0;
  //           const totalOrders = Number(data.kpi.totalOrders) || 0;

  //           if (totalTestDrives > 0 || totalOrders > 0) {
  //             console.log('📊 Creating Doughnut Chart with:', {
  //               totalTestDrives,
  //               totalOrders,
  //             });

  //             // setTimeout(() => {
  //             //   this.createDoughnutChart(totalTestDrives, totalOrders);
  //             // }, 0);
  //           }
  //         }
  //       },
  //       error: (err) => {
  //         console.error('Dashboard API error:', err);
  //       },
  //     });
  // }
  fetchDashboardData(type: 'MTD' | 'QTD' | 'YTD' = 'MTD') {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('Token not found!');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?type=${type}`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        console.log(`API response for type=${type}:`, res);
        const data = res?.data || {};

        const cleanChange = (val: any): number => {
          if (typeof val === 'string') {
            return parseFloat(val.replace('%', '').trim());
          }
          return Number(val) || 0;
        };

        this.currentLeads = Number(data.current) || 0;
        this.previousLeads = Number(data.previous) || 0;
        this.changeDisplay = cleanChange(data.change);

        this.currentTestDrives = Number(data.currentTestDrives) || 0;
        this.previousTestDrives = Number(data.previousTestDrives) || 0;
        this.testDriveChange = cleanChange(data.testDriveChange);

        this.currentOrders = Number(data.currentOrders) || 0;
        this.previousOrders = Number(data.previousOrders) || 0;
        this.orderChange = cleanChange(data.orderChange);

        this.progressValue = Math.abs(this.changeDisplay);
        this.strokeColor = this.getStrokeColor(this.changeDisplay);

        this.testDriveProgressValue = Math.abs(this.testDriveChange);
        this.testDriveStrokeColor = this.getStrokeColor(this.testDriveChange);

        this.orderProgressValue = Math.abs(this.orderChange);
        this.orderStrokeColor = this.getStrokeColor(this.orderChange);

        console.log('✅ Final Parsed Data:', {
          leads: {
            current: this.currentLeads,
            previous: this.previousLeads,
            change: this.changeDisplay,
          },
          testDrives: {
            current: this.currentTestDrives,
            previous: this.previousTestDrives,
            change: this.testDriveChange,
          },
          orders: {
            current: this.currentOrders,
            previous: this.previousOrders,
            change: this.orderChange,
          },
        });

        if (data.kpi) {
          const totalTestDrives = Number(data.kpi.totalTestDrives) || 0;
          const totalOrders = Number(data.kpi.totalOrders) || 0;

          if (totalTestDrives > 0 || totalOrders > 0) {
            console.log('📊 Creating Doughnut Chart with:', {
              totalTestDrives,
              totalOrders,
            });
            // Optional: createDoughnutChart(totalTestDrives, totalOrders);
          }
        }
      },
      error: (err) => {
        console.error('Dashboard API error:', err);
      },
    });
  }

  initLineChart() {
    const ctx: any = document.getElementById('enquiryLineChart');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr'], // sample months
        datasets: [
          {
            data: [3, 5, 7, 4], // Replace with dynamic values if needed
            borderColor: '#4CAF50',
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }, // ✅ Enable this
        },
        scales: {
          x: { display: false },
          y: { display: false },
        },
      },
    });
  }

  // CODE FOR LINE GRPAH ON THREEE CARDS
  renderChart(data: any): void {
    // Sample data extraction (adjust as per your API response)
    const chartData = {
      labels: ['Leads', 'Test Drives', 'Orders'], // X-Axis labels
      datasets: [
        {
          label: 'MTD Data',
          data: [data.mtdLeads, data.mtdTestDrives, data.mtdOrders], // Y-Axis data
          backgroundColor: ['#FF5733', '#33FF57', '#3357FF'],
          borderColor: ['#FF5733', '#33FF57', '#3357FF'],
          borderWidth: 1,
        },
      ],
    };

    this.chart = new Chart('myColumnChart', {
      type: 'bar', // Change to 'bar' for column chart
      data: chartData,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.label}: ${context.raw}`,
            },
          },
        },
      },
    });
  }

  fetchData(): void {
    this.http
      .get<any>('https://uat.smartassistapp.in/api/superAdmin/dashbaordNew')
      .subscribe(
        (response) => {
          console.log('API Response:', response); // Log the response to check its structure
          if (response?.data) {
            this.data = response.data; // Assign the 'data' part of the response
            console.log('Data after assignment:', this.data); // Check if `this.data` is populated correctly
          } else {
            console.error('No data in response:', response);
          }
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
      );
  }

  getLeadChange() {
    console.log('Data:', this.data); // Log the entire data object
    console.log('Lead Change:', this.data?.leads?.change); // Log the specific change value

    if (this.data?.leads?.change) {
      return this.data.leads.change; // This should return 100 based on your API response
    }
    return 0;
  }

  getChangePercentage(): number {
    return this.data?.leads?.change || 0; // Default to 0 if not available
  }

  // Method to return filtered leads (you can adjust this based on your logic)
  // getFilteredLeads(): number {
  //   return this.data ? this.data.leads.current : 0; // Example logic to return leads count
  // }

  // getPercentageChange(): number {
  //   console.log('Current Leads:', this.currentLeads);
  //   console.log('Previous Leads:', this.previousLeads);

  //   // Check if previous leads is 0 to avoid division by zero
  //   if (this.previousLeads === 0) {
  //     if (this.currentLeads === 0) {
  //       return 0; // No change if both are 0
  //     }
  //     return 100; // 100% change if previous leads is 0 and current is non-zero
  //   }

  //   // Calculate the percentage change
  //   const change =
  //     ((this.currentLeads - this.previousLeads) / this.previousLeads) * 100;
  //   return Math.round(change); // Round to nearest integer
  // }
  getLeadPercentageChange(): number {
    console.log(this.dashboardData);
    console.log(this.dashboardData?.leads?.change);

    // Update this to match your actual data structure
    // This could be this.dashboardData.leads.change or whatever matches your structure
    return this.dashboardData?.leads?.change || 0;

    // Alternatively, if you're storing the values separately:
    // return this.leadsChange || 100;
  }

  // get strokeColor(): string {
  //   const change = this.leadsData.change || 0;
  //   if (change > 0) return '#4caf50'; // green
  //   if (change < 0) return '#f44336'; // red
  //   return '#9e9e9e'; // grey for no change
  // }

  // get changeDisplay(): string {
  //   const change = this.leadsData.change || 0;
  //   return (change >= 0 ? '+' : '') + change + '%';
  // }

  // loadLeadsData() {
  //   this.http
  //     .get<any>(
  //       'https://uat.smartassistapp.in/api/superAdmin/superAdmin-dashboardd'
  //     )
  //     .subscribe((res) => {
  //       this.leadsData = res.leads;
  //       this.updateMiniChart();
  //     });
  // }

  // initMiniChart() {
  //   const ctx = document.getElementById('miniLeadsChart') as HTMLCanvasElement;
  //   this.miniChart = new Chart(ctx, {
  //     type: 'line',
  //     data: {
  //       labels: ['Prev', 'Now'],
  //       datasets: [
  //         {
  //           data: [0, 0],
  //           borderColor: '#28a745',
  //           backgroundColor: 'transparent',
  //           borderWidth: 2,
  //           tension: 0.4,
  //           pointRadius: 0,
  //         },
  //       ],
  //     },
  //     options: {
  //       responsive: false,
  //       plugins: {
  //         legend: { display: false },
  //         tooltip: { enabled: false },
  //       },
  //       scales: {
  //         x: { display: false },
  //         y: { display: false },
  //       },
  //     },
  //   });
  // }

  // updateMiniChart() {
  //   const previous = this.leadsData.previous || 0;
  //   const current = this.leadsData.MTD?.value || 0;

  //   this.miniChart.data.datasets[0].data = [previous, current];
  //   this.miniChart.update();
  // }

  // Return the currently selected filter

  // mtdLeads() {
  //   return this.leadsData?.MTD?.value || 0;
  // }

  // prevLeads() {
  //   return this.leadsData?.previous || 0;
  // }

  // getColor(val: number) {
  //   return val > 0 ? 'green' : 'gray';
  // }

  // initLineChart(labels: string[], values: number[]) {
  //   const ctx: any = document.getElementById('enquiryLineChart');

  //   if (this.lineChartInstance) {
  //     this.lineChartInstance.data.labels = labels;
  //     this.lineChartInstance.data.datasets[0].data = values;
  //     this.lineChartInstance.update();
  //   } else {
  //     this.lineChartInstance = new Chart(ctx, {
  //       type: 'line',
  //       data: {
  //         labels,
  //         datasets: [
  //           {
  //             label: 'Leads',
  //             data: values,
  //             borderColor: '#4CAF50',
  //             tension: 0.4,
  //             pointRadius: 3,
  //             borderWidth: 2,
  //           },
  //         ],
  //       },
  //       options: {
  //         responsive: true,
  //         plugins: { legend: { display: true }, tooltip: { enabled: true } },
  //         scales: {
  //           x: { title: { display: true, text: 'Month' } },
  //           y: { title: { display: true, text: 'Leads' } },
  //         },
  //       },
  //     });
  //   }
  // }

  // FOR CALL ANSLSYISI
  // Convert dealer.callLogs object to an array if it's a single object
  getPaginatedLogs(dealer: any) {
    const logsArray = Array.isArray(dealer.callLogs)
      ? dealer.callLogs
      : [dealer.callLogs];
    const currentPage = this.currentPageMap[dealer.dealer_id] || 1;
    const start = (currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return logsArray.slice(start, end);
  }

  getTotalPages(dealer: any) {
    const logsArray = Array.isArray(dealer.callLogs)
      ? dealer.callLogs
      : [dealer.callLogs];
    return Math.ceil(logsArray.length / this.itemsPerPage);
  }

  changePagesm(dealerId: string, page: number) {
    const dealer = this.dealers.find((d) => d.dealer_id === dealerId);
    if (!dealer) return;

    const totalPages = this.getTotalPages(dealer);
    if (page >= 1 && page <= totalPages) {
      this.currentPageMap[dealerId] = page;
    }
  }

  // changePage(dealerId: string, page: number) {
  //   const totalPages = this.getTotalPages(
  //     this.dealers.find((d) => d.dealer_id === dealerId)
  //   );
  //   if (page >= 1 && page <= totalPages) {
  //     this.currentPageMap[dealerId] = page;
  //   }
  // }
  updateData(data: any) {
    switch (this.selectedOption) {
      case 'leads':
        this.displayedData = data.rankings.leads; // Update table data for leads
        break;
      case 'testDrives':
        this.displayedData = data.rankings.testDrives; // Update table data for testDrives
        break;
      case 'orders':
        this.displayedData = data.rankings.orders; // Update table data for orders
        break;
      default:
        this.displayedData = data.rankings.leads; // Default to "leads"
    }

    // Update maxValue for chart rendering (based on displayed data)
    this.maxValue =
      Math.max(...this.displayedData.map((item) => item.value)) || 1;
  }

  // getChangeData(
  //   current: number,
  //   previous: number
  // ): { value: string; color: string } {
  //   if (previous === null || previous === undefined) {
  //     return { value: 'No data', color: 'text-muted' };
  //   }

  //   if (previous === 0) {
  //     if (current === 0) {
  //       return { value: '-0%', color: 'text-danger' };
  //     }
  //     const sign = current > 0 ? '+' : '-';
  //     const color = current > 0 ? 'text-success' : 'text-danger';
  //     return { value: `${sign}100%`, color };
  //   }

  //   const change = ((current - previous) / previous) * 100;
  //   const sign = change > 0 ? '+' : change < 0 ? '-' : '';
  //   const color =
  //     change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';

  //   if (change === 0) {
  //     return { value: '-0%', color: 'text-danger' };
  //   }

  //   return {
  //     value: `${sign}${Math.abs(change).toFixed(1)}%`,
  //     color,
  //   };
  // }
  getChangeData(current: number, previous: number) {
    if (previous === 0 && current === 0) {
      return { value: '-0%', color: 'text-danger' }; // Changed to -0%
    }
    if (previous === 0 && current > 0) {
      return { value: '+100%', color: 'text-success' };
    }
    if (previous > 0 && current === 0) {
      return { value: '-100%', color: 'text-danger' };
    }

    const change = ((current - previous) / previous) * 100;
    const roundedChange = Math.round(change);

    // Show "-0%" when change is exactly zero
    const valuePrefix =
      change === 0 ? (current < previous ? '-' : '') : change > 0 ? '+' : '';

    return {
      value: valuePrefix + Math.abs(roundedChange) + '%',
      color:
        change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted',
    };
  }

  //

  // updateDataBasedOnSelection() {
  //   const [type, range] = this.selectedOption.split('-'); // e.g. "leads", "MTD"

  //   // Retrieve the token from sessionStorage
  //   const token = sessionStorage.getItem('token'); // Correct retrieval of token

  //   if (!token) {
  //     console.error('No token found!');
  //     return;
  //   }

  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${token}`,
  //   });

  //   this.http
  //     .get<any>(
  //       `https://uat.smartassistapp.in/api/superAdmin/superAdmin-dashboardd/?type=${type}&range=${range}`,
  //       { headers }
  //     )
  //     .subscribe(
  //       (response) => {
  //         console.log('Response received:', response); // Log the full response to see the structure

  //         if (response && response.data) {
  //           // Handle different types of data based on selected option
  //           if (type === 'testDrives') {
  //             this.displayedData = response.data.rankings.testDrives || []; // Use the correct path to testDrives data
  //           } else if (type === 'leads') {
  //             this.displayedData = response.data.rankings.leads || []; // Use leads data
  //           } else if (type === 'orders') {
  //             this.displayedData = response.data.rankings.orders || []; // Use orders data
  //           }
  //         } else {
  //           console.error('No data found in response!');
  //           this.displayedData = []; // Handle case where there's no data
  //         }
  //       },
  //       (error) => {
  //         console.error('Error fetching data:', error);
  //         this.displayedData = []; // Handle error gracefully
  //       }
  //     );
  // }

  getFilteredLeads(): number {
    switch (this.selectedPeriod) {
      case 'MTD':
      case 'QTD':
      case 'YTD':
        return this.leads;
      default:
        return this.leads;
    }
  }

  // getFilteredTestDrives(): number {
  //   switch (this.selectedPeriod) {
  //     case 'MTD':
  //       return this.mtdTestDrives();
  //     case 'QTD':
  //       return this.qtdTestDrives();
  //     case 'YTD':
  //       return this.ytdTestDrives();
  //     default:
  //       return 0;
  //   }
  // }
  getFilteredTestDrives(): number {
    switch (this.selectedPeriod) {
      case 'MTD':
      case 'QTD':
      case 'YTD':
        return this.testDrives;
      default:
        return this.testDrives;
    }
  }
  // Logic to get filtered orders based on selected filter
  // getFilteredOrders(): number {
  //   switch (this.selectedPeriod) {
  //     case 'MTD':
  //       return this.mtdOrders();
  //     case 'QTD':
  //       return this.qtdOrders();
  //     case 'YTD':
  //       return this.ytdOrders();
  //     default:
  //       return 0;
  //   }
  // }
  getFilteredOrders(): number {
    switch (this.selectedPeriod) {
      case 'MTD':
      case 'QTD':
      case 'YTD':
        return this.orders;
      default:
        return this.orders;
    }
  }
  // getColor(value: number): string {
  //   return '#007bff'; // Always return blue
  // }
  showTooltip() {
    const tooltip = document.querySelector('.tooltip-content') as HTMLElement;
    if (tooltip) {
      tooltip.style.opacity = '1';
    }
  }

  hideTooltip() {
    const tooltip = document.querySelector('.tooltip-content') as HTMLElement;
    if (tooltip) {
      tooltip.style.opacity = '0';
      // console.log('hidetooltip');
    }
  }
  // fetchDashboardDataForTopCards(filter: string) {
  //   const token = sessionStorage.getItem('token');

  //   if (!token) {
  //     console.error('No token found!');
  //     return;
  //   }

  //   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  //   this.http
  //     .get(
  //       `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?filter=${filter}`,
  //       { headers }
  //     )
  //     .subscribe(
  //       (response: any) => {
  //         if (response && response.status === 200) {
  //           const data = response.data;

  //           // Access dynamic values based on the selected filter
  //           const leadsValue = data.leads?.[filter]?.value || 0;
  //           const testDrivesValue = data.testDrives?.[filter]?.value || 0;
  //           const ordersValue = data.orders?.[filter]?.value || 0;

  //           this.mtdLeads.set(leadsValue);
  //           this.mtdTestDrives.set(testDrivesValue);
  //           this.mtdOrders.set(ordersValue);
  //         } else {
  //           console.error(
  //             'Error fetching data:',
  //             response.message || 'Unknown error'
  //           );
  //         }
  //       },
  //       (error) => {
  //         console.error('Error fetching data:', error);
  //       }
  //     );
  // }
  fetchDashboardDataForTopCards(filter: string) {
    const token = sessionStorage.getItem('token');

    if (!token) {
      console.error('No token found!');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get<any>(
        `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?type=${filter}`,
        { headers }
      )
      .subscribe(
        (response) => {
          if (response && response.status === 200) {
            const kpi = response.data?.kpi;

            if (kpi) {
              this.dashboardMetrics = {
                totalLeads: kpi.totalLeads || 0,
                totalTestDrives: kpi.totalTestDrives || 0,
                totalOrders: kpi.totalOrders || 0,
                lostLeads: kpi.lostLeads || 0,
                cancellations: kpi.cancellations || 0,
                netOrders: kpi.netOrders || 0,
                retail: kpi.retail || 0,
              };

              const totalTestDrives = this.dashboardMetrics.totalTestDrives;
              const totalOrders = this.dashboardMetrics.totalOrders;

              // ✅ Always run the chart creation (even if both values are 0)
              setTimeout(() => {
                this.createDoughnutChart(totalTestDrives, totalOrders);
              }, 0);
            } else {
              console.warn('No KPI data found in response');
            }
          } else {
            console.error(
              'Error fetching data:',
              response.message || 'Unknown error'
            );
          }
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
      );
  }

  fetchDashboardDataForTable(filter: string) {
    const token = sessionStorage.getItem('token');

    if (!token) {
      console.error('No token found!');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get(
        `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?type=${filter};`,
        { headers }
      )
      .subscribe(
        (response: any) => {
          if (response && response.status === 200) {
            this.displayedData = response.data.tableData || [];
            this.maxValue =
              Math.max(...this.displayedData.map((item) => item.value)) || 1;
          } else {
            console.error('Failed to fetch table data:', response.message);
          }
        },
        (error) => {
          console.error('Fetch error:', error);
        }
      );
  }

  // createDoughnutChart(totalTestDrives: number, totalOrders: number) {
  //   const ctx = document.getElementById('doughnutChart') as HTMLCanvasElement;

  //    if (ctx) {
  //      if (this.doughnutChart) {
  //       this.doughnutChart.destroy();
  //     }

  //      this.doughnutChart = new Chart(ctx, {
  //       type: 'doughnut',
  //       data: {
  //         labels: ['Test Drives', 'Orders'],
  //         datasets: [
  //           {
  //             data: [totalTestDrives, totalOrders],
  //             backgroundColor: ['#1E90FF', '#87CEFA'], // Blue shades (adjust as needed)
  //           },
  //         ],
  //       },
  //       options: {
  //         responsive: true,
  //         aspectRatio: 1,
  //         plugins: {
  //           legend: {
  //             position: 'top',
  //           },
  //           tooltip: {
  //             enabled: true,
  //             callbacks: {
  //               label: function (tooltipItem) {
  //                 const value = tooltipItem.raw;
  //                 const label = tooltipItem.label;
  //                 return `${label}: ${value}`;
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });
  //   } else {
  //     console.error('Canvas element with ID "doughnutChart" not found.');
  //   }
  // }
  createDoughnutChart(totalTestDrives: number, totalOrders: number): void {
    this.cdr.detectChanges(); // ensures view is refreshed before accessing DOM

    const canvas = document.getElementById(
      'doughnutChart'
    ) as HTMLCanvasElement;

    if (!canvas) {
      console.error('Canvas element with ID "doughnutChart" not found.');
      return;
    }

    // 🔴 Properly destroy previous chart instance
    if (this.doughnutChart) {
      this.doughnutChart.destroy();
      this.doughnutChart = null;
    }

    // 🔄 Forcefully reset canvas
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    // ✅ Recreate the chart
    this.doughnutChart = new Chart(ctx!, {
      type: 'doughnut',
      data: {
        labels: ['Test Drives', 'Orders'],
        datasets: [
          {
            data: [totalTestDrives, totalOrders],
            backgroundColor: ['#1E90FF', '#87CEFA'],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                const value = tooltipItem.raw;
                const label = tooltipItem.label;
                return `${label}: ${value}`;
              },
            },
          },
        },
      },
    });
  }

  getPercentageChange(): number {
    if (this.previousLeads === 0) return 100;
    const diff = this.currentLeads - this.previousLeads;
    return Math.round((diff / this.previousLeads) * 100);
  }

  // getProgressPercentage(value: number, max: number): number {
  //   if (max <= 0) {
  //     console.warn('Invalid maxValue:', max);
  //     return 0;
  //   }
  //   return (value / max) * 100;
  // }

  updatePieChart(testDrives: number, orders: number): void {
    if (this.pieChartInstance) {
      this.pieChartInstance.data.datasets[0].data = [testDrives, orders];
      this.pieChartInstance.update();
    } else {
      this.createDoughnutChart(testDrives, orders);
    }
  }

  // updateSelection(option: string) {
  //   this.selectedOption = option;
  //   this.updateDataBasedOnSelection(); // Method to update your data based on selection
  // }
  // updateDataBasedOnSelection() {
  //   switch (this.selectedOption) {
  //     // Leads cases
  //     case 'leads-MTD':
  //       // Fetch and display MTD data for leads
  //       break;
  //     case 'leads-QTD':
  //       // Fetch and display QTD data for leads
  //       break;

  //     // Test Drives cases
  //     case 'testDrives-MTD':
  //       // Fetch and display MTD data for test drives
  //       break;
  //     case 'testDrives-QTD':
  //       // Fetch and display QTD data for test drives
  //       break;

  //     // Orders cases
  //     case 'orders-MTD':
  //       // Fetch and display MTD data for orders
  //       break;
  //     case 'orders-QTD':
  //       // Fetch and display QTD data for orders
  //       break;

  //     default:
  //       console.error('Invalid selection:', this.selectedOption);
  //   }
  // }
  // getFilteredLeads() {
  //   return this.data?.leads?.MTD?.value ?? 0; // adjust according to your data
  // }

  // updateDataBasedOnSelection(): void {
  //   const [type, range] = this.selectedOption.split('-');
  //   console.log(`📦 Fetching data for type: ${type}, duration: ${range}`);

  //   const token = sessionStorage.getItem('token');
  //   if (!token) {
  //     console.error('❌ No token found!');
  //     return;
  //   }

  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${token}`,
  //   });

  //   this.http
  //     .get<any>(
  //       `https://uat.smartassistapp.in/api/superAdmin/dashbaordNew?type=${range}`,
  //       { headers }
  //     )
  //     .subscribe(
  //       (response) => {
  //         console.log('✅ Filtered API response:', response);

  //         const rankings = response?.data?.rankings || {};
  //         this.displayedData = rankings[type] || [];
  //         this.paginateData(); // <-- paginate after setting data

  //         this.maxValue =
  //           Math.max(...this.displayedData.map((item) => item.value)) || 1;

  //         console.log('📊 Displayed Data:', this.displayedData);
  //       },
  //       (error) => {
  //         console.error('❌ Error fetching filtered data:', error);
  //         this.displayedData = [];
  //       }
  //     );
  // }
  paginateData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.displayedData.slice(startIndex, endIndex);
  }
  // Helper function to paginate
  paginateDealers() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedDealers = [...this.dealers.slice(start, end)];
  }

  getFormattedChange(change: number): string {
    if (Object.is(change, -0)) {
      return '-0%';
    }
    return `${change >= 0 ? '+' : ''}${change}%`;
  }

  // Calculate progress percentage based on value
  getProgressPercentage(value: number, maxValue: number): number {
    return (value / maxValue) * 100;
  }

  // Optionally, you can modify how you color the progress bar based on value
  getColor(rank: number): string {
    return rank <= 3 ? '#28a745' : '#dc3545'; // Green for rank 1, 2, 3, Red for others
  }
  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage = page;
    this.paginateData();
  }

  totalPages(): number {
    return Math.ceil(this.displayedData.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    return Array(this.totalPages())
      .fill(0)
      .map((_, index) => index + 1);
  }
  loadMoreUsers() {
    if (this.itemsToShow >= this.dealerUsers.length) {
      // Show less
      this.itemsToShow = 10;
    } else {
      // Show more
      this.itemsToShow += 10;
    }

    this.displayedDealerUsers = this.dealerUsers.slice(0, this.itemsToShow);
  }

  // getLeadChange() {
  //   console.log('DATA:', this.data);

  //   if (
  //     this.data &&
  //     this.data.leads &&
  //     typeof this.data.leads.change === 'number'
  //   ) {
  //     console.log('CHANGE:', this.data.leads.change);
  //     return this.data.leads.change;
  //   }
  //   return 0;
  // }

  // // Method to calculate the progress percentage for the rank bar
  // getProgressPercentage(value: number, maxValue: number) {
  //   return (value / maxValue) * 100;
  // }
  // private createPieChart(totalTestDrives: number, totalOrders: number) {
  //   const pieChartElement = document.getElementById(
  //     'doughnut_chart'
  //   ) as HTMLCanvasElement;

  //   if (pieChartElement) {
  //     // Destroy the previous chart instance if it exists (to prevent re-creating it on every filter change)
  //     if (this.pieChartInstance) {
  //       this.pieChartInstance.destroy();
  //     }

  //     this.pieChartInstance = new Chart(pieChartElement, {
  //       type: 'pie',
  //       data: {
  //         labels: ['Test Drives', 'Orders'],
  //         datasets: [
  //           {
  //             label: 'Total Dashboard Data',
  //             data: [totalTestDrives, totalOrders],
  //             backgroundColor: ['#007bff', '#008080'], // Light Blue and Dark Blue
  //           },
  //         ],
  //       },
  //       options: {
  //         responsive: true,
  //         plugins: {
  //           legend: {
  //             display: true,
  //             position: 'bottom',
  //           },
  //           tooltip: {
  //             callbacks: {
  //               label: function (tooltipItem) {
  //                 return `${tooltipItem.label}: ${tooltipItem.raw}`;
  //               },
  //             },
  //           },
  //         },
  //       },
  //     });
  //   } else {
  //     console.warn('Canvas element for chart not found');
  //   }
  // }
  // createDoughnutChart(testDrives: number, orders: number) {
  //   const canvas = document.getElementById(
  //     'doughnut_chart'
  //   ) as HTMLCanvasElement;
  //   if (!canvas) {
  //     console.error('Canvas element not found!');
  //     return;
  //   }

  //   const ctx = canvas.getContext('2d');
  //   if (this.pieChartInstance) {
  //     this.pieChartInstance.destroy(); // Prevent overlapping charts
  //   }

  //   this.pieChartInstance = new Chart(ctx!, {
  //     type: 'doughnut',
  //     data: {
  //       labels: ['Test Drives', 'Orders'],
  //       datasets: [
  //         {
  //           data: [testDrives, orders],
  //           backgroundColor: ['#007bff', '#FF6384'],
  //         },
  //       ],
  //     },
  //     options: {
  //       responsive: true,
  //       plugins: {
  //         legend: {
  //           position: 'bottom',
  //         },
  //       },
  //     },
  //   });
  // }
  // getFilteredLeads(): number {
  //   switch (this.selectedPeriod) {
  //     case 'MTD':
  //       return this.mtdLeads();
  //     case 'QTD':
  //       return this.qtdLeads();
  //     case 'YTD':
  //       return this.ytdLeads();
  //     default:
  //       return 0;
  //   }
  // }
  clearCustomDateFilter() {
    // Reset date fields
    // this.customStartDate = null;
    // this.customEndDate = null;
    this.appliedStartDate = null;
    this.appliedEndDate = null;

    // Optionally, refresh table with current standard filter
    this.applyFilter(this.selectedFilter);
  }

  // Apply the filter and update the selected period
  applyFilter(period: string): void {
    this.selectedPeriod = period;
    // this.selectedFilter = period; // ✅ ADD THIS LINE to highlight the correct button

    const token = sessionStorage.getItem('token');
    if (!token) return;

    let url =
      'https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities';
    if (period && period !== 'today') {
      url += `?type=${period}`;
    }

    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        const data = res.data;

        // ✅ Assign KPI values
        this.leads = data.leads ?? 0;
        this.currentLeads = data.current ?? 0;
        this.previousLeads = data.previous ?? 0;
        this.changeLeads = data.change ?? 0;

        this.testDrives = data.testDrives ?? 0;
        this.currentTestDrives = data.currentTestDrives ?? 0;
        this.previousTestDrives = data.previousTestDrives ?? 0;
        this.testDriveChange = data.testDriveChange ?? 0;

        this.orders = data.orders ?? 0;
        this.currentOrders = data.currentOrders ?? 0;
        this.previousOrders = data.previousOrders ?? 0;
        this.orderChange = data.orderChange ?? 0;

        // ✅ Show Doughnut Chart for MTD, QTD, YTD
        if (['MTD', 'QTD', 'YTD'].includes(period)) {
          const totalTestDrives = data.totalTestDrives ?? 0;
          const totalOrders = data.totalOrders ?? 0;
          this.createDoughnutChart(totalTestDrives, totalOrders);
        } else {
          // ❌ Destroy chart for other filters (e.g., 'today')
          if (this.doughnutChart) {
            this.doughnutChart.destroy();
            this.doughnutChart = null;
          }
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API error:', err);
      },
    });
  }
  loadInitialDealers() {
    this.paginatedDealers = this.dealers.slice(0, this.itemsPerPage);
    this.currentIndex = this.paginatedDealers.length;
    this.showMoreActive = false;
  }
  toggleShowMoreCallLogs() {
    if (this.callLogsItemsToShow >= this.dealers.length) {
      // Show Less → back to first 10
      this.callLogsItemsToShow = 10;
    } else {
      // Show next 10
      this.callLogsItemsToShow = Math.min(
        this.callLogsItemsToShow + 10,
        this.dealers.length
      );
    }
    this.updateDisplayedCallLogs();
  }
  updateDisplayedCallLogs() {
    this.displayedCallLogs = this.dealers.slice(0, this.callLogsItemsToShow);
    this.showMoreCallLogsVisible =
      this.callLogsItemsToShow < this.dealers.length;
  }

  // toggleShowMore() {
  //   if (this.showMoreActive) {
  //     // Show Less → reset to first 10 dealers
  //     this.loadInitialDealers();
  //   } else {
  //     // Show More → next 10 dealers
  //     const nextIndex = Math.min(
  //       this.currentIndex + this.itemsPerPage,
  //       this.dealers.length
  //     );
  //     this.paginatedDealers = this.dealers.slice(0, nextIndex);
  //     this.currentIndex = nextIndex;
  //     this.showMoreActive = true;
  //   }
  // }

  // toggleShowMore() {
  //   if (this.itemsToShow >= this.dealers.length) {
  //     // Reset to initial 10
  //     this.itemsToShow = 10;
  //   } else {
  //     // Show all remaining dealers
  //     this.itemsToShow = this.dealers.length;
  //   }
  //   this.updateDisplayedDealers();
  // }
  toggleShowMore() {
    if (this.itemsToShow >= this.dealers.length) {
      // Show Less → back to first 10
      this.itemsToShow = 10;
    } else {
      // Show next 10
      this.itemsToShow = Math.min(this.itemsToShow + 10, this.dealers.length);
    }
    this.updateDisplayedDealers();
  }
  loadTodayData(): void {
    this.selectedPeriod = ''; // ensure no filter is highlighted
    this.applyFilter('today');
  }
  // Load More / Show Less button
  loadMoreDealerUsers() {
    if (this.itemsToShow >= this.dealerUsers.length) {
      // Show Less
      this.itemsToShow = 10;
    } else {
      // Load More
      this.itemsToShow += 10;
    }
    this.displayedDealerUsers = this.dealerUsers.slice(0, this.itemsToShow);
  }
  populateDealerUsers(dealer: any) {
    // Map dealer.users array to dealerUsers
    this.dealerUsers =
      dealer.users?.map((user: any) => ({
        user_name: user.user_name || 'N/A',
        user_role: user.user_role || 'N/A',
        enquiries: user.enquiries || 0,
        followUps: user.followUps || 0,
        overdueFollowups: user.overdueFollowups || 0,
        testDrives: user.testDrives || 0,
        overdueTestDrives: user.overdueTestDrives || 0,
      })) || [];

    // Initialize pagination
    this.itemsToShow = 10;
    this.displayedDealerUsers = this.dealerUsers.slice(0, this.itemsToShow);
  }

  // Logic for calculating the color (green for positive, red for negative)
  // getColor(value: number): string {
  //   return value >= 0 ? 'green' : 'red';
  // }

  // Get change data for comparison (e.g., since last month)
  // getChangeData(currentValue: number, prevValue: number) {
  //   const change = currentValue - prevValue;
  //   const changePercentage = ((change / prevValue) * 100).toFixed(2);
  //   return {
  //     color: change >= 0 ? 'green' : 'red',
  //     value: `${change >= 0 ? '+' : ''}${changePercentage}%`,
  //   };
  // }
}
// calculateChange(current: number, previous: number): string {
//   console.log('Current:', current, 'Previous:', previous);

//   // If previous is null or undefined, display "No data"
//   if (previous === null || previous === undefined) {
//     return `<span style='color: grey;'>No data</span>`;
//   }

//   // Handle previous = 0 safely to avoid Infinity
//   if (previous === 0) {
//     if (current === 0) {
//       return `<span style='color: grey;'>0%</span>`;
//     }
//     // If previous is 0 and current is non-zero, treat it as +100% or -100%
//     const sign = current > 0 ? '+' : '-';
//     const color = current > 0 ? 'green' : 'red';
//     return `<span style='color: ${color};'>${sign}100%</span>`;
//   }

//   // Normal percentage calculation (for non-zero previous)
//   const change = ((current - previous) / previous) * 100;
//   const sign = change > 0 ? '+' : change < 0 ? '-' : '';
//   const color = change > 0 ? 'green' : change < 0 ? 'red' : 'grey';

//   return `<span style='color: ${color};'>${sign}${Math.abs(change).toFixed(
//     1
//   )}%</span>`;
// }

// calculateChange(current: number, previous: number): string {
//   console.log('Current:', current, 'Previous:', previous);

//   if (previous === null || previous === undefined) {
//     return `<span style='color: grey;'>No data</span>`;
//   }

//   if (previous === 0) {
//     if (current === 0) {
//       return `<span style='color: grey;'>0%</span>`;
//     }
//     const sign = current > 0 ? '+' : '-'; // sign will be '+'
//     const color = current > 0 ? 'green' : 'red'; // color will be 'green'
//     return `<span style='color: ${color};'>${sign}100%</span>`; // This will return '<span style='color: green;'>+100%</span>'
//   }

//   const change = ((current - previous) / previous) * 100;
//   const sign = change > 0 ? '+' : change < 0 ? '-' : '';
//   const color = change > 0 ? 'green' : change < 0 ? 'red' : 'grey';

//   return `<span style='color: ${color};'>${sign}${Math.abs(change).toFixed(
//     1
//   )}%</span>`;
// }

//   getChangeData(
//     current: number,
//     previous: number
//   ): { value: string; color: string } {
//     if (previous === null || previous === undefined) {
//       return { value: 'No data', color: 'text-muted' };
//     }

//     if (previous === 0) {
//       if (current === 0) {
//         return { value: '0%', color: 'text-muted' };
//       }
//       const sign = current > 0 ? '+' : '-';
//       const color = current > 0 ? 'text-success' : 'text-danger';
//       return { value: `${sign}100%`, color };
//     }

//     const change = ((current - previous) / previous) * 100;
//     const sign = change > 0 ? '+' : change < 0 ? '-' : '';
//     const color =
//       change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';

//     return {
//       value: `${sign}${Math.abs(change).toFixed(1)}%`,
//       color,
//     };
//   }
// }
