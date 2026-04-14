import { Injectable } from '@angular/core';
import {
  AccessCondition,
  AccessEvaluation,
  AccessUser,
  AccessBlockReason,
  MenuItemConfig,
  UserInfoAccess,
} from './access.models';

type PermissionMap = Record<string, boolean>;

@Injectable({
  providedIn: 'root',
})
export class AccessControlService {
  private normalizeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === '1' || normalized === 'true' || normalized === 'yes';
    }
    return Boolean(value);
  }

  private normalizePermissionMap(
    permissions: AccessUser['permissions'] | undefined,
  ): PermissionMap {
    if (!permissions) return {};

    if (Array.isArray(permissions)) {
      return permissions.reduce<PermissionMap>((acc, permission) => {
        if (typeof permission === 'string') {
          acc[permission] = true;
          return acc;
        }
        if (!permission?.key) return acc;
        acc[permission.key] = this.normalizeBoolean(permission.allowed);
        return acc;
      }, {});
    }

    return Object.keys(permissions).reduce<PermissionMap>((acc, key) => {
      acc[key] = this.normalizeBoolean(permissions[key]);
      return acc;
    }, {});
  }

  private normalizeList(input?: string | string[]): string[] {
    if (!input) return [];
    return Array.isArray(input) ? input.filter(Boolean) : [input].filter(Boolean);
  }

  private readUserInfoValue(
    userInfo: UserInfoAccess | undefined,
    key: string | number | symbol,
  ): unknown {
    if (!userInfo) return undefined;
    return (userInfo as Record<string, unknown>)[String(key)];
  }

  private satisfiesUserInfo(
    userInfo: UserInfoAccess | undefined,
    conditions?: AccessCondition['userInfo'],
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every((condition) => {
      const currentValue = this.readUserInfoValue(userInfo, condition.key);
      const expectedValue = condition.value;
      const operator = condition.operator ?? 'truthy';

      switch (operator) {
        case 'eq':
          return currentValue === expectedValue;
        case 'neq':
          return currentValue !== expectedValue;
        case 'gt':
          return Number(currentValue) > Number(expectedValue);
        case 'gte':
          return Number(currentValue) >= Number(expectedValue);
        case 'lt':
          return Number(currentValue) < Number(expectedValue);
        case 'lte':
          return Number(currentValue) <= Number(expectedValue);
        case 'truthy':
        default:
          return this.normalizeBoolean(currentValue);
      }
    });
  }

  canAccess(
    user: AccessUser | null | undefined,
    permission: string | string[] | undefined,
  ): boolean {
    if (!permission) return true;
    if (!user) return false;

    const permissionMap = this.normalizePermissionMap(user.permissions);
    return this.normalizeList(permission).every((key) => Boolean(permissionMap[key]));
  }

  hasAddon(
    user: AccessUser | null | undefined,
    addon: string | string[] | undefined,
  ): boolean {
    if (!addon) return true;
    if (!user) return false;

    const addonKeys = this.normalizeList(addon);
    return addonKeys.every((key) => this.normalizeBoolean(user.addons?.[key]));
  }

  hasTab(
    user: AccessUser | null | undefined,
    tab: string | string[] | undefined,
  ): boolean {
    if (!tab) return true;
    if (!user) return false;

    const tabKeys = this.normalizeList(tab);
    return tabKeys.every((key) => this.normalizeBoolean(user.tabs?.[key]));
  }

  canAccessModule(user: AccessUser | null | undefined, module: AccessCondition | MenuItemConfig): boolean {
    return this.evaluateModuleAccess(user, module).allowed;
  }

  evaluateModuleAccess(
    user: AccessUser | null | undefined,
    module: AccessCondition | MenuItemConfig,
  ): AccessEvaluation {
    if (!module) {
      return {
        allowed: true,
        discoverable: true,
        lockedByAddon: false,
        blockedBy: [],
      };
    }
    if (!user) {
      return {
        allowed: false,
        discoverable: false,
        lockedByAddon: false,
        blockedBy: ['permission'],
      };
    }

    const condition = module as AccessCondition;
    const blockedBy: AccessBlockReason[] = [];
    const hasAddonRequirement = this.normalizeList(condition.addon ?? []).length > 0;
    const hasPermissions = this.canAccess(user, condition.permission ?? []);
    const hasTabs = this.hasTab(user, condition.tab ?? []);
    const hasUserInfo = this.satisfiesUserInfo(user.userInfo, condition.userInfo);
    const hasAddons = this.hasAddon(user, condition.addon ?? []);

    if (!hasPermissions) blockedBy.push('permission');
    if (!hasTabs) blockedBy.push('tab');
    if (!hasUserInfo) blockedBy.push('userInfo');
    if (!hasAddons) blockedBy.push('addon');

    const discoverable = hasPermissions && hasTabs && hasUserInfo;
    const lockedByAddon = discoverable && hasAddonRequirement && !hasAddons;

    return {
      allowed: discoverable && hasAddons,
      discoverable,
      lockedByAddon,
      blockedBy,
    };
  }
}
