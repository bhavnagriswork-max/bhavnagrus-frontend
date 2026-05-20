import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: any = {};
  private refreshSub?: Subscription;

  constructor(public api: ApiService) { }

  ngOnInit(): void {
    this.fetchStats();
    // Auto refresh every 30 seconds
    this.refreshSub = interval(30000).subscribe(() => this.fetchStats());
  }

  ngOnDestroy(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  hasGreeted = false;

  dateRange = {
    startDate: '',
    endDate: ''
  };

  fetchStats() {
    this.api.getDashboardStats(this.dateRange.startDate, this.dateRange.endDate).subscribe({
      next: (res) => {
        this.stats = res;
        if (!this.hasGreeted) {
          this.playActivationSound();
          setTimeout(() => this.speakGreeting(), 1000); // Speak after sound
          this.hasGreeted = true;
        }
      },
      error: (err) => {
        console.error('Failed to load stats', err);
      }
    });
  }

  applyFilter() {
    if (this.dateRange.startDate && this.dateRange.endDate) {
      this.fetchStats();
    }
  }

  clearFilter() {
    this.dateRange = { startDate: '', endDate: '' };
    this.fetchStats();
  }

  playActivationSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a sophisticated multi-layered chime
      const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      // Futuristic ascending chime
      playNote(440, now, 0.5, 'sine');
      playNote(660, now + 0.1, 0.6, 'triangle');
      playNote(880, now + 0.2, 0.8, 'sine');
      
    } catch (e) {
      console.error('Audio activation failed', e);
    }
  }

  speakGreeting() {
    if ('speechSynthesis' in window) {
      const name = this.api.getUser()?.name || 'Admin';
      const orderCount = this.stats?.todayOrders || 0;
      const totalRevenue = this.stats?.totalRevenue || 0;
      
      const message = `Namaste, ${name}. Your heritage empire is thriving. We have secured ${orderCount} new orders today, bringing our total collection to ${totalRevenue} rupees. Your leadership is the true kalakari.`;
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0; // Steady, confident speed
      utterance.pitch = 0.9; // Slightly lower for authority/confidence
      utterance.volume = 1;
      
      // Try to find a nice male/premium voice if available
      const voices = window.speechSynthesis.getVoices();
      const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'));
      if (premiumVoice) utterance.voice = premiumVoice;

      window.speechSynthesis.speak(utterance);
    }
  }

  showReport = false;
  
  generateReport() {
    this.showReport = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  printReport() {
    window.print();
  }

  getBarHeight(count: number): number {
    if (!this.stats?.weeklyData?.length) return 0;
    const max = Math.max(...this.stats.weeklyData.map((d: any) => d.count));
    if (max === 0) return 10;
    return Math.max(10, (count / max) * 100);
  }

  formatDay(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }
}
