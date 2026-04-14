import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelfServiceComponent } from '../self-service.component';

@Component({
  selector: 'app-ess-dashboard',
  standalone: true,
  imports: [CommonModule, SelfServiceComponent],
  template: `<app-self-service></app-self-service>`,
})
export class EssDashboardComponent {}
