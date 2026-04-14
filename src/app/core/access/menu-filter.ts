import { AccessControlService } from './access-control.service';
import { AccessUser, MenuItemConfig, MenuSectionConfig } from './access.models';

function filterMenuItem(
  item: MenuItemConfig,
  user: AccessUser | null | undefined,
  accessControl: AccessControlService,
): MenuItemConfig | null {
  const children = (item.children || [])
    .map((child) => filterMenuItem(child, user, accessControl))
    .filter((child): child is MenuItemConfig => Boolean(child));

  const isVisible = accessControl.canAccessModule(user, item);

  if (!isVisible && children.length === 0) {
    return null;
  }

  return {
    ...item,
    children: children.length > 0 ? children : undefined,
  };
}

export function filterVisibleMenuItems(
  sections: MenuSectionConfig[],
  user: AccessUser | null | undefined,
  accessControl: AccessControlService,
): MenuSectionConfig[] {
  return sections
    .map((section) => {
      const items = section.items
        .map((item) => filterMenuItem(item, user, accessControl))
        .filter((item): item is MenuItemConfig => Boolean(item));

      return {
        ...section,
        items,
      };
    })
    .filter((section) => section.items.length > 0);
}

