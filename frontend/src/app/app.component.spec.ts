import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { AppComponent } from './app.component';
import { ApiService } from './services/api.service';
import { NotificationService } from './services/notification.service';
import { ThemeService } from './services/theme.service';
import { LanguageService } from './services/language.service';
import { of, BehaviorSubject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  // Mock services
  let mockApi: any;
  let mockRouter: any;
  let mockNotify: any;
  let mockTheme: any;
  let mockLangService: any;

  beforeEach(async () => {
    mockApi = {
      currentUser$: new BehaviorSubject<any>({ name: 'Royal User', role: 'user', dog_score: 5 }),
      getPublicSettings: jasmine.createSpy('getPublicSettings').and.returnValue(of({ website_greeting: 'Namaste' })),
      getCart: jasmine.createSpy('getCart').and.returnValue(of({ items: [] })),
      trackPageView: jasmine.createSpy('trackPageView'),
      subscribeNewsletter: jasmine.createSpy('subscribeNewsletter').and.returnValue(of({})),
      logout: jasmine.createSpy('logout')
    };

    mockRouter = {
      events: of(new NavigationEnd(1, '/home', '/home')),
      navigate: jasmine.createSpy('navigate')
    };

    mockNotify = {
      show: jasmine.createSpy('show')
    };

    mockTheme = {
      isDark$: new BehaviorSubject<boolean>(false),
      toggleTheme: jasmine.createSpy('toggleTheme')
    };

    mockLangService = {
      t: jasmine.createSpy('t').and.callFake((key: string) => key),
      getCurrentLanguage: jasmine.createSpy('getCurrentLanguage').and.returnValue('english'),
      setLanguage: jasmine.createSpy('setLanguage')
    };

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [AppComponent],
      providers: [
        { provide: ApiService, useValue: mockApi },
        { provide: Router, useValue: mockRouter },
        { provide: NotificationService, useValue: mockNotify },
        { provide: ThemeService, useValue: mockTheme },
        { provide: LanguageService, useValue: mockLangService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize language popup state based on local storage', () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'bhav_lang') return null;
      return null;
    });

    fixture.detectChanges();
    expect(component.showLanguagePopup).toBeTrue();
  });

  it('should not show language popup if language is already chosen', () => {
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'bhav_lang') return 'english';
      return null;
    });

    fixture.detectChanges();
    expect(component.showLanguagePopup).toBeFalse();
  });

  it('should change language and show notification when selectLanguage is called', () => {
    fixture.detectChanges();
    
    // Select gujarati
    component.selectLanguage('gujarati');

    expect(mockLangService.setLanguage).toHaveBeenCalledWith('gujarati');
    expect(component.showLanguagePopup).toBeFalse();
    expect(mockNotify.show).toHaveBeenCalledWith(
      'પધારો! ભાવનગરીસના શાહી દરબારમાં આપનું સ્વાગત છે.',
      'success'
    );
  });

  it('should change language and show correct Hindi message', () => {
    fixture.detectChanges();
    
    // Select hindi
    component.selectLanguage('hindi');

    expect(mockLangService.setLanguage).toHaveBeenCalledWith('hindi');
    expect(component.showLanguagePopup).toBeFalse();
    expect(mockNotify.show).toHaveBeenCalledWith(
      'पधारिए! भावनगरीस के शाही दरबार में आपका स्वागत है।',
      'success'
    );
  });

  it('should toggle theme when toggleTheme is called', () => {
    fixture.detectChanges();
    component.toggleTheme();
    expect(mockTheme.toggleTheme).toHaveBeenCalled();
  });

  it('should logout correctly', () => {
    fixture.detectChanges();
    component.logout();
    expect(mockApi.logout).toHaveBeenCalled();
    expect(mockNotify.show).toHaveBeenCalledWith('Logged out successfully', 'info');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
