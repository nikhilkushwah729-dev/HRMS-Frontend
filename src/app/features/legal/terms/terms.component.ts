import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-primary-500 to-primary-600 w-10 h-10 rounded-md flex items-center justify-center shadow-lg shadow-primary-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <h1 class="text-2xl font-bold text-white tracking-tight">Terms of Service</h1>
          </div>
          <a routerLink="/" class="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Home
          </a>
        </div>

        <!-- Content -->
        <div class="space-y-8 prose prose-invert prose-slate max-w-none">
          <section>
            <h2 class="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using HRNexus ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>HRNexus is a Human Resource Management System (HRMS) provided as a Software-as-a-Service (SaaS). We provide tools for employee management, attendance tracking, payroll, and organizational administration.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">3. User Responsibilities</h2>
            <ul class="list-disc pl-5 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to provide accurate and complete information when registering.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must comply with all applicable laws and regulations in your jurisdiction.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">4. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of HRNexus and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">5. Data Ownership</h2>
            <p>You retain all rights to the employee and organizational data you upload to the Service. By using the Service, you grant us a license to process this data solely for the purpose of providing the requested functionality.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">6. Limitation of Liability</h2>
            <p>In no event shall HRNexus, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">7. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">8. Changes to Terms</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice before any new terms taking effect.</p>
          </section>

          <section class="pt-8 border-t border-slate-800 text-sm text-slate-500">
            <p>Last updated: June 15, 2024</p>
            <p class="mt-2">Contact: support&#64;hrnexus.tech</p>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class TermsOfServiceComponent {}
