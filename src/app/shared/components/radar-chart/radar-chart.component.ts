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
    :host { display: block; width: 200px; height: 200px; flex-shrink: 0; }
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
          backgroundColor: 'rgba(34,211,238,0.12)',
          borderColor: 'rgba(34,211,238,0.8)',
          borderWidth: 1.5,
          pointBackgroundColor: 'rgba(34,211,238,1)',
          pointBorderColor: '#1a1f2e',
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 600, easing: 'easeInOutQuart' },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 25,
              display: false,
            },
            grid: {
              color: 'rgba(255,255,255,0.06)',
              circular: false,
            },
            angleLines: {
              color: 'rgba(255,255,255,0.08)',
            },
            pointLabels: {
              color: 'rgba(148,163,184,0.8)',
              font: { size: 10, family: 'var(--font-mono, monospace)' },
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
