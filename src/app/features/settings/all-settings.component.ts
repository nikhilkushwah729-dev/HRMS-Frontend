import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { getSettingMenu, SettingCategory, SettingRoute } from './setting-menu';

@Component({
  selector: 'app-all-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="mx-auto pb-4 max-w-7xl h-full flex flex-col">
      <!-- Search and Header Row -->
      <div class="grid grid-cols-12 gap-3 pb-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md pt-4">
        <div class="col-span-12">
          <div class="bg-white p-5 rounded-md shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                System Settings
              </div>
              <p class="text-sm text-slate-500 mt-1">Manage configurations, organizations, policies, and system-wide behavior.</p>
            </div>

            <!-- Search Bar -->
            <div class="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Search settings..."
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchChange($event)"
                class="w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-lg bg-slate-50 text-sm transition-all outline-none"
              />
              <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>

              <!-- Search Dropdown Results -->
              @if (isSearchOpen() && searchResults().length > 0) {
                <div class="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-md shadow-xl max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                  <div class="p-2 space-y-1">
                    @for (result of searchResults(); track result.route) {
                      <a [routerLink]="result.route" class="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors cursor-pointer">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                          </div>
                          <div>
                            <div class="text-sm font-semibold text-slate-900 group-hover:text-primary-600">{{ result.label }}</div>
                            <div class="text-xs text-slate-500">{{ result.path }}</div>
                          </div>
                        </div>
                      </a>
                    }
                  </div>
                </div>
              }

              @if (isSearchOpen() && searchResults().length === 0) {
                <div class="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-md shadow-xl p-4 text-center text-sm text-slate-500 z-50">
                  No settings found matching "{{ searchQuery() }}"
                </div>
              }
            </div>

            <!-- Close Button -->
            <button (click)="closeSettings()" class="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors border border-slate-100 hover:border-rose-100 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Settings Grid Layout -->
      <div class="flex-1 overflow-y-auto custom-scrollbar pb-24">
        <div class="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          
          <!-- Iterate over Setting Categories -->
          @for (category of objectKeys(structuredSettings()); track category) {
            @if (structuredSettings()[category].per && structuredSettings()[category].routes.length > 0) {
              <div class="bg-white rounded-md shadow-sm border border-slate-100 overflow-hidden break-inside-avoid animate-in fade-in slide-in-from-bottom-4">
                
                <!-- Category Header -->
                <div class="p-5 border-b border-slate-50 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center \{{ structuredSettings()[category].bgClass }} \{{ structuredSettings()[category].colorClass }}">
                    <img [src]="structuredSettings()[category].icon" class="w-5 h-5 opacity-80 mix-blend-multiply" alt="icon">
                  </div>
                  <h2 class="text-lg font-bold text-slate-900">
                    \{{ structuredSettings()[category].label }}
                  </h2>
                </div>

                <!-- Category Routes -->
                <div class="p-3 bg-slate-50/50">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    @for (route of structuredSettings()[category].routes; track route.route) {
                      @if (route.per) {
                        <a [routerLink]="route.route" class="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-white hover:text-primary-600 hover:shadow-sm border border-transparent hover:border-slate-100 transition-all truncate flex items-center gap-2">
                          <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                          \{{ formatLabel(route.label) }}
                        </a>
                      }
                    }
                  </div>
                </div>
              </div>
            }
          }

        </div>
      </div>

      <!-- Bottom Action Bar (Approval Flow, Import Wizard, etc) -->
      <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-30 sm:ml-64 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.02)]">
        <div class="max-w-7xl mx-auto flex gap-4">
          <a routerLink="approval-flow" class="flex-1 max-w-sm flex items-center gap-3 px-5 py-3 rounded-md border border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50 hover:shadow-sm hover:-translate-y-0.5 transition-all text-emerald-800 font-bold group">
            <div class="p-2 rounded bg-emerald-100/50 text-emerald-600 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
            </div>
            Approval Flow Center
          </a>

          <a routerLink="import-wizard" class="flex-1 max-w-sm flex items-center gap-3 px-5 py-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5 transition-all text-slate-700 font-bold group">
            <div class="p-2 rounded bg-slate-100 text-slate-500 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            Import Wizard
          </a>
        </div>
      </div>
      
    </div>
  `
})
export class AllSettingsComponent implements OnInit {
  private router = inject(Router);

  structuredSettings = signal<Record<string, SettingCategory>>({});
  
  searchQuery = signal('');
  isSearchOpen = signal(false);
  searchResults = signal<SettingRoute[]>([]);
  allFlatRoutes: SettingRoute[] = [];
  
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.structuredSettings.set(getSettingMenu(this.permissionService, this.authService));
    
    // Flatten routes for search
    const settings = this.structuredSettings();
    const flat: SettingRoute[] = [];
    Object.keys(settings).forEach(key => {
      flat.push(...settings[key].routes.filter(r => r.per));
    });
    this.allFlatRoutes = flat;

    // Attach click outside listener manually for simplicity
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.md\\:w-96')) {
        this.isSearchOpen.set(false);
      }
    });
  }

  objectKeys(obj: any) {
    return Object.keys(obj);
  }

  formatLabel(label: string): string {
    return label.replace(/-/g, ' ');
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    const q = query.trim().toLowerCase();
    
    if (!q) {
      this.isSearchOpen.set(false);
      this.searchResults.set([]);
      return;
    }

    this.isSearchOpen.set(true);
    const results = this.allFlatRoutes.filter(route => 
      route.label.toLowerCase().includes(q) || 
      route.category.toLowerCase().includes(q)
    );
    this.searchResults.set(results);
  }

  closeSettings() {
    this.router.navigate(['/self-service']);
  }
}

