import { Component, HostListener, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';
import { Router, NavigationEnd } from '@angular/router';
import { NotificationService, Notification } from './services/notification.service';
import { ThemeService } from './services/theme.service';
import { LanguageService } from './services/language.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Bhavnagris';
  isScrolled = false;
  mobileMenuOpen = false;
  user: any = null;
  cartCount = 0;
  isAdminPage = false;
  websiteGreeting = 'Namaste';
  showLanguagePopup = false;

  constructor(
    private api: ApiService, 
    private router: Router,
    private notify: NotificationService,
    public theme: ThemeService,
    public langService: LanguageService
  ) { }

  t(key: string): string {
    return this.langService.t(key);
  }

  toggleTheme() {
    this.theme.toggleTheme();
  }

  ngOnInit() {
    // Check if language is already chosen
    const chosenLang = localStorage.getItem('bhav_lang') || 'english';
    this.showLanguagePopup = !localStorage.getItem('bhav_lang');
    this.updateBodyFontClass(chosenLang);

    // Fetch public settings for greeting
    this.api.getPublicSettings().subscribe({
      next: (settings) => {
        if (settings.website_greeting) {
          this.websiteGreeting = settings.website_greeting;
        }
      }
    });

    this.api.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.updateCartCount();
      } else {
        this.cartCount = 0;
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAdminPage = event.url.startsWith('/admin');
      // Scroll to top on navigation
      window.scrollTo(0, 0);
      // Track page view
      this.api.trackPageView(event.urlAfterRedirects || event.url);
    });
  }

  selectLanguage(lang: string) {
    this.langService.setLanguage(lang);
    this.updateBodyFontClass(lang);
    this.showLanguagePopup = false;
    
    let welcomeMsg = 'Welcome to Bhavnagris!';
    if (lang === 'gujarati') {
      welcomeMsg = 'પધારો! ભાવનગરીસના શાહી દરબારમાં આપનું સ્વાગત છે.';
    } else if (lang === 'hindi') {
      welcomeMsg = 'पधारिए! भावनगरीस के शाही दरबार में आपका स्वागत है।';
    } else if (lang === 'english') {
      welcomeMsg = 'Welcome! Experience the Royal Heritage of Bhavnagris.';
    }
    
    this.notify.show(welcomeMsg, 'success');
  }

  updateBodyFontClass(lang: string) {
    document.body.classList.remove('lang-english', 'lang-gujarati', 'lang-hindi');
    document.body.classList.add(`lang-${lang}`);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  updateCartCount() {
    this.api.getCart().subscribe({
      next: (res) => {
        this.cartCount = res.items ? res.items.length : (Array.isArray(res) ? res.length : 0);
      },
      error: () => this.cartCount = 0
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  subscriberEmail = '';

  subscribeNewsletter() {
    if (!this.subscriberEmail) {
      this.notify.show('Please enter a valid email address', 'error');
      return;
    }
    this.api.subscribeNewsletter(this.subscriberEmail).subscribe({
      next: () => {
        this.notify.show('Thank you for subscribing to Bhavnagris!', 'success');
        this.subscriberEmail = '';
      },
      error: (err) => {
        this.notify.show(err.error?.message || 'Subscription failed', 'error');
      }
    });
  }

  logout() {
    this.api.logout();
    this.notify.show('Logged out successfully', 'info');
    this.router.navigate(['/login']);
  }
}
