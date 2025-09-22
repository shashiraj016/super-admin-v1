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
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchTrendChart();
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
  topdigitalLeads: number = 0
  topTasks: number = 0;
  topUTDs: number = 0;
  topCall: number = 0;
  topenquiryCalls: number = 0;
  topcoldCalls: number = 0;
  DistinctUsers: number = 0
  roleFilter: 'PS' | 'SM' | 'Both' = 'PS'; // default
  selectedCallType: string = 'calls'; // Default to total calls
  callTypes = [
    { value: 'calls', label: 'Total Calls' },
    { value: 'enquiryCalls', label: 'Enquiry Calls' },
    { value: 'coldCalls', label: 'Cold Calls' }
  ];




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
      this.selectedDealers = this.filteredDealers.map(d => d.dealer_id);
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
    console.log('Token:', localStorage.getItem('token'));

    if (!token) {
      console.error('❌ No token found in localStorage');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
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

    this.http
      .get<any>(`${this.BASE_URL}${this.TREND_CHART_URL}`, { headers, params })
      .subscribe({
        next: (res) => {
          console.log('✅ API Response:', res.topCards);

          // store dealer list on first load
          if (res.activeDealers) {
            this.dealers = res.activeDealers;
            this.filteredDealers = [...this.dealers];
            // if nothing selected yet, default to all dealers
            if (!this.selectedDealers.length || this.selectedDealers.includes('all')) {
              this.selectedDealers = this.dealers.map((d) => d.dealer_id);
            }
          }

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

          this.updateAllChartsFromApi(res);
        },
        error: (err) => {
          console.error('❌ API Error:', err);
        },
      });
  }

  updateAllChartsFromApi(res: any) {
    if (!res) return;

    if (res.psWiseActivity) {
      this.psWiseData = res.psWiseActivity;
      this.processPsWiseActivity(res.psWiseActivity);
    }

    // ---- Normalize input data ----
    const normalizeData = (input: any, key: string) => {
      if (!input) return [];

      // Case 1: flat object of arrays (All dealers case)
      if (typeof input === 'object' && !Array.isArray(input) && Array.isArray(input[key])) {
        return (input[key] || []).map((d: any) => ({
          ...d,
          dealer_name: 'All Dealers',
        }));
      }

      // Case 2: dealer-keyed object
      if (typeof input === 'object' && !Array.isArray(input)) {
        return Object.entries(input).flatMap(([dealer, obj]: [string, any]) => {
          const arr = obj?.[key] || [];
          return arr.map((d: any) => ({
            ...d,
            dealer_name: dealer,
          }));
        });
      }

      // Case 3: plain array
      if (Array.isArray(input)) {
        return input.map((d: any) => ({
          ...d,
          dealer_name: 'All Dealers',
        }));
      }

      return [];
    };

    // ---- Transform data into chart series & categories ----
    const transform = (data: any[], isHourChart = false) => {
      if (!data || data.length === 0) return { series: [], categories: [] };

      const xKey = isHourChart ? 'hour' : 'label';

      // Unique categories
      const uniqueCategories = Array.from(new Set(data.map((item) => item[xKey])));

      // Sort categories
      const sortedCategories = uniqueCategories.sort((a, b) => {
        if (isHourChart) {
          const [ah, am] = a.split(':').map(Number);
          const [bh, bm] = b.split(':').map(Number);
          return ah * 60 + am - (bh * 60 + bm);
        } else {
          const parseDate = (dateStr: string) => {
            const parts = dateStr.split(',').map((s) => s.trim());
            const [, dayMonth] = parts.length > 1 ? parts : ['', parts[0]];
            const [day, month] = dayMonth.split(' ');
            const monthMap: { [key: string]: number } = {
              Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
              Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
            };
            return new Date(2024, monthMap[month] || 0, parseInt(day, 10));
          };
          return parseDate(a as string).getTime() - parseDate(b as string).getTime();
        }
      });

      // Group by dealer
      const dealerGroups: { [key: string]: any[] } = {};
      data.forEach((item) => {
        const dealer = item.dealer_name || 'All Dealers';
        if (!dealerGroups[dealer]) dealerGroups[dealer] = [];
        dealerGroups[dealer].push(item);
      });

      // Build series
      const series = Object.keys(dealerGroups).map((dealer) => {
        const map = new Map(dealerGroups[dealer].map((d: any) => [d[xKey], Number(d.count) || 0]));
        return {
          name: dealer,
          data: sortedCategories.map((cat) => map.get(cat) || 0),
        };
      });

      // Format categories for x-axis
      const categories = isHourChart
        ? sortedCategories.map((h) => {
          const [hh, mm] = h.split(':').map(Number);
          return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
        })
        : sortedCategories;

      return { series, categories };
    };

    // ---- Helper to update chart ----
    const updateChart = (chartObj: any, chartData: any, isHourChart = false) => {
      const tickAmount = isHourChart
        ? Math.ceil(chartData.categories.length / 6) // dynamic tick interval for readability
        : undefined;

      return {
        ...chartObj,
        series: chartData.series,
        chart: { type: 'line', height: 350 },
        stroke: { width: 2 },
        xaxis: {
          categories: chartData.categories,
          tickAmount: tickAmount,
          labels: isHourChart ? { rotate: -45 } : {},
        },
      };
    };

    // ---- Chart configurations ----
    const chartConfigs = [
      { key: 'leads', resKey: 'left', target: 'dayLeadChart' },
      { key: 'utd', resKey: 'left', target: 'dayEventChart' },
      { key: 'followups', resKey: 'left', target: 'dayTaskChart' },
      { key: this.selectedCallType, resKey: 'left', target: 'dayCallsChart' }, // Use selected call type
      { key: 'lastLogin', resKey: 'left', target: 'dayLastLoginChart' },

      { key: 'leads', resKey: 'right', target: 'hourLeadChart' },
      { key: 'utd', resKey: 'right', target: 'hourEventChart' },
      { key: 'followups', resKey: 'right', target: 'hourTaskChart' },
      { key: this.selectedCallType, resKey: 'right', target: 'hourCallsChart' }, // Use selected call type
      { key: 'lastLogin', resKey: 'right', target: 'hourLastLoginChart' },
    ];

    // ---- Loop through charts and update ----
    chartConfigs.forEach(({ key, resKey, target }) => {
      const isHourChart = resKey === 'right';
      const chartData = transform(normalizeData(res[resKey], key), isHourChart);
      (this as any)[target] = updateChart((this as any)[target], chartData, isHourChart);
    });
  }


  fetchTrendChartWithFilters() {
    const token = localStorage.getItem('token');
    console.log('Token:', localStorage.getItem('token'), "second method");

    if (!token) return;

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    let dealerIds = '';

    // Only include dealer_ids if the user interacted
    if (this.userTouchedDealers && this.selectedDealers.length > 0) {
      dealerIds = this.selectedDealers.join(',');
    }

    let params = new HttpParams()
      .set('type', this.selectedDateFilter)
      .set('timezone', 'Asia/Calcutta');

    if (dealerIds.trim()) {
      params = params.set('dealer_ids', dealerIds);
    }

    this.http
      .get<any>(`${this.BASE_URL}${this.TREND_CHART_URL}`, { headers, params })
      .subscribe({
        next: (res) => {
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
          this.updateAllChartsFromApi(res);
        },
        error: (err) => console.error(err),
      });
  }

  transformDataForChart = (data: any[]) => {
    if (!data || data.length === 0) return { series: [], categories: [] };

    // Keep a map of label → date for sorting
    const labelDateMap = data.reduce((map, item) => {
      const label = item.label;
      const dateStr = label.split(',')[1]?.trim(); // "15 Sep"
      const [day, month] = dateStr.split(' ');
      const monthMap: { [key: string]: number } = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
      };
      const dateObj = new Date(2024, monthMap[month] || 0, parseInt(day, 10));
      map[label] = dateObj;
      return map;
    }, {} as Record<string, Date>);

    // Sort labels based on date
    const sortedLabels = Object.keys(labelDateMap).sort(
      (a, b) => labelDateMap[a].getTime() - labelDateMap[b].getTime()
    );

    // Group data by dealer
    const dealerGroups: { [key: string]: any[] } = {};
    data.forEach(item => {
      const key = item.dealer_name || 'Unknown';
      if (!dealerGroups[key]) dealerGroups[key] = [];
      dealerGroups[key].push(item);
    });

    // Build series aligned to sorted labels
    const series = Object.keys(dealerGroups).map(key => {
      const map = new Map(dealerGroups[key].map(d => [d.label, Number(d.count) || 0]));
      return { name: key, data: sortedLabels.map(label => map.get(label) || 0) };
    });

    return { series, categories: sortedLabels }; // ✅ categories are label strings
  };

  groupDataByDealer(data: any[]) {
    return data.reduce((groups: any, item: any) => {
      const dealerName = item.dealer_name || 'Unknown Dealer';
      if (!groups[dealerName]) {
        groups[dealerName] = [];
      }
      groups[dealerName].push(item);
      return groups;
    }, {});
  }

  formatDate(dateString: string): string {
    // Format date for x-axis labels
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
    });
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
    const callType = this.callTypes.find(type => type.value === this.selectedCallType);
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
    { value: 'enquiryCalls', label: 'Enquiry Calls' }
  ];

  psWiseSelectedCallType = 'calls'; // default



  // Add this method to process PS-wise activity data
 processPsWiseActivity(psWiseActivity: any) {
  if (!psWiseActivity) return;

  const metrics = ['saLeads', 'uniquetestDrives', 'followups', 'lastLogin', 'target'] as const;
  const metricLabels: { [key: string]: string } = {
    saLeads: 'saLeads',
    uniquetestDrives: 'events',
    followups: 'tasks',
    calls: 'calls',
    coldCalls: 'cold calls',
    enquiryCalls: 'enquiry calls',
    lastLogin: 'last login',
    target: 'target'
  };

  this.psWiseCharts = [];

  const calculateAllIndiaAvg = (metric: string) => {
    let totalSum = 0;
    let totalCount = 0;
    Object.values(psWiseActivity).forEach((users: any) => {
      if (Array.isArray(users)) {
        users.forEach((user: any) => {
          if (this.roleFilter === 'Both' || user.role === this.roleFilter) {
            totalSum += user[metric] || 0;
            totalCount++;
          }
        });
      }
    });
    return totalCount > 0 ? Math.round(totalSum / totalCount) : 0;
  };

  Object.entries(psWiseActivity).forEach(([dealerName, users]: [string, any]) => {
    if (!Array.isArray(users)) return;

    const filteredUsers = users.filter(u =>
      this.roleFilter === 'Both' ? true : u.role === this.roleFilter
    );

    const charts: any[] = [];

    // Static metrics (leads, testDrives, followups, lastLogin, target)
    metrics.forEach(metric => {
      const metricData = filteredUsers.map(u => ({
        x: u.name,
        // 👇 Always include 0, but give a tiny placeholder bar if val=0
        y: u[metric] && u[metric] > 0 ? u[metric] : 0.0001,
        displayVal: u[metric] || 0,
        dealer: dealerName
      }));

      if (metricData.length > 0) {
        const dealerAvg =
          Math.round(metricData.reduce((sum, d) => sum + d.displayVal, 0) / metricData.length);

        charts.push({
          title: metricLabels[metric],
          allIndiaAvg: calculateAllIndiaAvg(metric),
          dealerAvg,
          series: [{ name: metricLabels[metric], data: metricData.map(d => d.y) }],
          chart: { type: 'bar', height: 350, toolbar: { show: false } },
          plotOptions: {
            bar: {
              horizontal: true,
              distributed: true,
              barHeight: '70%',
              // dataLabels: { position: 'right' } 
            }
          },
          colors: this.generateColors(metricData.length),
          xaxis: {
            categories: metricData.map(d => d.x),
            labels: { style: { fontSize: '10px' } }
          },
          yaxis: { labels: { style: { fontSize: '10px' } } },
          dataLabels: {
            enabled: true,
            formatter: (_val: number, opts: any) => {
              return metricData[opts.dataPointIndex].displayVal; // show real 0
            },
            style: { fontSize: '10px', fontWeight: 'bold' }
          },
          tooltip: {
            custom: ({ dataPointIndex }: any) => {
              const user = metricData[dataPointIndex];
              return `
                <div style="padding:8px;">
                  <strong>${user.x}</strong><br>
                  <span>${user.dealer}</span><br>
                  <span>${metricLabels[metric]}: ${user.displayVal}</span>
                </div>
              `;
            }
          },
          legend: { show: false },
          key: metricLabels[metric].toLowerCase().replace(/\s/g, '')
        });
      }
    });

    // **Dynamic calls chart (dropdown-controlled)**
    const callMetric = this.psWiseSelectedCallType; // 'calls', 'coldCalls', or 'enquiryCalls'
    const callData = filteredUsers.map(u => ({
      x: u.name,
      y: u[callMetric] && u[callMetric] > 0 ? u[callMetric] : 0.0001,
      displayVal: u[callMetric] || 0,
      dealer: dealerName
    }));

    if (callData.length > 0) {
      const dealerAvg =
        Math.round(callData.reduce((sum, d) => sum + d.displayVal, 0) / callData.length);

      charts.push({
        title: metricLabels[callMetric],
        allIndiaAvg: calculateAllIndiaAvg(callMetric),
        dealerAvg,
        series: [{ name: metricLabels[callMetric], data: callData.map(d => d.y) }],
        chart: { type: 'bar', height: 350, toolbar: { show: false } },
        plotOptions: {
          bar: {
            horizontal: true,
            distributed: true,
            barHeight: '70%',
            dataLabels: { position: 'right' }
          }
        },
        colors: this.generateColors(callData.length),
        xaxis: {
          categories: callData.map(d => d.x),
          labels: { style: { fontSize: '10px' } }
        },
        yaxis: { labels: { style: { fontSize: '10px' } } },
        dataLabels: {
          enabled: true,
          formatter: (_val: number, opts: any) => {
            return callData[opts.dataPointIndex].displayVal;
          },
          style: { fontSize: '10px', fontWeight: 'bold' }
        },
        tooltip: {
          custom: ({ dataPointIndex }: any) => {
            const user = callData[dataPointIndex];
            return `
              <div style="padding:8px;">
                <strong>${user.x}</strong><br>
                <span>${user.dealer}</span><br>
                <span>${metricLabels[callMetric]}: ${user.displayVal}</span>
              </div>
            `;
          }
        },
        legend: { show: false },
        key: 'countOfCalls'
      });
    }

    if (charts.length > 0) {
      this.psWiseCharts.push({
        dealerName,
        users: filteredUsers,
        charts
      });
    }
  });

  // Initialize accordion states after processing all dealers
  this.initializePsAccordionStates();
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
      this.processPsWiseActivity(this.psWiseData);
    }
  }


  get sectionTitle() {
    if (this.roleFilter === 'Both') return 'PS+SM Activity';
    return `${this.roleFilter}-wise Activity`;
  }


  generateColors(count: number): string[] {
    const baseColors = [
      '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
      '#546E7A', '#26a69a', '#D10CE8', '#FF6B35', '#C7F464'
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  accordionStates = {
    leads: true,     // Default to open
    events: false,
    tasks: false,
    calls: false,
    lastLogin: false
  };

  // Add method to toggle accordion sections
  toggleAccordion(section: string) {
    this.accordionStates[section as keyof typeof this.accordionStates] =
      !this.accordionStates[section as keyof typeof this.accordionStates];
  }


  expandedDealerIndex: number | null = null;

  toggleDealer(index: number) {
    this.expandedDealerIndex = this.expandedDealerIndex === index ? null : index;
  }


}
