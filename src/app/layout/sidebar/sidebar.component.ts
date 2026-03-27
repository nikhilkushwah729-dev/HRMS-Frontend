import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectUser } from '../../core/state/auth/auth.selectors';
import { LayoutService } from '../../core/services/layout.service';
import { Organization, OrganizationService } from '../../core/services/organization.service';
import { AuthService } from '../../core/services/auth.service';
import { PermissionService } from '../../core/services/permission.service';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="layoutService.sidebarOpen()" (click)="layoutService.toggleSidebar()" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"></div>

    <aside [class.translate-x-0]="layoutService.sidebarOpen()" [class.-translate-x-full]="!layoutService.sidebarOpen()"
      class="app-sidebar-surface fixed lg:static inset-y-0 left-0 w-[85vw] max-w-[280px] h-screen flex flex-col overflow-hidden z-50 transition-transform duration-500 lg:translate-x-0 border-r border-white-[0.03] bg-[#0B1120] shadow-[10px_0_30px_-15px_rgba(0,0,0,0.5)]">

        <!-- Top Product Branding (HRNexus) -->
        <div class="px-6 pt-8 pb-6">
          <div class="flex flex-col gap-4">
             <div class="flex items-center gap-3 group cursor-pointer">
               <div class="relative rounded-xl overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-transform duration-500 group-hover:scale-105 border border-white/5">
                 <img src="hrnexus-logo.png" alt="HRNexus" class="h-10 w-auto object-contain">
               </div>
               <div class="flex flex-col">
                 <span class="text-sm font-black text-white tracking-widest uppercase" style="font-family: 'Sora', sans-serif;">HRNexus</span>
                 <span class="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.3em]">Technology</span>
               </div>
             </div>
          </div>
        </div>

        <!-- Client Organization Card -->
        <div class="px-4 mb-6">
          <div class="p-5 rounded-xl bg-white/[0.03] border border-white/[0.05] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md transform transition-all duration-300 hover:bg-white/[0.05] group">
            <div class="flex items-center gap-4">
              <div class="relative">
                <div class="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                 <div class="relative w-14 h-14 rounded-lg overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    @if (hasOrgLogo()) {
                      <img [src]="orgLogo()" [alt]="orgName() || 'Organization Logo'" class="w-full h-full object-cover" (error)="onOrgLogoError()">
                    } @else {
                      <span class="text-xl font-black text-emerald-200">{{ orgInitial() }}</span>
                    }
                </div>
              </div>
              <div class="flex flex-col min-w-0">
                <p class="text-[9px] font-extrabold text-emerald-500/80 uppercase tracking-[0.2em] mb-1">Active Space</p>
                @if (isOrgLoading()) {
                  <div class="h-5 bg-white/5 rounded-full animate-pulse w-24"></div>
                } @else {
                  <h2 class="text-base font-black text-white truncate leading-tight tracking-tight" title="{{ orgName() || 'Enterprise' }}">{{ orgName() || 'Enterprise' }}</h2>
                }
              </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Premium Plan</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </div>
        </div>

        <!-- User Identification -->
        <div class="px-4 pb-6 border-b border-white/[0.03]">
          <div class="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors cursor-pointer group">
            <div class="relative">
               <div class="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-indigo-300 font-black text-xs shadow-inner">
                @if (currentUser()?.avatar) {
                   <img [src]="currentUser()?.avatar" class="w-full h-full object-cover">
                } @else {
                  {{ userInitials() }}
                }
              </div>
              <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0B1120] rounded-full"></div>
            </div>
            <div class="min-w-0 flex-1">
              @if (isUserLoading()) {
                <div class="space-y-1">
                  <div class="h-4 bg-white/5 rounded animate-pulse w-20"></div>
                  <div class="h-3 bg-white/5 rounded animate-pulse w-16 mt-1"></div>
                </div>
              } @else {
                <p class="text-xs font-black text-white truncate tracking-tight group-hover:text-indigo-300 transition-colors" title="{{ userName() }}">{{ userName() }}</p>
                <p class="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">{{ userRole() }}</p>
              }
            </div>
          </div>
        </div>

      <nav role="navigation" aria-label="Main navigation" class="flex-1 px-4 py-8 space-y-6 overflow-y-auto custom-scrollbar scroll-smooth">
        <!-- Main Navigation -->
        <div>
          <button type="button" class="app-nav-section-trigger group" (click)="toggleSection('main')" [attr.aria-expanded]="isSectionExpanded('main') | json" aria-label="Toggle Workspace section">
            <div class="flex items-center gap-3">
              <span class="app-nav-section-title">Workspace</span>
              <span class="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-[8px] font-black text-indigo-400 border border-indigo-500/20 uppercase tracking-tighter">Core</span>
            </div>
            <div class="app-nav-section-chevron transition-transform duration-300 opacity-30 group-hover:opacity-100" [class.rotate-180]="isSectionExpanded('main')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </button>
