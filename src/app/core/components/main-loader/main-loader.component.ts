import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center space-y-8 animate-fade-in">
      <!-- Logo Container with Glow effect -->
      <div class="relative">
        <div class="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <div class="relative bg-gradient-to-br from-primary-500 to-primary-600 w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/30 ring-1 ring-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-bounce-slow">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
      </div>

      <!-- Text and Progress -->
      <div class="flex flex-col items-center gap-4">
        <div class="flex items-center gap-2">
          <h1 class="text-3xl font-black text-white tracking-tight">HRNexus</h1>
          <div class="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
        </div>
        
        <!-- Loading Animation -->
        <div class="flex gap-1.5 h-1">
          <div class="w-1.5 h-full rounded-full bg-primary-500/30 animate-loader-bar-1"></div>
          <div class="w-1.5 h-full rounded-full bg-primary-500/50 animate-loader-bar-2"></div>
          <div class="w-1.5 h-full rounded-full bg-primary-500 animate-loader-bar-3"></div>
          <div class="w-1.5 h-full rounded-full bg-primary-500/50 animate-loader-bar-4"></div>
          <div class="w-1.5 h-full rounded-full bg-primary-500/30 animate-loader-bar-5"></div>
        </div>
        
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] translate-x-1">Initializing Experience</p>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
    @keyframes loader-bar {
      0%, 100% { height: 100% }
      50% { height: 300% }
    }
    .animate-loader-bar-1 { animation: loader-bar 1.2s ease-in-out infinite; }
    .animate-loader-bar-2 { animation: loader-bar 1.2s ease-in-out infinite 0.1s; }
    .animate-loader-bar-3 { animation: loader-bar 1.2s ease-in-out infinite 0.2s; }
    .animate-loader-bar-4 { animation: loader-bar 1.2s ease-in-out infinite 0.3s; }
    .animate-loader-bar-5 { animation: loader-bar 1.2s ease-in-out infinite 0.4s; }
    
    .animate-bounce-slow {
      animation: bounce-slow 3s infinite ease-in-out;
    }
    @keyframes bounce-slow {
      0%, 100% { transform: translateY(-5%) }
      50% { transform: translateY(0) }
    }
  `]
})
export class MainLoaderComponent {}
