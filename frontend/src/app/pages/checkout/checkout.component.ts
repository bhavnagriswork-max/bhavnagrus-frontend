import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  cartItems: any[] = [];
  subtotal = 0;
  deliveryCharge = 50;
  total = 0;
  loading = true;
  processing = false;
  upiSettings: any = null;

  orderData = {
    customer_name: '',
    customer_email: '',
    customer_mobile: '',
    address_line1: '',
    address_line2: '',
    city: 'Bhavnagar',
    state: 'Gujarat',
    pincode: '',
    landmark: '',
    payment_method: 'COD'
  };

  constructor(
    private api: ApiService, 
    private router: Router,
    private notify: NotificationService
  ) { }

  ngOnInit(): void {
    this.fetchCart();
    this.loadUserInfo();
    this.fetchDeliveryCharge();
    this.fetchUpiSettings();
    this.fetchPaymentConfig();
  }

  fetchUpiSettings() {
    this.api.getUpiSettings().subscribe({
      next: (data) => this.upiSettings = data,
      error: () => {}
    });
  }

  fetchDeliveryCharge() {
    this.api.getPublicSettings().subscribe(settings => {
      const charge = settings.find((s: any) => s.setting_key === 'delivery_charge');
      if (charge) this.deliveryCharge = parseFloat(charge.setting_value);
      this.calculateTotals();
    });
  }

  loadUserInfo() {
    if (!this.api.isLoggedIn()) return;
    
    this.api.getProfile().subscribe({
      next: (user) => {
        this.orderData.customer_name = user.name;
        this.orderData.customer_email = user.email;
        this.orderData.customer_mobile = user.mobile;
        
        if (user.address) {
          try {
            const savedAddress = JSON.parse(user.address);
            this.orderData.address_line1 = savedAddress.address_line1 || '';
            this.orderData.address_line2 = savedAddress.address_line2 || '';
            this.orderData.pincode = savedAddress.pincode || '';
            this.orderData.landmark = savedAddress.landmark || '';
          } catch (e) {
            this.orderData.address_line1 = user.address;
          }
        }
      }
    });
  }

  fetchCart() {
    this.api.getCart().subscribe({
      next: (data) => {
        this.cartItems = data;
        if (this.cartItems.length === 0) {
          this.router.navigate(['/cart']);
        }
        this.calculateTotals();
        this.loading = false;
      },
      error: () => {
        if (this.api.isLoggedIn()) this.router.navigate(['/login']);
        this.loading = false;
      }
    });
  }

  calculateTotals() {
    this.subtotal = this.cartItems.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
    this.total = this.subtotal + this.deliveryCharge;
  }

  paymentConfig: any = null;

  fetchPaymentConfig() {
    this.api.getPaymentConfig().subscribe({
      next: (data) => this.paymentConfig = data,
      error: () => {}
    });
  }

  placeOrder() {
    if (!this.orderData.customer_name || !this.orderData.customer_mobile || !this.orderData.address_line1) {
      this.notify.show('Please complete the mandatory delivery details', 'error');
      return;
    }

    // If Razorpay selected, initiate payment first
    if (this.orderData.payment_method === 'ONLINE' && this.paymentConfig?.razorpay_enabled) {
      this.initiateRazorpay();
      return;
    }

    this.submitOrder();
  }

  initiateRazorpay() {
    this.processing = true;
    this.api.createRazorpayOrder(this.total).subscribe({
      next: (data) => {
        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: 'INR',
          name: 'Bhavnagris Heritage',
          description: 'Premium Gujarati Snacks Order',
          order_id: data.order_id,
          handler: (response: any) => {
            this.api.verifyRazorpayPayment(response).subscribe({
              next: (res) => {
                if (res.verified) {
                  this.submitOrder(res.payment_id);
                } else {
                  this.notify.show('Payment verification failed', 'error');
                  this.processing = false;
                }
              },
              error: () => {
                this.notify.show('Payment verification error', 'error');
                this.processing = false;
              }
            });
          },
          prefill: {
            name: this.orderData.customer_name,
            email: this.orderData.customer_email,
            contact: this.orderData.customer_mobile
          },
          theme: { color: '#C5A059' },
          modal: {
            ondismiss: () => {
              this.processing = false;
              this.notify.show('Payment cancelled', 'error');
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      },
      error: (err) => {
        this.notify.show(err.error?.message || 'Failed to create payment', 'error');
        this.processing = false;
      }
    });
  }

  submitOrder(paymentId?: string) {
    this.processing = true;
    const payload: any = {
      ...this.orderData,
      subtotal: this.subtotal,
      delivery_charge: this.deliveryCharge,
      discount_amount: 0,
      total_amount: this.total
    };

    if (paymentId) {
      payload.razorpay_payment_id = paymentId;
      payload.payment_status = 'Paid';
    }

    if (!this.api.isLoggedIn()) {
      payload.items = this.cartItems;
    }

    if (this.api.isLoggedIn()) {
      const addressToSave = JSON.stringify({
        address_line1: this.orderData.address_line1,
        address_line2: this.orderData.address_line2,
        pincode: this.orderData.pincode,
        landmark: this.orderData.landmark
      });

      this.api.updateProfile({ 
        name: this.orderData.customer_name, 
        mobile: this.orderData.customer_mobile,
        address: addressToSave
      }).subscribe();
    }

    this.api.placeOrder(payload).subscribe({
      next: (res) => {
        this.api.clearCart();
        this.notify.show('Order placed successfully!', 'success');
        this.router.navigate(['/order-success'], { queryParams: { id: res.order_number } });
        this.processing = false;
      },
      error: (err) => {
        this.notify.show(err.error?.message || 'Failed to place order', 'error');
        this.processing = false;
      }
    });
  }
}
