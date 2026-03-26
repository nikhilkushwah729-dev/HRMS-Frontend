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
        <div class="p-6 space-y-6">
            <!-- Header -->
            <div class="app-module-hero flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
                <div class="max-w-2xl">
                    <p class="app-module-kicker">Access Control</p>
                    <h1 class="app-module-title mt-3">Roles and permission governance</h1>
                    <p class="app-module-text mt-3">Manage role definitions, assign permission bundles, and keep access boundaries organized for the whole HRMS.</p>
                </div>
                <div class="flex flex-col gap-3 xl:items-end">
                    <div class="app-module-highlight min-w-[240px]">
                        <span class="app-module-highlight-label">Roles available</span>
                        <div class="app-module-highlight-value mt-3">{{ roles.length }}</div>
                        <p class="mt-2 text-sm text-white/80">Configured role profiles currently available inside the permission system.</p>
                    </div>
                <button (click)="openModal()" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-md flex items-center gap-2 font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Add Role
                </button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="app-chip-switch">
                <nav class="flex flex-wrap gap-2">
                    <button (click)="activeTab = 'roles'" 
                        [class]="activeTab === 'roles' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:bg-stone-100'"
                        class="app-chip-button whitespace-nowrap">
                        Roles
                    </button>
                    <button (click)="activeTab = 'permissions'; loadPermissions();" 
                        [class]="activeTab === 'permissions' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500 hover:bg-stone-100'"
                        class="app-chip-button whitespace-nowrap">
                        Permissions
                    </button>
                </nav>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading" class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>

            <!-- Roles Tab -->
            <div *ngIf="!loading && activeTab === 'roles'" class="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr *ngFor="let role of roles" class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <span class="font-medium text-gray-900">{{ role.name }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                {{ role.description || '-' }}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                <span class="px-2 py-1 bg-gray-100 rounded text-xs">
                                    {{ role.permissions?.length || 0 }} permissions
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span *ngIf="role.isDefault" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Default
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <button (click)="editRole(role)" class="text-blue-600 hover:text-blue-900 mr-3">
                                    Edit
                                </button>
                            </td>
                        </tr>
                        <tr *ngIf="roles.length === 0">
                            <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                                No roles found
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Permissions Tab -->
            <div *ngIf="!loading && activeTab === 'permissions'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div *ngFor="let module of permissionModules" class="bg-white rounded-md shadow-sm border border-gray-200 p-4">
                    <h3 class="font-semibold text-gray-800 mb-4 capitalize">{{ module }}</h3>
                    <div class="space-y-2">
                        <div *ngFor="let perm of permissionsByModule[module]" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div>
                                <p class="text-sm font-medium text-gray-900">{{ perm.name }}</p>
                                <p class="text-xs text-gray-500">{{ perm.description }}</p>
                            </div>
                            <span class="text-xs text-gray-400">{{ perm.slug }}</span>
                        </div>
                    </div>
                </div>
                <div *ngIf="getPermissionModuleCount() === 0" class="col-span-full text-center py-12 text-gray-500">
                    No permissions found
                </div>
            </div>
        </div>

        <!-- Modal -->
        <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-md shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div class="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
                    <h3 class="text-lg font-semibold text-gray-800">
                        {{ editingId ? 'Edit' : 'Add' }} Role
                    </h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                            <input type="text" [(ngModel)]="formData.name" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Manager">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea [(ngModel)]="formData.description" rows="2"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Role description"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                            <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                <div *ngFor="let module of permissionModules" class="border-b border-gray-100 pb-2 last:border-0">
                                    <h4 class="text-sm font-medium text-gray-600 capitalize mb-2">{{ module }}</h4>
                                    <div class="space-y-1 ml-2">
                                        <label *ngFor="let perm of permissionsByModule[module]" class="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" 
                                                [checked]="isPermissionSelected(perm.id)"
                                                (change)="togglePermission(perm.id)"
                                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                            <span class="text-sm text-gray-700">{{ perm.name }}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                    <button (click)="closeModal()" 
                        class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
                        Cancel
                    </button>
                    <button (click)="saveRole()" [disabled]="saving || !formData.name"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
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

}

