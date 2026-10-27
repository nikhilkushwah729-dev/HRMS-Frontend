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
    const includeLocked = options?.includeLocked ?? true;

    const isSuper = this.accessControl.isSuperAdmin(accessUser);

    return section.items
      .map((item) => {
        const evaluation = this.accessControl.evaluateModuleAccess(accessUser, item);
        const isAccessible = isSuper || evaluation.allowed;
        const isLocked = isSuper ? false : !evaluation.allowed;

        let lockReason: string | null = null;
        if (isLocked) {
          if (evaluation.lockedByAddon || evaluation.blockedBy?.includes('addon')) {
            lockReason = item.lockedDescription ?? `${item.label} module is an add-on not active for your organization.`;
          } else if (evaluation.blockedBy?.includes('permission')) {
            lockReason = `Access Restricted: You do not have permission for ${item.label}.`;
          } else if (evaluation.blockedBy?.includes('role')) {
            lockReason = `Role Restricted: Your role cannot access ${item.label}.`;
          } else {
            lockReason = `${item.label} is currently locked.`;
          }
        }

        return {
          ...item,
          sectionId: section.id,
          sectionLabel: section.label,
          sectionDescription: section.description,
          isAccessible,
          isLocked,
          lockReason,
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
