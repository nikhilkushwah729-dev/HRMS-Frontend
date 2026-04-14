import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="min-h-full">
      <div class="mx-auto max-w-[1600px] p-2">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class SettingsLayoutComponent {}
