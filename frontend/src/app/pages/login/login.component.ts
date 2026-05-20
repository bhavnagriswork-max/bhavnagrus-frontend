import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  credentials = {
    email: '',
    password: ''
  };
  
  regData = {
    name: '',
    email: '',
    mobile: '',
    password: ''
  };

  showRegisterModal = false;
  loading = false;
  loginImage: string = 'https://cdn.shopify.com/s/files/1/0979/4112/7479/files/Create_a_premium_e-commerce_hero_202605062348.jpg';

  constructor(
    public api: ApiService, 
    private router: Router,
    private notify: NotificationService
  ) { }

  ngOnInit() {
    this.api.getPublicSettings().subscribe({
      next: (settings) => {
        if (settings.login_image) {
          this.loginImage = settings.login_image;
        }
      }
    });
  }

  onLogin() {
    this.loading = true;
    this.api.login(this.credentials).subscribe({
      next: (res) => {
        this.notify.show(`Welcome back, ${res.name}`, 'success');
        if (res.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
        this.loading = false;
      },
      error: (err) => {
        this.notify.show(err.error?.message || 'Access Denied: Invalid Credentials', 'error');
        this.loading = false;
      }
    });
  }

  onRegister() {
    if (!this.regData.name || !this.regData.email || !this.regData.password || !this.regData.mobile) {
      this.notify.show('Please complete all heritage profile fields including mobile', 'error');
      return;
    }

    this.loading = true;
    this.api.register(this.regData).subscribe({
      next: (res) => {
        this.notify.show('Heritage Profile Established Successfully', 'success');
        this.router.navigate(['/']);
        this.loading = false;
      },
      error: (err) => {
        this.notify.show(err.error?.message || 'Enrollment failed. Please verify your details.', 'error');
        this.loading = false;
      }
    });
  }
}
