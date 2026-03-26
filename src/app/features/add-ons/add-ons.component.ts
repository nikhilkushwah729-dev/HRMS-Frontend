import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-ons',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto p-6">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-black bg-gradient-to-r from-slate-900 to-slate-800 bg-clip-text text-transparent mb-4">
          Add-Ons & Integrations
        </h1>
        <p class="text-xl text-slate-600 max-w-2xl mx-auto">
          Extend your HRMS with powerful add-ons for advanced attendance, tracking, and payroll management.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a routerLink="employee-tracking" class="group card hover:shadow-xl transition-all">
          <div class="p-8 text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-md flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-all">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-all">Employee Tracking</h3>
            <p class="text-slate-600 mb-6">Real-time GPS tracking and location monitoring for field employees.</p>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full w-3/4 group-hover:w-full transition-all"></div>
            </div>
          </div>
        </a>

        <a routerLink="shift-planner" class="group card hover:shadow-xl transition-all">
          <div class="p-8 text-center">
            <div class="w-16 h-16 bg-green-100 rounded-md flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-all">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-green-600 transition-all">Shift Planner</h3>
            <p class="text-slate-600 mb-6">Intelligent shift scheduling with auto-assignment and conflict resolution.</p>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div class="bg-green-600 h-2 rounded-full w-2/3 group-hover:w-full transition-all"></div>
            </div>
          </div>
        </a>

        <a routerLink="geo-fence" class="group card hover:shadow-xl transition-all">
          <div class="p-8 text-center">
            <div class="w-16 h-16 bg-purple-100 rounded-md flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-all">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-purple-600 transition-all">Geo-fencing</h3>
            <p class="text-slate-600 mb-6">Location-based attendance with customizable geofence boundaries.</p>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div class="bg-purple-600 h-2 rounded-full w-4/5 group-hover:w-full transition-all"></div>
            </div>
          </div>
        </a>

        <a routerLink="face-recognition" class="group card hover:shadow-xl transition-all">
          <div class="p-8 text-center">
            <div class="w-16 h-16 bg-indigo-100 rounded-md flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-200 transition-all">
              <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-all">Face Recognition</h3>
            <p class="text-slate-600 mb-6">Touchless attendance using AI-powered facial recognition.</p>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div class="bg-indigo-600 h-2 rounded-full w-5/6 group-hover:w-full transition-all"></div>
            </div>
          </div>
        </a>

        <a routerLink="track-visit" class="group card hover:shadow-xl transition-all">
          <div class="p-8 text-center">
            <div class="w-16 h-16 bg-orange-100 rounded-md flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-all">
              <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012 2v12m-4 0h10"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-all">Visit Tracking</h3>
            <p class="text-slate-600 mb-6">Complete visitor management from check-in to check-out.</p>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div class="bg-orange-600 h-2 rounded-full w-3/5 group-hover:w-full transition-all"></div>
            </div>
          </div>
        </a>

        <a routerLink="payroll" class="group card hover:shadow-xl transition-all">
          <div class="p-8 text-center">
            <div class="w-16 h-16 bg-emerald-100 rounded-md flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-200 transition-all">
              <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-all">Payroll</h3>
            <p class="text-slate-600 mb-6">Automated salary calculation integrated with attendance data.</p>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div class="bg-emerald-600 h-2 rounded-full w-4/5 group-hover:w-full transition-all"></div>
            </div>
          </div>
        </a>

        <a routerLink="manage-client" class="group card hover:shadow-xl transition-all">
          <div class="p-8 text-center">
            <div class="w-16 h-16 bg-cyan-100 rounded-md flex items-center justify-center mx-auto mb-6 group-hover:bg-cyan-200 transition-all">
              <svg class="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-cyan-600 transition-all">Client Management</h3>
            <p class="text-slate-600 mb-6">Manage client sites, projects, and field assignments centrally.</p>
            <div class="w-full bg-slate-200 rounded-full h-2">
              <div class="bg-cyan-600 h-2 rounded-full w-2/3 group-hover:w-full transition-all"></div>
            </div>
          </div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .card {
      @apply bg-white border border-slate-200 rounded-md p-1 shadow-sm hover:-translate-y-1 transition-all duration-300;
    }
  `]
})
export class AddOnsComponent {}
