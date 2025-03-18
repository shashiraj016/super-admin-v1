import { Component, AfterViewInit } from '@angular/core';
import { Chart, ChartType, registerables } from 'chart.js';

// Register all chart components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements AfterViewInit {

  constructor() { }

  // Reusable function to initialize a chart
  private createChart(ctx: HTMLCanvasElement, chartType: ChartType, data: any, options: any) {
    new Chart(ctx, {
      type: chartType, // Explicitly cast the chart type to the correct ChartType
      data: data,
      options: options
    });
  }

  ngAfterViewInit() {
    // Create Pie Chart
    this.createPieChart();

    // Create Doughnut Chart
    this.createDoughnutChart();

    // Create Line Chart (Sales Last Month)
    const ctxLine = document.getElementById('lineChart') as HTMLCanvasElement;
    if (ctxLine) { // Null check for canvas element
      this.createChart(ctxLine, 'line', {
        labels: Array.from({ length: 10 }, (_, i) => `Dealer ${i +1}`),
        datasets: [
          {
            label: 'Total Leads',
            data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100)),
            borderColor: '#0276FE',
            fill: false
          }
          // {
          //   label: 'Sales 2',
          //   data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100)),
          //   borderColor: 'green', // Different color for the second line
          //   fill: false
          // }
        ]
      }, {
        responsive: true,
        maintainAspectRatio: false
      });
    }

    // Create Gradient Bar Chart
    this.createGradientBarChart();
  }

  private createPieChart() {
    const pieChartElement = document.getElementById('pie_chart') as HTMLCanvasElement;
    if (pieChartElement) {
      this.createChart(pieChartElement, 'pie', {
        datasets: [{
          data: [45, 25, 20, 10],
          borderWidth: 0,
          backgroundColor: [
            "rgba(34, 47, 185, .9)",
            "rgba(34, 47, 185, .7)",
            "rgba(34, 47, 185, .5)",
            "rgba(0,0,0,0.07)"
          ],
          hoverBackgroundColor: [
            "rgba(34, 47, 185, .9)",
            "rgba(34, 47, 185, .7)",
            "rgba(34, 47, 185, .5)",
            "rgba(0,0,0,0.07)"
          ]
        }],
        labels: ["one", "two", "three", "four"]
      }, {
        responsive: true,
        legend: { display: false },
        maintainAspectRatio: false
      });
    }
  }

  private createDoughnutChart() {
    const doughnutChartElement = document.getElementById('doughnut_chart') as HTMLCanvasElement;
    if (doughnutChartElement) {
      this.createChart(doughnutChartElement, 'doughnut', {
        datasets: [{
          data: [45, 25, 20],
          borderWidth: 3,
          borderColor: "rgba(255,255,255,1)",
          backgroundColor: [
            "rgba(34, 47, 185, 1)",
            "rgba(33, 183, 49, 1)",
            "rgba(255, 38, 37, 1)"
          ],
          hoverBackgroundColor: [
            "rgba(34, 47, 185, 0.9)",
            "rgba(33, 183, 49, .9)",
            "rgba(255, 38, 37, .9)"
          ]
        }]
      }, {
        cutoutPercentage: 70,
        responsive: true,
        maintainAspectRatio: false
      });
    }
  }

  // Create Gradient Bar Chart (BarChart_2)
  private createGradientBarChart() {
    const barChart2Element = document.getElementById('barChart_2') as HTMLCanvasElement;
    if (barChart2Element) {
      const ctx = barChart2Element.getContext('2d');
      if (ctx) { // Null check for context
        // Generate Gradient
        const gradientStroke = ctx.createLinearGradient(0, 0, 0, 250);
        gradientStroke.addColorStop(0, "rgba(34, 47, 185, 1)");
        gradientStroke.addColorStop(1, "rgba(34, 47, 185, 0.5)");

        // Set height for the chart
        barChart2Element.height = 100;

        this.createChart(barChart2Element, 'bar', {
          labels: ["Dealer-1", "Dealer-2", "Dealer-3", "Dealer-4", "Dealer-5", "Dealer-6", "Dealer-7"],
          datasets: [{
            label: "Dealer Wise Leads",
            data: [65, 59, 80, 81, 56, 55, 40],
            borderColor: gradientStroke,
            borderWidth: 0,
            backgroundColor: gradientStroke,
            hoverBackgroundColor: gradientStroke
          }]
        }, {
          responsive: true,
          maintainAspectRatio: false,
          legend: { display: false },
          scales: {
            y: {
              ticks: { beginAtZero: true }
            },
            x: {
              barPercentage: 0.5
            }
          }
        });
      }
    }
  }
}
