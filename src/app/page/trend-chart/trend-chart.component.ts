import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexLegend,
  ApexMarkers,
  ApexGrid,
  ChartType,
  ApexTitleSubtitle,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { NgCircleProgressModule } from 'ng-circle-progress';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  markers: ApexMarkers;
  legend: ApexLegend;
  responsive?: ApexResponsive[];
  tooltip: ApexTooltip;
  colors?: string[];
};

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgCircleProgressModule,
    NgApexchartsModule,
  ],
  templateUrl: './trend-chart.component.html',
  styleUrls: ['./trend-chart.component.css'],
})
export class TrendChartComponent {
  originalHeaderOffsetTop: number = 0;

  isSticky = false;
  isHidden = false;
  public chartOptions: Partial<ChartOptions> = {
    series: [], // Will be populated dynamically from API
    chart: {
      height: 350,
      // width: 1280,
      type: 'line',
      zoom: { enabled: false },
      toolbar: { show: true }, // cleaner UI
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 2,
      curve: 'smooth',
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
      itemMargin: {
        horizontal: 10,
        vertical: 4,
      },
      tooltipHoverFormatter: function (val: string, opts: any) {
        return (
          val +
          ' - <strong>' +
          opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] +
          '</strong>'
        );
      },
    },
    markers: {
      size: 0,
      hover: { sizeOffset: 6 },
    },
    // Replace your current xaxis configuration with this:
    xaxis: {
      type: 'category',
      categories: [], // Will be populated with your date labels
      labels: {
        rotate: -45,
        hideOverlappingLabels: true,
        showDuplicates: false,
        style: {
          fontSize: '10px',
        },
        // Remove any formatter that might be converting to numbers
      },
      tickPlacement: 'on',
      sorted: false,
    },

