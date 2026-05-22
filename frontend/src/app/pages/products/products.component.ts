import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  categories: any[] = [];
  loading = true;
  selectedCategoryId: any = null;
  selectedSpiciness: number = 0;
  selectedBrand: string | null = null;
  sortOption = 'Latest Arrivals';
  window = window;

  constructor(
    public api: ApiService, 
    private router: Router,
    private route: ActivatedRoute,
    private notify: NotificationService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedBrand = params['brand'] || null;
      if (this.products && this.products.length > 0) {
        this.applyFilter();
      } else {
        this.fetchData();
      }
    });
  }

  fetchData() {
    this.loading = true;
    // Fetch Categories
    this.api.getCategories().subscribe({
      next: (data) => { this.categories = data; },
      error: (err) => console.error(err)
    });

    // Fetch Products
    this.api.getProducts().subscribe({
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

  filterByBrand(brand: string | null) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { brand: brand || null },
      queryParamsHandling: 'merge'
    });
  }

  applyFilter() {
    let result = [...this.products];
    
    if (this.selectedCategoryId) {
      result = result.filter(p => p.category_id === this.selectedCategoryId);
    }

    if (this.selectedBrand) {
      result = result.filter(p => {
        const prodBrand = p.brand || 'Bhavnagris';
        return prodBrand.toLowerCase().trim() === this.selectedBrand!.toLowerCase().trim();
      });
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
        this.notify.show('Added to Heritage Basket!', 'success');
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
