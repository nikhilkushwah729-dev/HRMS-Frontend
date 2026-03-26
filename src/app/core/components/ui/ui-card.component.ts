import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClass()">
      <!-- Card Header -->
      @if (title || headerTemplate) {
        <div [class]="headerClass()">
          @if (headerTemplate) {
            <ng-content select="[card-header]"></ng-content>
          } @else {
            <div class="flex items-center justify-between">
              <div>
                @if (title) {
                  <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
                }
                @if (subtitle) {
                  <p class="text-sm text-slate-500 mt-0.5">{{ subtitle }}</p>
                }
              </div>
              @if (headerActions) {
                <div class="flex items-center gap-2">
                  <ng-content select="[card-actions]"></ng-content>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Card Body -->
      <div [class]="bodyClass()">
        <ng-content></ng-content>
      </div>

      <!-- Card Footer -->
      @if (footerTemplate) {
        <div [class]="footerClass()">
          <ng-content select="[card-footer]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class UiCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() shadow = true;
  @Input() bordered = true;
  @Input() hoverable = false;
  @Input() headerTemplate = false;
  @Input() footerTemplate = false;
  @Input() headerActions = false;
  @Input() rounded: 'sm' | 'md' | 'lg' | 'xl' = 'lg';

  cardClass(): string {
    const base = 'bg-white';
    const shadowClass = this.shadow ? 'shadow-card' : '';
    const borderClass = this.bordered ? 'border border-slate-200' : '';
    const hoverClass = this.hoverable ? 'transition-shadow duration-200 hover:shadow-card-hover cursor-pointer' : '';
    const radiusClass = `rounded-${this.rounded}`;

    return `${base} ${shadowClass} ${borderClass} ${hoverClass} ${radiusClass}`.trim();
  }

  headerClass(): string {
    const paddingClass = this.padding === 'none' ? '' : this.getPaddingClass(this.padding);
    return `border-b border-slate-100 ${paddingClass}`;
  }

  bodyClass(): string {
    return this.getPaddingClass(this.padding);
  }

  footerClass(): string {
    const paddingClass = this.padding === 'none' ? '' : this.getPaddingClass(this.padding);
    return `border-t border-slate-100 ${paddingClass}`;
  }

  private getPaddingClass(padding: string): string {
    const map: Record<string, string> = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6',
    };
    return map[padding] || map['md'];
  }
}

