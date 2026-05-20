import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  userData = {
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  };
  errorMessage = '';

  constructor(private api: ApiService, private router: Router) { }

  onRegister() {
    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.api.register(this.userData).subscribe({
      next: (res) => {
        // Save token and user info for auto-login
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify({
          id: res.id,
          name: res.name,
          email: res.email,
          mobile: res.mobile,
          role: res.role
        }));
        
        // Redirect to home page (logged in)
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
