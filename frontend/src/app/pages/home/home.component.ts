import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { LanguageService } from '../../services/language.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  products: any[] = [];
  heroSettings: any = {
    hero_title: 'Pure <br/> <span class="text-gold-gradient italic">Tradition.</span>',
    hero_subtitle: 'Experience the authentic taste of Gujarat\'s heritage snacks. Crafted with generational recipes and delivered fresh to your door.',
    website_name: 'Bhavnagris Heritage',
    hero_badge: 'Established 1948 • Bhavnagar',
    hero_cta_text: 'Order Now',
    hero_image: 'assets/images/hero-snacks.webp',
    products_title: 'Signature <br/><span class="text-white/20">Hand-Picked Mix</span>',
    products_subtitle: 'Select your favorite traditional flavors from our curated collection.',
    cta_title: 'Savor the <br/> <span class="italic text-white/20">Legacy.</span>',
    cta_button_text: 'Start Your Order',
    trust_1_title: 'Freshly Made', trust_1_subtitle: 'Handcrafted Daily',
    trust_2_title: 'Fast Delivery', trust_2_subtitle: 'Across India',
    trust_3_title: 'Hygienic', trust_3_subtitle: 'FSSAI Certified',
    trust_4_title: 'Secure Pay', trust_4_subtitle: 'UPI & COD',
    mission_title: 'Every Single Order <br> <span class="text-white/30 italic">Feeds a Stray Life.</span>',
    mission_subtitle: 'Our heritage is built on more than just taste; it\'s built on kindness. For every order you place, we commit to feeding a dog in need. Your "Dog Score" isn\'t just a number—it\'s a measure of the lives you\'ve helped sustain.'
  };

  globalDogScore = 0;

  constructor(
    public api: ApiService, 
    public router: Router,
    private notify: NotificationService,
    public langService: LanguageService
  ) { }

  ngOnInit(): void {
    // Load Global Dog Score
    this.api.getGlobalDogScore().subscribe({
      next: (res) => this.globalDogScore = res.global_dog_score,
      error: (err) => console.error(err)
    });
    // Load Hero Settings
    this.api.getPublicSettings().subscribe({
      next: (config) => {
        if (config) {
          this.heroSettings = { ...this.heroSettings, ...config };
        }
      }
    });

    // Attempt to load from API
    this.api.getProducts().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.products = data.slice(0, 4);
        } else {
          this.products = [];
        }
      },
      error: () => {
        this.products = [];
      }
    });
  }

  scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  addToCart(product: any) {
    const qty = product.quantity || 1;
    this.api.addToCart(product, qty).subscribe({
      next: () => {
        this.notify.show('Added to heritage basket!', 'success');
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initGSAPHero();
    this.initScrollReveal();
  }

  initGSAPHero() {
    gsap.from('.hero-content', {
      duration: 1.5,
      y: 100,
      opacity: 0,
      ease: 'power4.out',
      stagger: 0.2
    });
  }

  initScrollReveal() {
    gsap.utils.toArray('.reveal-up').forEach((elem: any) => {
      ScrollTrigger.create({
        trigger: elem,
        start: 'top 90%',
        onEnter: () => elem.classList.add('active'),
        once: true
      });
    });
  }

  handleImageError(event: any) {
    event.target.src = 'assets/placeholder-luxury.jpg';
  }
}
