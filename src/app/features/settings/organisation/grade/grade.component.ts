import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

interface Grade {
  id: string;
  name: string;
  description: string;
  noOfEmployees: number;
  isActive: boolean;
}

@Component({
  selector: 'app-grade',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mx-auto max-w-7xl space-y-6 px-1 py-2">
      <section class="app-module-hero">
        <div>
          <p class="app-module-kicker">Organisation Settings</p>
          <h1 class="app-module-title">Grades</h1>
          <p class="app-module-text max-w-2xl">Maintain grading bands for compensation and leveling, even while backend support for this master remains under expansion.</p>
        </div>
        <div class="app-module-highlight">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Configured grades</p>
          <p class="mt-3 text-3xl font-black text-slate-900">{{ grades().length }}</p>
          <p class="mt-2 text-sm text-slate-600">Filtered results: {{ filteredGrades().length }}</p>
        </div>
      </section>

      <div class="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section class="app-surface-card">
          <div class="mb-6">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Create Grade</p>
            <h2 class="mt-2 text-2xl font-black text-slate-900">Compensation band</h2>
          </div>

          <form [formGroup]="gradeForm" (ngSubmit)="saveGrade()" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Grade Name</label>
              <input formControlName="name" class="app-field" placeholder="A1">
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Description</label>
              <textarea formControlName="description" rows="4" class="app-field resize-none" placeholder="Entry level executive"></textarea>
            </div>
            <button type="submit" [disabled]="gradeForm.invalid" class="w-full rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">Save Grade</button>
          </form>
        </section>

        <section class="app-surface-card overflow-hidden p-0">
          <div class="border-b border-slate-100 px-6 py-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Grade Directory</p>
                <h2 class="mt-2 text-2xl font-black text-slate-900">Saved bands</h2>
              </div>
              <input [value]="searchQuery()" (input)="updateSearch($event)" class="app-field w-full max-w-sm" placeholder="Search grades">
            </div>
          </div>

          <div class="divide-y divide-slate-100">
            @for (grade of filteredGrades(); track grade.id) {
              <div class="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-lg font-black text-slate-900">{{ grade.name }}</p>
                  <p class="mt-2 text-sm leading-7 text-slate-600">{{ grade.description }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{{ grade.noOfEmployees }} employees</span>
                  <button (click)="deleteGrade(grade.id)" class="rounded-md border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">Delete</button>
                </div>
              </div>
            } @empty {
              <div class="px-6 py-14 text-center text-slate-500">No grades found.</div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class GradeComponent implements OnInit {
  private readonly storageKey = 'hrms_grade_master';
  private fb = new FormBuilder();

  grades = signal<Grade[]>([]);
  searchQuery = signal('');

  gradeForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    description: ['', [Validators.required, Validators.minLength(2)]]
  });

  filteredGrades = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.grades();
    return this.grades().filter((grade) => grade.name.toLowerCase().includes(q) || grade.description.toLowerCase().includes(q));
  });

  ngOnInit() {
    this.loadGrades();
  }

  loadGrades() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.grades.set(JSON.parse(saved));
        return;
      }
    } catch {}

    this.grades.set([
      { id: '1', name: 'A1', description: 'Entry level executive', noOfEmployees: 112, isActive: true },
      { id: '2', name: 'A2', description: 'Senior executive', noOfEmployees: 85, isActive: true },
      { id: '3', name: 'M1', description: 'Manager', noOfEmployees: 34, isActive: true }
    ]);
  }

  persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.grades()));
  }

  updateSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  saveGrade() {
    if (this.gradeForm.invalid) return;
    const value = this.gradeForm.getRawValue();
    const grade: Grade = {
      id: Date.now().toString(),
      name: (value.name || '').trim(),
      description: (value.description || '').trim(),
      noOfEmployees: 0,
      isActive: true
    };
    this.grades.update((list) => [grade, ...list]);
    this.persist();
    this.gradeForm.reset({ name: '', description: '' });
  }

  deleteGrade(id: string) {
    this.grades.update((list) => list.filter((grade) => grade.id !== id));
    this.persist();
  }
}
