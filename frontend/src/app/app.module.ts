import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
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
import { RegisterComponent } from './pages/register/register.component';
import { ProductManagementComponent } from './pages/admin/product-management/product-management.component';
import { OrderManagementComponent } from './pages/admin/order-management/order-management.component';
import { SettingsComponent } from './pages/admin/settings/settings.component';
import { UsersManagementComponent } from './pages/admin/users-management/users-management.component';
import { CategoryManagementComponent } from './pages/admin/category-management/category-management.component';
import { ContactInquiriesComponent } from './pages/admin/contact-inquiries/contact-inquiries.component';
import { AdminLayoutComponent } from './pages/admin/admin-layout/admin-layout.component';
import { NotificationComponent } from './components/notification/notification.component';
import { HomepageSettingsComponent } from './pages/admin/homepage-settings/homepage-settings.component';
import { AnalyticsComponent } from './pages/admin/analytics/analytics.component';
import { SubscribersComponent } from './pages/admin/subscribers/subscribers.component';
import { AdminAiAssistantComponent } from './pages/admin/ai-assistant/admin-ai-assistant.component';
import { BrandShowcaseComponent } from './pages/brand-showcase/brand-showcase.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    BrandShowcaseComponent,
    LoginComponent,
    DashboardComponent,
    ProductsComponent,
    ProductDetailComponent,
    CartComponent,
    CheckoutComponent,
    OrderSuccessComponent,
    MyOrdersComponent,
    TrackOrderComponent,
    AboutUsComponent,
    ContactUsComponent,
    RegisterComponent,
    ProductManagementComponent,
    OrderManagementComponent,
    SettingsComponent,
    UsersManagementComponent,
    CategoryManagementComponent,
    ContactInquiriesComponent,
    AdminLayoutComponent,
    NotificationComponent,
    HomepageSettingsComponent,
    AnalyticsComponent,
    SubscribersComponent,
    AdminAiAssistantComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
