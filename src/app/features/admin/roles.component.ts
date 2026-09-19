import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService, Role, Permission } from '../../core/services/role.service';
import { ToastService } from '../../core/services/toast.service';

declare const Object: any;

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="space-y-6 p-6">
            <section class="rounded-[28px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eff6ff_100%)] p-6 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.34)]">
                <div class="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div class="max-w-3xl">
                        <p class="text-[11px] font-black uppercase tracking-[0.24em] text-sky-700">Access Governance</p>
                        <h1 class="mt-3 text-3xl font-black tracking-tight text-slate-950">Permission audit and role control</h1>
                        <p class="mt-3 text-sm leading-6 text-slate-600">
                            Review role definitions, permission coverage, and module access from one cleaner workspace so access changes stay easy to understand and audit.
                        </p>
                    </div>
                    <div class="flex flex-col gap-3 xl:items-end">
                        <button
                            (click)="openModal()"
                            class="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                            </svg>
                            Add Role
                        </button>
                        <p class="text-xs font-semibold text-slate-500">Role updates are meant to stay explicit, reviewable, and audit-friendly.</p>
                    </div>
                </div>

                <div class="mt-6 grid gap-4 md:grid-cols-3">
                    <article class="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Roles</p>
                        <p class="mt-2 text-3xl font-black text-slate-950">{{ roles.length }}</p>
                        <p class="mt-1 text-sm text-slate-500">Total role profiles available in this workspace.</p>
                    </article>
                    <article class="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm">
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700/70">Editable Roles</p>
                        <p class="mt-2 text-3xl font-black text-emerald-800">{{ editableRoleCount() }}</p>
                        <p class="mt-1 text-sm text-emerald-700/80">Organization-owned roles that can be adjusted here.</p>
                    </article>
                    <article class="rounded-2xl border border-sky-200 bg-sky-50/90 p-4 shadow-sm">
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-sky-700/70">Permission Catalog</p>
                        <p class="mt-2 text-3xl font-black text-sky-800">{{ permissions.length }}</p>
                        <p class="mt-1 text-sm text-sky-700/80">{{ governedModuleCount() }} modules currently mapped to access control.</p>
                    </article>
                </div>
            </section>

            <section class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div class="flex flex-wrap gap-2">
                    <button
                        (click)="activeTab = 'roles'"
                        [class]="activeTab === 'roles' ? 'bg-slate-950 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                        class="rounded-xl px-4 py-2 text-sm font-black transition"
                    >
                        Role Matrix
                    </button>
                    <button
                        (click)="activeTab = 'permissions'; loadPermissions()"
                        [class]="activeTab === 'permissions' ? 'bg-slate-950 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                        class="rounded-xl px-4 py-2 text-sm font-black transition"
                    >
                        Permission Catalog
                    </button>
                </div>
            </section>

            <div *ngIf="loading" class="flex justify-center items-center py-16">
                <div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600"></div>
            </div>

            <section *ngIf="!loading && activeTab === 'roles'" class="space-y-5">
                <div *ngIf="roles.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                    No roles found
                </div>

                <div *ngIf="roles.length > 0" class="grid gap-5 xl:grid-cols-2">
                    <article *ngFor="let role of roles" class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/60">
                        <div class="flex items-start justify-between gap-4">
                            <div class="min-w-0">
                                <div class="flex flex-wrap items-center gap-2">
                                    <h2 class="text-xl font-black text-slate-950">{{ role.name }}</h2>
                                    <span *ngIf="role.isDefault" class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Default</span>
                                    <span *ngIf="role.isSystem" class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">System</span>
                                </div>
                                <p class="mt-2 text-sm leading-6 text-slate-500">{{ role.description || 'No description added for this role yet.' }}</p>
                            </div>
                            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                                <p class="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Permissions</p>
                                <p class="mt-1 text-2xl font-black text-slate-900">{{ role.permissions?.length || 0 }}</p>
                            </div>
                        </div>

                        <div class="mt-5 flex flex-wrap gap-2">
                            <span class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                                {{ canEditRole(role) ? 'Editable in org scope' : 'Read-only role' }}
                            </span>
                            <span class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                                {{ getRolePermissionSummary(role) }}
                            </span>
                        </div>

                        <div class="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                            <div class="flex items-center justify-between gap-3">
                                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Permission Preview</p>
                                <span class="text-[11px] font-bold text-slate-500">{{ getRolePreviewPermissions(role).length }} shown</span>
                            </div>
                            <div class="mt-3 flex flex-wrap gap-2">
                                <span *ngFor="let permission of getRolePreviewPermissions(role)" class="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-[11px] font-bold text-sky-700">
                                    {{ permission }}
                                </span>
                                <span *ngIf="getRolePreviewPermissions(role).length === 0" class="text-sm text-slate-400">
                                    Detailed permission labels will appear after the catalog loads.
                                </span>
                            </div>
                        </div>

                        <div class="mt-5 flex items-center justify-between gap-3">
                            <p class="text-xs text-slate-400">
                                {{ role.updatedAt ? ('Updated ' + (role.updatedAt | date:'medium')) : 'No recent update timestamp available' }}
                            </p>
                            <button
                                (click)="editRole(role)"
                                [disabled]="!canEditRole(role)"
                                [class]="canEditRole(role) ? 'bg-slate-950 text-white hover:bg-sky-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'"
                                class="rounded-xl px-4 py-2 text-sm font-black transition"
                            >
                                Edit Role
                            </button>
                        </div>
                    </article>
                </div>
            </section>

            <section *ngIf="!loading && activeTab === 'permissions'" class="space-y-5">
                <div class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Catalog Filters</p>
                            <h2 class="mt-2 text-xl font-black text-slate-950">Review permissions by module</h2>
                            <p class="mt-1 text-sm text-slate-500">Search module access keys and quickly narrow the catalog before editing any role.</p>
                        </div>
                        <div class="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
                            <input
                                [(ngModel)]="permissionSearchQuery"
                                type="text"
                                placeholder="Search permission name or key"
                                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-300 xl:w-80"
                            />
                            <select
                                [(ngModel)]="selectedPermissionModule"
                                class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-300"
                            >
                                <option value="all">All Modules</option>
                                <option *ngFor="let module of permissionModules" [value]="module">{{ formatModuleLabel(module) }}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div *ngIf="filteredPermissionModules().length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                    No permissions found for the current filter.
                </div>

                <div *ngIf="filteredPermissionModules().length > 0" class="grid gap-5 xl:grid-cols-2">
                    <article *ngFor="let module of filteredPermissionModules()" class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Module</p>
                                <h3 class="mt-2 text-xl font-black text-slate-950">{{ formatModuleLabel(module) }}</h3>
                                <p class="mt-1 text-sm text-slate-500">{{ getModulePermissionCount(module) }} permissions available in this access area.</p>
                            </div>
                            <div class="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-center">
                                <p class="text-[10px] font-black uppercase tracking-[0.16em] text-sky-600">Count</p>
                                <p class="mt-1 text-2xl font-black text-sky-800">{{ getModulePermissionCount(module) }}</p>
                            </div>
                        </div>

                        <div class="mt-4 space-y-3">
                            <div *ngFor="let perm of filteredPermissionsForModule(module)" class="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                                <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0">
                                        <p class="text-sm font-black text-slate-900">{{ perm.name }}</p>
                                        <p class="mt-1 text-xs leading-5 text-slate-500">{{ perm.description || 'No description available.' }}</p>
                                    </div>
                                    <span class="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                                        {{ perm.slug }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </div>

        <!-- Modal -->
        <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-white/70 bg-white shadow-2xl">
                <div class="border-b border-slate-200 bg-white px-6 py-5">
                    <h3 class="text-xl font-black text-slate-900">
                        {{ editingId ? 'Edit' : 'Add' }} Role
                    </h3>
                    <p class="mt-1 text-sm text-slate-500">Choose the role name and permission bundle carefully so future audit entries remain easy to review.</p>
                </div>
                <div class="p-6">
                    <div class="space-y-5">
                        <div>
                            <label class="mb-1 block text-sm font-bold text-slate-700">Role Name *</label>
                            <input type="text" [(ngModel)]="formData.name" required
                                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300"
                                placeholder="e.g., Manager">
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-bold text-slate-700">Description</label>
                            <textarea [(ngModel)]="formData.description" rows="2"
                                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300"
                                placeholder="Role description"></textarea>
                        </div>
                        <div>
                            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                                <label class="block text-sm font-bold text-slate-700">Permissions</label>
                                <div class="flex flex-wrap gap-2">
                                    <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-600">
                                        Selected {{ formData.permissions.length }}
                                    </span>
                                </div>
                            </div>
                            <div class="max-h-[28rem] overflow-y-auto rounded-[24px] border border-slate-200 p-4 space-y-4">
                                <div *ngFor="let module of permissionModules" class="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                                    <div class="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h4 class="text-sm font-black capitalize text-slate-800">{{ formatModuleLabel(module) }}</h4>
                                            <p class="mt-1 text-xs text-slate-500">{{ getModulePermissionCount(module) }} permissions in this module.</p>
                                        </div>
                                        <div class="flex gap-2">
                                            <button type="button" (click)="selectAllPermissionsForModule(module)"
                                                class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700 transition hover:bg-emerald-100">
                                                Select All
                                            </button>
                                            <button type="button" (click)="clearPermissionsForModule(module)"
                                                class="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-black text-rose-700 transition hover:bg-rose-100">
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                    <div class="mt-3 grid gap-2 md:grid-cols-2">
                                        <label *ngFor="let perm of permissionsByModule[module]" class="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" 
                                                [checked]="isPermissionSelected(perm.id)"
                                                (change)="togglePermission(perm.id)"
                                                class="rounded border-slate-300 text-sky-600 focus:ring-sky-500">
                                            <span class="text-sm font-semibold text-slate-700">{{ perm.name }}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <button (click)="closeModal()" 
                        class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                        Cancel
                    </button>
                    <button (click)="saveRole()" [disabled]="saving || !formData.name"
                        class="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-sky-700 disabled:opacity-50">
                        {{ saving ? 'Saving...' : 'Save' }}
                    </button>
                </div>
            </div>
        </div>
    `
})
export class RolesComponent implements OnInit {
    private roleService = inject(RoleService);
    private toastService = inject(ToastService);

    roles: Role[] = [];
    permissions: Permission[] = [];
    permissionsByModule: { [key: string]: Permission[] } = {};
    loading = false;
    saving = false;
    showModal = false;
    editingId: number | null = null;
    activeTab = 'roles';
    permissionSearchQuery = '';
    selectedPermissionModule = 'all';

    formData = {
        name: '',
        description: '',
            permissions: [] as number[]
    };

    get permissionModules(): string[] {
        return Object.keys(this.permissionsByModule);
    }

    get permissionModuleKeys(): string[] {
        return Object.keys(this.permissionsByModule);
    }

    getPermissionModuleCount(): number {
        return Object.keys(this.permissionsByModule).length;
    }

    editableRoleCount(): number {
        return this.roles.filter((role) => this.canEditRole(role)).length;
    }

    governedModuleCount(): number {
        return this.permissionModules.length;
    }

    ngOnInit() {
        this.loadRoles();
    }

    loadRoles() {
        this.loading = true;
        this.roleService.getRoles().subscribe({
            next: (data) => {
                this.roles = data;
                this.loading = false;
            },
            error: () => {
                this.toastService.error('Failed to load roles');
                this.loading = false;
            }
        });
    }

    loadPermissions() {
        if (this.permissions.length > 0) return;
        
        this.roleService.getPermissions().subscribe({
            next: (data) => {
                this.permissions = data;
                this.permissionsByModule = this.groupByModule(data);
            },
            error: () => {
                this.toastService.error('Failed to load permissions');
            }
        });
    }

    groupByModule(permissions: Permission[]): { [key: string]: Permission[] } {
        const grouped: { [key: string]: Permission[] } = {};
        permissions.forEach(perm => {
            if (!grouped[perm.module]) {
                grouped[perm.module] = [];
            }
            grouped[perm.module].push(perm);
        });
        return grouped;
    }

    formatModuleLabel(module: string): string {
        return module
            .replace(/[_-]+/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    getModulePermissionCount(module: string): number {
        return this.filteredPermissionsForModule(module).length;
    }

    filteredPermissionModules(): string[] {
        const search = this.permissionSearchQuery.trim().toLowerCase();
        return this.permissionModules.filter((module) => {
            if (this.selectedPermissionModule !== 'all' && module !== this.selectedPermissionModule) {
                return false;
            }

            const permissions = this.permissionsByModule[module] || [];
            if (!search) {
                return permissions.length > 0;
            }

            return permissions.some((permission) =>
                `${permission.name} ${permission.slug} ${permission.description || ''}`
                    .toLowerCase()
                    .includes(search)
            );
        });
    }

    filteredPermissionsForModule(module: string): Permission[] {
        const permissions = this.permissionsByModule[module] || [];
        const search = this.permissionSearchQuery.trim().toLowerCase();
        if (!search) {
            return permissions;
        }

        return permissions.filter((permission) =>
            `${permission.name} ${permission.slug} ${permission.description || ''}`
                .toLowerCase()
                .includes(search)
        );
    }

    getRolePreviewPermissions(role: Role): string[] {
        const permissionIds = (role.permissions || [])
            .map((permission) => Number(permission))
            .filter((permission) => !Number.isNaN(permission));

        const labels = permissionIds
            .map((permissionId) => this.permissions.find((item) => item.id === permissionId)?.name)
            .filter((permission): permission is string => !!permission);

        return labels.slice(0, 6);
    }

    getRolePermissionSummary(role: Role): string {
        if (!role.permissions?.length) return 'No permissions assigned';
        if (role.permissions.length === 1) return '1 permission assigned';
        return `${role.permissions.length} permissions assigned`;
    }

    openModal() {
        this.loadPermissions();
        this.editingId = null;
        this.formData = {
            name: '',
            description: '',
            permissions: []
        };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    editRole(role: Role) {
        if (!this.canEditRole(role)) {
            this.toastService.info('System or global roles are read-only here.');
            return;
        }
        this.loadPermissions();
        this.editingId = role.id;
        this.formData = {
            name: role.name,
            description: role.description || '',
            permissions: (role.permissions || []).map((permission) => Number(permission)).filter((permission) => !Number.isNaN(permission))
        };
        this.showModal = true;
    }

    isPermissionSelected(permissionId: number): boolean {
        return this.formData.permissions.includes(permissionId);
    }

    togglePermission(permissionId: number) {
        const index = this.formData.permissions.indexOf(permissionId);
        if (index > -1) {
            this.formData.permissions.splice(index, 1);
        } else {
            this.formData.permissions.push(permissionId);
        }
    }

    selectAllPermissionsForModule(module: string) {
        const modulePermissionIds = (this.permissionsByModule[module] || []).map((permission) => permission.id);
        this.formData.permissions = Array.from(new Set([...this.formData.permissions, ...modulePermissionIds]));
    }

    clearPermissionsForModule(module: string) {
        const modulePermissionIds = new Set((this.permissionsByModule[module] || []).map((permission) => permission.id));
        this.formData.permissions = this.formData.permissions.filter((permissionId) => !modulePermissionIds.has(permissionId));
    }

    saveRole() {
        if (!this.formData.name) {
            this.toastService.error('Please enter a role name');
            return;
        }

        this.saving = true;
        const data = {
            name: this.formData.name,
            description: this.formData.description,
            permissions: this.formData.permissions
        };

        const operation = this.editingId
            ? this.roleService.updateRole(this.editingId, data)
            : this.roleService.createRole(data);

        operation.subscribe({
            next: () => {
                this.toastService.success(`Role ${this.editingId ? 'updated' : 'created'} successfully`);
                this.saving = false;
                this.closeModal();
                this.loadRoles();
            },
            error: () => {
                this.toastService.error(`Failed to ${this.editingId ? 'update' : 'create'} role`);
                this.saving = false;
            }
        });
    }

    canEditRole(role: Role): boolean {
        return !role.isSystem && role.orgId !== null && role.orgId !== undefined;
    }

}

