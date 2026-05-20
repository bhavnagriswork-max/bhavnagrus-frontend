import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css']
})
export class UsersManagementComponent implements OnInit {
  users: any[] = [];
  loading = true;

  constructor(
    private api: ApiService,
    private router: Router,
    private notify: NotificationService
  ) { }

  ngOnInit(): void {
    this.fetchUsers();
  }



  fetchUsers() {
    this.loading = true;
    this.api.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.show('Failed to fetch users', 'error');
        this.loading = false;
      }
    });
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  showResetModal = false;
  resetPasswordData = {
    newPassword: '',
    confirmPassword: ''
  };
  selectedUser: any = null;

  openResetModal(user: any) {
    this.selectedUser = user;
    this.resetPasswordData = { newPassword: '', confirmPassword: '' };
    this.showResetModal = true;
  }

  confirmResetPassword() {
    if (!this.resetPasswordData.newPassword) {
      this.notify.show('Please enter a new password', 'error');
      return;
    }
    if (this.resetPasswordData.newPassword !== this.resetPasswordData.confirmPassword) {
      this.notify.show('Passwords do not match', 'error');
      return;
    }

    this.api.resetUserPassword(this.selectedUser.id, this.resetPasswordData.newPassword).subscribe({
      next: (res) => {
        this.notify.show(res.message, 'success');
        this.showResetModal = false;
      },
      error: (err) => {
        this.notify.show(err.error?.message || 'Failed to reset password', 'error');
      }
    });
  }
}
