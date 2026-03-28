import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UiSelectAdvancedComponent,
  SelectOption,
} from './ui-select-advanced.component';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'date' | 'boolean' | 'status';
}

export interface TableAction {
  icon: string;
  label: string;
  action: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'ghost';
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions: number[];
}

@Component({
  selector: 'app-ui-table',
  standalone: true,
  imports: [CommonModule, FormsModule, UiSelectAdvancedComponent],
  template: `
    <div class="w-full">
      <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <!-- Header -->
        <div
          class="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-3 justify-between"
        >
          @if (searchable) {
            <div class="relative flex-1 min-w-[200px] max-w-sm">
              <svg
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
                [placeholder]="searchPlaceholder"
                class="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
              />
              @if (searchQuery) {
                <button
                  (click)="clearSearch()"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg
                    class="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              }
            </div>
          }
          <div class="flex items-center gap-2">
            @if (showRefresh) {
              <button
                (click)="refresh.emit()"
                class="p-2 text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                title="Refresh"
              >
                <svg
                  class="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                  />
                  <path d="M3 3v5h5" />
                  <path
                    d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"
                  />
                  <path d="M16 16h5v5" />
                </svg>
              </button>
            }
            @if (showExport) {
              <button
                (click)="exportData()"
                class="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
              >
                <svg
                  class="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Export
              </button>
            }
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                @for (col of columns; track col.key) {
                  <th [style.width]="col.width" [class]="getHeaderClass(col)">
                    @if (col.sortable) {
                      <button
                        (click)="sort(col.key)"
                        class="flex items-center gap-1 hover:text-slate-700"
                      >
                        {{ col.label }}
                        @if (sortKey() === col.key) {
                          <svg
                            class="w-3 h-3"
                            [class.rotate-180]="sortDirection() === 'desc'"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        }
                      </button>
                    } @else {
                      {{ col.label }}
                    }
                  </th>
                }
                @if (actions.length > 0) {
                  <th
                    class="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase"
                  >
                    Actions
                  </th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @if (loading) {
                <tr>
                  <td
                    [attr.colspan]="
                      columns.length + (actions.length > 0 ? 1 : 0)
                    "
                    class="px-4 py-12 text-center text-slate-400"
                  >
                    <svg
                      class="animate-spin w-5 h-5 mx-auto mb-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      ></path>
                    </svg>
                    Loading...
                  </td>
                </tr>
              } @else if (paginatedData().length === 0) {
                <tr>
                  <td
                    [attr.colspan]="
                      columns.length + (actions.length > 0 ? 1 : 0)
                    "
                    class="px-4 py-12 text-center text-slate-400"
                  >
                    {{ emptyMessage }}
                  </td>
                </tr>
              } @else {
                @for (
                  row of paginatedData();
                  track trackBy ? row[trackBy] : $index
                ) {
                  <tr class="hover:bg-slate-50/50">
                    @for (col of columns; track col.key) {
                      <td [class]="getCellClass(col)">
                        @if (col.type === 'boolean') {
                          <span
                            class="px-2 py-0.5 rounded-full text-xs font-medium"
                            [class.bg-green-50]="row[col.key]"
                            [class.text-green-700]="row[col.key]"
                            [class.bg-slate-100]="!row[col.key]"
                            [class.text-slate-500]="!row[col.key]"
                          >
                            {{ row[col.key] ? 'Yes' : 'No' }}
                          </span>
                        } @else if (col.type === 'date') {
                          {{ row[col.key] | date: 'mediumDate' }}
                        } @else if (col.type === 'status') {
                          <span
                            class="px-2 py-0.5 rounded-full text-xs font-medium"
                            [class.bg-green-50]="row[col.key] === 'active'"
                            [class.text-green-700]="row[col.key] === 'active'"
                            [class.bg-slate-100]="row[col.key] === 'inactive'"
                            [class.text-slate-600]="row[col.key] === 'inactive'"
                            [class.bg-amber-50]="row[col.key] === 'pending'"
                            [class.text-amber-700]="row[col.key] === 'pending'"
                          >
                            {{ row[col.key] }}
                          </span>
                        } @else {
                          {{ row[col.key] }}
                        }
                      </td>
                    }
                    @if (actions.length > 0) {
                      <td class="px-4 py-3 text-right">
                        <div class="flex items-center justify-end gap-1">
                          @for (action of actions; track action.action) {
                            <button
                              (click)="handleAction(action.action, row)"
                              [title]="action.label"
                              [class]="getActionClass(action)"
                            >
                              <span [innerHTML]="action.icon"></span>
                            </button>
                          }
                        </div>
                      </td>
                    }
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pagination && paginatedData().length > 0) {
          <div
            class="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3"
          >
            <div class="text-sm text-slate-500">
              Showing {{ startIndex() + 1 }} to {{ endIndex() }} of
              {{ filteredData().length }} entries
            </div>
            <div class="flex items-center gap-2">
              <app-ui-select-advanced
                [(ngModel)]="pageSize"
                (ngModelChange)="onPageSizeChange($event)"
                [options]="pageSizeSelectOptions()"
                [searchable]="false"
                [showFooter]="false"
                size="sm"
              ></app-ui-select-advanced>
              <div class="flex items-center gap-1">
                <button
                  (click)="goToPage(1)"
                  [disabled]="page <= 1"
                  class="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50"
                >
                  «
                </button>
                <button
                  (click)="goToPage(page - 1)"
                  [disabled]="page <= 1"
                  class="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50"
                >
                  ‹
                </button>
                <span class="px-2 text-sm"
                  >{{ page }} / {{ totalPages() }}</span
                >
                <button
                  (click)="goToPage(page + 1)"
                  [disabled]="page >= totalPages()"
                  class="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50"
                >
                  ›
                </button>
                <button
                  (click)="goToPage(totalPages())"
                  [disabled]="page >= totalPages()"
                  class="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-50"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .rotate-180 {
        transform: rotate(180deg);
      }
    `,
  ],
})
export class UiTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() trackBy = '';
  @Input() searchable = true;
  @Input() sortable = true;
  @Input() loading = false;
  @Input() showRefresh = true;
  @Input() showExport = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() emptyMessage = 'No data found';
  @Input() pagination: TablePagination | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() search = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<{
    key: string;
    direction: 'asc' | 'desc';
  }>();
  @Output() actionClick = new EventEmitter<{ action: string; row: any }>();

  searchQuery = '';
  sortKey = signal('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  page = 1;
  pageSize = 10;

  pageSizeSelectOptions(): SelectOption[] {
    if (!this.pagination) return [];
    return this.pagination.pageSizeOptions.map((size: number) => ({
      label: String(size),
      value: size,
    }));
  }

  ngOnInit() {
    if (this.pagination) {
      this.page = this.pagination.page;
      this.pageSize = this.pagination.pageSize;
    }
  }

  filteredData() {
    if (!this.searchQuery) return this.data;
    const q = this.searchQuery.toLowerCase();
    return this.data.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q)),
    );
  }

  sortedData() {
    if (!this.sortKey()) return this.filteredData();
    return [...this.filteredData()].sort((a, b) => {
      const aVal = a[this.sortKey()],
        bVal = b[this.sortKey()];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return this.sortDirection() === 'asc' ? cmp : -cmp;
    });
  }

  paginatedData() {
    const data = this.sortedData();
    return data.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize,
    );
  }

  totalPages() {
    return Math.ceil(this.filteredData().length / this.pageSize) || 1;
  }
  startIndex() {
    return (this.page - 1) * this.pageSize;
  }
  endIndex() {
    return Math.min(
      this.startIndex() + this.pageSize,
      this.filteredData().length,
    );
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.page = 1;
    this.search.emit(query);
  }

  clearSearch() {
    this.searchQuery = '';
    this.search.emit('');
  }

  sort(key: string) {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
    this.sortChange.emit({
      key: this.sortKey(),
      direction: this.sortDirection(),
    });
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) this.page = p;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.page = 1;
  }

  handleAction(action: string, row: any) {
    this.actionClick.emit({ action, row });
  }

  getHeaderClass(col: TableColumn): string {
    const align =
      col.align === 'center'
        ? 'text-center'
        : col.align === 'right'
          ? 'text-right'
          : 'text-left';
    return `px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider ${align}`;
  }

  getCellClass(col: TableColumn): string {
    const align =
      col.align === 'center'
        ? 'text-center'
        : col.align === 'right'
          ? 'text-right'
          : 'text-left';
    return `px-4 py-3 text-sm text-slate-700 ${align}`;
  }

  getActionClass(action: TableAction): string {
    const variants: Record<string, string> = {
      primary: 'text-primary-600 hover:bg-primary-50',
      success: 'text-green-600 hover:bg-green-50',
      warning: 'text-amber-600 hover:bg-amber-50',
      danger: 'text-red-600 hover:bg-red-50',
      ghost: 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
    };
    return `p-1.5 rounded-md transition-colors ${variants[action.variant || 'ghost']}`;
  }

  exportData() {
    const data = this.sortedData();
    const headers = this.columns.map((c) => c.label).join(',');
    const rows = data.map((row) =>
      this.columns.map((c) => row[c.key]).join(','),
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
