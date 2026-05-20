import { Component, OnInit, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { ThemeService } from '../../../services/theme.service';
import { NotificationService } from '../../../services/notification.service';
import { filter, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  mobileMenuOpen = false;
  searchOpen = false;
  searchQuery = '';
  searchResults: any = null;
  private searchSubject = new Subject<string>();

  constructor(
    public api: ApiService,
    public router: Router,
    public theme: ThemeService,
    private notify: NotificationService
  ) { }

  editingName = false;
  newName = '';

  startEditingName() {
    this.newName = this.api.getUser()?.name || '';
    this.editingName = true;
  }

  saveAdminName() {
    if (!this.newName.trim()) return;
    this.api.updateProfile({ name: this.newName, mobile: this.api.getUser().mobile }).subscribe({
      next: () => {
        const user = this.api.getUser();
        user.name = this.newName;
        localStorage.setItem('user', JSON.stringify(user));
        this.api.currentUser$ // This is a behavior subject, I should probably use a method to update it
        this.notify.show('Administrative identity updated', 'success');
        this.editingName = false;
      },
      error: () => this.notify.show('Failed to update identity', 'error')
    });
  }

  ngOnInit(): void {
    // Close mobile menu on navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.mobileMenuOpen = false;
      this.searchOpen = false;
    });

    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) return of(null);
        return this.api.adminGlobalSearch(query);
      })
    ).subscribe(results => {
      this.searchResults = results;
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Cmd/Ctrl + K to search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.toggleSearch();
    }
    // Esc to close
    if (event.key === 'Escape') {
      this.searchOpen = false;
    }
  }

  toggleSearch() {
    this.searchOpen = !this.searchOpen;
    if (this.searchOpen) {
      this.mobileMenuOpen = false;
      setTimeout(() => {
        document.getElementById('admin-search-input')?.focus();
      }, 100);
    }
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  toggleTheme() {
    this.theme.toggleTheme();
  }

  logout() {
    this.api.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.searchOpen = false;
  }
}
