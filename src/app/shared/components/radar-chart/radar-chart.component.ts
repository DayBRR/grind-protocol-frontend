import {
  Component, Input, OnChanges, OnDestroy, AfterViewInit,
  ElementRef, ViewChild
} from '@angular/core';
import {
  Chart, RadarController, RadialLinearScale,
  PointElement, LineElement, Filler, Tooltip
} from 'chart.js';

Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export interface RadarAxis {
  label: string;
  value: number; // 0–100
}

@Component({
  selector: 'gp-radar-chart',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; }
    canvas { display: block; width: 100% !important; height: 100% !important; }
  `]
})
export class RadarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() axes: RadarAxis[] = [];
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.buildChart();
  }

  ngOnChanges(): void {
    if (this.chart) this.updateChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private buildChart(): void {
    const ctx = this.canvasRef.nativeElement.getContext('2d')!;

    this.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: this.axes.map(a => a.label),
        datasets: [{
          data: this.axes.map(a => a.value),
          backgroundColor: 'rgba(217, 70, 168, 0.15)',
          borderColor: '#d946a8',
          borderWidth: 2,
          pointBackgroundColor: '#d946a8',
          pointBorderColor: '#0a0a0c',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff',
          fill: true,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: { 
          legend: { display: false },
          tooltip: {
            backgroundColor: '#16161d',
            titleFont: { family: 'Syne', size: 12, weight: 'bold' },
            bodyFont: { family: 'DM Mono', size: 11 },
            padding: 10,
            displayColors: false,
            borderColor: 'rgba(217, 70, 168, 0.3)',
            borderWidth: 1
          }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            beginAtZero: true,
            ticks: {
              stepSize: 20,
              display: false,
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              lineWidth: 1,
            },
            angleLines: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            pointLabels: {
              color: '#8b899a',
              font: { 
                size: 9, 
                family: 'Syne',
                weight: 'bold'
              },
              padding: 5
            },
          }
        }
      }
    });
  }

  private updateChart(): void {
    if (!this.chart) return;
    this.chart.data.labels = this.axes.map(a => a.label);
    this.chart.data.datasets[0].data = this.axes.map(a => a.value);
    this.chart.update();
  }
}