@if (isSectionExpanded('main')) {
            <div class="app-nav-section-content mt-2 space-y-1" open>
              @if (canAccess('/self-service')) {
                <a routerLink="" routerLinkActive="app-nav-link-active" (click)="closeOnMobile()" class="app-nav-link group">
                  <div class="app-nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                  </div>
                  <span>Dashboard</span>
                </a>
              }
              <a routerLink="/add-ons" routerLinkActive="app-nav-link-active" (click)="closeOnMobile()" class="app-nav-link group">
                <div class="app-nav-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <span>Marketplace</span>
              </a>
            </div>
          }
        </div>

        <!-- People Management -->
        <div>
          <button type="button" class="app-nav-section-trigger group" (click)="toggleSection('employees')" [attr.aria-expanded]="isSectionExpanded('employees') | json" aria-label="Toggle People section">
             <div class="flex items-center gap-3">
              <span class="app-nav-section-title">People</span>
            </div>
            <div class="app-nav-section-chevron transition-transform duration-300 opacity-30 group-hover:opacity-100" [class.rotate-180]="isSectionExpanded('employees')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </button>
@if (isSectionExpanded('employees')) {
            <div class="app-nav-section-content mt-2 space-y-1" open>
              @if (canAccess('/employees')) {
                <a routerLink="/employees" routerLinkActive="app-nav-link-active" (click)="closeOnMobile()" class="app-nav-link group">
                  <div class="app-nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <span>Directory</span>
                </a>
              }
              @if (canAccess('/employees/invitations')) {
                <a routerLink="/employees/invitations" routerLinkActive="app-nav-link-active" (click)="closeOnMobile()" class="app-nav-link group">
                  <div class="app-nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
                  </div>
                  <span>Invitations</span>
                </a>
              }
              <a routerLink="/visit-management" routerLinkActive="app-nav-link-active" (click)="closeOnMobile()" class="app-nav-link group">
                <div class="app-nav-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16h16V8l-6-6z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                </div>
                <span>Visitors</span>
              </a>
            </div>
          }
        </div>

        <!-- Operations -->
        <div>
          <button type="button" class="app-nav-section-trigger group" (click)="toggleSection('attendance')" [attr.aria-expanded]="isSectionExpanded('attendance') | json" aria-label="Toggle Ops & Time section">
            <div class="flex items-center gap-3">
              <span class="app-nav-section-title">Ops & Time</span>
            </div>
            <div class="app-nav-section-chevron transition-transform duration-300 opacity-30 group-hover:opacity-100" [class.rotate-180]="isSectionExpanded('attendance')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </button>
@if (isSectionExpanded('attendance')) {
            <div class="app-nav-section-content mt-2 space-y-1" open>
              @if (isModuleActive('attendance') && canAccess('/attendance')) {
                <a routerLink="/attendance" routerLinkActive="app-nav-link-active" (click)="closeOnMobile()" class="app-nav-link group">
                  <div class="app-nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                  </div>
                  <span>Attendance</span>
                </a>
              }
              @if (canAccess('/leaves')) {
                <a routerLink="/leaves" routerLinkActive="app-nav-link-active" (click)="closeOnMobile()" class="app-nav-link group">
                  <div class="app-nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <span>Leave Admin</span>
                </a>
              }
            </div>
          }
        </div>

        <!-- System & Config -->
        <div>
          <button type="button" class="app-nav-section-trigger group" (click)="toggleSection('security')" [attr.aria-expanded]="isSectionExpanded('security') | json" aria-label="Toggle System section">
             <div class="flex items-center gap-3">
              <span class="app-nav-section-title">System</span>
            </div>
            <div class="app-nav-section-chevron transition-transform duration-300 opacity-30 group-hover:opacity-100" [class.rotate-180]="isSectionExpanded('security')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </button>
