import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="min-h-full">
      <div class="mx-auto w-full max-w-[1680px] px-0 py-0">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class SettingsLayoutComponent {}
