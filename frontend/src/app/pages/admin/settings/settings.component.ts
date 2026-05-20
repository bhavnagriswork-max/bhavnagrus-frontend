import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  settings: any[] = [];
  loading = true;

  passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    public api: ApiService, 
    private notify: NotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchSettings();
  }

  fetchSettings() {
    this.loading = true;
    this.api.getSettings().subscribe({
      next: (data) => {
        this.settings = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  getSetting(key: string): any {
    return this.settings.find(s => s.setting_key === key);
  }

  getVal(key: string): any {
    const s = this.getSetting(key);
    return s ? s.setting_value : '';
  }

  setVal(key: string, value: any) {
    const s = this.getSetting(key);
    if (s) s.setting_value = value;
  }

  saveSettings() {
    this.api.updateSettings(this.settings).subscribe({
      next: () => {
        this.notify.show('Heritage settings updated!', 'success');
      },
      error: (err) => {
        this.notify.show('Failed to save settings', 'error');
      }
    });
  }

  changePassword() {
    if (!this.passwordData.oldPassword || !this.passwordData.newPassword) {
      this.notify.show('Please fill all password fields', 'error');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.notify.show('Passwords do not match', 'error');
      return;
    }

    this.api.changePassword(this.passwordData).subscribe({
      next: () => {
        this.notify.show('Secret key updated successfully', 'success');
        this.passwordData = { oldPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        this.notify.show(err.error?.message || 'Failed to update secret key', 'error');
      }
    });
  }

  uploadQR(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    this.api.uploadImage(file).subscribe({
      next: (res: any) => {
        this.setVal('upi_qr_image', res.imageUrl);
        this.notify.show('QR Code uploaded!', 'success');
      },
      error: () => this.notify.show('Failed to upload QR code', 'error')
    });
  }

  uploadLoginImage(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    this.api.uploadImage(file).subscribe({
      next: (res: any) => {
        this.setVal('login_image', res.imageUrl);
        this.notify.show('Login Image uploaded!', 'success');
      },
      error: () => this.notify.show('Failed to upload Login Image', 'error')
    });
  }
}
