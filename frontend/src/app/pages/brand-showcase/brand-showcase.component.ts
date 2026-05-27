import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-brand-showcase',
  templateUrl: './brand-showcase.component.html',
  styleUrls: ['./brand-showcase.component.css']
})
export class BrandShowcaseComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: any[] = [];
  loading = true;
  selectedCategoryId: any = null;
  selectedSpiciness: number = 0;
  sortOption = 'Latest Arrivals';
  window = window;

  constructor(
    public api: ApiService,
    private router: Router,
    private notify: NotificationService,
    public langService: LanguageService
  ) { }

  t(key: string): string {
    return this.langService.t(key);
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    // Fetch Categories
    this.api.getCategories().subscribe({
      next: (data) => {
        // Only keep Snacks and Sweets for brand page
        this.categories = data.filter((c: any) => 
          c.name.toLowerCase().includes('snack') || 
          c.name.toLowerCase().includes('sweet')
        );
      },
      error: (err) => console.error(err)
    });

    // Fetch ONLY Bhavnagris brand products
    this.api.getBrandProducts('Bhavnagris').subscribe({
      next: (data) => {
        this.products = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  filterByCategory(id: any) {
    this.selectedCategoryId = id;
    this.applyFilter();
  }

  applyFilter() {
    let result = [...this.products];

    if (this.selectedCategoryId) {
      result = result.filter(p => p.category_id == this.selectedCategoryId);
    }

    if (this.selectedSpiciness > 0) {
      result = result.filter(p => p.spiciness >= this.selectedSpiciness);
    }

    if (this.sortOption === 'Price: Low to High') {
      result.sort((a, b) => a.selling_price - b.selling_price);
    } else if (this.sortOption === 'Price: High to Low') {
      result.sort((a, b) => b.selling_price - a.selling_price);
    }

    this.filteredProducts = result;
  }

  addToCart(product: any) {
    this.api.addToCart(product, 1).subscribe({
      next: () => {
        this.notify.show('Added to your Heritage Basket!', 'success');
      },
      error: (err) => {
        this.notify.show('Failed to add to basket', 'error');
      }
    });
  }

  handleImageError(event: any) {
    event.target.src = 'assets/placeholder-luxury.jpg';
  }
}
