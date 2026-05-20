import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-subscribers',
  templateUrl: './subscribers.component.html',
  styleUrls: ['./subscribers.component.css']
})
export class SubscribersComponent implements OnInit {
  subscribers: any[] = [];
  loading = true;
  searchTerm = '';

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) { }

  ngOnInit(): void {
    this.fetchSubscribers();
  }

  fetchSubscribers() {
    this.loading = true;
    this.api.getSubscribersAdmin().subscribe({
      next: (res) => {
        this.subscribers = res;
        this.loading = false;
      },
      error: (err) => {
        this.notify.show('Failed to fetch subscribers', 'error');
        this.loading = false;
      }
    });
  }

  deleteSubscriber(id: number) {
    if (confirm('Are you sure you want to remove this subscriber?')) {
      this.api.deleteSubscriberAdmin(id).subscribe({
        next: () => {
          this.notify.show('Subscriber removed', 'success');
          this.fetchSubscribers();
        },
        error: (err) => {
          this.notify.show('Failed to remove subscriber', 'error');
        }
      });
    }
  }

  get filteredSubscribers() {
    if (!this.searchTerm) return this.subscribers;
    return this.subscribers.filter(s => 
      s.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  exportToCSV() {
    const headers = ['Email', 'Subscribed At'];
    const data = this.subscribers.map(s => [s.email, s.created_at]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + data.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "subscribers_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
