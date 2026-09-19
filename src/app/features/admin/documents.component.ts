import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DocumentService,
  Document,
} from '../../core/services/document.service';
import { ToastService } from '../../core/services/toast.service';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from '../../core/components/ui/ui-select-advanced.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div
        class="app-module-hero flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5"
      >
        <div class="max-w-2xl">
          <p class="app-module-kicker">Document Center</p>
          <h1 class="app-module-title mt-3">
            Employee files and records workspace
          </h1>
          <p class="app-module-text mt-3">
            Manage uploaded records, filter document categories, and handle
            document lifecycle from one organized repository.
          </p>
        </div>
        <div class="flex flex-col gap-3 xl:items-end">
          <div class="app-module-highlight min-w-[240px]">
            <span class="app-module-highlight-label">Visible files</span>
            <div class="app-module-highlight-value mt-3">
              {{ documents.length }}
            </div>
            <p class="mt-2 text-sm text-white/80">
              Documents currently loaded for the selected category and search
              filters.
            </p>
          </div>
          <button
            (click)="openUploadModal()"
            class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-md flex items-center gap-2 font-bold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            Upload Document
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="bg-white rounded-md shadow-sm border border-gray-200 p-4 mb-6"
      >
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Category</label
            >
            <app-ui-select-advanced
              [(ngModel)]="filters.category"
              (ngModelChange)="scheduleLoadDocuments()"
              [options]="categoryFilterOptions"
              placeholder="All Categories"
              size="sm"
              [searchable]="false"
              [showFooter]="false"
            ></app-ui-select-advanced>
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >Search</label
            >
            <input
              type="text"
              [(ngModel)]="filters.search"
              (input)="scheduleLoadDocuments()"
              placeholder="Search documents..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
        ></div>
      </div>

      <!-- Documents Grid -->
      <div
        *ngIf="!loading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          *ngFor="let doc of documents"
          class="bg-white rounded-md shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="font-medium text-gray-900 truncate max-w-[150px]">
                  {{ doc.name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ formatFileSize(doc.fileSize) }}
                </p>
              </div>
            </div>
            <div class="relative">
              <button
                (click)="toggleMenu(doc.id)"
                class="p-1 hover:bg-gray-100 rounded"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
                  />
                </svg>
              </button>
              <div
                *ngIf="activeMenu === doc.id"
                class="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
              >
                <button
                  (click)="openDocument(doc)"
                  class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  Open
                </button>
                <button
                  (click)="downloadDocument(doc)"
                  class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                >
                  Download
                </button>
                <button
                  (click)="deleteDocument(doc)"
                  class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {{ formatCategory(doc.category) }}
            </span>
          </div>
          <div class="mt-3 text-xs text-gray-500">
            Uploaded: {{ doc.uploadedAt | date: 'medium' }}
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="documents.length === 0" class="col-span-full">
          <div class="text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p class="mt-2 text-gray-500">No documents found</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div
      *ngIf="showUploadModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-md shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">Upload Document</h3>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <!-- File Drop Zone -->
            <div
              *ngIf="!selectedFile"
              (dragover)="onDragOver($event)"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
              class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 cursor-pointer transition-colors"
            >
              <input
                #fileInput
                type="file"
                (change)="onFileSelect($event)"
                class="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p class="mt-2 text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p class="text-xs text-gray-500">
                PDF, DOC, DOCX, JPG, PNG (max 10MB)
              </p>
            </div>

            <!-- Selected File -->
            <div
              *ngIf="selectedFile"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-8 w-8 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ selectedFile.name }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ formatFileSize(selectedFile.size) }}
                    </p>
                  </div>
                </div>
                <button
                  (click)="clearSelectedFile()"
                  class="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Progress Bar -->
            <div
              *ngIf="uploading && uploadProgress < 100"
              class="space-y-2"
            >
              <div class="flex items-center justify-between text-xs font-semibold text-gray-600">
                <span>Uploading to Cloudinary</span>
                <span>{{ uploadProgress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div
                class="bg-blue-600 h-2.5 rounded-full"
                [style.width.%]="uploadProgress"
              ></div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Document Name</label
              >
              <input
                type="text"
                [(ngModel)]="uploadData.name"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter document name"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Category</label
              >
              <app-ui-select-advanced
                [(ngModel)]="uploadData.category"
                [options]="categoryFormOptions"
              ></app-ui-select-advanced>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Description</label
              >
              <textarea
                [(ngModel)]="uploadData.description"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
              ></textarea>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <button
            (click)="closeUploadModal()"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            (click)="uploadDocument()"
            [disabled]="!selectedFile || uploading"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DocumentsComponent implements OnInit {
  private documentService = inject(DocumentService);
  private toastService = inject(ToastService);
  private loadDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  documents: Document[] = [];
  loading = false;
  uploading = false;
  uploadProgress = 0;
  showUploadModal = false;
  activeMenu: number | null = null;
  selectedFile: File | null = null;

  categoryFilterOptions: SelectOption[] = [
    { label: 'All Categories', value: '' },
    { label: 'Profile Photo', value: 'profile' },
    { label: 'ID Proof', value: 'id_proof' },
    { label: 'Certificate', value: 'certificate' },
    { label: 'Offer Letter', value: 'offer_letter' },
    { label: 'Contract', value: 'contract' },
    { label: 'Other', value: 'other' },
  ];

  categoryFormOptions: SelectOption[] = [
    { label: 'Profile Photo', value: 'profile' },
    { label: 'ID Proof', value: 'id_proof' },
    { label: 'Certificate', value: 'certificate' },
    { label: 'Offer Letter', value: 'offer_letter' },
    { label: 'Contract', value: 'contract' },
    { label: 'Other', value: 'other' },
  ];

  filters = {
    category: '',
    search: '',
  };

  uploadData = {
    name: '',
    category: 'other',
    description: '',
  };

  ngOnInit() {
    this.loadDocuments();
  }

  scheduleLoadDocuments() {
    if (this.loadDebounceTimer) {
      clearTimeout(this.loadDebounceTimer);
    }
    this.loadDebounceTimer = setTimeout(() => this.loadDocuments(), 250);
  }

  loadDocuments() {
    this.loading = true;
    this.documentService.getDocuments().subscribe({
      next: (data) => {
        this.documents = this.filterData(data);
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to load documents');
        this.loading = false;
      },
    });
  }

  filterData(data: Document[]): Document[] {
    return data.filter((item) => {
      if (this.filters.category && item.category !== this.filters.category)
        return false;
      if (this.filters.search) {
        const search = this.filters.search.toLowerCase();
        if (
          !item.name.toLowerCase().includes(search) &&
          !item.fileName?.toLowerCase().includes(search)
        )
          return false;
      }
      return true;
    });
  }

  openUploadModal() {
    this.uploadData = {
      name: '',
      category: 'other',
      description: '',
    };
    this.selectedFile = null;
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      if (!this.uploadData.name) {
        this.uploadData.name = this.selectedFile.name.replace(/\.[^/.]+$/, '');
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.selectedFile = event.dataTransfer.files[0];
      if (!this.uploadData.name) {
        this.uploadData.name = this.selectedFile.name.replace(/\.[^/.]+$/, '');
      }
    }
  }

  clearSelectedFile() {
    this.selectedFile = null;
  }

  uploadDocument() {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.uploadProgress = 0;

    this.documentService
      .uploadDocument(this.selectedFile, {
        name: this.uploadData.name || this.selectedFile.name,
        category: this.uploadData.category,
        description: this.uploadData.description,
      })
      .subscribe({
        next: (result) => {
          this.uploadProgress = result.progress;
          if (result.progress === 100) {
            this.toastService.success('Document uploaded successfully');
            this.uploading = false;
            this.closeUploadModal();
            this.loadDocuments();
          }
        },
        error: () => {
          this.toastService.error('Failed to upload document');
          this.uploading = false;
        },
      });
  }

  openDocument(doc: Document) {
    this.activeMenu = null;
    const url = doc.filePath || '';
    if (!url) {
      this.toastService.error('Document file is unavailable');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  downloadDocument(doc: Document) {
    this.activeMenu = null;
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName || doc.name;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.error('Failed to download document');
      },
    });
  }

  deleteDocument(doc: Document) {
    this.activeMenu = null;
    if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      this.documentService.deleteDocument(doc.id).subscribe({
        next: () => {
          this.toastService.success('Document deleted successfully');
          this.loadDocuments();
        },
        error: () => {
          this.toastService.error('Failed to delete document');
        },
      });
    }
  }

  toggleMenu(id: number) {
    this.activeMenu = this.activeMenu === id ? null : id;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatCategory(category: string): string {
    const categories: Record<string, string> = {
      profile: 'Profile Photo',
      id_proof: 'ID Proof',
      certificate: 'Certificate',
      offer_letter: 'Offer Letter',
      contract: 'Contract',
      other: 'Other',
    };
    return categories[category] || category;
  }
}
