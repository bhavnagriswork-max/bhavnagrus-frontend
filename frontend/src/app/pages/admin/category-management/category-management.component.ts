import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-category-management',
  templateUrl: './category-management.component.html'
})
export class CategoryManagementComponent implements OnInit {
  categories: any[] = [];
  isModalOpen = false;
  editingCategory: any = null;
  loading = true;
  
  categoryData = {
    name: '',
    slug: '',
    description: '',
    image: '',
    is_active: true
  };

  constructor(public api: ApiService, private notify: NotificationService) { }

  ngOnInit(): void {
    this.fetchCategories();
  }

  fetchCategories() {
    this.loading = true;
    this.api.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.notify.show('Failed to fetch categories', 'error');
        this.loading = false;
      }
    });
  }

  openModal(cat: any = null) {
    if (cat) {
      this.editingCategory = cat;
      this.categoryData = { ...cat };
    } else {
      this.editingCategory = null;
      this.categoryData = { name: '', slug: '', description: '', image: '', is_active: true };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  editCategory(cat: any) {
    this.openModal(cat);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.api.uploadImage(file).subscribe({
        next: (res) => {
          this.categoryData.image = res.imageUrl;
          this.notify.show('Image uploaded successfully', 'success');
        },
        error: (err) => this.notify.show('Image upload failed', 'error')
      });
    }
  }

  saveCategory() {
    if (!this.categoryData.name) {
      this.notify.show('Category name is required', 'error');
      return;
    }

    if (this.editingCategory) {
      this.api.updateCategory(this.editingCategory.id, this.categoryData).subscribe({
        next: () => {
          this.fetchCategories();
          this.closeModal();
          this.notify.show('Category refined successfully', 'success');
        },
        error: (err) => this.notify.show('Failed to refine category', 'error')
      });
    } else {
      this.api.createCategory(this.categoryData).subscribe({
        next: () => {
          this.fetchCategories();
          this.closeModal();
          this.notify.show('New category established', 'success');
        },
        error: (err) => this.notify.show('Failed to establish category', 'error')
      });
    }
  }

  deleteCategory(id: number) {
    if (confirm('Are you sure you want to deaccession this category?')) {
      this.api.deleteCategory(id).subscribe({
        next: () => {
          this.fetchCategories();
          this.notify.show('Category deaccessioned', 'success');
        },
        error: (err) => this.notify.show('Failed to deaccession category', 'error')
      });
    }
  }
}
