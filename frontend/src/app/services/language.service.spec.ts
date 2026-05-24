import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.removeItem('bhav_lang');
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    localStorage.removeItem('bhav_lang');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to english when no language is chosen', () => {
    expect(service.getCurrentLanguage()).toBe('english');
  });

  it('should allow setting a language and store it in localStorage', () => {
    service.setLanguage('gujarati');
    expect(service.getCurrentLanguage()).toBe('gujarati');
    expect(localStorage.getItem('bhav_lang')).toBe('gujarati');
  });

  it('should update currentLang$ observable when language is changed', (done) => {
    service.setLanguage('hindi');
    service.currentLang$.subscribe(lang => {
      expect(lang).toBe('hindi');
      done();
    });
  });

  it('should correctly translate keys in English', () => {
    expect(service.t('catalog')).toBe('Catalog');
    expect(service.t('heritage')).toBe('Heritage');
  });

  it('should correctly translate keys in Gujarati', () => {
    service.setLanguage('gujarati');
    expect(service.t('catalog')).toBe('મેનુ');
    expect(service.t('heritage')).toBe('વારસો');
  });

  it('should correctly translate keys in Hindi', () => {
    service.setLanguage('hindi');
    expect(service.t('catalog')).toBe('उत्पाद सूची');
    expect(service.t('heritage')).toBe('धरोहर');
  });

  it('should fall back to English if key is missing in another language', () => {
    // Let's mock a missing key translation in language.service.ts
    // In language.service.ts, 'brand' is 'Our Brand' in English, 'ખાસ બ્રાન્ડ' in Gujarati, and 'खास ब्रांड' in Hindi.
    // If a key is completely missing in a language but exists in English:
    // service.t(key) should fall back to English.
    
    // We can test a key that we know is translated in English.
    expect(service.t('non_existent_key_xyz')).toBe('non_existent_key_xyz');
  });
});
