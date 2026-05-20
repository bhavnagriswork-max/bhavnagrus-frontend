import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css']
})
export class ContactUsComponent {
  formData = {
    name: '',
    email: '',
    mobile: '',
    subject: 'General Inquiry',
    message: ''
  };
  loading = false;
  isDropdownOpen = false;
  topics = [
    'General Inquiry',
    'Bulk/Corporate Orders',
    'Order Assistance',
    'Franchise Inquiry'
  ];

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectTopic(topic: string) {
    this.formData.subject = topic;
    this.isDropdownOpen = false;
  }

  constructor(private api: ApiService, private notify: NotificationService) {}

  onSubmit() {
    if (!this.formData.name || !this.formData.email || !this.formData.message) {
      this.notify.show('Please fill in all required fields', 'error');
      return;
    }

    this.loading = true;
    this.api.submitContact(this.formData).subscribe({
      next: (res) => {
        this.notify.show('Your inquiry has been sent successfully!', 'success');
        this.formData = {
          name: '',
          email: '',
          mobile: '',
          subject: 'General Inquiry',
          message: ''
        };
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.show('Failed to send inquiry. Please try again later.', 'error');
        this.loading = false;
      }
    });
  }
}
