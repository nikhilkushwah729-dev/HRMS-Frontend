import { Injectable, inject } from '@angular/core';
import { User } from '../models/auth.model';
import { AccessContextService } from './access-context.service';
import { AccessControlService } from './access-control.service';
import { SAAS_MENU_SECTIONS } from './menu.config';
import { WorkspaceModuleView } from './access.models';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceCatalogService {
  private readonly accessContext = inject(AccessContextService);
  private readonly accessControl = inject(AccessControlService);

  getSectionViews(
    user: User | null | undefined,
    sectionId: string,
    options?: { includeLocked?: boolean },
  ): WorkspaceModuleView[] {
    const section = SAAS_MENU_SECTIONS.find((item) => item.id === sectionId);
    if (!section) return [];

    const accessUser = this.accessContext.buildAccessUser(user);
    const includeLocked = options?.includeLocked ?? false;

    return section.items
      .map((item) => {
        const evaluation = this.accessControl.evaluateModuleAccess(accessUser, item);

        return {
          ...item,
          sectionId: section.id,
          sectionLabel: section.label,
          sectionDescription: section.description,
          isAccessible: evaluation.allowed,
          isLocked: evaluation.lockedByAddon,
          lockReason: evaluation.lockedByAddon
            ? item.lockedDescription ?? `${item.label} is not enabled for this organization yet.`
            : null,
        };
      })
      .filter((item) => item.isAccessible || (includeLocked && item.isLocked));
  }

  getAllViews(
    user: User | null | undefined,
    options?: { includeLocked?: boolean },
  ): WorkspaceModuleView[] {
    return SAAS_MENU_SECTIONS.flatMap((section) =>
      this.getSectionViews(user, section.id, options),
    );
  }
}
