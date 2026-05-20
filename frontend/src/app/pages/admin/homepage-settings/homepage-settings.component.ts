import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-homepage-settings',
  templateUrl: './homepage-settings.component.html',
  styles: []
})
export class HomepageSettingsComponent implements OnInit {
  settings: any[] = [];
  loading = true;

  constructor(
    private api: ApiService,
    private notify: NotificationService
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
      error: () => this.loading = false
    });
  }

  getSetting(key: string): any {
    return this.settings.find(s => s.setting_key === key);
  }

  getVal(key: string): string {
    const s = this.getSetting(key);
    return s ? s.setting_value : '';
  }

  setVal(key: string, value: string) {
    const s = this.getSetting(key);
    if (s) s.setting_value = value;
  }

  saveSettings() {
    this.api.updateSettings(this.settings).subscribe({
      next: () => this.notify.show('Homepage settings saved!', 'success'),
      error: () => this.notify.show('Failed to save settings', 'error')
    });
  }

  uploadHeroImage(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.api.uploadImage(file).subscribe({
      next: (res: any) => {
        this.setVal('hero_image', res.imageUrl);
        this.notify.show('Hero image uploaded!', 'success');
      },
      error: () => this.notify.show('Upload failed', 'error')
    });
  }
}
