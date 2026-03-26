import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopLoaderService } from '../../services/top-loader.service';

@Component({
  selector: 'app-top-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="topLoaderService.loading" class="fixed top-0 left-0 right-0 z-[9999] overflow-hidden">
      <!-- HRNexus Branded Progress Bar -->
      <div class="h-1.5 md:h-2 bg-slate-100 relative">
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-30">
          <svg class="w-full h-full" viewBox="0 0 100 10" preserveAspectRatio="none">
            <pattern id="loader-pattern" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="5" r="1" fill="#cbd5e1"/>
            </pattern>
            <rect width="100" height="10" fill="url(#loader-pattern)"/>
          </svg>
        </div>
        
        <!-- Animated Progress - HRNexus Blue -->
        <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#1E3A8A] animate-progress shadow-lg shadow-[#3B82F6]/50"></div>
        
        <!-- Shine Effect -->
        <div class="absolute top-0 left-0 h-full w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine"></div>
        
        <!-- HRNexus Logo Icon -->
        <div class="absolute right-2 top-1/2 -translate-y-1/2">
          <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
            <path d="M20 2L35 11V29L20 38L5 29V11L20 2Z" stroke="white" stroke-width="2" fill="none"/>
            <text x="20" y="24" text-anchor="middle" fill="white" font-size="6" font-weight="bold">HR</text>
          </svg>
        </div>
      </div>
      
      <!-- Text Label -->
      <div class="bg-[#1E3A8A] px-3 py-1 inline-block rounded-br-lg shadow-lg">
        <span class="text-white text-xs font-medium tracking-wide">Loading...</span>
      </div>
    </div>
  `,
  styles: [`
    @keyframes progress {
      0% {
        width: 0%;
        margin-left: 0%;
      }
      10% {
        width: 15%;
        margin-left: 5%;
      }
      30% {
        width: 35%;
        margin-left: 20%;
      }
      50% {
        width: 55%;
        margin-left: 35%;
      }
      70% {
        width: 70%;
        margin-left: 50%;
      }
      90% {
        width: 85%;
        margin-left: 65%;
      }
      100% {
        width: 0%;
        margin-left: 100%;
      }
    }
    
    @keyframes shine {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(500%);
      }
    }
    
    .animate-progress {
      animation: progress 2s ease-in-out infinite;
    }
    
    .animate-shine {
      animation: shine 1.5s ease-in-out infinite;
    }
  `]
})
export class TopLoaderComponent implements OnInit, OnDestroy {
  topLoaderService = inject(TopLoaderService);

  ngOnInit() {
    // Component automatically reacts to the service's signal
  }

  ngOnDestroy() {
    // Cleanup if needed
  }
}

