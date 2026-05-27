import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CartComponent } from './pages/cart/cart.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrderSuccessComponent } from './pages/order-success/order-success.component';
import { MyOrdersComponent } from './pages/my-orders/my-orders.component';
import { TrackOrderComponent } from './pages/track-order/track-order.component';
import { AboutUsComponent } from './pages/about-us/about-us.component';
import { ContactUsComponent } from './pages/contact-us/contact-us.component';
import { BrandShowcaseComponent } from './pages/brand-showcase/brand-showcase.component';

import { ProductManagementComponent } from './pages/admin/product-management/product-management.component';
import { OrderManagementComponent } from './pages/admin/order-management/order-management.component';
import { UsersManagementComponent } from './pages/admin/users-management/users-management.component';
import { CategoryManagementComponent } from './pages/admin/category-management/category-management.component';
import { ContactInquiriesComponent } from './pages/admin/contact-inquiries/contact-inquiries.component';
import { SettingsComponent } from './pages/admin/settings/settings.component';
import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout.component';
import { HomepageSettingsComponent } from './pages/admin/homepage-settings/homepage-settings.component';
import { AnalyticsComponent } from './pages/admin/analytics/analytics.component';
import { SubscribersComponent } from './pages/admin/subscribers/subscribers.component';
import { adminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'collections/:category', component: ProductsComponent },
  { path: 'brand', component: BrandShowcaseComponent },
  { path: 'product/:slug', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent },
  { path: 'checkout', component: CheckoutComponent },
  { path: 'order-success', component: OrderSuccessComponent },
  { path: 'my-orders', component: MyOrdersComponent },
  { path: 'track-order/:number', component: TrackOrderComponent },
  { path: 'heritage', component: AboutUsComponent },
  { path: 'contact', component: ContactUsComponent },
  { 
    path: 'admin', 
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductManagementComponent },
      { path: 'categories', component: CategoryManagementComponent },
      { path: 'orders', component: OrderManagementComponent },
      { path: 'users', component: UsersManagementComponent },
      { path: 'inquiries', component: ContactInquiriesComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'homepage', component: HomepageSettingsComponent },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'subscribers', component: SubscribersComponent },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
