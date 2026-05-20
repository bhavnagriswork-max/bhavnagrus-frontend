import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkTheme = new BehaviorSubject<boolean>(true);
  public isDark$ = this.darkTheme.asObservable();

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.setDark(false);
    } else {
      this.setDark(true);
    }
  }

  toggleTheme() {
    this.setDark(!this.darkTheme.value);
  }

  setDark(isDark: boolean) {
    this.darkTheme.next(isDark);
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }
}
