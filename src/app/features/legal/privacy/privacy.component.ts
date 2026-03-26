import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8 pb-8 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 w-10 h-10 rounded-md flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><rect width="8" height="8" x="8" y="9" rx="1"/></svg>
            </div>
            <h1 class="text-2xl font-bold text-white tracking-tight">Privacy Policy</h1>
          </div>
          <a routerLink="/" class="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Home
          </a>
        </div>

        <!-- Content -->
        <div class="space-y-8 prose prose-invert prose-slate max-w-none">
          <section>
            <h2 class="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us when you create an organization account, add employees, or use the Service features. This includes:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
              <li>Account information (Name, Email, Phone Number)</li>
              <li>Employee records (names, identification details, contact info)</li>
              <li>Usage data (IP addresses, device information, activity logs)</li>
              <li>Attendance data (when using tracking features)</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
              <li>Provide, maintain, and improve our Service.</li>
              <li>Process transactions and send related information.</li>
              <li>Verify identity and ensure account security.</li>
              <li>Respond to your comments, questions, and requests.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">3. Data Security</h2>
            <p>We implement a variety of security measures to maintain the safety of your personal information. We use industry-standard encryption and secure database services (Firebase/Google Cloud) to protect your data from unauthorized access or disclosure.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">4. Data Sharing and Disclosure</h2>
            <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website or servicing you, so long as those parties agree to keep this information confidential.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
            <p>You have the right to access, update, or delete the personal information we have on you. In many cases, you can do this directly through your account settings or by contacting our support team.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">6. Cookies</h2>
            <p>We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">7. Changes to This Policy</h2>
            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.</p>
          </section>

          <section class="pt-8 border-t border-slate-800 text-sm text-slate-500">
            <p>Last updated: June 15, 2024</p>
            <p class="mt-2 text-primary-500 font-semibold">Privacy is our priority at HRNexus.</p>
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
export class PrivacyPolicyComponent {}
