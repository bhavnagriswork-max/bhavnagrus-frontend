import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { LanguageService } from '../../services/language.service';
import { combineLatest } from 'rxjs';

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
  sortOption = 'Best Selling';
  window = window;

  // Collection-specific states
  collectionSlug: string | null = null;
  activeCategory: any = null;
  availableTags: string[] = [];
  selectedTags: string[] = [];
  showOnlyBestSellers = false;

  constructor(
    public api: ApiService, 
    private router: Router,
    private route: ActivatedRoute,
    private notify: NotificationService,
    public langService: LanguageService
  ) { }

  ngOnInit(): void {
    // Listen to both params and queryParams together to handle routing transitions
    combineLatest([
      this.route.paramMap,
      this.route.queryParams
    ]).subscribe(([params, queryParams]) => {
      this.collectionSlug = params.get('category') || null;
      this.selectedBrand = queryParams['brand'] || null;

      // Clear sub-filters on collection transition
      this.selectedTags = [];
      this.showOnlyBestSellers = false;

      if (this.products && this.products.length > 0) {
        this.alignCollection();
      } else {
        this.fetchData();
      }
    });
  }

  fetchData() {
    this.loading = true;
    
    // Fetch Categories and then Products in sequence or parallel
    combineLatest([
      this.api.getCategories(),
      this.api.getProducts()
    ]).subscribe({
      next: ([cats, prods]) => {
        this.categories = cats;
        this.products = prods;
        this.alignCollection();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching catalog data:', err);
        this.loading = false;
      }
    });
  }

  alignCollection() {
    if (this.collectionSlug) {
      const matched = this.categories.find(c => c.slug === this.collectionSlug);
      if (matched) {
        this.activeCategory = matched;
        this.selectedCategoryId = matched.id;
      } else {
        this.activeCategory = null;
        this.selectedCategoryId = null;
      }
    } else {
      this.activeCategory = null;
      this.selectedCategoryId = null;
    }

    // Dynamic tag extraction for this specific collection
    this.extractTags();
    this.applyFilter();
  }

  extractTags() {
    const tagsSet = new Set<string>();
    const collectionProducts = this.products.filter(p => !this.selectedCategoryId || p.category_id == this.selectedCategoryId);
    
    collectionProducts.forEach(p => {
      if (p.tags) {
        p.tags.split(',').forEach((t: string) => {
          const cleaned = t.trim().toLowerCase();
          if (cleaned) tagsSet.add(cleaned);
        });
      }
    });
    
    this.availableTags = Array.from(tagsSet);
  }

  filterByCategory(id: any) {
    if (id === null) {
      this.selectedCategoryId = null;
      this.router.navigate(['/products']);
      return;
    }

    const cat = this.categories.find(c => c.id == id);
    if (cat && ['gathiya', 'sev', 'bhujia', 'puri-papadi', 'mixture-chevdo', 'chana-peanuts'].includes(cat.slug)) {
      this.router.navigate(['/collections', cat.slug]);
    } else {
      this.selectedCategoryId = id;
      this.applyFilter();
    }
  }

  filterByBrand(brand: string | null) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { brand: brand || null },
      queryParamsHandling: 'merge'
    });
  }

  toggleTagFilter(tag: string) {
    const idx = this.selectedTags.indexOf(tag);
    if (idx > -1) {
      this.selectedTags.splice(idx, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.applyFilter();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  toggleBestSellers() {
    this.showOnlyBestSellers = !this.showOnlyBestSellers;
    this.applyFilter();
  }

  applyFilter() {
    let result = [...this.products];
    
    // 1. Filter by Main Category
    if (this.selectedCategoryId) {
      result = result.filter(p => p.category_id == this.selectedCategoryId);
    }

    // 2. Filter by Brand
    if (this.selectedBrand) {
      result = result.filter(p => {
        const prodBrand = p.brand || 'Bhavnagris';
        return prodBrand.toLowerCase().trim() === this.selectedBrand!.toLowerCase().trim();
      });
    }

    // 3. Filter by Spice heat level
    if (this.selectedSpiciness > 0) {
      result = result.filter(p => p.spiciness >= this.selectedSpiciness);
    }

    // 4. Filter by sub-type Tags
    if (this.selectedTags.length > 0) {
      result = result.filter(p => {
        if (!p.tags) return false;
        const prodTags = p.tags.split(',').map((t: string) => t.trim().toLowerCase());
        return this.selectedTags.some(tag => prodTags.includes(tag));
      });
    }

    // 5. Filter by Featured / Best Sellers
    if (this.showOnlyBestSellers) {
      result = result.filter(p => p.is_featured === 1);
    }

    // 6. Luxury Sorting Logic
    if (this.sortOption === 'Best Selling') {
      result.sort((a, b) => {
        // Featured products first, then sort by highest average rating
        if (a.is_featured !== b.is_featured) {
          return b.is_featured - a.is_featured;
        }
        return (b.rating || 4.8) - (a.rating || 4.8);
      });
    } else if (this.sortOption === 'Price: Low to High') {
      result.sort((a, b) => a.selling_price - b.selling_price);
    } else if (this.sortOption === 'Price: High to Low') {
      result.sort((a, b) => b.selling_price - a.selling_price);
    } else if (this.sortOption === 'Latest Arrivals') {
      result.sort((a, b) => b.id - a.id);
    }

    this.filteredProducts = result;
  }

  resetFilters() {
    this.selectedTags = [];
    this.selectedSpiciness = 0;
    this.showOnlyBestSellers = false;
    this.applyFilter();
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

  buyNow(product: any) {
    this.api.addToCart(product, 1).subscribe({
      next: () => {
        this.router.navigate(['/checkout']);
      },
      error: (err) => {
        this.notify.show('Failed to initiate quick purchase', 'error');
      }
    });
  }

  handleImageError(event: any) {
    event.target.src = 'assets/placeholder-luxury.jpg';
  }

  getRestructuredCategoriesList(): any[] {
    return this.categories.filter(c => ['gathiya', 'sev', 'bhujia', 'puri-papadi', 'mixture-chevdo', 'chana-peanuts'].includes(c.slug));
  }

  getRestructuredCategories(): any[] {
    const list = this.getRestructuredCategoriesList();
    if (this.selectedCategoryId) {
      return list.filter(c => c.id == this.selectedCategoryId);
    }
    return list;
  }

  getRestructuredCategoriesWithProductsCount(): number {
    let count = 0;
    this.getRestructuredCategories().forEach(cat => {
      count += this.getProductsByCategory(cat.id).length;
    });
    return count;
  }

  getProductsByCategory(categoryId: number): any[] {
    let prods = this.products.filter(p => p.category_id == categoryId);
    
    // Apply filters
    if (this.selectedBrand) {
      prods = prods.filter(p => (p.brand || 'Bhavnagris').toLowerCase().trim() === this.selectedBrand!.toLowerCase().trim());
    }
    if (this.selectedSpiciness > 0) {
      prods = prods.filter(p => p.spiciness >= this.selectedSpiciness);
    }
    if (this.showOnlyBestSellers) {
      prods = prods.filter(p => p.is_featured === 1);
    }
    
    // Sort
    if (this.sortOption === 'Best Selling') {
      prods.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return b.is_featured - a.is_featured;
        return (b.rating || 4.8) - (a.rating || 4.8);
      });
    } else if (this.sortOption === 'Price: Low to High') {
      prods.sort((a, b) => a.selling_price - b.selling_price);
    } else if (this.sortOption === 'Price: High to Low') {
      prods.sort((a, b) => b.selling_price - a.selling_price);
    } else if (this.sortOption === 'Latest Arrivals') {
      prods.sort((a, b) => b.id - a.id);
    }
    
    return prods;
  }
}
