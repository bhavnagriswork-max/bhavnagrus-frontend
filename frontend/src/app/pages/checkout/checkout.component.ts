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
  
  // Shiprocket states
  shiprocketEnabled = false;
  calculatingShipping = false;
  shippingRateType = 'static'; 
  courierDetails: any = null;

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
    this.api.getPublicSettings().subscribe({
      next: (settings) => {
        if (settings.delivery_charge) {
          this.deliveryCharge = parseFloat(settings.delivery_charge) || 50;
        }
        if (settings.shiprocket_enabled) {
          this.shiprocketEnabled = (settings.shiprocket_enabled === 'true');
        }
        this.calculateTotals();
        
        // Recalculate rate if pincode is already loaded/prefilled
        if (this.orderData.pincode && this.orderData.pincode.toString().trim().length === 6) {
          this.calculateDynamicShippingRate();
        }
      },
      error: () => {
        this.calculateTotals();
      }
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
            
            // Recalculate shipping rate if loaded pincode is valid
            if (this.orderData.pincode && this.orderData.pincode.toString().trim().length === 6) {
              this.calculateDynamicShippingRate();
            }
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

  parseWeightToKg(weightStr: string): number {
    if (!weightStr) return 0.5; // default fallback weight to prevent calculation failure
    
    const cleanStr = weightStr.toLowerCase().trim();
    
    // Look for kilograms pattern: e.g., "1kg", "1.5 kg", "2 kg pack"
    const kgMatch = cleanStr.match(/([0-9.]+)\s*kg/);
    if (kgMatch) {
      return parseFloat(kgMatch[1]);
    }
    
    // Look for grams pattern: e.g., "500g", "250 g", "250g pack"
    const gMatch = cleanStr.match(/([0-9.]+)\s*g/);
    if (gMatch) {
      return parseFloat(gMatch[1]) / 1000;
    }
    
    // If it's just a number, assume grams if >= 10, else assume kg
    const numMatch = cleanStr.match(/([0-9.]+)/);
    if (numMatch) {
      const val = parseFloat(numMatch[1]);
      return val >= 10 ? val / 1000 : val;
    }
    
    return 0.5; // fallback
  }

  calculateDynamicShippingRate() {
    const pin = this.orderData.pincode ? this.orderData.pincode.toString().trim() : '';
    if (pin.length !== 6) {
      return;
    }

    if (!this.shiprocketEnabled) {
      return;
    }

    this.calculatingShipping = true;
    
    // Calculate total weight by parsing item weights
    const totalWeight = this.cartItems.reduce((acc, item) => {
      const itemWeight = this.parseWeightToKg(item.weight);
      return acc + (itemWeight * item.quantity);
    }, 0);

    const codStatus = this.orderData.payment_method === 'COD' ? 1 : 0;

    const payload = {
      delivery_postcode: pin,
      weight: totalWeight,
      cod: codStatus,
      declared_value: this.subtotal
    };

    this.api.calculateShippingRate(payload).subscribe({
      next: (res) => {
        this.deliveryCharge = res.rate;
        this.shippingRateType = res.rate_type;
        if (res.rate_type === 'dynamic') {
          this.courierDetails = {
            name: res.courier_name,
            etd: res.etd,
            etd_hours: res.etd_hours
          };
        } else {
          this.courierDetails = null;
        }
        this.calculateTotals();
        this.calculatingShipping = false;
      },
      error: (err) => {
        console.error('Dynamic shipping API failed:', err);
        this.shippingRateType = 'fallback';
        this.courierDetails = null;
        this.calculatingShipping = false;
        this.calculateTotals();
      }
    });
  }

  onPincodeChange(pin: string) {
    if (pin && pin.toString().trim().length === 6) {
      this.calculateDynamicShippingRate();
    }
  }

  onPaymentMethodChange() {
    if (this.orderData.pincode && this.orderData.pincode.toString().trim().length === 6) {
      this.calculateDynamicShippingRate();
    }
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