@if (isSectionExpanded('security')) {
            <div class="app-nav-section-content mt-2 space-y-1" open>
              @if (canAccess('/admin/audit')) {
                <a routerLink="/admin/audit" routerLinkActive="app-nav-link-active" (click)="closeOnMobile()" class="app-nav-link group">
                  <div class="app-nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
                  </div>
                  <span>Audit Logs</span>
                </a>
              }
              @if (canAccess('/settings')) {
                <a routerLink="/settings" routerLinkActive="app-nav-link-active" (click)="closeOnMobile()" class="app-nav-link group">
                  <div class="app-nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  </div>
                  <span>Settings</span>
                </a>
           }
            </div>
          }
        </div>    <!-- ← closes the System section wrapper <div> -->
      </nav>

      <div class="p-4 md:p-6 border-t border-white/5 opacity-50">
        <p class="text-[8px] text-center text-slate-500 uppercase tracking-widest">&copy; 2026 HRNexus Technology</p>
      </div>
    </aside>
  `,
  styles: [`
    .app-sidebar-surface {
      background: linear-gradient(180deg, #0F172A 0%, #0B1120 100%);
      box-shadow: 1px 0 0 0 rgba(255,255,255,0.05);
    }

    .app-nav-link {
      display: flex;
      items-center: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      color: #94A3B8;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 4px;
    }

    .app-nav-link {
      position: relative;
      overflow: hidden;
    }
    
    .app-nav-link::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      transition: left 0.6s;
    }
    
    .app-nav-link:hover::before {
      left: 100%;
    }
    
    .app-nav-link:hover {
      background: rgba(255,255,255,0.03);
      color: #F8FAFC;
      transform: translateX(4px);
    }

    .app-nav-link-active {
      background: linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 100%);
      color: #818CF8 !important;
      font-weight: 700;
      border-left: 2px solid #6366F1;
    }

    .app-nav-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    .app-nav-link:hover .app-nav-icon,
    .app-nav-link-active .app-nav-icon {
      opacity: 1;
      color: inherit;
    }

    .app-nav-section-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.2s ease;
    }

    .app-nav-section-trigger {
      overflow: hidden;
    }
    
    .app-nav-section-trigger:hover {
      background: rgba(255,255,255,0.02);
    }
    
    .app-nav-section-content {
      overflow: hidden;
      transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
      max-height: 0;
      opacity: 0;
    }
    
    .app-nav-section-content[open] {
      max-height: 500px;
      opacity: 1;
    }

    .app-nav-section-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #475569;
    }

    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
  `]
})
export class SidebarComponent implements OnInit {
  layoutService = inject(LayoutService);
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  currentUser = signal<User | null>(null);
  orgName = signal<string>('');
  orgLogo = signal<string>('');
  hasOrgLogo = computed(() => Boolean(this.orgLogo().trim()));
  private expandedSections = signal<Record<string, boolean>>({
    main: true,
    employees: false,
    attendance: true,
    payroll: false,
    productivity: false,
    security: false,
  });
  public isUserLoading = signal(true);
  public isOrgLoading = signal(true);
  private store = inject(Store);
  private user$ = this.store.select(selectUser);

  ngOnInit() {
    this.currentUser.set(this.authService.getStoredUser());
    this.isUserLoading.set(false);
    
    this.user$.subscribe(user => {
      if (user) {
        this.currentUser.set(user);
      }
    });
    
    this.orgService.getOrganization().subscribe((org) => {
      this.setOrganizationBranding(org);
      this.isOrgLoading.set(false);
    });
    this.orgService.getAddons().subscribe();
  }

  private setOrganizationBranding(org: Organization | null | undefined) {
    this.orgName.set((org?.name || '').trim());
    this.orgLogo.set((org?.logo || '').trim());
  }

  toggleSection(section: string) {
    this.expandedSections.update((state) => ({
      ...state,
      [section]: !state[section]
    }));
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSections()[section] ?? false;
  }

  isModuleActive(slug: string): boolean {
    return this.orgService.activeModules().includes(slug);
  }

  activeModuleCount(): number {
    return this.orgService.activeModules().length;
  }

  canAccess(route: string): boolean {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    return this.permissionService.canAccessRoute(user, route);
  }

  userName(): string {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    if (!user) return 'Workspace User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Workspace User';
  }

  userRole(): string {
    const roleId = (this.currentUser() ?? this.authService.getStoredUser())?.roleId;
    switch (roleId) {
      case 1:
        return 'Administrator';
      case 2:
        return 'HR Manager';
      case 3:
        return 'Team Manager';
      default:
        return 'Employee';
    }
  }

  userInitials(): string {
    const user = this.currentUser() ?? this.authService.getStoredUser();
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return (first + last || user?.email?.charAt(0) || 'U').toUpperCase();
  }

  orgInitial(): string {
    const source = this.orgName().trim();
    return (source.charAt(0) || 'E').toUpperCase();
  }

  onOrgLogoError() {
    this.orgLogo.set('');
  }

  closeOnMobile() {
    if (window.innerWidth < 1024) {
      this.layoutService.closeSidebar();
    }
  }
}
