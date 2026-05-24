import { Component, OnInit, AfterViewInit, HostListener, Inject, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, AfterViewInit {
  product: any = null;
  activeImage: string = '';
  allImages: string[] = [];
  activeIndex: number = 0;
  isImageTransitioning: boolean = false;
  
  // Touch gestures swipe state
  touchStartX = 0;
  touchEndX = 0;

  reviews: any[] = [];
  averageRating: number = 0;
  quantity = 1;
  loading = true;
  
  // Review form
  reviewData = {
    user_name: '',
    rating: 5,
    comment: '',
    image_url: ''
  };
  showReviewForm = false;
  hoverRating: number = 0;

  constructor(
    private route: ActivatedRoute,
    public api: ApiService,
    private router: Router,
    private notify: NotificationService,
    private titleService: Title,
    private metaService: Meta,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.fetchProduct(slug);
    }
  }

  fetchProduct(slug: string) {
    this.loading = true;
    this.api.getProductBySlug(slug).subscribe({
      next: (data) => {
        this.product = data;
        
        // Compile all gallery images dynamically
        this.allImages = [data.image];
        if (data.images && data.images.length > 0) {
          this.allImages.push(...data.images.map((img: any) => img.image_url));
        }
        
        this.activeIndex = 0;
        this.activeImage = this.allImages[0];
        this.loading = false;
        
        // SEO Metadata Optimization
        this.titleService.setTitle(`${this.product.name} | Buy Premium Snacks Online | Bhavnagris`);
        this.metaService.updateTag({ name: 'description', content: this.product.description?.substring(0, 160) || 'Experience the authentic taste of Bhavnagar heritage with our premium selection of hand-crafted delicacies.' });
        this.setSchemaMarkup(this.product);

        this.fetchReviews(data.id);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.notify.show('Failed to load heritage artifact', 'error');
      }
    });
  }

  // --- IMAGE CAROUSEL METHODS ---
  selectImage(index: number) {
    if (this.activeIndex === index || this.isImageTransitioning) return;
    this.isImageTransitioning = true;
    this.activeIndex = index;
    this.activeImage = this.allImages[index];
    setTimeout(() => {
      this.isImageTransitioning = false;
    }, 350);
  }

  nextImage() {
    if (this.allImages.length <= 1 || this.isImageTransitioning) return;
    this.isImageTransitioning = true;
    this.activeIndex = (this.activeIndex + 1) % this.allImages.length;
    this.activeImage = this.allImages[this.activeIndex];
    setTimeout(() => {
      this.isImageTransitioning = false;
    }, 350);
  }

  prevImage() {
    if (this.allImages.length <= 1 || this.isImageTransitioning) return;
    this.isImageTransitioning = true;
    this.activeIndex = (this.activeIndex - 1 + this.allImages.length) % this.allImages.length;
    this.activeImage = this.allImages[this.activeIndex];
    setTimeout(() => {
      this.isImageTransitioning = false;
    }, 350);
  }

  onImageLoad() {
    this.isImageTransitioning = false;
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipeGesture();
  }

  handleSwipeGesture() {
    const threshold = 50; // Min swipe distance
    if (this.touchStartX - this.touchEndX > threshold) {
      this.nextImage();
    } else if (this.touchEndX - this.touchStartX > threshold) {
      this.prevImage();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Only switch images if the user is not actively typing in an input/textarea
    const activeElem = document.activeElement?.tagName;
    if (activeElem === 'INPUT' || activeElem === 'TEXTAREA') return;

    if (event.key === 'ArrowRight') {
      this.nextImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevImage();
    }
  }

  fetchReviews(productId: string) {
    this.api.getReviews(productId).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.reviews = data;
          if (data.length > 0) {
            const sum = data.reduce((acc: number, curr: any) => acc + curr.rating, 0);
            this.averageRating = Math.round((sum / data.length) * 10) / 10;
          } else {
            this.averageRating = 0;
          }
        } else {
          this.reviews = [];
          this.averageRating = 0;
        }
      },
      error: (err) => console.error(err)
    });
  }

  submitReview() {
    if (!this.reviewData.user_name || !this.reviewData.comment) {
      this.notify.show('Please complete your testimonial', 'error');
      return;
    }

    this.api.postReview(this.product.id, this.reviewData).subscribe({
      next: (res) => {
        this.notify.show('Testimonial recorded successfully', 'success');
        this.showReviewForm = false;
        this.reviewData = { user_name: '', rating: 5, comment: '', image_url: '' };
        this.fetchReviews(this.product.id);
      },
      error: (err) => this.notify.show('Testimonial transmission failed', 'error')
    });
  }

  onReviewFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.api.uploadImage(file).subscribe({
        next: (res) => {
          this.reviewData.image_url = res.imageUrl;
          this.notify.show('Visual proof uploaded!', 'success');
        },
        error: (err) => this.notify.show('Visual upload failed', 'error')
      });
    }
  }

  addToCart() {
    this.api.addToCart(this.product, this.quantity).subscribe({
      next: () => {
        this.notify.show('Added to heritage basket!', 'success');
        this.router.navigate(['/cart']);
      },
      error: (err) => {
        this.notify.show('Failed to add to basket', 'error');
      }
    });
  }

  shareProduct() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.notify.show('Reference link copied to clipboard!', 'success');
    });
  }

  handleImageError(event: any) {
    if (!event.target.src.includes('assets/placeholder-luxury.jpg')) {
      event.target.src = 'assets/placeholder-luxury.jpg';
    }
  }

  ngAfterViewInit(): void {
    // Initial animations applied via setTimeout to wait for data binding
    setTimeout(() => {
      this.initScrollReveal();
    }, 500);
  }

  initScrollReveal() {
    gsap.utils.toArray('.reveal-up').forEach((elem: any) => {
      ScrollTrigger.create({
        trigger: elem,
        start: 'top 85%',
        onEnter: () => elem.classList.add('active'),
        once: true
      });
    });
  }

  getRatingText(rating: number): string {
    const texts = [
      'Select Rating',
      '1 Star - Poor',
      '2 Stars - Fair',
      '3 Stars - Good',
      '4 Stars - Very Good',
      '5 Stars - Exceptional'
    ];
    return texts[rating] || texts[0];
  }

  setSchemaMarkup(product: any) {
    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": this.api.getMediaUrl(product.image),
      "description": product.description || 'Premium Bhavnagari snack.',
      "brand": {
        "@type": "Brand",
        "name": "Bhavnagris"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "INR",
        "price": product.selling_price,
        "availability": "https://schema.org/InStock"
      }
    };
    
    const script = this.renderer.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    this.renderer.appendChild(this.document.head, script);
  }
}
