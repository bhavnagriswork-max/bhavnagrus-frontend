import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap, of, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseHost = window.location.hostname;
  private isLocal = this.baseHost === 'localhost' || this.baseHost === '127.0.0.1';
  private apiUrl = this.isLocal ? `http://localhost:5000/api` : `https://bhavnagris-backend.onrender.com/api`;
  private mediaUrl = this.isLocal ? `http://localhost:5000` : `https://bhavnagris-backend.onrender.com`;
  
  
  private userSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  public currentUser$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) { }

  // Global Error Handler
  private handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      // Clear stale session
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.userSubject.next(null);
      
      // Only redirect to login if on admin pages or profile
      const currentUrl = this.router.url;
      if (currentUrl.includes('/admin') || currentUrl.includes('/profile')) {
        this.router.navigate(['/login']);
      }
    }
    return throwError(() => error);
  }

  // Utility to fix image paths globally
  public normalizeImage(data: any): any {
    if (!data || typeof data !== 'object') {
      if (typeof data === 'string') {
        if (data.startsWith('/uploads') || data.startsWith('uploads/')) {
          const path = data.startsWith('/') ? data : `/${data}`;
          return `${this.mediaUrl}${path}`;
        } else if (data.includes('localhost') || data.includes('127.0.0.1')) {
          return data.replace(/localhost|127\.0\.0\.1/, this.baseHost);
        }
      }
      return data;
    }

    // Clone to avoid side effects if needed, but here we mutate for simplicity as per existing pattern
    const obj = data;

    // Normalize common image fields
    if (obj.image) obj.image = this.normalizeImage(obj.image);
    if (obj.product_image) obj.product_image = this.normalizeImage(obj.product_image);
    if (obj.image_url) obj.image_url = this.normalizeImage(obj.image_url);
    
    // Special handling for comma separated images in orders
    if (obj.item_images && typeof obj.item_images === 'string') {
      const images = obj.item_images.split(',').map((img: string) => this.normalizeImage(img.trim()));
      obj.item_images = images.join(',');
    }

    // Recursive for arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.normalizeImage(item));
    }

    // Handle nested collections with string-to-json fallback
    if (obj.images) {
      if (typeof obj.images === 'string') {
        try { obj.images = JSON.parse(obj.images); } catch(e) {}
      }
      if (Array.isArray(obj.images)) obj.images = this.normalizeImage(obj.images);
    }

    if (obj.items) {
      if (typeof obj.items === 'string') {
        try { obj.items = JSON.parse(obj.items); } catch(e) {}
      }
      if (Array.isArray(obj.items)) obj.items = this.normalizeImage(obj.items);
    }
    
    if (obj.topProducts && Array.isArray(obj.topProducts)) obj.topProducts = this.normalizeImage(obj.topProducts);
    if (obj.recentOrders && Array.isArray(obj.recentOrders)) obj.recentOrders = this.normalizeImage(obj.recentOrders);

    return obj;
  }

  // Auth
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((user: any) => {
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
        this.userSubject.next(user);
        this.syncGuestCart();
      }),
      catchError(err => this.handleError(err))
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData).pipe(
      tap((user: any) => {
        localStorage.setItem('token', user.token);
        localStorage.setItem('user', JSON.stringify(user));
        this.userSubject.next(user);
        this.syncGuestCart();
      }),
      catchError(err => this.handleError(err))
    );
  }

  private syncGuestCart() {
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
    if (guestCart.length > 0) {
      localStorage.removeItem('guestCart');
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/profile`, data, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  changePassword(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/change-password`, data, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Categories
  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`).pipe(
      map((cats: any[]) => cats.map(c => this.normalizeImage(c))),
      catchError(err => this.handleError(err))
    );
  }

  createCategory(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/categories`, data, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateCategory(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/categories/${id}`, data, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/categories/${id}`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Products
  getProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products`).pipe(
      map((prods: any[]) => prods.map(p => this.normalizeImage(p))),
      catchError(err => this.handleError(err))
    );
  }

  getBrandProducts(brandName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products?brand=${encodeURIComponent(brandName)}`).pipe(
      map((prods: any[]) => prods.map(p => this.normalizeImage(p))),
      catchError(err => this.handleError(err))
    );
  }

  getFeaturedProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/featured`).pipe(
      map((prods: any[]) => prods.map(p => this.normalizeImage(p))),
      catchError(err => this.handleError(err))
    );
  }

  getProduct(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${id}`).pipe(
      map(p => this.normalizeImage(p)),
      catchError(err => this.handleError(err))
    );
  }

  getProductBySlug(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/slug/${slug}`).pipe(
      map(p => this.normalizeImage(p)),
      catchError(err => this.handleError(err))
    );
  }

  // Admin Product Management
  getAllProductsAdmin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/products`, this.getHeaders()).pipe(
      map((prods: any[]) => prods.map(p => this.normalizeImage(p))),
      catchError(err => this.handleError(err))
    );
  }

  createProduct(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/products`, data, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateProduct(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/products/${id}`, data, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  updateProductSpiciness(id: string, spiciness: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/products/${id}/spiciness`, { spiciness }, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/products/${id}`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/upload`, formData, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  uploadImages(files: FileList): Observable<any> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    return this.http.post(`${this.apiUrl}/upload/multiple`, formData, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Cart (Hybrid Guest/User)
  getCart(): Observable<any> {
    if (this.isLoggedIn()) {
      return this.http.get(`${this.apiUrl}/cart`, this.getHeaders()).pipe(
        map((items: any[]) => items.map(i => this.normalizeImage(i))),
        catchError(err => this.handleError(err))
      );
    } else {
      const items = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const mapped = items.map((i: any) => ({ ...i, id: i.product_id }));
      return of(mapped);
    }
  }

  addToCart(product: any, quantity: number): Observable<any> {
    if (this.isLoggedIn()) {
      return this.http.post(`${this.apiUrl}/cart/add`, { product_id: product.id, quantity }, this.getHeaders()).pipe(
        catchError(err => this.handleError(err))
      );
    } else {
      let items = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const existing = items.find((i: any) => i.product_id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        items.push({
          product_id: product.id,
          name: product.name,
          selling_price: product.selling_price,
          image: product.image,
          weight: product.weight,
          quantity: quantity
        });
      }
      localStorage.setItem('guestCart', JSON.stringify(items));
      return of({ message: 'Added to guest cart' });
    }
  }

  updateCart(id: string, quantity: number): Observable<any> {
    if (this.isLoggedIn()) {
      return this.http.put(`${this.apiUrl}/cart/update/${id}`, { quantity }, this.getHeaders()).pipe(
        catchError(err => this.handleError(err))
      );
    } else {
      let items = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const item = items.find((i: any) => i.product_id === id);
      if (item) item.quantity = quantity;
      localStorage.setItem('guestCart', JSON.stringify(items));
      return of({ message: 'Guest cart updated' });
    }
  }

  removeFromCart(id: string): Observable<any> {
    if (this.isLoggedIn()) {
      return this.http.delete(`${this.apiUrl}/cart/remove/${id}`, this.getHeaders()).pipe(
        catchError(err => this.handleError(err))
      );
    } else {
      let items = JSON.parse(localStorage.getItem('guestCart') || '[]');
      items = items.filter((i: any) => i.product_id !== id);
      localStorage.setItem('guestCart', JSON.stringify(items));
      return of({ message: 'Removed from guest cart' });
    }
  }

  clearCart() {
    localStorage.removeItem('guestCart');
  }

  getPublicSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings/public`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Reviews
  getReviews(productId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews/${productId}/reviews`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  postReview(productId: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews/${productId}/reviews`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Settings
  getSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/settings`, this.getHeaders()).pipe(
      map(data => this.normalizeImage(data)),
      catchError(err => this.handleError(err))
    );
  }

  updateSettings(settings: any[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/settings`, settings, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  calculateShippingRate(payload: { delivery_postcode: string, weight: number, cod: number, declared_value: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/shipping/calculate-rate`, payload).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Orders
  placeOrder(orderData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/place`, orderData, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getMyOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/my-orders`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getOrderDetails(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${id}`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  trackOrder(orderNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/track/${orderNumber}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Admin Specific
  getDashboardStats(startDate?: string, endDate?: string): Observable<any> {
    let url = `${this.apiUrl}/admin/dashboard`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.http.get(url, this.getHeaders()).pipe(
      map(stats => this.normalizeImage(stats)),
      catchError(err => this.handleError(err))
    );
  }

  getAllOrders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/orders`, this.getHeaders()).pipe(
      map(orders => this.normalizeImage(orders)),
      catchError(err => this.handleError(err))
    );
  }

  updateOrderStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/orders/${id}/status`, { status }, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/orders/${id}`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  bulkDeleteOrders(orderIds: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/orders/bulk-delete`, { orderIds }, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/users`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  resetUserPassword(userId: number, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/reset-password`, { userId, newPassword }, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Contact Inquiries Admin
  getInquiriesAdmin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/contact/admin`, this.getHeaders()).pipe(
      map(data => this.normalizeImage(data)),
      catchError(err => this.handleError(err))
    );
  }

  updateInquiryStatusAdmin(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/contact/admin/${id}/status`, { status }, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  submitContact(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/contact`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    
    // Explicit check for null/undefined strings
    if (!token || token === 'null' || token === 'undefined' || token === '') {
      console.warn('API Request attempted without valid token');
      return {};
    }
    
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }

  public isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  public getMediaUrl(imagePath: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('assets/')) return imagePath;
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${this.mediaUrl}${path}`;
  }

  public getUser(): any {
    return this.userSubject.value;
  }

  public getGlobalDogScore(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/global-stats`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  public getUpiSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings/upi`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  public getPaymentConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/payment/config`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  public createRazorpayOrder(amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/payment/create-order`, { amount }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  public verifyRazorpayPayment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payment/verify`, data).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Analytics
  private sessionId = this.generateSessionId();

  private generateSessionId(): string {
    let sid = sessionStorage.getItem('bhav_session');
    if (!sid) {
      sid = 'ses_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('bhav_session', sid);
    }
    return sid;
  }

  public trackPageView(url: string): void {
    this.http.post(`${this.apiUrl}/analytics/track`, {
      page_url: url,
      referrer: document.referrer,
      session_id: this.sessionId
    }).pipe(catchError(() => of(null))).subscribe();
  }

  public getAnalyticsStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/stats`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  public getAiSuggestionsAdmin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/ai-suggestions`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  public adminGlobalSearch(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/global-search?query=${query}`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Subscribers
  public subscribeNewsletter(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/subscribers`, { email }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  public getSubscribersAdmin(): Observable<any> {
    return this.http.get(`${this.apiUrl}/subscribers`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }

  public deleteSubscriberAdmin(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subscribers/${id}`, this.getHeaders()).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
