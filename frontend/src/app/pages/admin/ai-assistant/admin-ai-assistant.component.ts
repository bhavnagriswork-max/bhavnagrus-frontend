import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-ai-assistant',
  templateUrl: './admin-ai-assistant.component.html',
  styleUrls: ['./admin-ai-assistant.component.css']
})
export class AdminAiAssistantComponent implements OnInit {
  suggestions: any[] = [];
  loading = true;
  chatVisible = false;
  messages: any[] = [
    { role: 'assistant', text: 'Namaste! I am the Bhavnagris Heritage Assistant. I have analyzed your latest sales data. Would you like to see some marketing suggestions for your best sellers?' }
  ];

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.fetchSuggestions();
  }

  fetchSuggestions() {
    this.loading = true;
    this.api.getAiSuggestionsAdmin().subscribe({
      next: (res) => {
        this.suggestions = res.suggestions;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  toggleChat() {
    this.chatVisible = !this.chatVisible;
  }

  showSuggestions() {
    this.messages.push({ role: 'user', text: 'Yes, show me the suggestions.' });
    
    setTimeout(() => {
      this.messages.push({ role: 'assistant', text: 'Analyzing inventory velocity and heritage trends...' });
      
      setTimeout(() => {
        if (this.suggestions.length > 0) {
          const main = this.suggestions[0];
          this.messages.push({ 
            role: 'assistant', 
            text: `Based on your best seller list, I recommend focusing on ${main.title}. ${main.content}`,
            hasAction: true,
            suggestion: main
          });
        } else {
          this.messages.push({ role: 'assistant', text: 'I need a bit more sales data to generate specific suggestions. Keep up the great work!' });
        }
      }, 1500);
    }, 500);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // You could add a small toast here
  }
}
