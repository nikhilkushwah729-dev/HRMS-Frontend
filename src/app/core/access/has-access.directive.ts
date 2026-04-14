import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { AccessControlService } from './access-control.service';
import { AccessCondition, AccessUser, MenuItemConfig } from './access.models';

@Directive({
  selector: '[appHasAccess]',
  standalone: true,
})
export class HasAccessDirective implements OnChanges {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly accessControl = inject(AccessControlService);

  private condition: AccessCondition | MenuItemConfig | null = null;
  private user: AccessUser | null = null;

  @Input('appHasAccess')
  set appHasAccess(value: AccessCondition | MenuItemConfig | null) {
    this.condition = value;
    this.render();
  }

  @Input('appHasAccessUser')
  set appHasAccessUser(value: AccessUser | null) {
    this.user = value;
    this.render();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.render();
  }

  private render(): void {
    this.viewContainer.clear();

    if (this.condition && this.accessControl.canAccessModule(this.user, this.condition)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}

