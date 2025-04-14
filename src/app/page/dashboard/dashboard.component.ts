import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnInit, signal } from '@angular/core';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { Chart, ChartType, registerables } from 'chart.js';

// Register all chart components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements AfterViewInit, OnInit {
  dashboardData: any;
  totalLeads = signal<number>(0);
  totalTestDrives = signal<number>(0);
  totalOrders = signal<number>(0);
  prevLeads = signal<number>(0);
  prevTestDrives = signal<number>(0);
  prevOrders = signal<number>(0);

  constructor(private http: HttpClient) {}

  // ngOnInit() {
  //   fetch('https://api.smartassistapp.in/api/superAdmin/dashboard')
  //     .then((res) => res.json())
  //     .then((response) => {
  //       const data = response.data;

  //       // Currents
  //       this.totalLeads.set(data.totalLeads);
  //       this.totalTestDrives.set(data.totalTestDrives);
  //       this.totalOrders.set(data.totalOrders);

  //       // Simulated previous data — replace with real ones if available
  //       this.prevLeads.set(40);
  //       this.prevTestDrives.set(50);
  //       this.prevOrders.set(30);
  //     });
  // }

  // Reusable function to initialize a chart
  ngOnInit() {
    console.log('ngonit triggered');

    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NWM4NDk2Yi1lZjIyLTQ1MWUtYjAyNi1kMmIyNTIyNzA2YmYiLCJyb2xlIjoiU3VwZXJBZG1pbiIsInVzZXJFbWFpbCI6Im1hZGh1bWl0aGEubWFuaUBhcmlhbnRlY2hzb2x1dGlvbnMuY29tIiwiaWF0IjoxNzQ0NjA3NTk5LCJleHAiOjE3NDQ2MTExOTl9.4MHux5VRWeUkeF51qO5qMtStUcta27qpmZLMJL5Dhdc';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .get('https://api.smartassistapp.in/api/superAdmin/dashboard', {
        headers,
      })
      .subscribe(
        (response: any) => {
          console.log('API Response:', response);
          if (response && response.status === 200) {
            const data = response.data;

            this.totalLeads.set(data.totalLeads);
            this.totalTestDrives.set(data.totalTestDrives);
            this.totalOrders.set(data.totalOrders);

            console.log('Total Leads:', this.totalLeads());
            console.log('Total Test Drives:', this.totalTestDrives());
            console.log('Total Orders:', this.totalOrders());

            // Now that data is ready, create the charts
            this.createPieChart();
            this.createDoughnutChart();
          } else {
            console.error(
              'Error in response:',
              response.message || 'Unknown error'
            );
          }
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
      );
  }
  private createChart(
    ctx: HTMLCanvasElement,
    chartType: ChartType,
    data: any,
    options: any
  ) {
    new Chart(ctx, {
      type: chartType,
      data: data,
      options: options,
    });
  }

  ngAfterViewInit() {
    // Create Pie Chart
    this.createPieChart();

    // Create Doughnut Chart
    this.createDoughnutChart();

    // Create Line Chart (Sales Last Month)
    const ctxLine = document.getElementById('lineChart') as HTMLCanvasElement;
    if (ctxLine) {
      this.createChart(
        ctxLine,
        'line',
        {
          labels: Array.from({ length: 10 }, (_, i) => `Dealer ${i + 1}`),
          datasets: [
            {
              label: 'Total Leads',
              data: Array.from({ length: 30 }, () =>
                Math.floor(Math.random() * 100)
              ),
              borderColor: '#0276FE',
              fill: false,
            },
          ],
        },
        {
          responsive: true,
          maintainAspectRatio: false,
        }
      );
    }

    // Create Gradient Bar Chart
    this.createGradientBarChart();
  }
  calculateChange(current: number, previous: number): string {
    if (previous === 0) return 'N/A'; // avoid divide-by-zero
    const change = ((current - previous) / previous) * 100;
    const arrow = change >= 0 ? '▲' : '▼';
    const colorClass = change >= 0 ? 'text-success' : 'text-danger';
    const formatted = `${arrow} ${Math.abs(change).toFixed(2)}%`;
    return `<span class="${colorClass}" style="font-size: 10px;">${formatted}</span>`;
  }

  // private createPieChart() {
  //   const pieChartElement = document.getElementById(
  //     'pie_chart'
  //   ) as HTMLCanvasElement;
  //   if (pieChartElement) {
  //     this.createChart(
  //       pieChartElement,
  //       'pie',
  //       {
  //         datasets: [
  //           {
  //             data: [45, 25, 20, 10],
  //             borderWidth: 0,
  //             backgroundColor: [
  //               'rgba(34, 47, 185, .9)',
  //               'rgba(34, 47, 185, .7)',
  //               'rgba(34, 47, 185, .5)',
  //               'rgba(0,0,0,0.07)',
  //             ],
  //             hoverBackgroundColor: [
  //               'rgba(34, 47, 185, .9)',
  //               'rgba(34, 47, 185, .7)',
  //               'rgba(34, 47, 185, .5)',
  //               'rgba(0,0,0,0.07)',
  //             ],
  //           },
  //         ],
  //         labels: ['one', 'two', 'three', 'four'],
  //       },
  //       {
  //         responsive: true,
  //         plugins: { legend: { display: false } },
  //         maintainAspectRatio: false,
  //       }
  //     );
  //   }
  // }
  private createPieChart() {
    const pieChartElement = document.getElementById(
      'pieChart'
    ) as HTMLCanvasElement;
    if (pieChartElement) {
      new Chart(pieChartElement, {
        type: 'pie',
        data: {
          labels: ['Total Leads', 'Total Test Drives', 'Total Orders'],
          datasets: [
            {
              label: 'Dashboard Data',
              data: [
                this.totalLeads(),
                this.totalTestDrives(),
                this.totalOrders(),
              ],
              backgroundColor: ['#FF5733', '#33FF57', '#3357FF'],
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (tooltipItem) {
                  return tooltipItem.label + ': ' + tooltipItem.raw;
                },
              },
            },
          },
        },
      });
    }
  }

  // private createDoughnutChart() {
  //   const doughnutChartElement = document.getElementById(
  //     'doughnut_chart'
  //   ) as HTMLCanvasElement;
  //   if (doughnutChartElement) {
  //     this.createChart(
  //       doughnutChartElement,
  //       'doughnut',
  //       {
  //         datasets: [
  //           {
  //             data: [45, 25], // Use only two values
  //             backgroundColor: [
  //               'rgba(33, 183, 49, 1)', // Green for Orders
  //               'rgba(34, 47, 185, 1)', // Blue for Test Drives
  //             ],
  //             hoverBackgroundColor: [
  //               'rgba(33, 183, 49, .9)',
  //               'rgba(34, 47, 185, .9)',
  //             ],
  //           },
  //         ],
  //       },
  //       {
  //         cutout: '70%',
  //         responsive: true,
  //         maintainAspectRatio: false,
  //       }
  //     );
  //   }
  // }
  private createDoughnutChart() {
    const doughnutChartElement = document.getElementById(
      'doughnut_chart'
    ) as HTMLCanvasElement;
    if (doughnutChartElement) {
      const data = [
        this.totalLeads(),
        this.totalTestDrives(),
        this.totalOrders(),
      ];

      new Chart(doughnutChartElement, {
        type: 'doughnut',
        data: {
          datasets: [
            {
              data: data,
              backgroundColor: [
                'rgba(33, 183, 49, 1)',
                'rgba(34, 47, 185, 1)',
                'rgba(255, 99, 132, 1)',
              ],
              hoverBackgroundColor: [
                'rgba(33, 183, 49, .9)',
                'rgba(34, 47, 185, .9)',
                'rgba(255, 99, 132, .9)',
              ],
            },
          ],
        },
        options: {
          cutout: '70%',
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    }
  }

  private createGradientBarChart() {
    const barChart2Element = document.getElementById(
      'barChart_2'
    ) as HTMLCanvasElement;
    if (barChart2Element) {
      const ctx = barChart2Element.getContext('2d');
      if (ctx) {
        const gradientStroke = ctx.createLinearGradient(0, 0, 0, 250);
        gradientStroke.addColorStop(0, 'rgba(34, 47, 185, 1)');
        gradientStroke.addColorStop(1, 'rgba(34, 47, 185, 0.5)');

        barChart2Element.height = 100;

        this.createChart(
          barChart2Element,
          'bar',
          {
            labels: [
              'Dealer-1',
              'Dealer-2',
              'Dealer-3',
              'Dealer-4',
              'Dealer-5',
              'Dealer-6',
              'Dealer-7',
            ],
            datasets: [
              {
                label: 'Dealer Wise Leads',
                data: [65, 59, 80, 81, 56, 55, 40],
                borderColor: gradientStroke,
                borderWidth: 0,
                backgroundColor: gradientStroke,
                hoverBackgroundColor: gradientStroke,
              },
            ],
          },
          {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
              },
              x: {
                barPercentage: 0.5,
              },
            },
          }
        );
      }
    }
  }
}
