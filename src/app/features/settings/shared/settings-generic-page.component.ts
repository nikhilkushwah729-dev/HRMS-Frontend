import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { SettingsFieldConfig, SettingsPageConfig } from './settings-page.types';
import { SettingsWorkspaceService } from './settings-workspace.service';
import { LanguageService } from '../../../core/services/language.service';
import { PermissionService } from '../../../core/services/permission.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings-generic-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6">
      <section class="app-module-hero overflow-hidden">
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div class="space-y-5">
            <div>
              <p class="app-module-kicker">{{ config().kicker }}</p>
              <h1 class="app-module-title">{{ config().title }}</h1>
              <p class="app-module-text max-w-2xl">{{ config().description }}</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{{ config().primaryMetricLabel || t('common.configuredItems') }}</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ items().length }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ t('common.savedRecords') }}</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('common.active') }}</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ activeCount() }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ t('common.enabledRightNow') }}</p>
              </div>
              <div class="rounded-md border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
                <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{{ t('common.fields') }}</p>
                <p class="mt-2 text-2xl font-black text-slate-900">{{ config().fields.length }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ t('common.configurationInputs') }}</p>
              </div>
            </div>
          </div>

          <div class="app-module-highlight">
            <p class="app-module-highlight-label">{{ t('common.editorStatus') }}</p>
            <p class="mt-3 app-module-highlight-value">
              {{ editingId() ? t('common.editing') : t('common.ready') }}
            </p>
            <p class="mt-3 text-sm leading-6 text-slate-600">
              {{ editingId() ? t('common.editing') + ' ' + config().itemName : t('common.create') + ' ' + config().itemName }}
            </p>
            <div class="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {{ t('common.quickAttributesVisible', { count: secondaryFields().length }) }}
            </div>
            <div class="mt-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
              {{ t('common.sharedWorkspaceSettings') }}
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section class="app-surface-card overflow-hidden">
          <div class="border-b border-slate-100 px-6 py-5">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ editingId() ? t('common.update') : t('common.create') }} {{ config().itemName }}</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">{{ t('common.configurationEditor') }}</h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              {{ t('common.configurationEditorHelp') }}
            </p>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-5 px-6 py-6">
            <div class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p class="font-bold">{{ t('common.quickNote') }}</p>
              <p class="mt-1 leading-6">{{ t('common.sharedSettingsNote') }}</p>
            </div>

            @for (field of config().fields; track field.key) {
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-3">
                  <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{{ field.label }}</label>
                  @if (field.required) {
                    <span class="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600">{{ t('common.required') }}</span>
                  }
                </div>

                @switch (field.type) {
                  @case ('textarea') {
                    <textarea [formControlName]="field.key" rows="4" class="app-field resize-none" [placeholder]="field.placeholder || ''" [readonly]="!canEditSettings()"></textarea>
                  }
                  @case ('number') {
                    <input type="number" [formControlName]="field.key" class="app-field" [placeholder]="field.placeholder || ''" [readonly]="!canEditSettings()" />
                  }
                  @case ('toggle') {
                    <label class="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                      <input type="checkbox" [formControlName]="field.key" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500" [disabled]="!canEditSettings()" />
                      {{ t('common.enable') }} {{ field.label.toLowerCase() }}
                    </label>
                  }
                  @case ('select') {
                    <select [formControlName]="field.key" class="app-field" [disabled]="!canEditSettings()">
                      <option value="">{{ t('common.selectField', { field: field.label }) }}</option>
                      @for (option of field.options || []; track option.value) {
                        <option [value]="option.value">{{ option.label }}</option>
                      }
                    </select>
                  }
                  @default {
                    <input type="text" [formControlName]="field.key" class="app-field" [placeholder]="field.placeholder || ''" [readonly]="!canEditSettings()" />
                  }
                }
              </div>
            }

            <div class="grid gap-3 sm:grid-cols-2">
              <button type="submit" [disabled]="form.invalid || !canEditSettings()" class="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                {{ editingId() ? t('common.update') : t('common.save') }} {{ config().itemName }}
              </button>
              <button type="button" (click)="reset()" [disabled]="!canEditSettings()" class="rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                {{ t('common.reset') }}
              </button>
            </div>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('common.configuredItems') }}</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">{{ t('common.directory') }}</h2>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  Browse and update existing records quickly. Search works across every visible value on the card.
                </p>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" [placeholder]="t('common.searchItems', { itemName: config().itemName })" />
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (item of filteredItems(); track item['id']) {
              <article class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-3">
                    <p class="text-lg font-black text-slate-900">{{ item[primaryLabelKey()] || item['name'] || config().itemName }}</p>
                    <span class="rounded-full px-3 py-1 text-xs font-semibold"
                      [ngClass]="isItemActive(item) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                      {{ isItemActive(item) ? t('common.active') : t('common.inactive') }}
                    </span>
                  </div>
              <div class="mt-2 flex flex-wrap gap-2">
                    @for (field of secondaryFields(); track field.key) {
                      @if (displayValue(item, field)) {
                        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {{ field.label }}: {{ displayValue(item, field) }}
                        </span>
                      }
                    }
                  </div>
                  <p class="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {{ t('common.itemRecord', { itemName: config().itemName }) }}
                  </p>
                </div>
                @if (canEditSettings()) {
                  <div class="flex gap-3">
                    <button type="button" (click)="edit(item)" class="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{{ t('common.edit') }}</button>
                    <button type="button" (click)="remove(item['id'])" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">{{ t('common.delete') }}</button>
                  </div>
                }
              </article>
            } @empty {
              <div class="px-6 py-16 text-center">
                <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                </div>
                <p class="mt-4 text-base font-semibold text-slate-900">{{ t('common.noItemRecordsYet', { itemName: config().itemName }) }}</p>
                <p class="mt-2 text-sm text-slate-500">{{ config().emptyState }}</p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class SettingsGenericPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly workspace = inject(SettingsWorkspaceService);
  private readonly languageService = inject(LanguageService);
  private readonly permissionService = inject(PermissionService);
  private readonly authService = inject(AuthService);

  config = signal<SettingsPageConfig>({
    storageKey: 'hrms_generic_page',
    title: 'Settings',
    kicker: 'System Settings',
    description: '',
    itemName: 'item',
    emptyState: 'No records found.',
    fields: [],
    seedItems: [],
  });
  items = signal<Record<string, any>[]>([]);
  editingId = signal<string | null>(null);
  searchQuery = signal('');
  form = this.fb.group({});

  filteredItems = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.items();
    return this.items().filter((item) =>
      JSON.stringify(item).toLowerCase().includes(query)
    );
  });

  activeCount = computed(() =>
    this.items().filter((item) => Boolean(item['active'] ?? item['enabled'] ?? item['published'] ?? true)).length
  );
  canEditSettings = computed(() =>
    this.permissionService.canManageSettings(this.authService.getStoredUser())
  );

  primaryLabelKey = computed(() => this.config().fields.find((field) => field.type !== 'toggle')?.key || 'name');

  secondaryFields = computed(() =>
    this.config().fields.filter((field) => field.key !== this.primaryLabelKey() && field.type !== 'textarea').slice(0, 3)
  );

  ngOnInit(): void {
    const config = this.route.snapshot.data['config'] as SettingsPageConfig;
    this.config.set(config);
    this.buildForm(config.fields);
    this.loadItems();
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    this.languageService.currentLanguage();
    return this.languageService.t(key, params);
  }

  private buildForm(fields: SettingsFieldConfig[]): void {
    const controls: Record<string, any> = {};
    for (const field of fields) {
      controls[field.key] = [
        field.type === 'toggle' ? false : '',
        field.required ? [Validators.required] : [],
      ];
    }
    this.form = this.fb.group(controls);
  }

  private loadItems(): void {
    this.workspace
      .getCollection<Record<string, any>>(this.config().storageKey, this.config().seedItems)
      .subscribe((items) => {
        this.items.set(items.length ? items : this.config().seedItems);
      });
  }

  private persist(): void {
    this.workspace
      .saveCollection(this.config().storageKey, this.items())
      .subscribe((items) => this.items.set(items));
  }

  updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  save(): void {
    if (!this.canEditSettings()) {
      this.toastService.error('You do not have permission to update these settings.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      id: this.editingId() || `${this.config().storageKey}-${Date.now()}`,
      ...this.form.getRawValue(),
    };

    if (this.editingId()) {
      this.items.update((list) => list.map((item) => item['id'] === payload.id ? payload : item));
      this.toastService.success(`${this.config().title} updated.`);
    } else {
      this.items.update((list) => [payload, ...list]);
      this.toastService.success(`${this.config().title} saved.`);
    }

    this.persist();
    this.reset();
  }

  edit(item: Record<string, any>): void {
    if (!this.canEditSettings()) return;
    this.editingId.set(String(item['id']));
    this.form.patchValue(item);
  }

  remove(id: string): void {
    if (!this.canEditSettings()) {
      this.toastService.error('You do not have permission to delete these settings.');
      return;
    }
    this.items.update((list) => list.filter((item) => String(item['id']) !== String(id)));
    this.persist();
    if (this.editingId() === String(id)) {
      this.reset();
    }
    this.toastService.success(`${this.config().itemName} removed.`);
  }

  reset(): void {
    if (!this.canEditSettings()) return;
    this.editingId.set(null);
    const defaults: Record<string, any> = {};
    this.config().fields.forEach((field) => {
      defaults[field.key] = field.type === 'toggle' ? false : '';
    });
    this.form.reset(defaults);
  }

  displayValue(item: Record<string, any>, field: SettingsFieldConfig): string {
    const value = item[field.key];
    if (value === undefined || value === null || value === '') return '';
    if (typeof value === 'boolean') return value ? this.t('common.yes') : this.t('common.no');
    return String(value);
  }

  isItemActive(item: Record<string, any>): boolean {
    return Boolean(item['active'] ?? item['enabled'] ?? item['published'] ?? true);
  }
}
