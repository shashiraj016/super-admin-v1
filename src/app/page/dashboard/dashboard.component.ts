import { CommonModule } from '@angular/common';
import {
  Component,
  AfterViewInit,
  OnInit,
  signal,
  WritableSignal,
  ChangeDetectorRef,
  NgZone,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexNonAxisChartSeries, ApexResponsive } from 'ng-apexcharts';
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

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexPlotOptions,
  ApexTitleSubtitle,
  ChartComponent,
} from 'ng-apexcharts';
import { ToastrService } from 'ngx-toastr';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  plotOptions?: ApexPlotOptions; // ✅ added
  tooltip?: ApexTooltip; // ✅ added
  legend?: ApexLegend; // ✅ added
  title: ApexTitleSubtitle;
  responsive?: ApexResponsive[]; // ✅ add this line
};
type FilterType =
  | 'DAY'
  | 'YESTERDAY'
  | 'WEEK'
  | 'LAST_WEEK'
  | 'MTD'
  | 'LAST_MONTH'
  | 'QTD'
  | 'LAST_QUARTER'
  | 'SIX_MONTH'
  | 'YTD'
  | 'LIFETIME'
  | 'CUSTOM';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    NgCircleProgressModule,
    NgApexchartsModule, // ✅ add this
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements AfterViewInit, OnInit {
  dashboardMetrics: any = {
    totalLeads: 0,
    totalTestDrives: 0,
    totalOrders: 0,
    lostLeads: 0,
    cancellations: 0,
    netOrders: 0,
    retail: 0,
  };

  // ✅ initialize callLogs so template won’t break
  callLogs = {
    totalCalls: 120,
    outgoing: 50,
    incoming: 40,
    connected: 20,
    declined: 10,
    durationSec: 500,
  };
  // NEW DESIGN CODE
  expandedDealer: any | null = null; // or better, create an interface for Dealer
  // chartOptions!: ChartOptions;
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;
  sortColumn: string | null = 'saLeads';
  sortDirection: 'asc' | 'desc' | 'default' = 'desc';
  skipDefaultSelection = false;
  loadingUsers: { [dealerId: string]: boolean } = {};
  filteredDealerData: any[] = [];
  showLogoutModal: boolean = false;

  currentPageMap: { [dealerId: string]: number } = {}; // track current page per dealer
  showAllSMs: { [dealerId: string]: boolean } = {};
  showCustomDatePicker = false;
  customStartDate: string = '';
  customEndDate: string = '';
  isAllSelected: boolean = false;

  displayedDealers: any[] = [];
  itemsToShow: number = 10;
  expandedRow: string | null = null;
  filteredDealers: any[] = []; // filtered for dropdown
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
  callLogDealers: Dealer[] = []; // for call logs, fixed order
  isInitialLoad = true;
  invalidDateRange: boolean = false;
  expandedSummaryRow: string | null = null;
  dealersData: any[] = []; // <-- holds the full API response
  refreshingSA = false;
  showQuickActionBtn = true; // 👈 initially visible
  lastScrollTop = 0; // keep track of last scroll position
  isSticky = false;
  originalHeaderOffsetTop: number = 0;

  loading = false; // Declare this in your component
  selectedDealer: any = null;
  ps1Data: any[] = [];
  ps2Data: any[] = [];
  pageSize = 20; // or any number you want
  ytdTestDrives = signal<number>(0);
  loadingSM: boolean = false;
  psData: { [smId: string]: any[] } = {};
  showDetails = false;
  paginatedDealers: any[] = [];
  dealerCallData: any[] = [];
  dropdownOpen = false;
  selectedDealers: any[] = []; // ✅ store multiple selected dealers
  dealerPSL: any = null;
  userCallLogs: { [dealerId: string]: any[] } = {};
  callLogsItemsToShow = 10;
  displayedCallLogs: any[] = [];
  showMoreCallLogsVisible = true;
  mtdOrders = signal<number>(0);
  qtdOrders = signal<number>(0);
  ytdOrders = signal<number>(0);
  table1Length = 10;
  table2Length = 10;
  isLoading = false;
  overallData: any = {}; // 👈 holds overall API response metrics

  dealerSummaryCallsViewType: 'table' | 'chart' = 'table';

  // Dropdown (enquiries or coldcalls)
  dealerSummaryCallsDataType: 'enquiries' | 'coldcalls' = 'enquiries';

  selectedFilter!: FilterType;

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
  dealerUsers: { [dealerId: string]: any[] } = {}; // store users per dealer
  dealerCallLogs: { [dealerId: string]: any } = {}; // ← add this
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
  kpiData: any = {
    dealers: 0,
    activeNetwork: 0,
    users: 0,
    activeUsers: 0,
    leads: 0,
    calls: 0,
    totalFollowUps: 0,
    uniqueTestDrives: 0,
    completedTestDrives: 0,
  };

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
  displayedDealerUsers: any[] = [];

  currentDealerPage: number = 1;
  dealersPerPage: number = 5;
  expandedItems: { [key: string]: boolean } = {};
  filterOptions = ['MTD', 'QTD', 'YTD'] as const; // 'as const' makes type readonly ['MTD','QTD','YTD']
  expandedRows: boolean[] = [false, false, false, false, false, false];
  showMoreActive = false; // Button toggle state
  originalDealers: any[] = [];

  rankings: any = {};
  sidebarTestDrives = signal<number>(0);
  sidebarOrders = signal<number>(0);
  sidebarLeads = signal<number>(0);
  private pieChartInstance: any;
  leadsData: any = {}; // Holds your backend data
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

  change: number = 0; // Initialize with a default value, such as 0
  doughnutChart: any;
  dealerSearch: string = '';

  animatedValue: number = 0; // Initial value
  currentPage: number = 1;
  itemsPerPage: number = 10;
  paginatedData: any[] = [];
  activeFilter: 'MTD' | 'QTD' | 'YTD' = 'MTD'; // set default selection
  dealers: any[] = []; // Full dealer list from API
  currentdealerPage: number = 1;
  itemsPerdealerPage: number = 5;
  maxValue: number = 0;
  selectedFilterPS: 'MTD' | 'QTD' | 'YTD' = 'MTD'; // default

  changeDisplay: number = 0;
  progressValue: number = 0;
  strokeColor: string = 'red'; // green by default
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private context: ContextService,
    private router: Router,
    private dashboardService: DashboardService,
    private sharedService: SharedService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef,
    private eRef: ElementRef,
    private toastr: ToastrService
  ) {}
  data: any; // To hold your data
  apiUrl: string = 'https://uat.smartassistapp.in/api/superAdmin/dashbaordNew';

  ngOnInit(): void {
    // 1️⃣ Read persisted filter from localStorage
    const savedFilter = localStorage.getItem('selectedFilter') as FilterType;
    this.selectedFilter = savedFilter ?? 'DAY';

    // 2️⃣ Fetch data based on selected filter
    if (this.selectedFilter !== 'CUSTOM') {
      const apiFilter = this.mapFilterToApi(this.selectedFilter);
      this.fetchSuperAdminDashboard(apiFilter);
    }

    // Other initializations
    const savedData = localStorage.getItem('kpiData');
    if (savedData) {
      this.kpiData = { ...JSON.parse(savedData) };
    }
    this.currentDisplayCount = this.itemsPerPage;

    this.context.onSideBarClick$.next({
      role: 'dashboard',
      pageTitle: 'Dashboard',
    });
  }
  initializeDisplay() {
    this.currentDisplayCount = this.itemsPerPage;
  }

  toggleShow() {
    if (this.currentDisplayCount >= this.dealers.length) {
      this.currentDisplayCount = this.itemsPerPage;
    } else {
      this.currentDisplayCount = Math.min(
        this.dealers.length,
        this.currentDisplayCount + this.incrementSize
      );
    }
  }

  showLess() {
    this.currentDisplayCount = this.itemsPerPage;
  }

  get canShowMore(): boolean {
    return this.currentDisplayCount < this.dealers.length;
  }

  get canShowLess(): boolean {
    return this.currentDisplayCount > this.itemsPerPage;
  }

  get isShowingAll(): boolean {
    return this.currentDisplayCount >= this.dealers.length;
  }
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
  toggleCustomDatePicker() {
    if (!this.showCustomDatePicker) {
      this.customStartDate = '';
      this.customEndDate = '';
    }
    this.showCustomDatePicker = !this.showCustomDatePicker;
  }

  getFilterLabel(filter: string): string {
    const labels: Record<string, string> = {
      DAY: 'Today',
      YESTERDAY: 'Yesterday',
      WEEK: 'This Week',
      LAST_WEEK: 'Last Week',
      MTD: 'This Month',
      LAST_MONTH: 'Last Month',
      QTD: 'This Quarter',
      LAST_QUARTER: 'Last Quarter',
      SIX_MONTH: 'Last 6 Months',
      YTD: 'This Year',
      LIFETIME: 'Lifetime',
    };
    return labels[filter] || filter;
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

  getSortedUsers(dealerId: string) {
    console.log('🔥 getSortedUsers called for dealer', dealerId);

    const users = this.dealerUsers[dealerId] ?? [];
    console.log(
      '📊 Sorting dealer summary users:',
      dealerId,
      users.map((u) => ({
        user: u.user,
        saLeads: u.leads?.sa,
        totalCalls: u.calls?.total,
      }))
    );

    return [...users].sort((a, b) => {
      const saA = a.leads?.sa ?? 0;
      const saB = b.leads?.sa ?? 0;

      // 🔹 Sort by sa leads descending
      if (saB !== saA) {
        return saB - saA;
      }

      // 🔹 Then by active status (active first)
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;

      // 🔹 Then by name alphabetically
      return a.user.toLowerCase().localeCompare(b.user.toLowerCase());
    });
  }

  getSortedCallLogs(dealerId: string) {
    console.log('🔥 getSortedCallLogs called for dealer', dealerId);

    const users = this.userCallLogs[dealerId] ?? [];
    console.log(
      '📞 Sorting call log users:',
      dealerId,
      users.map((u) => ({
        user: u.name,
        totalCalls: u.calls?.total,
        saLeads: u.leads?.sa,
      }))
    );
    return [...users].sort((a, b) => {
      const totalA = a.calls?.total ?? 0;
      const totalB = b.calls?.total ?? 0;
      return totalB - totalA; // descending by total calls
    });
  }

  getSortedDealersForCallLogs() {
    const list =
      this.selectedDealers.length > 0 ? this.selectedDealers : this.dealers;
    if (!list) return [];

    return [...list].sort((a, b) => {
      const totalA = this.getDealerCalls(a)?.totalCalls ?? 0;
      const totalB = this.getDealerCalls(b)?.totalCalls ?? 0;
      return totalB - totalA; // descending
    });
  }

  getSortedDealersForSummary() {
    const list =
      this.selectedDealers.length > 0 ? this.selectedDealers : this.dealers;

    // If no sort column or default direction, return list
    if (!this.sortColumn || this.sortDirection === 'default') {
      return list;
    }

    const column = this.sortColumn; // TypeScript now knows this is string

    // In-place sort
    list.sort((a: any, b: any) => {
      const valA = a[column] ?? 0;
      const valB = b[column] ?? 0;
      return this.sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }

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

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage!');
      return;
    }

    const apiType = this.mapTimeToApi(time);

    this.dashboardService.getDealers(apiType, token).subscribe((res: any) => {
      console.log('API Response dealerssssssssssss:', res);
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
    if (this.totalTestDrives() && this.totalOrders()) {
      this.doughnutChart(this.totalTestDrives(), this.totalOrders()); // 👈 changed
    }
    const header = document.querySelector('.sticky-header') as HTMLElement;
    if (header) {
      this.originalHeaderOffsetTop = header.offsetTop; // store original position once
    }
  }

  onFilterClick(filter: 'MTD' | 'QTD' | 'YTD') {}

  toggleShowAllSMs(dealerId: string) {
    this.showAllSMs[dealerId] = !this.showAllSMs[dealerId];
  }

  private mapFilterToApi(
    filter:
      | 'DAY'
      | 'YESTERDAY'
      | 'WEEK'
      | 'LAST_WEEK'
      | 'MTD'
      | 'LAST_MONTH'
      | 'QTD'
      | 'LAST_QUARTER'
      | 'SIX_MONTH'
      | 'YTD'
      | 'LIFETIME'
      | 'CUSTOM'
  ):
    | 'DAY'
    | 'YESTERDAY'
    | 'WEEK'
    | 'LAST_WEEK'
    | 'MTD'
    | 'LAST_MONTH'
    | 'QTD'
    | 'LAST_QUARTER'
    | 'SIX_MONTH'
    | 'YTD'
    | 'LIFETIME'
    | 'CUSTOM' {
    switch (filter) {
      case 'DAY':
        return 'DAY';
      case 'YESTERDAY':
        return 'YESTERDAY';
      case 'WEEK':
        return 'WEEK';
      case 'LAST_WEEK':
        return 'LAST_WEEK';
      case 'MTD':
        return 'MTD'; // ✅ backend expects lowercase "month"
      case 'LAST_MONTH':
        return 'LAST_MONTH'; // ✅ backend expects lowercase "month"
      case 'QTD':
        return 'QTD';
      case 'LAST_QUARTER':
        return 'LAST_QUARTER';
      case 'SIX_MONTH':
        return 'SIX_MONTH';
      case 'YTD':
        return 'YTD';
      case 'LIFETIME':
        return 'LIFETIME';
      case 'CUSTOM':
        return 'CUSTOM';
    }
  }

  toggleNameSelection(dealer: any): void {
    // show loader
    this.isLoading = true;

    if (this.isDealerSelected(dealer)) {
      // remove if already selected
      this.selectedDealers = this.selectedDealers.filter(
        (d) => d.dealerName !== dealer.dealerName
      );
    } else {
      // add dealer
      this.selectedDealers.push(dealer);
    }

    // or refresh dashboard data
    this.fetchSuperAdminDashboard(this.selectedFilter);
  }

  // onFilterChange(filter: FilterType): void {
  //   // Reset tables and states
  //   this.expandedRow = null;
  //   this.dealerUsers = {};
  //   this.userCallLogs = {};
  //   this.dealerCallLogs = {};

  //   this.selectedFilter = filter;

  //   // Persist selection
  //   localStorage.setItem('selectedFilter', filter);

  //   if (filter === 'CUSTOM') {
  //     // Only show date inputs, do NOT call API yet
  //     return;
  //   }

  //   // For normal filters, call API immediately
  //   const apiFilter = this.mapFilterToApi(filter);
  //   this.fetchSuperAdminDashboard(apiFilter);
  // }
  onFilterChange(filter: FilterType): void {
    // Collapse expanded rows completely
    this.expandedSummaryRow = null;
    this.expandedRow = null; // <- Reset call logs row

    // Clear all dealer/user data
    this.dealerUsers = {};
    this.userCallLogs = {};
    this.dealerCallLogs = {};

    // Detect changes immediately
    this.cd.detectChanges();

    // Set the new filter
    this.selectedFilter = filter;
    localStorage.setItem('selectedFilter', filter);

    if (filter === 'CUSTOM') return;

    const apiFilter = this.mapFilterToApi(filter);
    this.fetchSuperAdminDashboard(apiFilter);
  }

  fetchDealerSMs(
    dealerId: string,
    type: 'MTD' | 'QTD' | 'YTD',
    activeSMId?: string
  ) {
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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

  updateProgressAndColor(change: number) {
    this.changeDisplay = change;
    this.progressValue = this.getProgressFromChange(change);
    this.strokeColor = this.getStrokeColor(change);
    this.cdr.detectChanges(); // ✅ trigger update
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
  // DEALER PAGIANTOON
  get totalPagesdealer(): number {
    return Math.ceil(this.dealers.length / this.dealersPerPage);
  }

  loadKpiData(type: string = 'DAY') {
    // Get token from session storage
    const token = localStorage.getItem('token');

    // Set headers with Bearer token
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    this.http
      .get<any>(
        `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?type=${type}`,
        { headers }
      )
      .subscribe({
        next: (res) => {
          if (res.status === 200 && res.data) {
            // Replace entire object with API response
            this.kpiData = { ...res.data };

            // Persist full object in localStorage
            localStorage.setItem('kpiData', JSON.stringify(this.kpiData));

            // Force Angular to detect changes
            this.cd.detectChanges();
          }
        },
        error: (err) => console.error('Error fetching KPI data:', err),
      });
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

  onPageChange(page: number): void {
    const totalPages = Math.ceil(this.dealers.length / this.itemsPerPage);

    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      // this.updatePaginatedDealers();
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

  onSMClick(sm: any): void {
    this.selectedSM = sm;
    this.selectedDealer = null;
    this.currentPage = 1;
    this.ps1Data = []; // Clear old PS data immediately // this.fetchPS1Data(); // no argument
  }

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
    console.log(`Loading dealers for page ${page}`);
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

  changeTablePage(tableId: string, direction: number): void {
    console.log(`Changing page for ${tableId} by ${direction}`);
  }

  // Add search functionality
  searchDealer(searchTerm: string): void {
    console.log('Searching for:', searchTerm);
  }

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

  private initializeFilters(): void {
    const filterElements = document.querySelectorAll(
      'select, input[type="date"]'
    ) as NodeListOf<HTMLElement>;
    filterElements.forEach((element: HTMLElement) => {
      element.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        console.log('Filter changed:', target.value);
        this.handleFilterChange(target.value);
      });
    });
  }

  private handleFilterChange(value: string): void {
    console.log('Handling filter change:', value);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchDealer(target.value);
  }

  fetchSuperAdminDashboard(type: string): void {
    this.isLoading = true;

    console.log('🚀 fetchSuperAdminDashboard called with:', type);
    console.log(
      '📍 Selected dealers:',
      this.selectedDealers?.length,
      this.selectedDealers
    );

    let url = '';
    const isCustomMode =
      this.selectedFilter === 'CUSTOM' &&
      this.customStartDate &&
      this.customEndDate;

    if (!this.selectedDealers?.length) {
      url = isCustomMode
        ? `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?start_date=${this.customStartDate}&end_date=${this.customEndDate}`
        : `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?type=${type}`;
    } else if (this.selectedDealers.length === 1) {
      url = isCustomMode
        ? `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?dealer_id=${this.selectedDealers[0].dealerId}&start_date=${this.customStartDate}&end_date=${this.customEndDate}`
        : `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?dealer_id=${this.selectedDealers[0].dealerId}&type=${type}`;
    } else {
      const dealerIds = this.selectedDealers.map((d) => d.dealerId).join(',');
      url = isCustomMode
        ? `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?dealerIds=${dealerIds}&start_date=${this.customStartDate}&end_date=${this.customEndDate}`
        : `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?dealerIds=${dealerIds}&type=${type}`;
    }

    console.log('🌐 API URL:', url);

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage!');
      this.isLoading = false;
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any>(url, { headers }).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('📦 Full API Response:', res);

        if (res?.status === 200 && res.data) {
          const globalDealers = res.data.dealers ?? 0;
          const globalActiveNetwork = res.data.activeNetwork ?? 0;

          let updatedKpi = {
            dealers: globalDealers,
            activeNetwork: globalActiveNetwork,
            users: res.data.users ?? 0,
            activeUsers: res.data.activeUsers ?? 0,
            leads: res.data.leads ?? 0,
            calls: res.data.calls ?? 0,
            totalFollowUps: res.data.totalFollowUps ?? 0,
            uniqueTestDrives: res.data.uniqueTestDrives ?? 0,
            completedTestDrives: res.data.completedTestDrives ?? 0,
          };

          const newDealerData = res.data.dealerData ?? [];
          console.log('🏪 Previous dealers count:', this.dealers?.length || 0);
          console.log('🏪 New dealers count:', newDealerData.length);

          // Replace dealers
          this.dealers = [...newDealerData];

          this.dealers.forEach((d) => {
            if (!d.callLogs)
              d.callLogs = {
                totalCalls: 0,
                outgoing: 0,
                incoming: 0,
                connected: 0,
                declined: 0,
                durationSec: 0,
              };
            else if (!d.callLogs.totalCalls) d.callLogs.totalCalls = 0;
          });

          // --- Sort dealers for summary table (saLeads → totalCalls) ---
          this.dealers.sort(
            (a, b) => Number(b.saLeads ?? 0) - Number(a.saLeads ?? 0)
          );

          this.originalDealers = [...this.dealers];
          this.filteredDealers = [...this.dealers];

          // --- Sort users inside each dealer (totalCalls) ---
          this.dealers.forEach((dealer) => {
            const users = dealer.users ?? [];
            const mappedUsers = [...users].map((u) => ({
              userId: u.user_id,
              user: u.user,
              calls: u.calls ?? {},
              enquiriesCalls: u.enquiriesCalls ?? {},
              coldCalls: u.coldCalls ?? {},
            }));

            dealer.users = mappedUsers; // <-- update dealer.users
            this.userCallLogs[dealer.dealerId] = mappedUsers;
          });

          // --- Select all dealers on first load, otherwise preserve selection ---
          if (this.isInitialLoad) {
            if (this.dealers.length > 0) {
              this.selectedDealers = [...this.dealers];
              this.isAllSelected = true;
            }
            this.isInitialLoad = false;
          } else {
            // Preserve existing selection
            if (this.selectedDealers?.length > 0) {
              this.selectedDealers = this.selectedDealers
                .map((sel) =>
                  this.dealers.find((d) => d.dealerId === sel.dealerId)
                )
                .filter(Boolean);
            }
          }

          // Ensure isAllSelected is correct
          this.isAllSelected =
            this.selectedDealers.length === this.dealers.length;

          // Sort selected dealers by totalCalls for call logs
          this.selectedDealers.sort(
            (a, b) =>
              Number(b.callLogs?.totalCalls ?? 0) -
              Number(a.callLogs?.totalCalls ?? 0)
          );

          // --- KPI calculation (added isAllSelected support) ---
          if (this.isAllSelected) {
            // ✅ New: use global totals when all selected
            updatedKpi = {
              dealers: globalDealers,
              activeNetwork: globalActiveNetwork,
              users: res.data.users ?? 0,
              activeUsers: res.data.activeUsers ?? 0,
              leads: res.data.leads ?? 0,
              calls: res.data.calls ?? 0,
              totalFollowUps: res.data.totalFollowUps ?? 0,
              uniqueTestDrives: res.data.uniqueTestDrives ?? 0,
              completedTestDrives: res.data.completedTestDrives ?? 0,
            };
          } else if (this.selectedDealers?.length === 1) {
            const dealer = this.dealers.find(
              (d) => d.dealerId === this.selectedDealers[0].dealerId
            );
            if (dealer) {
              updatedKpi = {
                dealers: globalDealers,
                activeNetwork: globalActiveNetwork,
                users: dealer.totalUsers ?? 0,
                activeUsers: dealer.activeUsers ?? 0,
                leads: dealer.saLeads ?? dealer.totalLeads ?? 0,
                calls: dealer.callLogs?.totalCalls ?? 0,
                totalFollowUps:
                  dealer.saFollowUps ?? dealer.totalFollowUps ?? 0,
                uniqueTestDrives: dealer.uniqueTestDrives ?? 0,
                completedTestDrives: dealer.completedTestDrives ?? 0,
              };
            }
          } else if (this.selectedDealers?.length > 1) {
            const sum = this.selectedDealers.reduce(
              (acc, sel) => {
                const dealer = this.dealers.find(
                  (d) => d.dealerId === sel.dealerId
                );
                if (dealer) {
                  acc.users += dealer.totalUsers ?? 0;
                  acc.activeUsers += dealer.activeUsers ?? 0;
                  acc.leads += dealer.saLeads ?? dealer.totalLeads ?? 0;
                  acc.calls += dealer.callLogs?.totalCalls ?? 0;
                  acc.totalFollowUps +=
                    dealer.saFollowUps ?? dealer.totalFollowUps ?? 0;
                  acc.uniqueTestDrives += dealer.uniqueTestDrives ?? 0;
                  acc.completedTestDrives += dealer.completedTestDrives ?? 0;
                }
                return acc;
              },
              {
                users: 0,
                activeUsers: 0,
                leads: 0,
                calls: 0,
                totalFollowUps: 0,
                uniqueTestDrives: 0,
                completedTestDrives: 0,
              }
            );

            updatedKpi = {
              dealers: globalDealers,
              activeNetwork: globalActiveNetwork,
              ...sum,
            };
          }

          this.kpiData = { ...updatedKpi };
          this.cdr.detectChanges();

          // this.chartOptions = {
          //   series: [
          //     { name: 'Series 1', data: [44, 55, 41, 64, 22, 43, 21] },
          //     { name: 'Series 2', data: [53, 32, 33, 52, 13, 44, 32] },
          //   ],
          //   chart: {
          //     type: 'bar',
          //     height: 430,
          //     stacked: true, // ✅ important for combined tooltip
          //   },
          //   plotOptions: {
          //     bar: {
          //       horizontal: true,
          //       dataLabels: { position: 'top' },
          //     },
          //   },
          //   dataLabels: {
          //     enabled: true,
          //     offsetX: -6,
          //     style: { fontSize: '12px', colors: ['#fff'] },
          //   },
          //   stroke: { show: true, width: 1, colors: ['#fff'] },
          //   tooltip: {
          //     shared: true,
          //     intersect: false,
          //     custom: (opts: any) => {
          //       const dataPointIndex = opts.dataPointIndex;
          //       const w = opts.w;
          //       const dealerName = w.globals.labels[dataPointIndex];
          //       let tooltipText = `<strong>${dealerName}</strong><br/>`;
          //       w.config.series.forEach((s: any) => {
          //         const value = s.data[dataPointIndex];
          //         tooltipText += `${s.name}: ${value}<br/>`;
          //       });
          //       return tooltipText;
          //     },
          //   },
          //   xaxis: {
          //     categories: [
          //       'Total Calls',
          //       'Outgoing',
          //       'Incoming',
          //       'Declined',
          //       'Connected',
          //       'Duration',
          //     ],
          //   },
          //   title: {
          //     text: 'Dealer-wise Calls Analysis (Dummy Data)',
          //     align: 'left',
          //   },
          //   legend: {
          //     show: true,
          //     position: 'bottom',
          //     horizontalAlign: 'center',
          //     markers: { width: 12, height: 12 },
          //   },
          // } as any;

          const targetDealers =
            this.selectedDealers.length > 0
              ? this.selectedDealers
              : this.dealers;

          this.chartOptions = {
            series: [
              {
                name: 'Total Calls',
                data: targetDealers.map(
                  (d) => this.getDealerCalls(d)?.totalCalls ?? 0
                ),
              },
              {
                name: 'Incoming',
                data: targetDealers.map(
                  (d) => this.getDealerCalls(d)?.incoming ?? 0
                ),
              },
              {
                name: 'Outgoing',
                data: targetDealers.map(
                  (d) => this.getDealerCalls(d)?.outgoing ?? 0
                ),
              },
              {
                name: 'Connected',
                data: targetDealers.map(
                  (d) => this.getDealerCalls(d)?.connected ?? 0
                ),
              },
              {
                name: 'Declined',
                data: targetDealers.map(
                  (d) => this.getDealerCalls(d)?.declined ?? 0
                ),
              },
            ],
            chart: {
              type: 'bar',
              height: 430,
              stacked: true,
            },
            plotOptions: {
              bar: {
                horizontal: true,

                dataLabels: { position: 'center' },
              },
            },
            dataLabels: {
              enabled: true,
              style: {
                fontSize: '12px',
                colors: ['#fff'],
              },
            },
            stroke: {
              show: true,
              width: 1,
              colors: ['#fff'],
            },
            tooltip: {
              shared: true,
              intersect: false,
              y: {
                formatter: (val, opts) => {
                  const dealerName =
                    opts?.w?.globals?.labels[opts.dataPointIndex];
                  const series = opts?.w?.config?.series;
                  let tooltipText = `${dealerName}<br/>`;
                  series.forEach((s: any) => {
                    const value = s.data[opts.dataPointIndex];
                    tooltipText += `${s.name}: ${value}<br/>`;
                  });
                  return tooltipText;
                },
              },
            },
            xaxis: {
              categories: targetDealers.map((d) => d.dealerName), // ✅ only selected dealers
            },
            title: {
              text: 'Dealer-wise Calls Analysis',
              align: 'left',
            },
            legend: {
              show: true,
              position: 'bottom',
              horizontalAlign: 'center',
              markers: { size: 12 },
            },
            responsive: [
              {
                breakpoint: 768,
                options: {
                  xaxis: {
                    labels: {
                      rotate: -60,
                      style: { fontSize: '9px' },
                    },
                  },
                  legend: {
                    position: 'bottom',
                    fontSize: '10px',
                  },
                },
              },
              {
                breakpoint: 480,
                options: {
                  xaxis: {
                    labels: {
                      show: true,
                      rotate: -75,
                      style: { fontSize: '8px' },
                    },
                  },
                  legend: {
                    position: 'bottom',
                    fontSize: '8px',
                  },
                },
              },
            ],
          };

          console.log('Chart series:', this.chartOptions.series);
        } else {
          this.dealers = [];
          this.filteredDealers = [];
          this.userCallLogs = {};
          this.kpiData = {
            dealers: 0,
            activeNetwork: 0,
            users: 0,
            activeUsers: 0,
            leads: 0,
            calls: 0,
            totalFollowUps: 0,
            uniqueTestDrives: 0,
            completedTestDrives: 0,
          };
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ API failed:', err);
        this.dealers = [];
        this.filteredDealers = [];
        this.userCallLogs = {};
        this.kpiData = {
          dealers: 0,
          activeNetwork: 0,
          users: 0,
          activeUsers: 0,
          leads: 0,
          calls: 0,
          totalFollowUps: 0,
          uniqueTestDrives: 0,
          completedTestDrives: 0,
        };
      },
    });
  }

  private aggregateDealerData(selected: any[]): any {
    const agg = {
      dealers: selected.length,
      activeNetwork: selected.length,
      users: 0,
      activeUsers: 0,
      leads: 0, // 👈 use saLeads instead of overall leads
      calls: 0,
      totalFollowUps: 0,
      uniqueTestDrives: 0,
      completedTestDrives: 0,
    };

    selected.forEach((d) => {
      agg.users += d.totalUsers || 0;
      agg.activeUsers += d.activeUsers || 0;
      agg.leads += d.saLeads || 0; // 👈 only SmartAssist leads
      agg.calls += d.calls || 0;
      agg.totalFollowUps += d.totalFollowUps || 0;
      agg.uniqueTestDrives += d.uniqueTestDrives || 0;
      agg.completedTestDrives += d.completedTestDrives || 0;
    });

    return agg;
  }
  // Map & normalize user call logs for each dealer
  private buildUserCallLogs(): void {
    this.dealers.forEach((dealer) => {
      const users = dealer.users ?? [];

      // Normalize calls object for each user
      this.userCallLogs[dealer.dealerId] = users.map((u: any) => ({
        userId: u.user_id,
        name: u.user,
        calls: {
          total: u.calls?.totalCalls ?? 0, // map API → template format
          outgoing: u.calls?.outgoing ?? 0,
          incoming: u.calls?.incoming ?? 0,
          connected: u.calls?.connected ?? 0,
          declined: u.calls?.declined ?? 0,
          durationSec: u.calls?.durationSec ?? 0,
        },
      }));
    });
  }

  fetchDealers(filter: 'MTD' | 'QTD' | 'YTD') {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/view-activities?type=${filter}`;

    this.http.get<any>(url, { headers }).subscribe(
      (res) => {
        if (res?.status === 200 && res.data?.dealerData) {
          this.dealers = res.data.dealerData;

          // Initialize dealerSMS for each dealer
          this.dealers.forEach((dealer) => {
            if (!this.dealerSMS[dealer.dealer_id]) {
              this.dealerSMS[dealer.dealer_id] = [];
            }
          });
        } else {
          this.dealers = []; // clear if no data
        }
      },
      (err) => {
        console.error('Error fetching dealers:', err);
        this.dealers = []; // clear on error
      }
    );
  }

  applyCustomDate() {
    if (!this.customStartDate || !this.customEndDate) {
      this.toastr.warning('Please select both start and end dates', 'Warning');
      return;
    }

    if (new Date(this.customEndDate) < new Date(this.customStartDate)) {
      this.toastr.error('End date cannot be earlier than start date', 'Error');
      return;
    }

    this.isLoading = true;
    this.selectedFilter = 'CUSTOM';

    this.fetchSuperAdminDashboard('CUSTOM'); // Call API with proper dates
  }

  resetCustomDate() {
    this.customStartDate = '';
    this.customEndDate = '';

    this.selectedFilter = 'DAY';

    this.invalidDateRange = false; // ✅ reset validation

    // ✅ Show loader
    this.isLoading = true;

    // Fetch default data
    this.onFilterChange(this.selectedFilter);

    // Remove applied visual effect
    const inputs = document.querySelector('.custom-inputs');
    if (inputs) {
      inputs.classList.remove('applied');
    }
  }
  validateCustomDates() {
    if (this.customStartDate && this.customEndDate) {
      const start = new Date(this.customStartDate);
      const end = new Date(this.customEndDate);

      this.invalidDateRange = start > end; // disable if invalid
    } else {
      this.invalidDateRange = false; // reset when dates are empty
    }
  }
  formatDuration(sec: number): string {
    const h = Math.floor(sec / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  toggleRow(event: Event, dealer: any): void {
    const id = dealer.dealerId;
    if (!id) return;

    // Toggle row expansion for summary only
    this.expandedRow = this.expandedRow === id ? null : id;

    const token = localStorage.getItem('token');
    if (!token) return;

    this.loadingUsers[id] = true;

    let request$;
    if (
      this.selectedFilter === 'CUSTOM' &&
      this.customStartDate &&
      this.customEndDate
    ) {
      request$ = this.dashboardService.getDealersByCustomDate(
        this.customStartDate,
        this.customEndDate,
        token,
        id
      );
    } else {
      request$ = this.dashboardService.getDealerUsers(
        id,
        this.selectedFilter,
        token
      );
    }

    request$.subscribe({
      next: (res: any) => {
        this.loadingUsers[id] = false;

        const dealerData = Array.isArray(res?.data?.dealerData)
          ? res.data.dealerData.find((d: any) => d.dealerId === id)
          : res?.data?.dealerData;

        if (!dealerData) {
          this.dealerUsers[id] = [];
          return;
        }

        // ✅ Only set dealerUsers (for summary table)
        this.dealerUsers[id] = dealerData.users || [];

        this.cd.detectChanges();
      },
      error: (err) => {
        this.loadingUsers[id] = false;
        console.error(err);
        this.dealerUsers[id] = [];
      },
    });
  }

  fetchDealersWithCustomDate(start: string, end: string) {
    const token = localStorage.getItem('token');

    // Determine if we need to pass dealer ID
    let dealerId = undefined;
    if (this.selectedDealers?.length === 1) {
      dealerId = this.selectedDealers[0].dealerId;
    }

    // Call the service with dealer ID if needed
    this.dashboardService
      .getDealersByCustomDate(start, end, token!, dealerId)
      .subscribe({
        next: (res: any) => {
          this.ngZone.run(() => {
            if (res?.status === 200 && res.data) {
              const globalDealers = res.data.dealers ?? 0;
              const globalActiveNetwork = res.data.activeNetwork ?? 0;

              // Default KPI - Always start with global values
              let updatedKpi = {
                dealers: globalDealers,
                activeNetwork: globalActiveNetwork,
                users: res.data.users ?? 0,
                activeUsers: res.data.activeUsers ?? 0,
                leads: res.data.leads ?? 0,
                calls: res.data.calls ?? 0,
                totalFollowUps: res.data.totalFollowUps ?? 0,
                uniqueTestDrives: res.data.uniqueTestDrives ?? 0,
                completedTestDrives: res.data.completedTestDrives ?? 0,
              };

              // Update dealers array first
              this.dealers = res.data.dealerData ?? [];
              this.filteredDealers = [...this.dealers];

              // Sync selected dealers with fresh data
              if (this.selectedDealers?.length > 0) {
                this.selectedDealers = this.selectedDealers.map(
                  (selectedDealer) => {
                    const freshDealer = this.dealers.find(
                      (d) => d.dealerId === selectedDealer.dealerId
                    );
                    return freshDealer || selectedDealer;
                  }
                );
              }

              // Single dealer override
              if (this.selectedDealers?.length === 1) {
                const dealer = this.dealers.find(
                  (d: any) => d.dealerId === this.selectedDealers[0].dealerId
                );

                if (dealer) {
                  updatedKpi = {
                    dealers: globalDealers,
                    activeNetwork: globalActiveNetwork,
                    users: dealer.totalUsers ?? 0,
                    activeUsers: dealer.activeUsers ?? 0,
                    leads: dealer.saLeads ?? dealer.totalLeads ?? 0,
                    calls: dealer.callLogs?.totalCalls ?? 0,
                    totalFollowUps:
                      dealer.saFollowUps ?? dealer.totalFollowUps ?? 0,
                    uniqueTestDrives: dealer.uniqueTestDrives ?? 0,
                    completedTestDrives: dealer.completedTestDrives ?? 0,
                  };
                }
              }

              // Multi-dealer sum
              else if (this.selectedDealers?.length > 1) {
                let sum = {
                  users: 0,
                  activeUsers: 0,
                  leads: 0,
                  calls: 0,
                  totalFollowUps: 0,
                  uniqueTestDrives: 0,
                  completedTestDrives: 0,
                };

                this.selectedDealers.forEach((sel) => {
                  const dealer = this.dealers.find(
                    (d: any) => d.dealerId === sel.dealerId
                  );
                  if (dealer) {
                    sum.users += dealer.totalUsers ?? 0;
                    sum.activeUsers += dealer.activeUsers ?? 0;
                    sum.leads += dealer.saLeads ?? dealer.totalLeads ?? 0;
                    sum.calls += dealer.callLogs?.totalCalls ?? 0;
                    sum.totalFollowUps +=
                      dealer.saFollowUps ?? dealer.totalFollowUps ?? 0;
                    sum.uniqueTestDrives += dealer.uniqueTestDrives ?? 0;
                    sum.completedTestDrives += dealer.completedTestDrives ?? 0;
                  }
                });

                updatedKpi = {
                  dealers: globalDealers,
                  activeNetwork: globalActiveNetwork,
                  ...sum,
                };
              }

              // Assign final KPI data
              this.kpiData = { ...updatedKpi };

              // Sort dealers by leads
              this.dealers.sort((a: any, b: any) => {
                const leadsA =
                  (a.saLeads || 0) +
                  (a.cxpLeads || 0) +
                  (a.icsLeads || 0) +
                  (a.manuallyEnteredLeads || 0);
                const leadsB =
                  (b.saLeads || 0) +
                  (b.cxpLeads || 0) +
                  (b.icsLeads || 0) +
                  (b.manuallyEnteredLeads || 0);
                return leadsB - leadsA;
              });

              // Chart refresh
              const categories = this.dealers.map((d: any) => d.dealerName);
              const connected = this.dealers.map(
                (d: any) => d.callLogs?.connected ?? 0
              );
              const declined = this.dealers.map(
                (d: any) => d.callLogs?.declined ?? 0
              );
              const durationSec = this.dealers.map(
                (d: any) => d.callLogs?.durationSec ?? 0
              );
              const incoming = this.dealers.map(
                (d: any) => d.callLogs?.incoming ?? 0
              );
              const outgoing = this.dealers.map(
                (d: any) => d.callLogs?.outgoing ?? 0
              );
              const totalCalls = this.dealers.map(
                (d: any) => d.callLogs?.totalCalls ?? 0
              );

              // this.chartOptions = {
              //   ...this.chartOptions,
              //   series: [
              //     { name: 'Total Calls', data: totalCalls },
              //     { name: 'Outgoing Calls', data: outgoing },
              //     { name: 'Incoming Calls', data: incoming },
              //     { name: 'Duration Sec', data: durationSec },
              //     { name: 'Declined Calls', data: declined },
              //     { name: 'Connected Calls', data: connected },
              //   ],
              //   xaxis: { categories },
              // };
              this.chartOptions = {
                series: [
                  { name: 'Total Calls', data: totalCalls },
                  { name: 'Outgoing Calls', data: outgoing },
                  { name: 'Incoming Calls', data: incoming },
                  { name: 'Duration Sec', data: durationSec },
                  { name: 'Declined Calls', data: declined },
                  { name: 'Connected Calls', data: connected },
                ],
                chart: { type: 'bar', height: 430 },
                plotOptions: {
                  // ✅ THIS PART IS MISSING IN YOUR DYNAMIC CHART
                  bar: { horizontal: true, dataLabels: { position: 'top' } },
                },
                dataLabels: {
                  enabled: true,
                  offsetX: -6,
                  style: { fontSize: '12px', colors: ['#fff'] },
                },
                stroke: { show: true, width: 1, colors: ['#fff'] },
                tooltip: { shared: true, intersect: false },
                xaxis: { categories },
                title: { text: 'Dealer-wise Calls Analysis', align: 'left' },
                legend: {
                  show: true,
                  position: 'bottom',
                  horizontalAlign: 'center',
                },
              } as any;
              // Force UI refresh
              this.cdr.detectChanges();
            } else {
              this.dealers = [];
              this.kpiData = {
                dealers: 0,
                activeNetwork: 0,
                users: 0,
                activeUsers: 0,
                leads: 0,
                calls: 0,
                totalFollowUps: 0,
                uniqueTestDrives: 0,
                completedTestDrives: 0,
              };
            }

            // Hide loader when API success finishes
            this.isLoading = false;
          });
        },
        error: (err) => {
          console.error(err);
          this.ngZone.run(() => {
            this.dealers = [];
            this.kpiData = {
              dealers: 0,
              activeNetwork: 0,
              users: 0,
              activeUsers: 0,
              leads: 0,
              calls: 0,
              totalFollowUps: 0,
              uniqueTestDrives: 0,
              completedTestDrives: 0,
            };
            this.isLoading = false;
          });
        },
      });
  }
  updatePaginatedDealers() {
    this.paginatedDealers = this.dealers.slice(0, this.currentDisplayCount);
  }
  onDealerSelectionChange() {
    // Check if we're in custom mode
    if (
      this.selectedFilter === 'CUSTOM' &&
      this.customStartDate &&
      this.customEndDate
    ) {
      // For custom date range, call the custom API
      this.fetchDealersWithCustomDate(this.customStartDate, this.customEndDate);
    } else {
      // For regular filters, call the regular API
      const apiFilter = this.mapFilterToApi(this.selectedFilter);
      this.fetchSuperAdminDashboard(apiFilter);
    }
  }

  onDealerClick(dealerId: string, type: string) {
    const token = localStorage.getItem('token')!;

    if (
      this.selectedFilter === 'CUSTOM' &&
      this.customStartDate &&
      this.customEndDate
    ) {
      // For custom date mode, build URL with start_date and end_date parameters
      const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?dealer_id=${dealerId}&start_date=${this.customStartDate}&end_date=${this.customEndDate}`;

      this.http
        .get(url, { headers: { Authorization: `Bearer ${token}` } })
        .subscribe((res) => {
          console.log('Custom dealer response', res);
        });
    } else {
      // Fallback: legacy API with type
      const url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM?dealer_id=${dealerId}&type=${type}`;
      this.http
        .get(url, { headers: { Authorization: `Bearer ${token}` } })
        .subscribe((res) => {
          console.log('Non-custom dealer response', res);
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
  }

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
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No token found in localStorage');
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

  showMore() {
    this.currentDisplayCount += this.itemsPerPage;
    this.updateDisplayedDealers();
  }
  showMoreVisible: boolean = true;

  showMoreTable1() {
    const list =
      this.selectedDealers.length > 0 ? this.selectedDealers : this.dealers;
    if (this.table1Length < list.length) {
      this.table1Length += 10;
    }
  }

  showLessTable1() {
    this.table1Length = 10;
  }

  showMoreTable2() {
    const list = this.dealers; // yaha selectedDealers ka concept nahi hai, sirf dealers hai
    if (this.table2Length < list.length) {
      this.table2Length += 10;
    }
  }

  showLessTable2() {
    this.table2Length = 10;
  }

  // dealerEngagementView(type: 'table' | 'chart' | 'enquiries' | 'coldcalls') {
  //   if (type === 'table' || type === 'chart') {
  //     this.dealerSummaryCallsViewType = type; // handle tab
  //   } else {
  //     this.dealerSummaryCallsDataType = type; // handle dropdown
  //   }

  //   // Load data based on both selections
  //   this.loadDealerData(
  //     this.dealerSummaryCallsDataType,
  //     this.dealerSummaryCallsViewType
  //   );
  // }
  dealerEngagementView(type: 'table' | 'chart' | 'enquiries' | 'coldcalls') {
    if (type === 'table' || type === 'chart') {
      this.dealerSummaryCallsViewType = type;
    } else {
      this.dealerSummaryCallsDataType = type;

      // ✅ Close any open user call logs table when switching data type
      this.expandedRow = null;

      // ✅ Refresh chart when data type changes
      this.updateDealerChart();
    }

    // ✅ Refresh dealer table
    this.loadDealerData(
      this.dealerSummaryCallsDataType,
      this.dealerSummaryCallsViewType
    );

    // ✅ Refresh user table for expanded row
    this.refreshUserCallLogsForFilterChange();
  }

  refreshUserCallLogs(dealer: any) {
    const id = dealer.dealerId;
    const usersFromLogs = this.userCallLogs[id] ?? [];

    // Update calls based on selected type
    this.userCallLogs[id] = [
      ...usersFromLogs.map((userLog: any) => {
        const userData =
          dealer.users?.find((u: any) => u.user_id === userLog.userId) || {};
        const calls = this.getUserCalls(userData);
        const durationSec = Number(calls?.durationSec ?? calls?.duration ?? 0);

        return {
          userId: userData.user_id || userLog.userId,
          name: userData.user || userLog.name,
          calls: {
            total: Number(calls?.totalCalls ?? 0),
            outgoing: Number(calls?.outgoing ?? 0),
            incoming: Number(calls?.incoming ?? 0),
            connected: Number(calls?.connected ?? 0),
            declined: Number(calls?.declined ?? 0),
            duration: this.formatDuration(durationSec),
            durationSec,
          },
        };
      }),
    ];
  }

  refreshUserCallLogsForFilterChange() {
    if (!this.expandedRow) return;

    const dealer = this.dealersData.find(
      (d) => d.dealerId === this.expandedRow
    );
    if (!dealer) return;

    const id = dealer.dealerId;

    // Recompute userCallLogs using getUserCalls()
    this.userCallLogs[id] =
      dealer.users?.map((user: any) => {
        const calls = this.getUserCalls(user); // this recalculates based on current filter
        const durationSec = Number(calls?.durationSec ?? calls?.duration ?? 0);

        return {
          userId: user.user_id,
          name: user.user,
          calls: {
            total: Number(calls?.totalCalls ?? 0),
            outgoing: Number(calls?.outgoing ?? 0),
            incoming: Number(calls?.incoming ?? 0),
            connected: Number(calls?.connected ?? 0),
            declined: Number(calls?.declined ?? 0),
            duration: this.formatDuration(durationSec),
            durationSec,
          },
        };
      }) || [];
  }

  loadDealerData(
    dataType: 'enquiries' | 'coldcalls',
    viewType: 'table' | 'chart'
  ) {
    // map API response to only pick relevant call data
    this.filteredDealerData = this.dealersData.map((dealer) => {
      return {
        dealerId: dealer.dealerId,
        dealerName: dealer.dealerName,
        totalCalls:
          dataType === 'enquiries'
            ? dealer.enquiriesCalls.totalCalls
            : dealer.coldCalls.totalCalls,
        connectedCalls:
          dataType === 'enquiries'
            ? dealer.enquiriesCalls.connectedCalls
            : dealer.coldCalls.connectedCalls,
      };
    });
  }
  updateDisplayedDealers() {
    this.displayedDealers = this.dealers.slice(0, this.itemsToShow);
    this.showMoreVisible = this.itemsToShow < this.dealers.length;
  }

  fetchDashboardData(type: 'MTD' | 'QTD' | 'YTD' = 'MTD') {
    const token = localStorage.getItem('token');
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
  trackByDealerId(index: number, dealer: any) {
    return dealer.dealer_id;
  }
  getChangePercentage(): number {
    return this.data?.leads?.change || 0; // Default to 0 if not available
  }

  getLeadPercentageChange(): number {
    console.log(this.dashboardData);
    console.log(this.dashboardData?.leads?.change);

    return this.dashboardData?.leads?.change || 0;
  }

  sortData(column: string) {
    // Toggle sort direction
    if (this.sortColumn === column) {
      this.sortDirection =
        this.sortDirection === 'asc'
          ? 'desc'
          : this.sortDirection === 'desc'
          ? 'default'
          : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // No sorting if reset
    if (this.sortDirection === 'default') return;

    // Only sort selectedDealers (displayed rows)
    if (!this.selectedDealers?.length) return;

    // In-place sort to preserve references
    this.selectedDealers.sort((a: any, b: any) => {
      const valA = a[column] ?? 0;
      const valB = b[column] ?? 0;
      return this.sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }

  fetchDashboardDataForTopCards(filter: string) {
    const token = localStorage.getItem('token') || '';
    let url = `https://uat.smartassistapp.in/api/superAdmin/dashboard/NoSM`;

    if (filter === 'CUSTOM' && this.customStartDate && this.customEndDate) {
      url += `?startDate=${this.customStartDate}&endDate=${this.customEndDate}`;
    } else if (filter !== 'CUSTOM') {
      url += `?type=${filter}`;
    }

    this.http
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.kpiData = res.data; // top cards
            this.dealers = res.data.dealerData; // table data
          }
        },
        error: (err) => {
          console.error('Error fetching dealer data:', err);
          this.dealers = [];
        },
      });
  }
  filterDealers() {
    const search = this.dealerSearch.toLowerCase();

    if (!search) {
      // 👉 If no search text, show all dealers
      this.filteredDealers = [...this.dealers];
      return;
    }

    this.filteredDealers = this.dealers.filter(
      (d) => d.dealerName?.toLowerCase().includes(search) // use correct field
    );
  }
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      // reset list when dropdown opens
      this.filteredDealers = [...this.dealers];
    }
  }

  toggleSelectAll(event: any) {
    const checked = event.target.checked;

    if (checked) {
      // Select all filtered dealers
      this.selectedDealers = [...this.filteredDealers];

      // ✅ Mark that all dealers are selected
      this.isAllSelected = true;
    } else {
      // Deselect all filtered dealers
      this.selectedDealers = [];
      this.isAllSelected = false;
    }

    // Call API after selection
    this.fetchSuperAdminDashboard(this.selectedFilter);
  }

  clearSelection(): void {
    this.selectedDealers = [];
    this.cdr.detectChanges(); // forces Angular to refresh view immediately
  }

  selectDealer(dealer: any) {
    this.selectedDealer = dealer;
    this.dealerSearch = '';
    this.dropdownOpen = false;

    // refresh dashboard with dealer-specific logic
    this.fetchSuperAdminDashboard('MTD');
  }
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (this.dropdownOpen) {
      const targetElement = event.target as HTMLElement;

      // 👉 check if clicked button that toggles dropdown
      const isToggleButton = targetElement.closest('.dropdown-toggle');

      if (!isToggleButton) {
        this.dropdownOpen = false;
      }
    }
  }

  isDealerSelected(dealer: any): boolean {
    return this.selectedDealers.some((d) => d.dealerId === dealer.dealerId);
  }

  toggleDealerSelection(dealer: any) {
    const index = this.selectedDealers.findIndex(
      (d) => d.dealerId === dealer.dealerId
    );
    if (index > -1) {
      this.selectedDealers.splice(index, 1);
    } else {
      this.selectedDealers.push(dealer);
    }

    // 🔥 Call the API after selection change
    this.fetchSuperAdminDashboard(this.selectedFilter);
  }
  areAllSelected(): boolean {
    if (!this.filteredDealers || this.filteredDealers.length === 0)
      return false;
    if (!this.selectedDealers || this.selectedDealers.length === 0)
      return false; // <- add this
    return this.filteredDealers.every((fd) =>
      this.selectedDealers.some((sd) => sd.dealerId === fd.dealerId)
    );
  }

  exportToCSV() {
    // Get the same list as the table is showing
    const dealersToExport = this.getSortedDealersForSummary();

    if (!dealersToExport || dealersToExport.length === 0) {
      console.warn('No dealers to export');
      return;
    }

    const headers = [
      'Dealer',
      'Total Users',
      'registerUsers',
      'Active Users',
      'Leads SA',
      'Leads Sync with CXP',
      'Leads Sync with ICS',
      'Digital Leads',
      'Follow-ups SA',
      'Follow-ups Sync with CXP',
      'Follow-ups Completed',
      'Follow-ups Upcoming',
      'Follow-ups Overdue',
      'Test Drives SA',
      'Test Drives Sync with CXP',
      'Test Drives Completed',
      'Test Drives Unique',
      'Test Drives Upcoming',
      'Test Drives Overdue',
      'Opportunities Converted',
    ];

    const rows = dealersToExport.map((dealer) => [
      `"${dealer.dealerName}"`,
      dealer.totalUsers || 0,
      dealer.registerUsers || 0,
      dealer.activeUsers || 0,
      dealer.saLeads || 0,
      dealer.cxpLeads || 0,
      dealer.icsLeads || 0,
      dealer.manuallyEnteredLeads || 0,
      dealer.saFollowUps || 0,
      dealer.cxpFollowUps || 0,
      dealer.completedFollowUps || 0,
      dealer.openFollowUps || 0,
      dealer.closedFollowUps || 0,
      dealer.saTestDrives || 0,
      dealer.cxpTestDrives || 0,
      dealer.completedTestDrives || 0,
      dealer.uniqueTestDrives || 0,
      dealer.upcomingTestDrives || 0,
      dealer.closedTestDrives || 0,
      dealer.opportunitiesConverted || 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'dealer_summary.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  trackByUserId(index: number, user: any) {
    return user.user_id; // Use unique ID if available, fallback to username
  }

  // exportDealerCalllogstocxp() {
  //   const list =
  //     this.selectedDealers.length > 0 ? this.selectedDealers : this.dealers;

  //   if (!list || list.length === 0) {
  //     console.warn('No dealers to export');
  //     return;
  //   }

  //   // ✅ Only include columns visible in the dealer call logs table
  //   const headers = [
  //     'Dealer',
  //     'Total Calls',
  //     'Outgoing',
  //     'Incoming',
  //     'Connected',
  //     'Declined',
  //     'Duration',
  //   ];

  //   const rows = list.map((dealer) => [
  //     `"${dealer.dealerName}"`,
  //     dealer.callLogs?.totalCalls || 0,
  //     dealer.callLogs?.outgoing || 0,
  //     dealer.callLogs?.incoming || 0,
  //     dealer.callLogs?.connected || 0,
  //     dealer.callLogs?.declined || 0,
  //     dealer.callLogs?.durationSec
  //       ? this.formatDuration(dealer.callLogs.durationSec) // ✅ format duration
  //       : '00:00:00',
  //   ]);

  //   const csvContent = [
  //     headers.join(','),
  //     ...rows.map((r) => r.join(',')),
  //   ].join('\n');

  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //   const url = URL.createObjectURL(blob);

  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = 'dealer_summary_calls.csv';
  //   a.style.display = 'none';
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);

  //   console.log('Dealer call logs CSV exported successfully');
  // }
  exportDealerCalllogstocxp() {
    // ✅ Use the same data as your table
    let list =
      this.displayedDealers?.length > 0
        ? [...this.displayedDealers] // clone to avoid mutating table data
        : this.selectedDealers.length > 0
        ? [...this.selectedDealers]
        : [...this.dealers];

    if (!list || list.length === 0) {
      console.warn('No dealers to export');
      return;
    }

    // ✅ Sort by totalCalls DESC (highest first)
    list.sort((a, b) => {
      const callsA = this.getDealerCalls(a)?.totalCalls || 0;
      const callsB = this.getDealerCalls(b)?.totalCalls || 0;
      return callsB - callsA;
    });

    const headers = [
      'Dealer',
      'Total Calls',
      'Outgoing',
      'Incoming',
      'Connected',
      'Declined',
      'Duration',
    ];

    const rows = list.map((dealer) => {
      const calls = this.getDealerCalls(dealer);

      return [
        `"${dealer.dealerName}"`,
        calls.totalCalls || 0,
        calls.outgoing || 0,
        calls.incoming || 0,
        calls.connected || 0,
        calls.declined || 0,
        calls.duration || '00:00:00',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'dealer_summary_calls.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Dealer call logs CSV exported successfully');
  }

  // toggleSummaryRow(event: Event, dealer: any): void {
  //   event.stopPropagation();
  //   const id = dealer.dealerId;
  //   this.expandedSummaryRow = this.expandedSummaryRow === id ? null : id;

  //   const token = localStorage.getItem('token');
  //   if (!token) return;

  //   // set loading state
  //   this.loadingUsers[id] = true;

  //   let request$;
  //   if (
  //     this.selectedFilter === 'CUSTOM' &&
  //     this.customStartDate &&
  //     this.customEndDate
  //   ) {
  //     request$ = this.dashboardService.getDealersByCustomDate(
  //       this.customStartDate,
  //       this.customEndDate,
  //       token,
  //       id
  //     );
  //   } else {
  //     request$ = this.dashboardService.getDealerUsers(
  //       id,
  //       this.selectedFilter,
  //       token
  //     );
  //   }

  //   request$.subscribe({
  //     next: (res: any) => {
  //       this.loadingUsers[id] = false;

  //       const dealerData = Array.isArray(res?.data?.dealerData)
  //         ? res.data.dealerData.find((d: any) => d.dealerId === id)
  //         : res?.data?.dealerData;

  //       if (!dealerData) {
  //         this.dealerUsers[id] = [];
  //         this.dealerCallLogs[id] = null;
  //         this.userCallLogs[id] = [];
  //         return;
  //       }

  //       // ✅ Save users
  //       this.dealerUsers[id] = dealerData.users || [];

  //       // ✅ Save dealer-level call logs
  //       this.dealerCallLogs[id] = dealerData.callLogs ?? null;

  //       // ✅ Map user call logs
  //       this.userCallLogs[id] =
  //         dealerData.users?.map((user: any) => {
  //           const durationSec = Number(user.calls?.durationSec ?? 0);

  //           return {
  //             userId: user.user_id,
  //             name: user.user,
  //             role: user.user_role,
  //             active: user.active,
  //             calls: {
  //               total: Number(user.calls?.totalCalls ?? 0),
  //               outgoing: Number(user.calls?.outgoing ?? 0),
  //               incoming: Number(user.calls?.incoming ?? 0),
  //               connected: Number(user.calls?.connected ?? 0),
  //               declined: Number(user.calls?.declined ?? 0),
  //               duration: this.formatDuration(durationSec),
  //               durationSec,
  //             },
  //           };
  //         }) || [];

  //       this.cd.detectChanges();
  //     },
  //     error: (err) => {
  //       this.loadingUsers[id] = false;
  //       console.error(err);
  //       this.dealerUsers[id] = [];
  //       this.dealerCallLogs[id] = null;
  //       this.userCallLogs[id] = [];
  //     },
  //   });
  // }
  toggleSummaryRow(event: Event, dealer: any): void {
    event.stopPropagation();
    const id = dealer.dealerId;
    this.expandedSummaryRow = this.expandedSummaryRow === id ? null : id;

    // If already loaded, just toggle without HTTP
    if (this.dealerUsers[id]?.length) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    this.loadingUsers[id] = true;

    let request$;
    if (
      this.selectedFilter === 'CUSTOM' &&
      this.customStartDate &&
      this.customEndDate
    ) {
      request$ = this.dashboardService.getDealersByCustomDate(
        this.customStartDate,
        this.customEndDate,
        token,
        id
      );
    } else {
      request$ = this.dashboardService.getDealerUsers(
        id,
        this.selectedFilter,
        token
      );
    }

    request$.subscribe({
      next: (res: any) => {
        this.loadingUsers[id] = false;
        const dealerData = Array.isArray(res?.data?.dealerData)
          ? res.data.dealerData.find((d: any) => d.dealerId === id)
          : res?.data?.dealerData;

        this.dealerUsers[id] = dealerData?.users || [];
        this.dealerCallLogs[id] = dealerData?.callLogs ?? null;
        this.userCallLogs[id] =
          dealerData?.users?.map((user: any) => ({
            userId: user.user_id,
            name: user.user,
            role: user.user_role,
            active: user.active,
            calls: {
              total: Number(user.calls?.totalCalls ?? 0),
              outgoing: Number(user.calls?.outgoing ?? 0),
              incoming: Number(user.calls?.incoming ?? 0),
              connected: Number(user.calls?.connected ?? 0),
              declined: Number(user.calls?.declined ?? 0),
              duration: this.formatDuration(
                Number(user.calls?.durationSec ?? 0)
              ),
              durationSec: Number(user.calls?.durationSec ?? 0),
            },
          })) || [];
        this.cd.detectChanges();
      },
      error: () => {
        this.loadingUsers[id] = false;
        this.dealerUsers[id] = [];
        this.dealerCallLogs[id] = null;
        this.userCallLogs[id] = [];
      },
    });
  }

  // toggleCallLogsRow(event: Event, dealer: any): void {
  //   event.stopPropagation();
  //   const id = dealer.dealerId;

  //   // Toggle expand
  //   this.expandedRow = this.expandedRow === id ? null : id;

  //   if (!this.expandedRow) return;

  //   const token = localStorage.getItem('token');
  //   if (!token) return;

  //   this.loadingUsers[id] = true;

  //   let request$;
  //   if (
  //     this.selectedFilter === 'CUSTOM' &&
  //     this.customStartDate &&
  //     this.customEndDate
  //   ) {
  //     request$ = this.dashboardService.getDealersByCustomDate(
  //       this.customStartDate,
  //       this.customEndDate,
  //       token,
  //       id
  //     );
  //   } else {
  //     request$ = this.dashboardService.getDealerUsers(
  //       id,
  //       this.selectedFilter,
  //       token
  //     );
  //   }

  //   request$.subscribe({
  //     next: (res: any) => {
  //       this.loadingUsers[id] = false;

  //       const dealerData = Array.isArray(res?.data?.dealerData)
  //         ? res.data.dealerData.find((d: any) => d.dealerId === id)
  //         : res?.data?.dealerData;

  //       if (!dealerData) {
  //         this.userCallLogs[id] = [];
  //         return;
  //       }
  //       this.userCallLogs[id] =
  //         dealerData.users?.map((user: any) => {
  //           const calls = this.getUserCalls(user); // ✅ Use the dynamic type here
  //           const durationSec = Number(
  //             calls?.durationSec ?? calls?.duration ?? 0
  //           );

  //           return {
  //             userId: user.user_id,
  //             name: user.user,
  //             calls: {
  //               total: Number(calls?.totalCalls ?? 0),
  //               outgoing: Number(calls?.outgoing ?? 0),
  //               incoming: Number(calls?.incoming ?? 0),
  //               connected: Number(calls?.connected ?? 0),
  //               declined: Number(calls?.declined ?? 0),
  //               duration: this.formatDuration(durationSec),
  //               durationSec,
  //             },
  //           };
  //         }) || [];
  //     },
  //     error: (err) => {
  //       this.loadingUsers[id] = false;
  //       console.error(err);
  //       this.userCallLogs[id] = [];
  //     },
  //   });
  // }
  toggleCallLogsRow(event: Event, dealer: any) {
    event.stopPropagation();
    const id = dealer.dealerId;

    this.expandedRow = this.expandedRow === id ? null : id;
    if (!this.expandedRow) return;

    // Fetch user data when row expands
    this.fetchDealerUsers(dealer);
  }
  fetchDealerUsers(dealer: any) {
    const id = dealer.dealerId;
    const token = localStorage.getItem('token');
    if (!token) return;

    this.loadingUsers[id] = true;

    let request$ =
      this.selectedFilter === 'CUSTOM' &&
      this.customStartDate &&
      this.customEndDate
        ? this.dashboardService.getDealersByCustomDate(
            this.customStartDate,
            this.customEndDate,
            token,
            id
          )
        : this.dashboardService.getDealerUsers(id, this.selectedFilter, token);

    request$.subscribe({
      next: (res: any) => {
        this.loadingUsers[id] = false;

        const dealerData = Array.isArray(res?.data?.dealerData)
          ? res.data.dealerData.find((d: any) => d.dealerId === id)
          : res?.data?.dealerData;

        if (!dealerData) {
          this.userCallLogs[id] = [];
          return;
        }

        // Map users based on selected type
        this.userCallLogs[id] =
          dealerData.users?.map((user: any) => {
            const calls = this.getUserCalls(user);
            const durationSec = Number(
              calls?.durationSec ?? calls?.duration ?? 0
            );

            return {
              userId: user.user_id,
              name: user.user,
              calls: {
                total: Number(calls?.totalCalls ?? 0),
                outgoing: Number(calls?.outgoing ?? 0),
                incoming: Number(calls?.incoming ?? 0),
                connected: Number(calls?.connected ?? 0),
                declined: Number(calls?.declined ?? 0),
                duration: this.formatDuration(durationSec),
                durationSec,
              },
            };
          }) || [];
      },
      error: () => {
        this.loadingUsers[id] = false;
        this.userCallLogs[id] = [];
      },
    });
  }
  getDealerCalls(dealer: any) {
    let calls: any = {};

    if (this.dealerSummaryCallsDataType === 'enquiries') {
      calls = dealer.enquiriesCalls || {};
    } else if (this.dealerSummaryCallsDataType === 'coldcalls') {
      calls = dealer.coldCalls || {};
    } else {
      calls = dealer.callLogs || {};
    }

    // normalize duration field (different APIs use `duration` vs `durationSec`)
    const durationSec = calls.durationSec ?? calls.duration ?? 0;

    return {
      ...calls,
      duration: this.formatDuration(Number(durationSec)),
    };
  }

  // getDealerCalls(dealer: any) {
  //   if (this.dealerSummaryCallsDataType === 'enquiries') {
  //     return dealer.enquiriesCalls;
  //   } else if (this.dealerSummaryCallsDataType === 'coldcalls') {
  //     return dealer.coldCalls;
  //   } else {
  //     return dealer.callLogs;
  //   }
  // }
  // getUserCalls(user: any) {
  //   console.log(
  //     '🔹 getUserCalls called for:',
  //     user.user,
  //     'Type:',
  //     this.dealerSummaryCallsDataType
  //   );

  //   // Always fallback to `calls` if specific type doesn't exist
  //   if (this.dealerSummaryCallsDataType === 'enquiries') {
  //     return user.enquiriesCalls ?? user.calls ?? {};
  //   } else if (this.dealerSummaryCallsDataType === 'coldcalls') {
  //     return user.coldCalls ?? user.calls ?? {};
  //   } else {
  //     return user.calls ?? {};
  //   }
  // }
  getUserCalls(user: any) {
    if (this.dealerSummaryCallsDataType === 'enquiries') {
      return user.enquiriesCalls ?? user.calls ?? {};
    } else if (this.dealerSummaryCallsDataType === 'coldcalls') {
      return user.coldCalls ?? user.calls ?? {};
    } else {
      return user.calls ?? {};
    }
  }
  updateDealerChart() {
    this.chartOptions = {
      ...this.chartOptions, // keep old chart settings like tooltip, legend, etc.
      series: [
        {
          name: 'Total Calls',
          data: this.dealers.map(
            (d) => this.getDealerCalls(d)?.totalCalls ?? 0
          ),
        },
        {
          name: 'Incoming',
          data: this.dealers.map((d) => this.getDealerCalls(d)?.incoming ?? 0),
        },
        {
          name: 'Outgoing',
          data: this.dealers.map((d) => this.getDealerCalls(d)?.outgoing ?? 0),
        },
        {
          name: 'Connected',
          data: this.dealers.map((d) => this.getDealerCalls(d)?.connected ?? 0),
        },
        {
          name: 'Declined',
          data: this.dealers.map((d) => this.getDealerCalls(d)?.declined ?? 0),
        },
        {
          name: 'Duration',
          data: this.dealers.map(
            (d) => this.getDealerCalls(d)?.durationSec ?? 0
          ),
        },
      ],
      xaxis: {
        categories: this.dealers.map((d) => d.dealerName),
      },
    };
  }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    // Show/hide Quick Action button
    this.showQuickActionBtn = scrollY < this.lastScrollTop;

    this.lastScrollTop = scrollY <= 0 ? 0 : scrollY;

    // Sticky header logic
    this.isSticky = scrollY >= this.originalHeaderOffsetTop;
  }
  // refreshSuperAdminDealers() {
  //   console.log('🔄 Refresh SuperAdmin dealers clicked');
  //   this.refreshingSA = true;

  //   // Call your existing SuperAdmin dashboard API fetch
  //   this.fetchSuperAdminDashboard(this.selectedFilter);

  //   // Reset refreshing state after data comes back (or use API complete)
  //   setTimeout(() => {
  //     this.refreshingSA = false;
  //   }, 1500);
  // }
  refreshSuperAdminDealers() {
    console.log('🔄 Refresh SuperAdmin dealers clicked');
    this.refreshingSA = true;

    // Collapse all expanded rows
    this.expandedSummaryRow = null;

    // Call your existing SuperAdmin dashboard API fetch
    this.fetchSuperAdminDashboard(this.selectedFilter);

    // Reset refreshing state after data comes back
    setTimeout(() => {
      this.refreshingSA = false;
    }, 1500);
  }
}
