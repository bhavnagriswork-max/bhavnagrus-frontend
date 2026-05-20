import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styles: []
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  stats: any = {};
  loading = true;
  private refreshSub?: Subscription;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.fetchStats();
    // Auto-refresh every 30 seconds for live visitor feel
    this.refreshSub = interval(30000).subscribe(() => this.fetchStats());
  }

  ngOnDestroy(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  fetchStats() {
    this.api.getAnalyticsStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getBarHeight(count: number, dataArray: any[], key: string): number {
    if (!dataArray || dataArray.length === 0) return 0;
    const max = Math.max(...dataArray.map((d: any) => d[key]));
    if (max === 0) return 10;
    return Math.max(10, (count / max) * 100);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  getDeviceIcon(type: string): string {
    if (type === 'Mobile') return 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z';
    if (type === 'Tablet') return 'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    return 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
  }
}
