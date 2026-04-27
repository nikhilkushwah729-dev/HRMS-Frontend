import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { KioskAttendanceService } from './kiosk-attendance.service';
import { KioskDeviceConfig } from './kiosk.service';

type PendingMethod = 'face' | 'pin' | 'qr';

export interface PendingKioskAttempt {
  id?: number;
  method: PendingMethod;
  payload: Record<string, any>;
  clientReference: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private readonly dbName = 'hrms-kiosk-sync';
  private readonly storeName = 'attendance_attempts';
  private readonly version = 1;

  online = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  syncing = signal<boolean>(false);
  pendingCount = signal<number>(0);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.online.set(true);
      });
      window.addEventListener('offline', () => {
        this.online.set(false);
      });
      void this.refreshPendingCount();
    }
  }

  async queueAttempt(method: PendingMethod, payload: Record<string, any>) {
    const record: PendingKioskAttempt = {
      method,
      payload,
      clientReference:
        payload['clientReference'] ?? `${method}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).add(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    await this.refreshPendingCount();
    return record.clientReference;
  }

  async flushQueuedAttempts(
    config: KioskDeviceConfig,
    attendanceService: KioskAttendanceService,
  ) {
    if (!this.online() || this.syncing()) {
      return [];
    }

    this.syncing.set(true);
    try {
      const db = await this.openDb();
      const records = await this.getAll(db);
      if (!records.length) {
        this.pendingCount.set(0);
        return [];
      }

      const payload = records.map((record) => ({
        method: record.method,
        clientReference: record.clientReference,
        ...record.payload,
      }));

      const results = await firstValueFrom(
        attendanceService.submitOfflineSync(config, payload),
      );

      const successfulRefs = new Set<string>(
        (results ?? [])
          .filter((item: any) => item?.success && typeof item.clientReference === 'string')
          .map((item: any) => item.clientReference as string),
      );

      if (successfulRefs.size) {
        await this.removeByClientReferences(db, [...successfulRefs]);
      }

      await this.refreshPendingCount();
      return results ?? [];
    } finally {
      this.syncing.set(false);
    }
  }

  private async refreshPendingCount() {
    const db = await this.openDb();
    const count = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const request = tx.objectStore(this.storeName).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    this.pendingCount.set(count);
  }

  private async openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('clientReference', 'clientReference', { unique: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAll(db: IDBDatabase): Promise<PendingKioskAttempt[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const request = tx.objectStore(this.storeName).getAll();
      request.onsuccess = () => resolve(request.result as PendingKioskAttempt[]);
      request.onerror = () => reject(request.error);
    });
  }

  private async removeByClientReferences(db: IDBDatabase, refs: string[]) {
    const records = await this.getAll(db);
    const matched = records.filter((record) => refs.includes(record.clientReference));

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      matched.forEach((record) => {
        if (record.id !== undefined) {
          store.delete(record.id);
        }
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
