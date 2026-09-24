export interface ContractErrorDetails {
  serviceName: string;
  endpoint: string;
  missingField: string;
  dtoKeys: string[];
  timestamp: string;
}

export interface MapperWarningState {
  hasWarnings: boolean;
  unparseableCount: number;
  message: string | null;
}

export type MonitoringHook = (error: ContractErrorDetails) => void;

let activeMonitoringHook: MonitoringHook | null = null;

export function registerMonitoringHook(hook: MonitoringHook | null): void {
  activeMonitoringHook = hook;
}

export function reportContractError(
  serviceName: string,
  endpoint: string,
  dto: any,
  missingField: string
): void {
  const dtoKeys = dto && typeof dto === 'object' ? Object.keys(dto) : [];
  const details: ContractErrorDetails = {
    serviceName,
    endpoint,
    missingField,
    dtoKeys,
    timestamp: new Date().toISOString()
  };

  console.warn(
    `[Contract Error] Service: ${serviceName}, Endpoint: ${endpoint}, Missing Field: ${missingField}, Available DTO Keys: [${dtoKeys.join(', ')}]`
  );

  if (activeMonitoringHook) {
    try {
      activeMonitoringHook(details);
    } catch (err) {
      console.error('[Contract Error] Monitoring hook invocation failed:', err);
    }
  }
}

export interface MapListResult<T> {
  items: T[];
  warningState: MapperWarningState;
}

export function mapListWithWarnings<Raw, Domain>(
  items: Raw[],
  mapper: (item: Raw) => Domain | null,
  serviceName: string,
  endpoint: string
): MapListResult<Domain> {
  if (!Array.isArray(items)) {
    return {
      items: [],
      warningState: {
        hasWarnings: false,
        unparseableCount: 0,
        message: null
      }
    };
  }

  const validItems: Domain[] = [];
  let unparseableCount = 0;

  for (const item of items) {
    try {
      const mapped = mapper(item);
      if (mapped !== null) {
        validItems.push(mapped);
      } else {
        unparseableCount++;
      }
    } catch (err) {
      unparseableCount++;
      reportContractError(serviceName, endpoint, item, 'item_mapping_exception');
    }
  }

  const hasWarnings = unparseableCount > 0;
  const message = hasWarnings
    ? `${unparseableCount} ${unparseableCount === 1 ? 'record' : 'records'} could not be displayed due to invalid data format.`
    : null;

  return {
    items: validItems,
    warningState: {
      hasWarnings,
      unparseableCount,
      message
    }
  };
}
