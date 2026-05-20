import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-track-order',
  templateUrl: './track-order.component.html',
  styleUrls: ['./track-order.component.css']
})
export class TrackOrderComponent implements OnInit {
  orderNumber: string = '';
  order: any = null;
  loading = false;
  error = '';

  constructor(private route: ActivatedRoute, private api: ApiService) { }

  ngOnInit(): void {
    const num = this.route.snapshot.paramMap.get('number');
    if (num) {
      this.orderNumber = num;
      this.track();
    }
  }

  track() {
    if (!this.orderNumber) return;
    this.loading = true;
    this.error = '';
    this.api.trackOrder(this.orderNumber).subscribe({
      next: (data) => {
        this.order = data.order || data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Order not found. Please check the order number.';
        this.loading = false;
      }
    });
  }

  getStepStatus(step: string) {
    if (!this.order) return 'pending';
    
    // Normalize step names to match DB status logic
    const statuses = ['pending', 'confirmed', 'shipped', 'out for delivery', 'delivered'];
    const currentStatus = this.order.order_status.toLowerCase();
    
    // "Accepted" or "Packed" count as "confirmed" for the UI stepper
    let normalizedStatus = currentStatus;
    if (currentStatus === 'accepted' || currentStatus === 'packed') normalizedStatus = 'confirmed';

    const currentIndex = statuses.indexOf(normalizedStatus);
    const stepIndex = statuses.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }
}
