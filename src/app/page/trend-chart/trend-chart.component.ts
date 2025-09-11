import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Component, HostListener } from '@angular/core';
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
    xaxis: {
      type: 'category', // ✅ Important: stops auto-date parsing
      categories: [], // Fill in the order you want: ["Wk of 18 Aug", "Wk of 25 Aug", "Wk of 01 Sep"]
      labels: {
        rotate: -45,
        hideOverlappingLabels: true,
        showDuplicates: false,
        formatter: (val: string) => val, // keep as-is
        style: {
          fontSize: '10px',
        },
      },
      tickPlacement: 'on', // ✅ makes sure it respects your order
      sorted: false, // ✅ prevents Apex from re-sorting
    },

    tooltip: {
      x: {
        formatter: (val: string | number) => {
          const date = new Date(val);
          return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
          });
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
  TREND_CHART_URL = '/api/superAdmin/trend-chart';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTrendChart();
  }

  dealers: any[] = []; // Your dealers array
  selectedDealers: any[] = [];
  filteredDealers: any[] = [];
  dropdownOpen = false;
  dealerSearch = '';
  selectedDateFilter: string = 'LAST_30_DAYS';
  selectedMetric: string = 'calls';
  chartTypes: ChartType[] = ['line', 'area', 'bar'];
  currentChartTypeIndex = 0; // keep track of current

  loadDealers() {
    // Your method to load dealers
    // this.dealers = your dealer data
    this.filteredDealers = [...this.dealers];
  }

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
    const dealerId = dealer.dealer_id;
    const index = this.selectedDealers.indexOf(dealerId);

    if (index > -1) {
      this.selectedDealers.splice(index, 1);
    } else {
      this.selectedDealers.push(dealerId);
    }

    // Fetch updated chart data
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
      this.filteredDealers.forEach((dealer) => {
        if (!this.selectedDealers.includes(dealer.dealer_id)) {
          this.selectedDealers.push(dealer.dealer_id);
        }
      });
    } else {
      this.filteredDealers.forEach((dealer) => {
        const index = this.selectedDealers.indexOf(dealer.dealer_id);
        if (index > -1) {
          this.selectedDealers.splice(index, 1);
        }
      });
    }

    this.fetchTrendChartWithFilters();
  }

  clearSelection() {
    this.selectedDealers = [];
    this.fetchTrendChartWithFilters();
  }

  fetchTrendChart() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found in localStorage');
      return;
    }

    const headers = new HttpHeaders({
      authorization: `Bearer ${token}`,
    });

    const params = new HttpParams()
      .set('metric', 'calls')
      .set('dateFilter', 'LAST_30_DAYS');

    this.http
      .get<any>(`${this.BASE_URL}${this.TREND_CHART_URL}`, { headers, params })
      .subscribe({
        next: (res) => {
          console.log('✅ Initial API Response:', res);

          // Populate dealer dropdown
          if (res.activeDealers) {
            this.dealers = res.activeDealers;
            this.filteredDealers = [...this.dealers];
          }

          // Update chart with initial data (empty since no dealers selected)
          this.updateChart(res.data || []);
        },
        error: (err) => {
          console.error('❌ API Error:', err);
        },
      });
  }

  fetchTrendChartWithFilters() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found in localStorage');
      return;
    }

    const headers = new HttpHeaders({
      authorization: `Bearer ${token}`,
    });

    let params = new HttpParams()
      .set('metric', this.selectedMetric)
      .set('dateFilter', this.selectedDateFilter);

    if (this.selectedDealers.length > 0) {
      params = params.set('dealer_id', this.selectedDealers.join(','));
    }
    // 👉 don’t set dealer_id when none selected

    this.http
      .get<any>(`${this.BASE_URL}${this.TREND_CHART_URL}`, { headers, params })
      .subscribe({
        next: (res) => {
          console.log('✅ Filtered API Response:', res);
          this.updateChart(res.data || []);
        },
        error: (err) => {
          console.error('❌ API Error:', err);
        },
      });
  }

  updateChart(data: any[]) {
    if (!data || data.length === 0) {
      this.chartOptions = {
        ...this.chartOptions,
        series: [],
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: [],
        },
      };
      return;
    }

    const transformedData = this.transformDataForChart(data);

    this.chartOptions = {
      ...this.chartOptions,
      series: transformedData.series,
      xaxis: {
        ...this.chartOptions.xaxis,
        categories: transformedData.categories,
      },
      colors: [
        '#2a8eff',
        '#0f5fb8',
        '#1676e6',
        '#86c1ff',
        '#57a8ff',
        '#059669',
        '#0ea5e9',
        '#9333ea',
        '#d97706',
        '#e11d48',
        '#0d4c90',
        '#0c3f76',
        '#64748b',
        '#475569',
        '#14b8a6',
      ],
      chart: {
        ...this.chartOptions.chart,
        type: this.chartOptions.chart?.type || 'line', // ✅ keep type required
        toolbar: {
          ...this.chartOptions.chart?.toolbar,
          tools: {
            ...this.chartOptions.chart?.toolbar?.tools,
          },
          export: {
            // ✅ put export here, not directly under chart
            csv: { filename: this.getExportFileName() },
            svg: { filename: this.getExportFileName() },
            png: { filename: this.getExportFileName() },
          },
        },
      },
    };
  }

  transformDataForChart(data: any[]) {
    if (!data || data.length === 0) return { series: [], categories: [] };

    // Preserve order as given from API (no sort)
    const allLabels = Array.from(new Set(data.map((item) => item.label)));

    // Group data by dealer
    const dealerGroups: { [key: string]: any[] } = {};
    data.forEach((item) => {
      const key = item.dealer_name; // series grouped by dealer
      if (!dealerGroups[key]) dealerGroups[key] = [];
      dealerGroups[key].push(item);
    });

    const series = Object.keys(dealerGroups).map((dealerName) => {
      const dealerData = dealerGroups[dealerName];
      const dealerMap = new Map(
        dealerData.map((d: any) => [d.label, Number(d.count) || 0])
      );

      const alignedData = allLabels.map((label) => dealerMap.get(label) || 0);

      return {
        name: dealerName,
        data: alignedData,
      };
    });

    const categories = allLabels; // x-axis labels in API order

    return { series, categories };
  }

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

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.dropdown');

    if (!dropdown || !dropdown.classList.contains('flt1')) {
      this.dropdownOpen = false;
    }
  }
}
