import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  subtotal = 0;
  deliveryCharge = 50;
  total = 0;
  loading = true;

  constructor(public api: ApiService, private router: Router) { }

  ngOnInit(): void {
    this.fetchCart();
  }

  fetchCart() {
    this.loading = true;
    this.api.getCart().subscribe({
      next: (data) => {
        this.cartItems = data;
        this.calculateTotals();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        // If not logged in, maybe redirect to login or show empty cart
      }
    });
  }

  calculateTotals() {
    this.subtotal = this.cartItems.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
    this.total = this.subtotal + this.deliveryCharge;
  }

  updateQuantity(id: string, newQty: number) {
    if (newQty < 1) return;
    // We need updateCart in ApiService. Let's assume it exists or we add it.
    // For now, let's just update locally and call API
    this.api.updateCart(id, newQty).subscribe(() => {
      this.fetchCart();
    });
  }

  removeItem(id: string) {
    this.api.removeFromCart(id).subscribe(() => {
      this.fetchCart();
    });
  }

  checkout() {
    this.router.navigate(['/checkout']);
  }
}
