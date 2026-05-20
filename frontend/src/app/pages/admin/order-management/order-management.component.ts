import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.css']
})
export class OrderManagementComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  loading = true;
  selectedOrder: any = null;
  showModal = false;
  searchQuery = '';
  selectedOrderIds: Set<number> = new Set();

  constructor(public api: ApiService, private notify: NotificationService) { }

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders() {
    this.loading = true;
    this.api.getAllOrders().subscribe({
      next: (data) => {
        this.orders = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Order fetch error:', err);
        this.orders = [];
        this.applyFilter();
        this.loading = false;
        this.notify.show('Failed to synchronize order records', 'error');
      }
    });
  }

  applyFilter() {
    if (!this.orders) {
      this.filteredOrders = [];
      return;
    }
    
    if (!this.searchQuery) {
      this.filteredOrders = [...this.orders];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredOrders = this.orders.filter(o => 
        (o.order_number && o.order_number.toLowerCase().includes(query)) || 
        (o.customer_name && o.customer_name.toLowerCase().includes(query)) ||
        (o.customer_mobile && o.customer_mobile.includes(query))
      );
    }
  }

  updateStatus(orderId: any, status: string) {
    this.api.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        this.notify.show(`Order ${status} successfully!`, 'success');
        this.fetchOrders();
      },
      error: () => this.notify.show('Failed to update status', 'error')
    });
  }

  viewOrder(order: any) {
    this.selectedOrder = order;
    this.showModal = true;
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'Pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'Confirmed': return 'text-blue-400 bg-blue-400/10';
      case 'Shipped': return 'text-purple-400 bg-purple-400/10';
      case 'Out for Delivery': return 'text-orange-400 bg-orange-400/10';
      case 'Delivered': return 'text-green-400 bg-green-400/10';
      case 'Cancelled': return 'text-red-400 bg-red-400/10';
      default: return 'text-white/40 bg-white/5';
    }
  }

  getItemImagesArray(imagesStr: string): string[] {
    if (!imagesStr) return [];
    return imagesStr.split(',');
  }

  toggleSelection(orderId: number) {
    if (this.selectedOrderIds.has(orderId)) {
      this.selectedOrderIds.delete(orderId);
    } else {
      this.selectedOrderIds.add(orderId);
    }
  }

  toggleAllSelection(event: any) {
    if (event.target.checked) {
      this.filteredOrders.forEach(o => this.selectedOrderIds.add(o.id));
    } else {
      this.selectedOrderIds.clear();
    }
  }

  isOrderSelected(orderId: number): boolean {
    return this.selectedOrderIds.has(orderId);
  }

  isAllSelected(): boolean {
    return this.filteredOrders.length > 0 && this.selectedOrderIds.size === this.filteredOrders.length;
  }

  deleteOrder(id: any) {
    if (confirm('Are you sure you want to deaccession this order? This action is irreversible.')) {
      this.api.deleteOrder(id).subscribe({
        next: (res) => {
          this.notify.show(res.message, 'success');
          this.fetchOrders();
          this.selectedOrderIds.delete(id);
        },
        error: (err) => this.notify.show('Deaccession failed', 'error')
      });
    }
  }

  bulkDelete() {
    const count = this.selectedOrderIds.size;
    if (confirm(`Are you sure you want to deaccession ${count} selected orders?`)) {
      this.api.bulkDeleteOrders(Array.from(this.selectedOrderIds)).subscribe({
        next: (res) => {
          this.notify.show(res.message, 'success');
          this.selectedOrderIds.clear();
          this.fetchOrders();
        },
        error: (err) => this.notify.show('Bulk deaccession failed', 'error')
      });
    }
  }
}
