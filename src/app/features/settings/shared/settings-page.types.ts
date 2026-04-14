export interface SettingsFieldOption {
  label: string;
  value: string | number | boolean;
}

export interface SettingsFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'toggle' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: SettingsFieldOption[];
}

export interface SettingsPageConfig {
  storageKey: string;
  title: string;
  kicker: string;
  description: string;
  itemName: string;
  emptyState: string;
  fields: SettingsFieldConfig[];
  seedItems: Record<string, any>[];
  primaryMetricLabel?: string;
}
