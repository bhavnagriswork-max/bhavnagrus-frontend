import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    private notify: NotificationService
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
        this.activeImage = data.image;
        this.loading = false;
        this.fetchReviews(data.id);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.notify.show('Failed to load heritage artifact', 'error');
      }
    });
  }

  fetchReviews(productId: string) {
    this.api.getReviews(productId).subscribe({
      next: (data) => {
        this.reviews = data;
        if (data && data.length > 0) {
          const sum = data.reduce((acc: number, curr: any) => acc + curr.rating, 0);
          this.averageRating = Math.round((sum / data.length) * 10) / 10;
        } else {
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
    event.target.src = 'assets/placeholder-luxury.jpg';
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
}