    // Replace your current tooltip configuration with this:
    tooltip: {
      x: {
        formatter: (val: any) => {
          // Return the label as-is, don't try to parse as date
          return val.toString();
        },
      },
      y: {
        formatter: (val: number) => val.toString(),
      },
    },
    grid: {
      show: true, // make sure grid is enabled
      borderColor: '#e0e0e0', // lighter gray lines
      strokeDashArray: 3, // dashed lines for better readability
      position: 'back', // behind chart elements
      xaxis: {
        lines: {
          show: true, // vertical grid lines
        },
      },
      yaxis: {
        lines: {
          show: true, // horizontal grid lines
        },
      },
      row: {
        colors: ['transparent'], // no row stripes
        opacity: 0,
      },
      column: {
        colors: ['transparent'], // no column stripes
        opacity: 0,
      },
    },
  };

  BASE_URL = 'https://api.prod.smartassistapp.in';
  TREND_CHART_URL = '/api/superAdmin/dashboard/trend-chart';

  // Day-level charts
  dayLeadChart: Partial<ChartOptions> = {};
  dayEventChart: Partial<ChartOptions> = {};
  dayTaskChart: Partial<ChartOptions> = {};
  dayCallsChart: Partial<ChartOptions> = {};
  dayLastLoginChart: Partial<ChartOptions> = {};

  // Hour-level charts
  hourLeadChart: Partial<ChartOptions> = {};
  hourEventChart: Partial<ChartOptions> = {};
  hourTaskChart: Partial<ChartOptions> = {};
  hourCallsChart: Partial<ChartOptions> = {};
  hourLastLoginChart: Partial<ChartOptions> = {};

  psWiseCharts: any[] = [];
  psWiseData: any = {};
  shouldFillBars = false;
  private lastScrollTop = 0;
  lastApiResponse: any;

  constructor(private http: HttpClient) {}

  private iosPerformanceMode = false;

  ngOnInit(): void {
    this.iosPerformanceMode = this.isIOS();

    if (this.iosPerformanceMode) {
      // console.log('iOS Performance Mode Enabled');
      // Increase delays for iOS
      this.scrollThrottleDelay = 150;
    }
    this.fetchTrendChart();
    this.fetchTrendChartWithFilters();
    // window.addEventListener('resize', () => {
    //   this.updateAllChartsFromApi(this.lastApiResponse);
    // });
  }

  private scrollTimeout: any;
  private lastScrollTime = 0;
  private scrollThrottleDelay = 100; // ms

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   const now = Date.now();

  //   // Throttle scroll events (especially important for iOS)
  //   if (now - this.lastScrollTime < this.scrollThrottleDelay) {
  //     return;
  //   }
  //   this.lastScrollTime = now;

  //   // Use requestAnimationFrame for smooth updates
  //   if (this.scrollTimeout) {
  //     cancelAnimationFrame(this.scrollTimeout);
  //   }

  //   this.scrollTimeout = requestAnimationFrame(() => {
  //     const scrollY = window.scrollY || document.documentElement.scrollTop;

  //     // Sticky Header Logic
  //     const offset = this.originalHeaderOffsetTop || 0;
  //     this.isSticky = scrollY >= offset;
  //     this.isHidden = false;

  //     // Fill Bars Logic (only trigger once)
  //     if (scrollY > this.lastScrollTop && !this.shouldFillBars) {
  //       this.shouldFillBars = true;
  //     }

  //     this.lastScrollTop = Math.max(scrollY, 0);
  //   });
  // }
  ngAfterViewInit() {
    const header = document.querySelector('.dashboard-top') as HTMLElement;
    if (header) {
      this.originalHeaderOffsetTop = header.offsetTop;
    }
  }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    /** 🔹 Sticky Header Logic */
    this.isSticky = scrollY >= this.originalHeaderOffsetTop;
    this.isHidden = false; // never hide header

    /** 🔹 Fill Bars Logic */
    if (scrollY > this.lastScrollTop) {
      // user scrolling down
      this.shouldFillBars = true;
    } else {
      // user scrolling up (optional reset if needed)
      // this.shouldFillBars = false;
    }

    /** 🔹 Update last scroll position */
    this.lastScrollTop = scrollY <= 0 ? 0 : scrollY;
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  dealers: any[] = []; // Your dealers array
  selectedDealers: any[] = [];
  filteredDealers: any[] = [];
  dropdownOpen = false;
  dealerSearch = '';
  selectedDateFilter: string = 'DAY';
  selectedMetric: string = 'calls';
  chartTypes: ChartType[] = ['line', 'area', 'bar'];
  currentChartTypeIndex = 0; // keep track of current
  charts: any = {};
  userTouchedDealers = false; // New property in your component
  topLeads: number = 0;
  topsaLeads: number = 0;
  topdigitalLeads: number = 0;
  topTasks: number = 0;
  topUTDs: number = 0;
  topCall: number = 0;
  topenquiryCalls: number = 0;
  topcoldCalls: number = 0;
  DistinctUsers: number = 0;
  roleFilter: 'PS' | 'SM' | 'Both' = 'PS'; // default
  selectedCallType: string = 'calls'; // Default to total calls
  callTypes = [
    { value: 'calls', label: 'Total Calls' },
    { value: 'enquiryCalls', label: 'Enquiry Calls' },
    { value: 'coldCalls', label: 'Cold Calls' },
  ];
  isLoading = false;

  switchChartType() {
    this.currentChartTypeIndex =
      (this.currentChartTypeIndex + 1) % this.chartTypes.length;

    const newType: ChartType = this.chartTypes[this.currentChartTypeIndex];

    this.chartOptions = {
      ...this.chartOptions,
      chart: {
        ...this.chartOptions.chart,
        type: newType,
        animations: {
          enabled: true,
          speed: 800, // only allowed props
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 600 },
        },
      },
    };
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  filterDealers() {
    if (!this.dealerSearch.trim()) {
      this.filteredDealers = [...this.dealers];
    } else {
      this.filteredDealers = this.dealers.filter((dealer) =>
        dealer.dealer_name
          .toLowerCase()
          .includes(this.dealerSearch.toLowerCase())
      );
    }
  }

  isDealerSelected(dealer: any): boolean {
    // return this.selectedDealers.some(selected => selected.dealer_id === dealer.dealer_id);
    return this.selectedDealers.includes(dealer.dealer_id);
  }

  toggleDealerSelection(dealer: any) {
    this.userTouchedDealers = true; // user actually changed individual dealer

    const dealerId = dealer.dealer_id;
    const index = this.selectedDealers.indexOf(dealerId);

    if (index > -1) {
      this.selectedDealers.splice(index, 1);
    } else {
      this.selectedDealers.push(dealerId);
    }

    this.fetchTrendChartWithFilters();
  }

  areAllSelected(): boolean {
    return (
      this.filteredDealers.length > 0 &&
      this.filteredDealers.every((dealer) => this.isDealerSelected(dealer))
    );
  }
  // toggleSort(chart: any, dealerIndex: number): void {
  //   const dealerGroup = this.psWiseCharts[dealerIndex];
  //   if (!dealerGroup) return;

  //   // Determine next sort order
  //   let newOrder: 'asc' | 'desc' | null = null;

  //   if (!chart.sortOrder) {
  //     newOrder = 'desc';
  //   } else if (chart.sortOrder === 'desc') {
  //     newOrder = 'asc';
  //   } else {
  //     newOrder = null;
  //   }

  //   // Update the clicked chart's sortOrder
  //   chart.sortOrder = newOrder;

  //   // Determine sorting base (the clicked chart users)
  //   let sortedUsersBase: any[] = [];

  //   if (newOrder === 'desc') {
  //     sortedUsersBase = [...chart.users].sort((a, b) => b.value - a.value);
  //   } else if (newOrder === 'asc') {
  //     sortedUsersBase = [...chart.users].sort((a, b) => a.value - b.value);
  //   } else {
  //     sortedUsersBase = [...(chart.originalUsers || chart.users)];
  //   }

  //   // Get the sorted user IDs in the desired order
  //   const sortedUserIds = sortedUsersBase.map((u) => u.id || u.name);

  //   // Apply same order to ALL charts for that dealer
  //   dealerGroup.charts.forEach((c: any) => {
  //     const userMap = new Map(
  //       (c.originalUsers || c.users).map((u: any) => [u.id || u.name, u])
  //     );
  //     c.users = sortedUserIds.map((id) => userMap.get(id)).filter(Boolean);

  //     // Sync sortOrder visually (optional)
  //     if (c !== chart) {
  //       c.sortOrder = chart.sortOrder;
  //     }
  //   });
  // }
  toggleSort(chart: any, dealerIndex: number): void {
    const dealerGroup = this.psWiseCharts[dealerIndex];
    if (!dealerGroup) return;

    // 🔁 Determine next sort order (3-stage cycle)
    let newOrder: 'desc' | 'asc' | null = null;
    if (!chart.sortOrder) {
      newOrder = 'desc'; // 1st click → High → Low
    } else if (chart.sortOrder === 'desc') {
      newOrder = 'asc'; // 2nd click → Low → High
    } else {
      newOrder = null; // 3rd click → Reset to default (SA Leads order)
    }

    chart.sortOrder = newOrder;

    let sortedUsersBase: any[] = [];

    if (newOrder === 'desc') {
      // 🔼 High → Low
      sortedUsersBase = [...chart.users].sort((a, b) => b.value - a.value);
    } else if (newOrder === 'asc') {
      // 🔽 Low → High
      sortedUsersBase = [...chart.users].sort((a, b) => a.value - b.value);
    } else {
      // 🧭 3rd click → Reset to default (SA Leads-based order)
      const defaultOrder = chart.defaultUserOrder;

      if (defaultOrder && defaultOrder.length > 0) {
        const userMap = new Map(
          chart.originalUsers.map((u: any) => [u.id || u.name, u])
        );
        sortedUsersBase = defaultOrder
          .map((id: any) => userMap.get(id))
          .filter(Boolean);
      } else {
        console.warn('⚠️ No default SA Leads order found for reset');
        sortedUsersBase = [...chart.users]; // fallback
      }
    }

    const sortedUserIds = sortedUsersBase.map((u) => u.id || u.name);

    // ✅ Apply same sorted order to all charts in the dealer group
    dealerGroup.charts.forEach((c: any) => {
      const userMap = new Map(
        (c.originalUsers || c.users).map((u: any) => [u.id || u.name, u])
      );
      c.users = sortedUserIds.map((id) => userMap.get(id)).filter(Boolean);
      c.sortOrder = chart.sortOrder;
    });
  }

  toggleSelectAll(event: any) {
    const isChecked = event.target.checked;

    if (isChecked) {
      // Select all in UI but do NOT set userTouchedDealers → keep dealer_ids empty
      this.selectedDealers = this.filteredDealers.map((d) => d.dealer_id);
    } else {
      // Unselect all → user has touched
      this.userTouchedDealers = true;
      this.selectedDealers = [];
    }

    this.fetchTrendChartWithFilters();
  }

  clearSelection() {
    this.selectedDealers = [];
    this.userTouchedDealers = false; // reset flag
    this.fetchTrendChartWithFilters();
  }

  fetchTrendChart() {
    const token = localStorage.getItem('token');
    // console.log('Token:', localStorage.getItem('token'));

    if (!token) {
      // console.error('❌ No token found in localStorage');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // 🟢 If "all" selected → expand to all known dealer_ids
    let dealerIds = '';
    if (this.selectedDealers.includes('all')) {
      if (this.dealers && this.dealers.length > 0) {
        dealerIds = this.dealers.map((d) => d.dealer_id).join(',');
      }
    } else if (this.selectedDealers.length > 0) {
      dealerIds = this.selectedDealers.join(',');
    }

    // const params = new HttpParams()
    //   .set('dealer_ids', dealerIds)
    //   .set('type', 'DAY')
    //   .set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    const params = new HttpParams()
      .set('dealer_ids', dealerIds)
      .set('type', 'DAY')
      .set('timezone', 'Asia/Kolkata');
    this.isLoading = true;
    this.http
      .get<any>(`${this.BASE_URL}${this.TREND_CHART_URL}`, { headers, params })
      .subscribe({
        next: (res) => {
          this.lastApiResponse = res;
          this.isLoading = false;

          // console.log('✅ API Response:', res.topCards);

          // store dealer list on first load
          if (res.activeDealers) {
            this.dealers = res.activeDealers;
            this.filteredDealers = [...this.dealers];
            // if nothing selected yet, default to all dealers
            if (
              !this.selectedDealers.length ||
              this.selectedDealers.includes('all')
            ) {
              this.selectedDealers = this.dealers.map((d) => d.dealer_id);
            }
          }

          if (res.topCards) {
            this.topLeads = res.topCards.leads || 0;
            this.topsaLeads = res.topCards.saLeads || 0;
            this.topdigitalLeads = res.topCards.digitalLeads || 0;
            this.topTasks = res.topCards.followups || 0;
            this.topUTDs = res.topCards.utd || 0;
            this.topCall = res.topCards.calls || 0;
            this.topenquiryCalls = res.topCards.enquiryCalls || 0;
            this.topcoldCalls = res.topCards.coldCalls || 0;
            this.DistinctUsers = res.topCards.distinctUsers || 0;
          }

          this.updateAllChartsFromApi(res);
        },
        error: (err) => {
          // console.error('❌ API Error:', err);
        },
      });
  }

  private chartUpdateTimeout: any;

  // updateAllChartsFromApi(res: any) {
  //   if (!res) return;

  //   // ---- Normalize input data ----
  //   const normalizeData = (input: any, key: string) => {
  //     if (!input) return [];

  //     if (
  //       typeof input === 'object' &&
  //       !Array.isArray(input) &&
  //       Array.isArray(input[key])
  //     ) {
  //       return (input[key] || []).map((d: any) => ({
  //         ...d,
  //         dealer_name: 'All Dealers',
  //       }));
  //     }

  //     if (typeof input === 'object' && !Array.isArray(input)) {
  //       return Object.entries(input).flatMap(([dealer, obj]: [string, any]) => {
  //         const arr = obj?.[key] || [];
  //         return arr.map((d: any) => ({ ...d, dealer_name: dealer }));
  //       });
  //     }

  //     if (Array.isArray(input)) {
  //       return input.map((d: any) => ({ ...d, dealer_name: 'All Dealers' }));
  //     }

  //     return [];
  //   };

  //   // ---- Transform data into chart-ready format ----
  //   const transform = (data: any[], isHourChart = false) => {
  //     if (!data || !data.length) return { series: [], categories: [] };
  //     const xKey = isHourChart ? 'hour' : 'label';

  //     const categories = Array.from(
  //       new Set(data.map((item) => item[xKey]))
  //     ).sort((a, b) => {
  //       if (isHourChart) {
  //         const [ah, am] = a.split(':').map(Number);
  //         const [bh, bm] = b.split(':').map(Number);
  //         return ah * 60 + am - (bh * 60 + bm);
  //       } else {
  //         return new Date(a).getTime() - new Date(b).getTime();
  //       }
  //     });

  //     const dealerMap = new Map<string, Map<string, number>>();
  //     data.forEach((item) => {
  //       const dealer = item.dealer_name || 'All Dealers';
  //       if (!dealerMap.has(dealer)) dealerMap.set(dealer, new Map());
  //       dealerMap.get(dealer)!.set(item[xKey], Number(item.count) || 0);
  //     });

  //     const series = Array.from(dealerMap.entries()).map(
  //       ([dealer, catMap]) => ({
  //         name: dealer,
  //         data: categories.map((cat) => catMap.get(cat) || 0),
  //       })
  //     );

  //     return { series, categories };
  //   };

  //   // ---- Enhanced chart update with better data labels ----
  //   const updateChart = (
  //     chartRef: any,
  //     chartData: any,
  //     isHourChart = false,
  //     metricKey: string = ''
  //   ) => {
  //     if (!chartRef) return;

  //     const isAllDealersSingleLine =
  //       chartData.series.length === 1 &&
  //       (chartData.series[0].name === 'All Dealers' ||
  //         this.selectedDealers.length === 0 ||
  //         !this.userTouchedDealers);

  //     let fixedColors: string[] = [];
  //     let labelColor = '#304758'; // default

  //     if (isAllDealersSingleLine) {
  //       if (metricKey === 'leads') {
  //         fixedColors = ['#000080'];
  //         labelColor = '#000080';
  //       }
  //       if (metricKey === 'utd') {
  //         fixedColors = ['#FFA500'];
  //         labelColor = '#FFA500';
  //       }
  //       if (metricKey === 'followups') {
  //         fixedColors = ['#008000'];
  //         labelColor = '#008000';
  //       }
  //       if (metricKey.toLowerCase().includes('call')) {
  //         fixedColors = ['#800080'];
  //         labelColor = '#800080';
  //       }
  //       if (metricKey === 'lastLogin') {
  //         fixedColors = ['#FF0000'];
  //         labelColor = '#FF0000';
  //       }
  //     }

  //     const isMobile = window.innerWidth <= 768;
  //     const chartHeight = isMobile ? 300 : 150;

  //     const chartOptions: ApexCharts.ApexOptions = {
  //       chart: {
  //         height: chartHeight,
  //         toolbar: { show: false },
  //         type: 'line',
  //       },
  //       stroke: {
  //         curve: 'smooth',
  //         width: 1,
  //       },
  //       markers: {
  //         size: isAllDealersSingleLine ? 4 : 3,
  //         strokeWidth: isAllDealersSingleLine ? 2 : 1,
  //       },
  //       tooltip: { enabled: true },
  //       xaxis: {
  //         categories: chartData.categories,
  //         labels: {
  //           // rotate: isMobile ? 0 : -60,
  //           rotate: 0,
  //           style: {
  //             colors: '#333',
  //             fontFamily: 'Helvetica, Arial, sans-serif',
  //             fontWeight: 400,
  //           },
  //           trim: false, // prevent cutting
  //           offsetX: 0,
  //           offsetY: 5,
  //         },
  //       },
  //       yaxis: {
  //         labels: { formatter: (val: number) => val.toString() },
  //       },
  //       legend: {
  //         show: false,
  //       },
  //       grid: {
  //         show: true,
  //         padding: {
  //           left: 15,
  //           right: 15,
  //           top: 0,
  //           // bottom: isMobile ? 30 : 50,
  //         },
  //       },
  //       colors: fixedColors.length ? fixedColors : undefined,
  //       dataLabels: {
  //         enabled: isAllDealersSingleLine,
  //         formatter: (val: number) => (val > 0 ? val.toString() : ''),
  //         style: {
  //           fontSize: '11px',
  //           fontFamily: 'Helvetica, Arial, sans-serif',
  //           fontWeight: 'bold',
  //           colors: [labelColor],
  //         },
  //         background: {
  //           enabled: true,
  //           foreColor: '#fff',
  //           padding: 4,
  //           borderRadius: 2,
  //           borderWidth: 1,
  //           borderColor: '#ccc',
  //           opacity: 0.9,
  //         },
  //       },
  //     };

  //     if (chartRef.updateOptions && chartRef.updateSeries) {
  //       chartRef.updateSeries(chartData.series, true);
  //       chartRef.updateOptions(chartOptions, true);
  //     } else {
  //       chartRef = {
  //         ...chartRef,
  //         series: chartData.series,
  //         ...chartOptions,
  //         legend: { show: false },
  //       };
  //     }

  //     return chartRef;
  //   };

  //   // ---- Chart configurations ----
  //   const chartConfigs = [
  //     { key: 'leads', resKey: 'left', target: 'dayLeadChart' },
  //     { key: 'utd', resKey: 'left', target: 'dayEventChart' },
  //     { key: 'followups', resKey: 'left', target: 'dayTaskChart' },
  //     { key: this.selectedCallType, resKey: 'left', target: 'dayCallsChart' },
  //     { key: 'lastLogin', resKey: 'left', target: 'dayLastLoginChart' },

  //     { key: 'leads', resKey: 'right', target: 'hourLeadChart' },
  //     { key: 'utd', resKey: 'right', target: 'hourEventChart' },
  //     { key: 'followups', resKey: 'right', target: 'hourTaskChart' },
  //     { key: this.selectedCallType, resKey: 'right', target: 'hourCallsChart' },
  //     { key: 'lastLogin', resKey: 'right', target: 'hourLastLoginChart' },
  //   ];

  //   // ---- Debounce heavy updates ----
  //   clearTimeout(this.chartUpdateTimeout);
  //   this.chartUpdateTimeout = setTimeout(() => {
  //     chartConfigs.forEach(({ key, resKey, target }) => {
  //       const isHourChart = resKey === 'right';
  //       const chartData = transform(
  //         normalizeData(res[resKey], key),
  //         isHourChart
  //       );
  //       (this as any)[target] = updateChart(
  //         (this as any)[target],
  //         chartData,
  //         isHourChart,
  //         key
  //       );
  //     });
  //   }, 100);
  // }

  isIOS(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
  }
  isAllZero(series: any[]): boolean {
    if (!series || !series.length) return true;
    return series.every(
      (s) => Array.isArray(s.data) && s.data.every((val: number) => val === 0)
    );
  }

  updateAllChartsFromApi(res: any) {
    if (!res) return;

    const normalizeData = (input: any, key: string) => {
      if (!input) return [];

      if (
        typeof input === 'object' &&
        !Array.isArray(input) &&
        Array.isArray(input[key])
      ) {
        return (input[key] || []).map((d: any) => ({
          ...d,
          dealer_name: 'All Dealers',
        }));
      }

      if (typeof input === 'object' && !Array.isArray(input)) {
        const dealerCount = Object.keys(input).length;

        // Check if we should aggregate: either no dealers selected OR all dealers from response are selected
        const shouldAggregate =
          !this.selectedDealers ||
          this.selectedDealers.length === 0 ||
          this.selectedDealers.length >= dealerCount;

        if (shouldAggregate) {
          // Aggregate all dealer data into one "All Dealers" series
          const aggregatedData = new Map<string, number>();

          Object.entries(input).forEach(([dealer, obj]: [string, any]) => {
            const arr = obj?.[key] || [];
            arr.forEach((d: any) => {
              const xKey = d.hour || d.label;
              const currentCount = aggregatedData.get(xKey) || 0;
              aggregatedData.set(xKey, currentCount + (Number(d.count) || 0));
            });
          });

          return Array.from(aggregatedData.entries()).map(([xKey, count]) => ({
            hour: xKey.includes(':') ? xKey : undefined,
            label: !xKey.includes(':') ? xKey : undefined,
            count: count,
            dealer_name: 'All Dealers',
          }));
        }

        // If specific dealers are selected (not all), return individual series
        return Object.entries(input).flatMap(([dealer, obj]: [string, any]) => {
          const arr = obj?.[key] || [];
          return arr.map((d: any) => ({ ...d, dealer_name: dealer }));
        });
      }

      if (Array.isArray(input)) {
        return input.map((d: any) => ({ ...d, dealer_name: 'All Dealers' }));
      }

      return [];
    };

    const transform = (data: any[], isHourChart = false) => {
      if (!data || !data.length) return { series: [], categories: [] };
      const xKey = isHourChart ? 'hour' : 'label';

      const categories = Array.from(
        new Set(data.map((item) => item[xKey]))
      ).sort((a, b) => {
        if (isHourChart) {
          const [ah, am] = a.split(':').map(Number);
          const [bh, bm] = b.split(':').map(Number);
          return ah * 60 + am - (bh * 60 + bm);
        } else {
          return new Date(a).getTime() - new Date(b).getTime();
        }
      });

      const dealerMap = new Map<string, Map<string, number>>();
      data.forEach((item) => {
        const dealer = item.dealer_name || 'All Dealers';
        if (!dealerMap.has(dealer)) dealerMap.set(dealer, new Map());
        dealerMap.get(dealer)!.set(item[xKey], Number(item.count) || 0);
      });

      const series = Array.from(dealerMap.entries()).map(
        ([dealer, catMap]) => ({
          name: dealer,
          data: categories.map((cat) => catMap.get(cat) || 0),
        })
      );

      return { series, categories };
    };

    const updateChart = (
      chartRef: any,
      chartData: any,
      isHourChart = false,
      metricKey: string = ''
    ) => {
      if (!chartRef) return;

      // Show single line with data labels when:
      // 1. Only one series exists AND it's "All Dealers"
      // 2. OR when exactly 1 dealer is selected
      const isSingleDealerLine =
        (chartData.series.length === 1 &&
          chartData.series[0].name === 'All Dealers') ||
        this.selectedDealers.length === 1;

      // Default colors
      let fixedColors: string[] = [];
      let labelColor = '#304758';

      if (isSingleDealerLine) {
        switch (metricKey) {
          case 'leads':
            fixedColors = ['#000080'];
            labelColor = '#000080';
            break;
          case 'utd':
            fixedColors = ['#FFA500'];
            labelColor = '#FFA500';
            break;
          case 'followups':
            fixedColors = ['#008000'];
            labelColor = '#008000';
            break;
          case 'lastLogin':
            fixedColors = ['#FF0000'];
            labelColor = '#FF0000';
            break;
          default:
            if (metricKey.toLowerCase().includes('call')) {
              fixedColors = ['#800080'];
              labelColor = '#800080';
            }
        }
      }

      const isMobile = window.innerWidth <= 768;
      const chartHeight = isMobile ? 300 : 150;

      const chartOptions: ApexCharts.ApexOptions = {
        chart: {
          type: 'line',
          height: chartHeight,
          toolbar: { show: false },
          zoom: { enabled: false },
          selection: { enabled: false },
          animations: {
            enabled: !this.iosPerformanceMode,
            speed: this.iosPerformanceMode ? 0 : 800,
            animateGradually: {
              enabled: !this.iosPerformanceMode,
              delay: this.iosPerformanceMode ? 0 : 150,
            },
            dynamicAnimation: {
              enabled: !this.iosPerformanceMode,
              speed: this.iosPerformanceMode ? 0 : 350,
            },
          },
          redrawOnParentResize: !this.iosPerformanceMode,
          redrawOnWindowResize: !this.iosPerformanceMode,
        },
        stroke: {
          curve: 'smooth',
          width: this.iosPerformanceMode ? 1 : 2,
        },
        markers: {
          size: isSingleDealerLine ? 3 : 2,
          strokeWidth: isSingleDealerLine ? 1 : 0,
        },
        tooltip: {
          enabled: true,
          fillSeriesColor: this.iosPerformanceMode,
        },
        xaxis: {
          categories: chartData.categories,
          labels: {
            rotate: 0,
            style: {
              colors: '#333',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
            },
            trim: false,
            offsetX: 0,
            offsetY: 5,
          },
        },
        yaxis: {
          labels: { formatter: (val: number) => val.toString() },
        },
        legend: { show: false },
        grid: { show: true, padding: { left: 15, right: 15, top: 0 } },
        colors: fixedColors.length ? fixedColors : undefined,
        dataLabels: {
          enabled: isSingleDealerLine && !this.iosPerformanceMode,
          formatter: (val: number) => (val > 0 ? val.toString() : ''),
          style: {
            fontSize: '11px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            colors: [labelColor],
          },
          background: {
            enabled: true,
            foreColor: '#fff',
            padding: 4,
            borderRadius: 2,
            borderWidth: 1,
            borderColor: '#ccc',
            opacity: 0.9,
          },
        },
      };

      if (chartRef.updateOptions && chartRef.updateSeries) {
        chartRef.updateSeries(chartData.series, false);
        chartRef.updateOptions(chartOptions, false, !this.iosPerformanceMode);
      } else {
        chartRef = {
          ...chartRef,
          series: chartData.series,
          ...chartOptions,
          legend: { show: false },
        };
      }

      return chartRef;
    };

    const chartConfigs = [
      { key: 'leads', resKey: 'left', target: 'dayLeadChart' },
      { key: 'utd', resKey: 'left', target: 'dayEventChart' },
      { key: 'followups', resKey: 'left', target: 'dayTaskChart' },
      { key: 'enquiryCalls', resKey: 'left', target: 'dayCallsChart' },
      { key: 'lastLogin', resKey: 'left', target: 'dayLastLoginChart' },
      { key: 'leads', resKey: 'right', target: 'hourLeadChart' },
      { key: 'utd', resKey: 'right', target: 'hourEventChart' },
      { key: 'followups', resKey: 'right', target: 'hourTaskChart' },
      { key: 'enquiryCalls', resKey: 'right', target: 'hourCallsChart' },
      { key: 'lastLogin', resKey: 'right', target: 'hourLastLoginChart' },
    ];

    const debounceTime = this.iosPerformanceMode ? 200 : 100;

    clearTimeout(this.chartUpdateTimeout);
    this.chartUpdateTimeout = setTimeout(() => {
      chartConfigs.forEach(({ key, resKey, target }) => {
        const isHourChart = resKey === 'right';
        const chartData = transform(
          normalizeData(res[resKey], key),
          isHourChart
        );
        (this as any)[target] = updateChart(
          (this as any)[target],
          chartData,
          isHourChart,
          key
        );
      });
    }, debounceTime);
  }

  ngOnDestroy() {
    if (this.scrollTimeout) {
      cancelAnimationFrame(this.scrollTimeout);
    }
    clearTimeout(this.chartUpdateTimeout);
    clearTimeout(this.filterUpdateTimeout);
    clearTimeout(this.psProcessingTimeout);
  }
  private filterUpdateTimeout: any;

  fetchTrendChartWithFilters() {
    // console.log('🔄 fetchTrendChartWithFilters called');
    // console.log('Current selectedDateFilter:', this.selectedDateFilter);
    // console.log('Current psWiseCharts length:', this.psWiseCharts?.length || 0);

    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    let dealerIds = '';

    if (this.userTouchedDealers && this.selectedDealers.length > 0) {
      dealerIds = this.selectedDealers.join(',');
    }

    let params = new HttpParams()
      .set('type', this.selectedDateFilter)
      .set('timezone', 'Asia/Kolkata');

    if (dealerIds.trim()) {
      params = params.set('dealer_ids', dealerIds);
    }

    // console.log('📤 API params:', params.toString());

    clearTimeout(this.filterUpdateTimeout);
    this.filterUpdateTimeout = setTimeout(() => {
      this.isLoading = true;

      this.http
        .get<any>(`${this.BASE_URL}${this.TREND_CHART_URL}`, {
          headers,
          params,
        })
        .subscribe({
          next: (res) => {
            // console.log('📥 API Response received');
            // console.log('Has psWiseActivity:', !!res.psWiseActivity);
            // console.log(
            //   'psWiseActivity data length:',
            //   res.psWiseActivity?.length || 0
            // );

            // Update top cards immediately
            if (res.topCards) {
              this.topLeads = res.topCards.leads || 0;
              this.topsaLeads = res.topCards.saLeads || 0;
              this.topdigitalLeads = res.topCards.digitalLeads || 0;
              this.topTasks = res.topCards.followups || 0;
              this.topUTDs = res.topCards.utd || 0;
              this.topCall = res.topCards.calls || 0;
              this.topenquiryCalls = res.topCards.enquiryCalls || 0;
              this.topcoldCalls = res.topCards.coldCalls || 0;
              this.DistinctUsers = res.topCards.distinctUsers || 0;
            }

            // Update charts
            this.updateAllChartsFromApi(res);

            // Handle PS data
            if (res.psWiseActivity) {
              // console.log(
              //   '✅ Setting psWiseData and calling scheduleProcessPsActivity'
              // );
              this.psWiseData = res.psWiseActivity;
              this.scheduleProcessPsActivity();
            } else {
              // console.log('❌ No psWiseActivity in response');
              this.psWiseCharts = [];
            }

            this.isLoading = false;
          },
          error: (err) => {
            // console.error('❌ API Error:', err);
            this.isLoading = false;
            this.psWiseCharts = [];
          },
        });
    }, 200);
  }

  getExportFileName(): string {
    // Metric label mapping for readability
    const metricMap: { [key: string]: string } = {
      last_login: 'LastLogin',
      leads: 'Leads',
      follow_up: 'FollowUps',
      unique_testdrive: 'UniqueTestDrives',
      calls: 'TotalCalls',
    };

    const metricLabel = metricMap[this.selectedMetric] || this.selectedMetric;

    // Dealer part
    let dealerPart = 'AllDealers';
    if (this.selectedDealers.length > 0) {
      const dealerNames = this.dealers
        .filter((d) => this.selectedDealers.includes(d.dealer_id))
        .map((d) => d.dealer_name.replace(/\s+/g, ''));

      dealerPart = dealerNames.slice(0, 3).join('_');
      if (dealerNames.length > 3) {
        dealerPart += `_plus${dealerNames.length - 3}`;
      }
    }

    // Add current date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    return `${metricLabel}_${dealerPart}_${today}_Report`;
  }

  //method to handle call type change
  onCallTypeChange() {
    // Re-fetch data with updated call type
    this.fetchTrendChartWithFilters();
  }

  // method to get current call type label
  getCurrentCallTypeLabel(): string {
    const callType = this.callTypes.find(
      (type) => type.value === this.selectedCallType
    );
    return callType ? callType.label : 'Calls';
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.dropdown');

    if (!dropdown || !dropdown.classList.contains('flt1')) {
      this.dropdownOpen = false;
    }
  }

  psWiseCallTypes = [
    { value: 'calls', label: 'Calls' },
    { value: 'coldCalls', label: 'Cold Calls' },
    { value: 'enquiryCalls', label: 'Enquiry Calls' },
  ];

  psWiseSelectedCallType = 'calls'; // default

  private psProcessingTimeout: any;

  scheduleProcessPsActivity() {
    // console.log('⏰ scheduleProcessPsActivity called');
    // console.log('psWiseData available:', !!this.psWiseData);
    // console.log('roleFilter:', this.roleFilter);

    clearTimeout(this.psProcessingTimeout);
    this.psProcessingTimeout = setTimeout(() => {
      // console.log('🔄 Processing PS activity...');
      this.processPsWiseActivityChunked();
    }, 100);
  }

  processPsWiseActivityChunked() {
    // console.log('==== Start processPsWiseActivity (Chunked) ====');
    // console.log('📊 processPsWiseActivityChunked called');
    // console.log('psWiseData length:', this.psWiseData?.length || 0);
    if (!this.psWiseData) return;

    const staticMetrics = [
      'saLeads',
      'uniquetestDrives',
      'followups',
      'lastLogin',
    ];
    const dynamicCallMetrics = ['calls', 'coldCalls', 'enquiryCalls'];

    const metricLabels: Record<string, string> = {
      saLeads: 'SA Leads',
      uniquetestDrives: 'Test Drives',
      followups: 'Followups',
      calls: 'Calls',
      coldCalls: 'Cold calls',
      enquiryCalls: 'Enquiry calls',
      lastLogin: 'Last login',
    };

    // Clear existing data
    this.psWiseCharts = [];

    // console.log(
    //   'Before processing - psWiseCharts length:',
    //   this.psWiseCharts.length
    // );

    // Precompute averages (this is fast)
    const allIndiaAvgMap = this.computeAllIndiaAverages(
      staticMetrics,
      dynamicCallMetrics
    );

    // Get all dealers to process
    const dealers = Object.entries(this.psWiseData);

    // Process dealers in chunks
    this.processNextDealerChunk(
      dealers,
      0,
      staticMetrics,
      metricLabels,
      allIndiaAvgMap
    );
  }

  // processNextDealerChunk(
  //   dealers: [string, any][],
  //   currentIndex: number,
  //   staticMetrics: string[],
  //   metricLabels: Record<string, string>,
  //   allIndiaAvgMap: Record<string, number>
  // ) {
  //   const CHUNK_SIZE = 1; // Process one dealer at a time
  //   const endIndex = Math.min(currentIndex + CHUNK_SIZE, dealers.length);

  //   // Process current chunk
  //   for (let i = currentIndex; i < endIndex; i++) {
  //     const [dealerName, users] = dealers[i];
  //     const dealerCharts = this.processSingleDealer(
  //       dealerName,
  //       users,
  //       staticMetrics,
  //       metricLabels,
  //       allIndiaAvgMap
  //     );
  //     if (dealerCharts) {
  //       this.psWiseCharts.push(dealerCharts);
  //     }
  //   }

  //   // Continue with next chunk if there are more dealers
  //   if (endIndex < dealers.length) {
  //     // Use setTimeout to yield control back to browser
  //     setTimeout(() => {
  //       this.processNextDealerChunk(
  //         dealers,
  //         endIndex,
  //         staticMetrics,
  //         metricLabels,
  //         allIndiaAvgMap
  //       );
  //     }, 10); // Small delay to allow UI updates
  //   } else {
  //     // All done - initialize accordion states
  //     this.initializePsAccordionStates();
  //     this.isLoading = false;
  //     console.log('==== End processPsWiseActivity (Chunked) ====');
  //     console.log(
  //       'After processing - psWiseCharts length:',
  //       this.psWiseCharts.length
  //     );
  //     console.log('Final psWiseCharts:', this.psWiseCharts);
  //   }
  // }
  processNextDealerChunk(
    dealers: [string, any][],
    currentIndex: number,
    staticMetrics: string[],
    metricLabels: Record<string, string>,
    allIndiaAvgMap: Record<string, number>
  ) {
    const CHUNK_SIZE = 1; // Process one dealer at a time
    const endIndex = Math.min(currentIndex + CHUNK_SIZE, dealers.length);

    // Process current chunk
    for (let i = currentIndex; i < endIndex; i++) {
      const [dealerName, users] = dealers[i];
      const dealerCharts = this.processSingleDealer(
        dealerName,
        users,
        staticMetrics,
        metricLabels,
        allIndiaAvgMap
      );

      if (dealerCharts) {
        // ✅ Default sort: SA Leads highest first (descending)
        dealerCharts.charts.forEach((chart) => {
          if (chart.title.toLowerCase().includes('sa leads')) {
            chart.users.sort(
              (a: any, b: any) => (b.value || 0) - (a.value || 0)
            );
          }
        });

        // ✅ Use the SA Leads chart as the base order for all other charts
        const saLeadsChart = dealerCharts.charts.find((c) =>
          c.title.toLowerCase().includes('sa leads')
        );

        if (saLeadsChart) {
          // Store SA Leads–based default user order
          const defaultUserOrder = saLeadsChart.users.map(
            (u: any) => u.id || u.name
          );

          dealerCharts.charts.forEach((chart) => {
            // Preserve original order (for toggle reset)
            chart.originalUsers = [...chart.users];

            // ✅ Apply same default user order to all charts for alignment
            const userMap = new Map(
              chart.users.map((u: any) => [u.id || u.name, u])
            );
            chart.users = defaultUserOrder
              .map((id: any) => userMap.get(id))
              .filter(Boolean);

            // Save for 3rd click reset
            chart.defaultUserOrder = [...defaultUserOrder];
          });
        }

        this.psWiseCharts.push(dealerCharts);
      }
    }

    // Continue with next chunk if there are more dealers
    if (endIndex < dealers.length) {
      setTimeout(() => {
        this.processNextDealerChunk(
          dealers,
          endIndex,
          staticMetrics,
          metricLabels,
          allIndiaAvgMap
        );
      }, 10); // Small delay to allow UI updates
    } else {
      // All done - initialize accordion states
      this.initializePsAccordionStates();
      this.isLoading = false;
      // console.log('==== End processPsWiseActivity (Chunked) ====');
      // console.log(
      //   'After processing - psWiseCharts length:',
      //   this.psWiseCharts.length
      // );
      // console.log('Final psWiseCharts:', this.psWiseCharts);
    }
  }

  computeAllIndiaAverages(
    staticMetrics: string[],
    dynamicCallMetrics: string[]
  ) {
    const allMetrics = [...staticMetrics, ...dynamicCallMetrics];
    const allIndiaAvgMap: Record<string, number> = {};

    allMetrics.forEach((metric) => {
      let sum = 0,
        count = 0;
      Object.values(this.psWiseData).forEach((users: any) => {
        if (!Array.isArray(users)) return;
        users.forEach((u) => {
          if (this.roleFilter === 'Both' || u.role === this.roleFilter) {
            sum += u[metric] || 0;
            count++;
          }
        });
      });
      allIndiaAvgMap[metric] = count > 0 ? Math.round(sum / count) : 0;
    });

    return allIndiaAvgMap;
  }

  // processSingleDealer(
  //   dealerName: string,
  //   users: any,
  //   staticMetrics: string[],
  //   metricLabels: Record<string, string>,
  //   allIndiaAvgMap: Record<string, number>
  // ) {
  //   if (!Array.isArray(users)) return null;

  //   const filteredUsers = users.filter((u) =>
  //     this.roleFilter === 'Both' ? true : u.role === this.roleFilter
  //   );

  //   if (filteredUsers.length === 0) return null;

  //   const charts: any[] = [];

  //   // Process static metrics
  //   staticMetrics.forEach((metric) => {
  //     const sortedUsers = filteredUsers
  //       .map((u) => ({
  //         name: u.name,
  //         role: u.role, // ✅ include role

  //         value: u[metric] || 0,
  //         dealer: dealerName,
  //       }))
  //       .sort((a, b) => b.value - a.value);

  //     if (sortedUsers.length > 0) {
  //       const dealerAvg = Math.round(
  //         sortedUsers.reduce((sum, u) => sum + u.value, 0) / sortedUsers.length
  //       );

  //       // Find max value for percentage calculation
  //       const maxValue = Math.max(...sortedUsers.map((u) => u.value), 1);

  //       charts.push({
  //         title: metricLabels[metric],
  //         allIndiaAvg: allIndiaAvgMap[metric],
  //         dealerAvg,
  //         maxValue,
  //         users: sortedUsers,
  //         key: metricLabels[metric].toLowerCase().replace(/\s/g, ''),
  //       });
  //     }
  //   });

  //   // Process call metric
  //   const callMetric = this.psWiseSelectedCallType || 'calls';
  //   const callUsers = filteredUsers
  //     .map((u) => ({
  //       name: u.name,
  //       role: u.role, // ✅ include role

  //       value: u[callMetric] || 0,
  //       dealer: dealerName,
  //     }))
  //     .sort((a, b) => b.value - a.value);

  //   if (callUsers.length > 0) {
  //     const dealerAvg = Math.round(
  //       callUsers.reduce((sum, u) => sum + u.value, 0) / callUsers.length
  //     );

  //     const maxValue = Math.max(...callUsers.map((u) => u.value), 1);

  //     charts.push({
  //       title: metricLabels[callMetric],
  //       allIndiaAvg: allIndiaAvgMap[callMetric],
  //       dealerAvg,
  //       maxValue,
  //       users: callUsers,
  //       key: 'countOfCalls',
  //     });
  //   }

  //   return charts.length > 0
  //     ? { dealerName, users: filteredUsers, charts }
  //     : null;
  // }

  // Method to get bar color based on index
  // CODE GIVEN BY SHAHSI ON 14

  processSingleDealer(
    dealerName: string,
    users: any,
    staticMetrics: string[],
    metricLabels: Record<string, string>,
    allIndiaAvgMap: Record<string, number>
  ) {
    if (!dealerName || dealerName.trim().toLowerCase() === 'dealer null')
      return null;
    if (!Array.isArray(users)) return null;

    const filteredUsers = users.filter((u) =>
      this.roleFilter === 'Both' ? true : u.role === this.roleFilter
    );
    if (filteredUsers.length === 0) return null;

    const charts: any[] = [];

    // Process static metrics
    staticMetrics.forEach((metric) => {
      const mappedUsers = filteredUsers.map((u) => ({
        name: u.name,
        role: u.role,
        value: u[metric] || 0,
        dealer: dealerName,
      }));

      const dealerAvg = Math.round(
        mappedUsers.reduce((sum, u) => sum + u.value, 0) / mappedUsers.length
      );
      const maxValue = Math.max(...mappedUsers.map((u) => u.value), 1);

      charts.push({
        title: metricLabels[metric],
        allIndiaAvg: allIndiaAvgMap[metric],
        dealerAvg,
        maxValue,
        users: [...mappedUsers], // default order
        originalUsers: [...mappedUsers], // store original for sorting/highlight
        key: metricLabels[metric].toLowerCase().replace(/\s/g, ''),
        sortOrder: null, // no default sorting
      });
    });

    // Process call metric
    const callMetric = this.psWiseSelectedCallType || 'calls';
    const callUsers = filteredUsers.map((u) => ({
      name: u.name,
      role: u.role,
      value: u[callMetric] || 0,
      dealer: dealerName,
    }));

    const dealerAvg = Math.round(
      callUsers.reduce((sum, u) => sum + u.value, 0) / callUsers.length
    );
    const maxValue = Math.max(...callUsers.map((u) => u.value), 1);

    charts.push({
      title: metricLabels[callMetric],
      allIndiaAvg: allIndiaAvgMap[callMetric],
      dealerAvg,
      maxValue,
      users: [...callUsers], // default order
      originalUsers: [...callUsers],
      key: 'countOfCalls',
      sortOrder: null,
    });

    return charts.length > 0
      ? { dealerName, users: filteredUsers, charts }
      : null;
  }

  getBarColor(index: number, chartTitle?: string): string {
    const title = chartTitle?.toLowerCase() || '';
    if (title.includes('sa leads')) {
      return '#001f5b'; // Navy Blue
    } else if (title.includes('followups')) {
      return '#28a745'; // Orange
    } else if (title.includes('test drives')) {
      return '#ff9800'; // Green
    } else if (title.includes('last login')) {
      return '#007bff'; // Green
    } else if (title.includes('target')) {
      return '#FFD827';
    } else if (title.includes('calls')) {
      return '#CB4A1A';
    }

    // fallback palette for other metrics (last login, calls, etc.)
    const colors = [
      '#007bff',
      '#28a745',
      '#ffc107',
      '#dc3545',
      '#17a2b8',
      '#6610f2',
      '#e83e8c',
      '#fd7e14',
      '#20c997',
      '#6f42c1',
      '#495057',
    ];
    return colors[index % colors.length];
  }

  // Method to get bar percentage width
  getBarWidth(value: number, maxValue: number): number {
    return maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 0;
  }

  psAccordionStates: boolean[] = [];

  // Method to initialize PS accordion states
  initializePsAccordionStates() {
    this.psAccordionStates = new Array(this.psWiseCharts.length).fill(false);
    // Optionally open the first dealer by default
    if (this.psAccordionStates.length > 0) {
      this.psAccordionStates[0] = true;
    }
  }

  // Method to toggle PS accordion sections
  togglePsAccordion(index: number) {
    this.psAccordionStates[index] = !this.psAccordionStates[index];
  }

  psWiseOnCallTypeChange() {
    if (this.psWiseData) {
      this.scheduleProcessPsActivity();
    }
  }

  get sectionTitle() {
    if (this.roleFilter === 'Both') return 'PS+SM Activity';
    return `${this.roleFilter}-wise Activity`;
  }

  generateColors(count: number): string[] {
    const baseColors = [
      '#008FFB',
      '#00E396',
      '#FEB019',
      '#FF4560',
      '#775DD0',
      '#546E7A',
      '#26a69a',
      '#D10CE8',
      '#FF6B35',
      '#C7F464',
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }
  refreshStats() {
    // console.log('Refreshing stats...');
    this.fetchTrendChartWithFilters();
  }
  private isScrolling = false;
  highlightedUsers: Array<{ dealerIndex: number; userId: string }> = [];

  // Updated synchronized scroll method (keep as is)
  onChartScroll(event: Event, dealerIndex: number): void {
    const scrollTop = (event.target as HTMLElement).scrollTop;
    const dealerGroup = this.psWiseCharts[dealerIndex];

    if (!dealerGroup) return;

    const containers = document.querySelectorAll(
      `.custom-chart-container[data-dealer-index="${dealerIndex}"]`
    );

    containers.forEach((container: Element, index: number) => {
      if (index !== 0) {
        const el = container as HTMLElement;
        el.scrollTop = scrollTop;

        // 🔥 Force browser to repaint immediately (fix stuck effect)
        void el.offsetHeight;
      }
    });
  }
  isUserHighlighted(dealerIndex: number, userId: string): boolean {
    return this.highlightedUsers.some(
      (u) => u.dealerIndex === dealerIndex && u.userId === userId
    );
  }
  toggleUserHighlight(dealerIndex: number, userId: string): void {
    const dealerGroup = this.psWiseCharts[dealerIndex];
    if (!dealerGroup) return;

    const existingIndex = this.highlightedUsers.findIndex(
      (u) => u.dealerIndex === dealerIndex && u.userId === userId
    );

    if (existingIndex > -1) {
      // Remove highlight
      this.highlightedUsers.splice(existingIndex, 1);
    } else {
      // Add highlight
      this.highlightedUsers.push({ dealerIndex, userId });
    }

    // Align all charts using base order (first chart)
    const baseOrder = dealerGroup.charts[0].users.map(
      (u: any) => u.id || u.name
    );

    dealerGroup.charts.forEach((chart: any) => {
      const userMap = new Map(
        (chart.originalUsers || chart.users).map((u: any) => [
          u.id || u.name,
          u,
        ])
      );

      // Reorder chart.users according to baseOrder
      chart.users = baseOrder.map((id: any) => userMap.get(id)).filter(Boolean);
    });
  }
}
