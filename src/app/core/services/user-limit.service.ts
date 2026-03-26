import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserLimitService {
  private _openModal = signal(false);

  get openModal() {
    return this._openModal();
  }

  showLimitModal() {
    this._openModal.set(true);
  }

  closeModal = () => {
    this._openModal.set(false);
  }

  upgrade() {
    console.log('Upgrading plan...');
    // Implement upgrade logic here (e.g., navigate to billing)
    this.closeModal();
  }
}
