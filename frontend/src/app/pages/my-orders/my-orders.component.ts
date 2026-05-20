import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.css']
})
export class MyOrdersComponent implements OnInit {
  orders: any[] = [];
  loading = true;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders() {
    this.loading = true;
    this.api.getMyOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-500';
      case 'shipped': return 'text-blue-500';
      case 'delivered': return 'text-green-500';
      case 'cancelled': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }
}
