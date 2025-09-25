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
  @ViewChild('headerSection', { static: true }) headerSection!: ElementRef;
  headerOffset!: number;
  showQuickActionBtn = true; // 👈 initially visible
  originalHeaderOffsetTop: number = 0;

  isSticky = false;
  isHidden = false;
  // lastScrollTop = 0;
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

  BASE_URL = 'https://uat.smartassistapp.in';
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTrendChart();
  }
  ngAfterViewInit() {
    const header = document.querySelector('.dashboard-top') as HTMLElement;
    if (header) {
      this.originalHeaderOffsetTop = header.offsetTop;
    }
  }

  // @HostListener('window:scroll', [])
  // onWindowScroll() {
  //   const scrollY = window.scrollY || document.documentElement.scrollTop;

  //   // Show/hide Quick Action button
  //   this.showQuickActionBtn = scrollY < this.lastScrollTop;

  //   this.lastScrollTop = scrollY <= 0 ? 0 : scrollY;

  //   // Sticky header logic
  //   this.isSticky = scrollY >= this.originalHeaderOffsetTop;
  // }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    // Sticky logic: only stick when scroll passes original position
    this.isSticky = scrollY >= this.originalHeaderOffsetTop;

    // Never hide the header
    this.isHidden = false;

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

    if (!token) {
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

    const params = new HttpParams()
      .set('dealer_ids', dealerIds)
      .set('type', 'DAY')
      .set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    this.isLoading = true;
    this.http
      .get<any>(`${this.BASE_URL}${this.TREND_CHART_URL}`, { headers, params })
      .subscribe({
        next: (res) => {
          this.isLoading = false;

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
        error: (err) => {},
      });
  }

  private chartUpdateTimeout: any;

  updateAllChartsFromApi(res: any) {
    if (!res) return;

    // ---- Normalize input data ----
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

    // ---- Transform data into chart-ready format ----
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

    // ---- Efficient chart update ----
    const updateChart = (
      chartRef: any,
      chartData: any,
      isHourChart = false,
      metricKey: string = ''
    ) => {
      if (!chartRef) return;

      const isAllDealersSingleLine =
        chartData.series.length === 1 &&
        chartData.series[0].name === 'All Dealers';

      let fixedColors: string[] = [];
      if (isAllDealersSingleLine) {
        if (metricKey === 'leads') fixedColors = ['#000080']; // navy blue
        if (metricKey === 'utd') fixedColors = ['#FFA500']; // orange
        if (metricKey === 'followups') fixedColors = ['#008000']; // green
        if (metricKey.toLowerCase().includes('call')) fixedColors = ['#800080']; // purple
        if (metricKey === 'lastLogin') fixedColors = ['#FF0000']; // red
      }

      const chartOptions = {
        chart: { height: 150, toolbar: { show: false } },
        stroke: { curve: 'smooth', width: 1 },
        markers: { size: 4 },
        tooltip: { enabled: true },
        legend: { show: false },
        xaxis: {
          categories: chartData.categories,
          labels: { rotate: isHourChart ? 0 : -60 },
        },
        yaxis: { labels: { formatter: (val: number) => val.toString() } },
        grid: { show: true, padding: { left: 0, right: 0, top: 0, bottom: 0 } },
        colors: fixedColors.length ? fixedColors : undefined,
        dataLabels: isAllDealersSingleLine
          ? {
              enabled: true,
              formatter: (val: number) => val.toString(),
              style: { colors: ['#000'], fontSize: '12px', fontWeight: 'bold' },
              background: { enabled: false },
              offsetY: -6,
            }
          : { enabled: false },
      };

      if (chartRef.updateOptions && chartRef.updateSeries) {
        chartRef.updateSeries(chartData.series, true);
        chartRef.updateOptions(chartOptions, true);
      } else {
        chartRef = {
          ...chartRef,
          series: chartData.series,
          ...chartOptions,
        };
      }

      return chartRef;
    };

    // ---- Chart configurations ----
    const chartConfigs = [
      { key: 'leads', resKey: 'left', target: 'dayLeadChart' },
      { key: 'utd', resKey: 'left', target: 'dayEventChart' },
      { key: 'followups', resKey: 'left', target: 'dayTaskChart' },
      { key: this.selectedCallType, resKey: 'left', target: 'dayCallsChart' },
      { key: 'lastLogin', resKey: 'left', target: 'dayLastLoginChart' },

      { key: 'leads', resKey: 'right', target: 'hourLeadChart' },
      { key: 'utd', resKey: 'right', target: 'hourEventChart' },
      { key: 'followups', resKey: 'right', target: 'hourTaskChart' },
      { key: this.selectedCallType, resKey: 'right', target: 'hourCallsChart' },
      { key: 'lastLogin', resKey: 'right', target: 'hourLastLoginChart' },
    ];

    // ---- Debounce heavy updates ----
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
    }, 100);
  }

  private filterUpdateTimeout: any;

  fetchTrendChartWithFilters() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    let dealerIds = '';

    if (this.userTouchedDealers && this.selectedDealers.length > 0) {
      dealerIds = this.selectedDealers.join(',');
    }

    let params = new HttpParams()
      .set('type', this.selectedDateFilter)
      .set('timezone', 'Asia/Calcutta');

    if (dealerIds.trim()) {
      params = params.set('dealer_ids', dealerIds);
    }

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
            // Update top cards immediately
            if (res.topCards) {
              this.topLeads = res.topCards.leads || 0;
              this.topsaLeads = res.topCards.saLeads || 0;
              this.topdigitalLeads = res.topCards.digitalLeads || 0;
              this.topTasks = res.topCards.followups || 0;
              this.topUTDs = res.topCards.testDrives || 0;
              this.topCall = res.topCards.calls || 0;
              this.topenquiryCalls = res.topCards.enquiryCalls || 0;
              this.topcoldCalls = res.topCards.coldCalls || 0;
              this.DistinctUsers = res.topCards.distinctUsers || 0;
            }

            // Update charts
            this.updateAllChartsFromApi(res);

            // Store PS data but don't process it yet
            if (res.psWiseActivity) {
              this.psWiseData = res.psWiseActivity;
              // Process PS data separately with delay
              this.scheduleProcessPsActivity();
            }
            this.isLoading = false;
          },
          error: (err) => console.error(err),
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

  // Add this method to process PS-wise activity data
  // processPsWiseActivity(psWiseActivity: any) {
  //   console.log('==== Start processPsWiseActivity ====');
  //   if (!psWiseActivity) return;

  //   const staticMetrics = ['saLeads', 'uniquetestDrives', 'followups', 'lastLogin', 'target'];
  //   const dynamicCallMetrics = ['calls', 'coldCalls', 'enquiryCalls'];

  //   const metricLabels: Record<string, string> = {
  //     saLeads: 'SALeads',
  //     uniquetestDrives: 'Events',
  //     followups: 'Tasks',
  //     calls: 'calls',
  //     coldCalls: 'cold calls',
  //     enquiryCalls: 'Enquiry calls',
  //     lastLogin: 'last login',
  //     target: 'target'
  //   };

  //   this.psWiseCharts = [];

  //   // --- Precompute All-India averages ---
  //   const allMetrics = [...staticMetrics, ...dynamicCallMetrics];
  //   const allIndiaAvgMap: Record<string, number> = {};

  //   allMetrics.forEach(metric => {
  //     let sum = 0, count = 0;
  //     Object.values(psWiseActivity).forEach((users: any) => {
  //       if (!Array.isArray(users)) return;
  //       users.forEach(u => {
  //         if (this.roleFilter === 'Both' || u.role === this.roleFilter) {
  //           sum += u[metric] || 0;
  //           count++;
  //         }
  //       });
  //     });
  //     allIndiaAvgMap[metric] = count > 0 ? Math.round(sum / count) : 0;
  //     console.log(`All India Avg for ${metric}:`, allIndiaAvgMap[metric]);
  //   });

  //   // --- Process per dealer asynchronously to avoid blocking ---
  //   Promise.resolve().then(() => {
  //     Object.entries(psWiseActivity).forEach(([dealerName, users]: [string, any]) => {
  //       if (!Array.isArray(users)) return;

  //       const filteredUsers = users.filter(u =>
  //         this.roleFilter === 'Both' ? true : u.role === this.roleFilter
  //       );

  //       const charts: any[] = [];

  //       // Process static metrics
  //       staticMetrics.forEach(metric => {
  //         const metricData = filteredUsers.map(u => ({
  //           x: u.name,
  //           y: u[metric] && u[metric] > 0 ? u[metric] : 0.0001, // tiny placeholder for zero
  //           displayVal: u[metric] || 0,
  //           dealer: dealerName
  //         }));

  //         if (metricData.length > 0) {
  //           const dealerAvg = Math.round(metricData.reduce((sum, d) => sum + d.displayVal, 0) / metricData.length);

  //           charts.push({
  //             title: metricLabels[metric],
  //             allIndiaAvg: allIndiaAvgMap[metric],
  //             dealerAvg,
  //             series: [{ name: metricLabels[metric], data: metricData.map(d => d.y) }],
  //             chart: { type: 'bar', height: 350, toolbar: { show: false } },
  //             plotOptions: { bar: { horizontal: true, distributed: true, barHeight: '70%' } },
  //             colors: this.generateColors(metricData.length),
  //             xaxis: { categories: metricData.map(d => d.x), labels: { style: { fontSize: '10px' } } },
  //             yaxis: { labels: { style: { fontSize: '10px' } } },
  //             dataLabels: {
  //               enabled: true,
  //               formatter: (_val: number, opts: any) => metricData[opts.dataPointIndex].displayVal,
  //               style: { fontSize: '10px', fontWeight: 'bold' }
  //             },
  //             tooltip: {
  //               custom: ({ dataPointIndex }: any) => {
  //                 const user = metricData[dataPointIndex];
  //                 return `<div style="padding:8px;">
  //                         <strong>${user.x}</strong><br>
  //                         <span>${user.dealer}</span><br>
  //                         <span>${metricLabels[metric]}: ${user.displayVal}</span>
  //                       </div>`;
  //               }
  //             },
  //             legend: { show: false },
  //             key: metricLabels[metric].toLowerCase().replace(/\s/g, '')
  //           });
  //         }
  //       });

  //       // Process selected call metric dynamically
  //       const callMetric = this.psWiseSelectedCallType || 'calls';
  //       if (dynamicCallMetrics.includes(callMetric)) {
  //         const callData = filteredUsers.map(u => ({
  //           x: u.name,
  //           y: u[callMetric] && u[callMetric] > 0 ? u[callMetric] : 0.0001,
  //           displayVal: u[callMetric] || 0,
  //           dealer: dealerName
  //         }));

  //         if (callData.length > 0) {
  //           const dealerAvg = Math.round(callData.reduce((sum, d) => sum + d.displayVal, 0) / callData.length);

  //           charts.push({
  //             title: metricLabels[callMetric],
  //             allIndiaAvg: allIndiaAvgMap[callMetric],
  //             dealerAvg,
  //             series: [{ name: metricLabels[callMetric], data: callData.map(d => d.y) }],
  //             chart: { type: 'bar', height: 350, toolbar: { show: false } },
  //             plotOptions: { bar: { horizontal: true, distributed: true, barHeight: '70%', dataLabels: { position: 'right' } } },
  //             colors: this.generateColors(callData.length),
  //             xaxis: { categories: callData.map(d => d.x), labels: { style: { fontSize: '10px' } } },
  //             yaxis: { labels: { style: { fontSize: '10px' } } },
  //             dataLabels: { enabled: true, formatter: (_val: number, opts: any) => callData[opts.dataPointIndex].displayVal, style: { fontSize: '10px', fontWeight: 'bold' } },
  //             tooltip: {
  //               custom: ({ dataPointIndex }: any) => {
  //                 const user = callData[dataPointIndex];
  //                 return `<div style="padding:8px;">
  //                         <strong>${user.x}</strong><br>
  //                         <span>${user.dealer}</span><br>
  //                         <span>${metricLabels[callMetric]}: ${user.displayVal}</span>
  //                       </div>`;
  //               }
  //             },
  //             legend: { show: false },
  //             key: 'countOfCalls'
  //           });
  //         }
  //       }

  //       if (charts.length > 0) {
  //         this.psWiseCharts.push({ dealerName, users: filteredUsers, charts });
  //       }
  //     });

  //     console.log('Final psWiseCharts array:', this.psWiseCharts);

  //     // Initialize accordion states after processing
  //     this.initializePsAccordionStates();

  //     console.log('==== End processPsWiseActivity ====');
  //   });
  // }

  private psProcessingTimeout: any;

  scheduleProcessPsActivity() {
    this.isLoading = true;
    clearTimeout(this.psProcessingTimeout);
    // Process PS data after main UI updates are complete
    this.psProcessingTimeout = setTimeout(() => {
      this.processPsWiseActivityChunked();
    }, 100);
  }

  processPsWiseActivityChunked() {
    if (!this.psWiseData) return;

    const staticMetrics = [
      'saLeads',
      'uniquetestDrives',
      'followups',
      'lastLogin',
      'target',
    ];
    const dynamicCallMetrics = ['calls', 'coldCalls', 'enquiryCalls'];

    const metricLabels: Record<string, string> = {
      saLeads: 'SA Leads',
      uniquetestDrives: 'Events',
      followups: 'Tasks',
      calls: 'Calls',
      coldCalls: 'Cold calls',
      enquiryCalls: 'Enquiry calls',
      lastLogin: 'Last login',
      target: 'Target',
    };

    // Clear existing data
    this.psWiseCharts = [];

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
        this.psWiseCharts.push(dealerCharts);
      }
    }

    // Continue with next chunk if there are more dealers
    if (endIndex < dealers.length) {
      // Use setTimeout to yield control back to browser
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

  processSingleDealer(
    dealerName: string,
    users: any,
    staticMetrics: string[],
    metricLabels: Record<string, string>,
    allIndiaAvgMap: Record<string, number>
  ) {
    if (!Array.isArray(users)) return null;

    const filteredUsers = users.filter((u) =>
      this.roleFilter === 'Both' ? true : u.role === this.roleFilter
    );

    if (filteredUsers.length === 0) return null;

    const charts: any[] = [];

    // Process static metrics
    staticMetrics.forEach((metric) => {
      const sortedUsers = filteredUsers
        .map((u) => ({
          name: u.name,
          value: u[metric] || 0,
          dealer: dealerName,
        }))
        .sort((a, b) => b.value - a.value);

      if (sortedUsers.length > 0) {
        const dealerAvg = Math.round(
          sortedUsers.reduce((sum, u) => sum + u.value, 0) / sortedUsers.length
        );

        // Find max value for percentage calculation
        const maxValue = Math.max(...sortedUsers.map((u) => u.value), 1);

        charts.push({
          title: metricLabels[metric],
          allIndiaAvg: allIndiaAvgMap[metric],
          dealerAvg,
          maxValue,
          users: sortedUsers,
          key: metricLabels[metric].toLowerCase().replace(/\s/g, ''),
        });
      }
    });

    // Process call metric
    const callMetric = this.psWiseSelectedCallType || 'calls';
    const callUsers = filteredUsers
      .map((u) => ({
        name: u.name,
        value: u[callMetric] || 0,
        dealer: dealerName,
      }))
      .sort((a, b) => b.value - a.value);

    if (callUsers.length > 0) {
      const dealerAvg = Math.round(
        callUsers.reduce((sum, u) => sum + u.value, 0) / callUsers.length
      );

      const maxValue = Math.max(...callUsers.map((u) => u.value), 1);

      charts.push({
        title: metricLabels[callMetric],
        allIndiaAvg: allIndiaAvgMap[callMetric],
        dealerAvg,
        maxValue,
        users: callUsers,
        key: 'countOfCalls',
      });
    }

    return charts.length > 0
      ? { dealerName, users: filteredUsers, charts }
      : null;
  }

  // Method to get bar color based on index
  getBarColor(index: number, chartTitle?: string): string {
    const title = chartTitle?.toLowerCase() || '';

    if (title.includes('sa leads')) {
      return '#001f5b'; // Navy Blue
    } else if (title.includes('events')) {
      return '#ff9800'; // Orange
    } else if (title.includes('tasks')) {
      return '#28a745'; // Green
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

  accordionStates = {
    leads: true, // Default to open
    events: false,
    tasks: false,
    calls: false,
    lastLogin: false,
  };

  // Add method to toggle accordion sections
  toggleAccordion(section: string) {
    this.accordionStates[section as keyof typeof this.accordionStates] =
      !this.accordionStates[section as keyof typeof this.accordionStates];
  }

  expandedDealerIndex: number | null = null;

  toggleDealer(index: number) {
    this.expandedDealerIndex =
      this.expandedDealerIndex === index ? null : index;
  }
}
