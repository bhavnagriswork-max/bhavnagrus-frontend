import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  loading = true;
  showModal = false;
  isEdit = false;
  searchTerm: string = '';
  
  currentProduct: any = {
    name: '',
    description: '',
    original_price: 0,
    selling_price: 0,
    discount_percentage: 0,
    image: '',
    additional_images: [],
    category_id: null,
    stock: 0,
    weight: '',
    is_featured: 0,
    spiciness: 0,
    slug: '',
    brand: 'Bhavnagris',
    rating: 4.8,
    rating_count: 120
  };

  visibleColumns = {
    image: true,
    name: true,
    brand: true,
    category: true,
    spiciness: true,
    valuation: true,
    stock: true,
    weight: true,
    featured: true,
    status: true
  };

  constructor(
    public api: ApiService, 
    private router: Router,
    private notify: NotificationService
  ) { }

  ngOnInit(): void {
    this.fetchProducts();
    this.fetchCategories();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.api.uploadImage(file).subscribe({
        next: (res) => {
          this.currentProduct.image = res.imageUrl;
          this.notify.show('Main asset uploaded', 'success');
        },
        error: (err) => this.notify.show('Upload failed: ' + err.error?.message, 'error')
      });
    }
  }

  onMultipleFilesSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.api.uploadImages(files).subscribe({
        next: (res) => {
          if (!this.currentProduct.additional_images) this.currentProduct.additional_images = [];
          this.currentProduct.additional_images = [...this.currentProduct.additional_images, ...res.imageUrls];
          this.notify.show(`Added ${res.imageUrls.length} assets to gallery`, 'success');
        },
        error: (err) => this.notify.show('Gallery upload failed: ' + err.error?.message, 'error')
      });
    }
  }

  removeImage(index: number) {
    this.currentProduct.additional_images.splice(index, 1);
  }

  moveImage(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= this.currentProduct.additional_images.length) return;
    
    const temp = this.currentProduct.additional_images[index];
    this.currentProduct.additional_images[index] = this.currentProduct.additional_images[targetIndex];
    this.currentProduct.additional_images[targetIndex] = temp;
  }

  fetchProducts() {
    this.loading = true;
    this.api.getAllProductsAdmin().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.show('Failed to synchronize heritage collection', 'error');
        this.loading = false;
      }
    });
  }

  fetchCategories() {
    this.api.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error(err)
    });
  }

  openAddModal() {
    this.isEdit = false;
    this.currentProduct = {
      name: '',
      description: '',
      original_price: 0,
      selling_price: 0,
      discount_percentage: 0,
      image: '',
      additional_images: [],
      category_id: this.categories.length > 0 ? this.categories[0].id : null,
      stock: 0,
      weight: '',
      is_featured: 0,
      spiciness: 0,
      slug: '',
      brand: 'Bhavnagris',
      rating: 4.8,
      rating_count: 120
    };
    this.showModal = true;
  }

  openEditModal(product: any) {
    this.isEdit = true;
    const additional = product.images ? product.images.map((img: any) => img.image_url) : [];
    this.currentProduct = { 
      ...product, 
      brand: product.brand || 'Bhavnagris', 
      rating: product.rating !== undefined && product.rating !== null ? product.rating : 4.8, 
      rating_count: product.rating_count !== undefined && product.rating_count !== null ? product.rating_count : 120, 
      additional_images: additional 
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveProduct() {
    if (!this.api.isLoggedIn()) {
      this.notify.show('Session expired. Re-authentication required.', 'error');
      this.router.navigate(['/login']);
      return;
    }

    if (!this.currentProduct.slug && this.currentProduct.name) {
      this.currentProduct.slug = this.currentProduct.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    }

    if (this.isEdit) {
      this.api.updateProduct(this.currentProduct.id, this.currentProduct).subscribe({
        next: () => {
          this.notify.show('Heritage record updated successfully', 'success');
          this.fetchProducts();
          this.closeModal();
        },
        error: (err) => this.notify.show('Refinement failed: ' + err.error?.message, 'error')
      });
    } else {
      this.api.createProduct(this.currentProduct).subscribe({
        next: () => {
          this.notify.show('New collection item established', 'success');
          this.fetchProducts();
          this.closeModal();
        },
        error: (err) => this.notify.show('Creation failed: ' + err.error?.message, 'error')
      });
    }
  }

  quickUpdateSpiciness(product: any, newSpiciness: number) {
    this.api.updateProductSpiciness(product.id, newSpiciness).subscribe({
      next: () => {
        product.spiciness = newSpiciness;
        this.notify.show('Spiciness refined successfully', 'success');
      },
      error: (err) => this.notify.show('Failed to refine spiciness', 'error')
    });
  }

  toggleColumn(column: keyof typeof this.visibleColumns) {
    this.visibleColumns[column] = !this.visibleColumns[column];
  }

  handleImageError(event: any) {
    event.target.src = 'assets/placeholder-luxury.jpg';
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to deaccession this item?')) {
      this.api.deleteProduct(id).subscribe({
        next: () => {
          this.notify.show('Item deaccessioned from collection', 'success');
          this.fetchProducts();
        },
        error: (err) => this.notify.show('Deaccession failed: ' + err.error?.message, 'error')
      });
    }
  }

  get filteredProducts(): any[] {
    if (!this.searchTerm.trim()) {
      return this.products;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.products.filter(p => 
      p.name?.toLowerCase().includes(term) ||
      p.category_name?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.weight?.toLowerCase().includes(term) ||
      (p.selling_price && p.selling_price.toString().includes(term))
    );
  }
}
