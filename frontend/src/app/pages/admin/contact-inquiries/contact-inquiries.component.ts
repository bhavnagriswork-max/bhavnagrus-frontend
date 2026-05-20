import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-contact-inquiries',
  templateUrl: './contact-inquiries.component.html'
})
export class ContactInquiriesComponent implements OnInit {
  inquiries: any[] = [];
  selectedInquiry: any = null;
  loading = true;

  constructor(private api: ApiService, private notify: NotificationService) { }

  ngOnInit(): void {
    this.fetchInquiries();
  }

  fetchInquiries() {
    this.loading = true;
    this.api.getInquiriesAdmin().subscribe({
      next: (data) => {
        this.inquiries = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.show('Failed to fetch inquiries', 'error');
        this.loading = false;
      }
    });
  }

  viewInquiry(inquiry: any) {
    this.selectedInquiry = inquiry;
  }

  updateStatus(id: number, status: string) {
    this.api.updateInquiryStatusAdmin(id, status).subscribe({
      next: () => {
        if (this.selectedInquiry) this.selectedInquiry.status = status;
        this.fetchInquiries();
        this.notify.show(`Inquiry marked as ${status}`, 'success');
      },
      error: (err) => this.notify.show('Failed to update status', 'error')
    });
  }
}
