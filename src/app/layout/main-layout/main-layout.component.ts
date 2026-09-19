import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { AiAssistantDrawerComponent } from '../../core/components/ai-assistant-drawer/ai-assistant-drawer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    AiAssistantDrawerComponent,
  ],
  template: `
    <div class="app-shell">
      <div class="app-shell-ambient"></div>
      <div class="app-shell-content">
        <app-sidebar></app-sidebar>
        <div class="app-shell-main flex flex-col">
          <app-topbar></app-topbar>
          <main class="app-page">
            <div class="app-page-inner min-w-0">
              <router-outlet></router-outlet>
            </div>
          </main>
        </div>
      </div>
      <!-- Global AI HR Assistant Drawer -->
      <app-ai-assistant-drawer></app-ai-assistant-drawer>
    </div>
  `,
  styles: []
})
export class MainLayoutComponent {}
